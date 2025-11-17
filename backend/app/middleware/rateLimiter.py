"""
Rate Limiting Middleware for Sentiment Aura API
Provides intelligent rate limiting with per-client limits and request queuing
"""

import time
import asyncio
from typing import Dict, Optional, Callable, Any
from collections import defaultdict, deque
from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import logging
import hashlib
import ipaddress

logger = logging.getLogger(__name__)

class RateLimiter:
    """
    Token bucket rate limiter with per-client tracking
    """

    def __init__(self,
                 requests_per_window: int = 10,
                 window_size: int = 60,
                 burst_size: int = 5):
        """
        Initialize rate limiter

        Args:
            requests_per_window: Maximum requests per time window
            window_size: Time window in seconds
            burst_size: Maximum burst size allowed
        """
        self.requests_per_window = requests_per_window
        self.window_size = window_size
        self.burst_size = burst_size

        # Store client buckets: {client_id: {tokens, last_refill}}
        self.clients: Dict[str, Dict[str, float]] = {}

        # Request tracking for metrics
        self.request_counts = defaultdict(int)
        self.last_cleanup = time.time()

    def _get_client_id(self, request: Request) -> str:
        """Generate unique client identifier"""
        # Try to get client IP from various headers (for reverse proxies)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Take the first IP in the chain
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            real_ip = request.headers.get("X-Real-IP")
            if real_ip:
                client_ip = real_ip
            else:
                client_ip = request.client.host if request.client else "unknown"

        # Add user agent if available for better identification
        user_agent = request.headers.get("User-Agent", "unknown")

        # Create a unique client identifier
        client_string = f"{client_ip}:{user_agent}"
        return hashlib.sha256(client_string.encode()).hexdigest()[:16]

    def _refill_bucket(self, client_id: str):
        """Refill tokens for client bucket"""
        now = time.time()
        client = self.clients.get(client_id)

        if not client:
            # Initialize new client
            self.clients[client_id] = {
                "tokens": float(self.requests_per_window),
                "last_refill": now
            }
            return

        # Calculate time passed since last refill
        time_passed = now - client["last_refill"]

        # Refill tokens based on time passed
        tokens_to_add = (time_passed / self.window_size) * self.requests_per_window
        client["tokens"] = min(client["tokens"] + tokens_to_add, self.requests_per_window)
        client["last_refill"] = now

    def _cleanup_old_clients(self):
        """Remove inactive clients to prevent memory leaks"""
        now = time.time()
        if now - self.last_cleanup < 300:  # Cleanup every 5 minutes
            return

        inactive_clients = []
        cutoff_time = now - self.window_size * 2  # Remove clients inactive for 2 windows

        for client_id, client_data in self.clients.items():
            if client_data["last_refill"] < cutoff_time:
                inactive_clients.append(client_id)

        for client_id in inactive_clients:
            del self.clients[client_id]

        self.last_cleanup = now

    def is_allowed(self, request: Request) -> tuple[bool, Dict[str, Any]]:
        """
        Check if request is allowed

        Returns:
            tuple of (is_allowed, response_data)
        """
        client_id = self._get_client_id(request)

        # Clean up old clients periodically
        self._cleanup_old_clients()

        # Refill tokens
        self._refill_bucket(client_id)

        client = self.clients[client_id]

        # Check if request is allowed
        if client["tokens"] >= 1:
            # Consume one token
            client["tokens"] -= 1
            self.request_counts[client_id] += 1

            return True, {
                "remaining_tokens": int(client["tokens"]),
                "reset_time": client["last_refill"] + self.window_size,
                "client_id": client_id
            }
        else:
            # Rate limited
            retry_after = int(self.window_size - (time.time() - client["last_refill"]))

            return False, {
                "error": "Rate limit exceeded",
                "retry_after": max(retry_after, 1),
                "limit": self.requests_per_window,
                "window": self.window_size,
                "client_id": client_id
            }

    def get_client_stats(self, client_id: str) -> Dict[str, Any]:
        """Get statistics for a specific client"""
        client = self.clients.get(client_id)
        if not client:
            return {"client_id": client_id, "status": "not_found"}

        return {
            "client_id": client_id,
            "tokens_remaining": client["tokens"],
            "last_refill": client["last_refill"],
            "requests_made": self.request_counts.get(client_id, 0)
        }

    def get_global_stats(self) -> Dict[str, Any]:
        """Get global rate limiter statistics"""
        return {
            "active_clients": len(self.clients),
            "total_requests": sum(self.request_counts.values()),
            "requests_per_window": self.requests_per_window,
            "window_size": self.window_size
        }

class RequestQueue:
    """
    Simple request queue for handling rate limit exceeded scenarios
    """

    def __init__(self, max_queue_size: int = 50):
        self.max_queue_size = max_queue_size
        self.queues: Dict[str, deque] = defaultdict(deque)
        self.processing: Dict[str, bool] = defaultdict(bool)

    def enqueue_request(self, client_id: str, request_data: Any) -> bool:
        """Add request to queue"""
        queue = self.queues[client_id]

        if len(queue) >= self.max_queue_size:
            return False  # Queue full

        queue.append({
            "data": request_data,
            "timestamp": time.time()
        })
        return True

    def dequeue_request(self, client_id: str) -> Optional[Any]:
        """Get next request from queue"""
        queue = self.queues[client_id]
        if queue:
            return queue.popleft()
        return None

    def get_queue_size(self, client_id: str) -> int:
        """Get queue size for client"""
        return len(self.queues[client_id])

    def clear_queue(self, client_id: str):
        """Clear queue for client"""
        if client_id in self.queues:
            del self.queues[client_id]
        if client_id in self.processing:
            del self.processing[client_id]

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    FastAPI middleware for rate limiting
    """

    def __init__(self,
                 app,
                 requests_per_minute: int = 60,
                 burst_size: int = 10,
                 enable_queue: bool = False,
                 excluded_paths: list = None):
        """
        Initialize rate limit middleware

        Args:
            app: FastAPI app
            requests_per_minute: Requests allowed per minute per client
            burst_size: Maximum burst size
            enable_queue: Whether to queue rate-limited requests
            excluded_paths: List of paths to exclude from rate limiting
        """
        super().__init__(app)

        self.rate_limiter = RateLimiter(
            requests_per_window=requests_per_minute,
            window_size=60,
            burst_size=burst_size
        )

        self.request_queue = RequestQueue() if enable_queue else None
        self.excluded_paths = excluded_paths or ["/", "/health", "/docs", "/redoc", "/metrics"]

        # Statistics
        self.stats = {
            "total_requests": 0,
            "rate_limited": 0,
            "queued": 0,
            "processed": 0
        }

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process request through rate limiter
        """
        # Skip rate limiting for excluded paths
        if request.url.path in self.excluded_paths:
            return await call_next(request)

        self.stats["total_requests"] += 1

        # Check rate limit
        is_allowed, limit_info = self.rate_limiter.is_allowed(request)
        client_id = limit_info["client_id"]

        if is_allowed:
            # Add rate limit headers to response
            response = await call_next(request)

            response.headers["X-RateLimit-Limit"] = str(self.rate_limiter.requests_per_window)
            response.headers["X-RateLimit-Remaining"] = str(limit_info["remaining_tokens"])
            response.headers["X-RateLimit-Reset"] = str(int(limit_info["reset_time"]))

            self.stats["processed"] += 1
            return response

        # Rate limited
        self.stats["rate_limited"] += 1

        # Try to queue if enabled
        if self.request_queue and self.request_queue.enqueue_request(client_id, {
            "method": request.method,
            "url": str(request.url),
            "headers": dict(request.headers),
            "body": await request.body()
        }):
            self.stats["queued"] += 1

            return JSONResponse(
                status_code=202,  # Accepted
                content={
                    "error": "Request queued due to rate limit",
                    "queue_position": self.request_queue.get_queue_size(client_id),
                    "retry_after": limit_info["retry_after"],
                    "client_id": client_id
                },
                headers={
                    "X-RateLimit-Limit": str(self.rate_limiter.requests_per_window),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(time.time() + limit_info["retry_after"])),
                    "Retry-After": str(limit_info["retry_after"])
                }
            )

        # Return rate limit error
        return JSONResponse(
            status_code=429,
            content={
                "error": "Rate limit exceeded",
                "message": "Too many requests. Please try again later.",
                "retry_after": limit_info["retry_after"],
                "limit": limit_info["limit"],
                "window": limit_info["window"],
                "client_id": client_id
            },
            headers={
                "X-RateLimit-Limit": str(self.rate_limiter.requests_per_window),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(int(time.time() + limit_info["retry_after"])),
                "Retry-After": str(limit_info["retry_after"])
            }
        )

    def get_stats(self) -> Dict[str, Any]:
        """Get middleware statistics"""
        return {
            "middleware": self.stats,
            "rate_limiter": self.rate_limiter.get_global_stats()
        }

    def get_client_stats(self, client_id: str) -> Dict[str, Any]:
        """Get statistics for specific client"""
        stats = self.rate_limiter.get_client_stats(client_id)

        if self.request_queue:
            stats["queue_size"] = self.request_queue.get_queue_size(client_id)

        return stats

# Rate limiter factory function
def create_rate_limiter(app, **kwargs):
    """
    Create rate limiter middleware for FastAPI app
    """
    default_config = {
        "requests_per_minute": 30,  # 30 requests per minute
        "burst_size": 10,          # Allow bursts of 10
        "enable_queue": False,     # Don't queue for now
        "excluded_paths": ["/", "/health", "/docs", "/redoc", "/metrics"]
    }
    config = {**default_config, **kwargs}
    return RateLimitMiddleware(app, **config)