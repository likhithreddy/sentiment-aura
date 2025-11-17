"""
Backend Caching System for Sentiment Analysis
Provides in-memory caching with TTL and intelligent cache management
"""

import time
import hashlib
import json
import logging
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict
from threading import Lock
import asyncio
from app.models.sentiment import SentimentResponse

logger = logging.getLogger(__name__)

@dataclass
class CacheEntry:
    """Cache entry with metadata"""
    data: Dict[str, Any]
    timestamp: float
    ttl: float
    access_count: int = 0
    last_accessed: float = 0.0

class SentimentCache:
    """
    In-memory cache for sentiment analysis responses
    with LRU eviction and TTL support
    """

    def __init__(self, max_size: int = 1000, default_ttl: int = 300):
        """
        Initialize sentiment cache

        Args:
            max_size: Maximum number of entries
            default_ttl: Default TTL in seconds (5 minutes)
        """
        self.max_size = max_size
        self.default_ttl = default_ttl
        self.cache: Dict[str, CacheEntry] = {}
        self.access_order: List[str] = []
        self.lock = Lock()

        # Statistics
        self.stats = {
            "hits": 0,
            "misses": 0,
            "sets": 0,
            "evictions": 0,
            "total_requests": 0
        }
        self._cleanup_task_started = False

    def _generate_key(self, text: str) -> str:
        """
        Generate cache key from text input

        Args:
            text: Input text to analyze

        Returns:
            Cache key string
        """
        # Normalize text: lowercase, trim, remove extra whitespace
        import re
        normalized = re.sub(r'\s+', ' ', text.lower().strip())

        # Create hash for consistent key generation
        content = f"{normalized}:{len(normalized)}"
        return hashlib.sha256(content.encode()).hexdigest()[:16]

    def _normalize_text_for_similarity(self, text: str) -> str:
        """
        Normalize text for similarity matching

        Args:
            text: Input text

        Returns:
            Normalized text string
        """
        # Remove punctuation, normalize case and whitespace
        import re
        normalized = re.sub(r'[^\w\s]', '', text.lower())
        normalized = re.sub(r'\s+', ' ', normalized).strip()
        return normalized

    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate text similarity using word overlap

        Args:
            text1: First text
            text2: Second text

        Returns:
            Similarity score between 0 and 1
        """
        words1 = set(self._normalize_text_for_similarity(text1).split())
        words2 = set(self._normalize_text_for_similarity(text2).split())

        if not words1 or not words2:
            return 0.0

        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))

        return intersection / union if union > 0 else 0.0

    def get(self, text: str, similarity_threshold: float = 0.8) -> Optional[Dict[str, Any]]:
        """
        Get cached sentiment data

        Args:
            text: Input text
            similarity_threshold: Threshold for fuzzy matching

        Returns:
            Cached sentiment data or None
        """
        with self.lock:
            self.stats["total_requests"] += 1

            # Try exact match first
            exact_key = self._generate_key(text)
            if exact_key in self.cache:
                entry = self.cache[exact_key]

                # Check TTL
                if self._is_expired(entry):
                    self._remove_entry(exact_key)
                else:
                    self._update_access(exact_key)
                    self.stats["hits"] += 1
                    return entry.data

            # Try similarity match
            if similarity_threshold > 0:
                for key, entry in self.cache.items():
                    if self._is_expired(entry):
                        continue

                    # Try to reconstruct original text from cache key approximation
                    # This is a simplified approach - in production you'd store original text
                    if entry.data.get("original_text_hash"):
                        # Compare using the stored data similarity
                        cached_text = entry.data.get("text_preview", "")
                        if cached_text and self._calculate_similarity(text, cached_text) >= similarity_threshold:
                            self._update_access(key)
                            self.stats["hits"] += 1
                            return entry.data

            self.stats["misses"] += 1
            return None

    def set(self, text: str, data: Dict[str, Any], ttl: Optional[int] = None) -> None:
        """
        Store sentiment data in cache

        Args:
            text: Input text
            data: Sentiment response data
            ttl: Custom TTL in seconds
        """
        with self.lock:
            key = self._generate_key(text)

            # Add text preview and hash for similarity matching
            enhanced_data = {
                **data,
                "text_preview": text[:100],  # Store first 100 chars for matching
                "original_text_hash": hashlib.md5(text.encode()).hexdigest()[:8]
            }

            # Evict if cache is full
            if len(self.cache) >= self.max_size and key not in self.cache:
                self._evict_lru()

            entry = CacheEntry(
                data=enhanced_data,
                timestamp=time.time(),
                ttl=ttl or self.default_ttl,
                last_accessed=time.time()
            )

            self.cache[key] = entry
            self._update_access_order(key)
            self.stats["sets"] += 1

    def has(self, text: str) -> bool:
        """
        Check if text is cached

        Args:
            text: Input text

        Returns:
            True if cached, False otherwise
        """
        return self.get(text) is not None

    def delete(self, text: str) -> bool:
        """
        Delete entry from cache

        Args:
            text: Input text

        Returns:
            True if deleted, False if not found
        """
        with self.lock:
            key = self._generate_key(text)
            return self._remove_entry(key)

    def clear(self) -> None:
        """Clear all cache entries"""
        with self.lock:
            self.cache.clear()
            self.access_order.clear()

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        with self.lock:
            total_requests = self.stats["total_requests"]
            hit_rate = (self.stats["hits"] / total_requests * 100) if total_requests > 0 else 0

            return {
                **self.stats,
                "cache_size": len(self.cache),
                "max_size": self.max_size,
                "hit_rate": round(hit_rate, 2),
                "memory_usage_estimate": len(self.cache) * 1024  # Rough estimate
            }

    def get_entries(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get cache entries for debugging"""
        with self.lock:
            entries = []
            for key, entry in list(self.cache.items())[:limit]:
                entries.append({
                    "key": key,
                    "timestamp": entry.timestamp,
                    "ttl": entry.ttl,
                    "access_count": entry.access_count,
                    "last_accessed": entry.last_accessed,
                    "data_preview": str(entry.data)[:100]
                })
            return entries

    def _is_expired(self, entry: CacheEntry) -> bool:
        """Check if cache entry has expired"""
        return time.time() - entry.timestamp > entry.ttl

    def _update_access(self, key: str) -> None:
        """Update access information for entry"""
        if key in self.cache:
            entry = self.cache[key]
            entry.access_count += 1
            entry.last_accessed = time.time()
            self._update_access_order(key)

    def _update_access_order(self, key: str) -> None:
        """Update access order for LRU"""
        if key in self.access_order:
            self.access_order.remove(key)
        self.access_order.append(key)

    def _remove_entry(self, key: str) -> bool:
        """Remove entry from cache"""
        removed = False
        if key in self.cache:
            del self.cache[key]
            removed = True

        if key in self.access_order:
            self.access_order.remove(key)

        return removed

    def _evict_lru(self) -> None:
        """Evict least recently used entry"""
        if self.access_order:
            lru_key = self.access_order[0]
            self._remove_entry(lru_key)
            self.stats["evictions"] += 1

    async def start_cleanup_task(self) -> None:
        """Start the background cleanup task if not already started"""
        if not self._cleanup_task_started:
            self._cleanup_task_started = True
            asyncio.create_task(self._cleanup_task())

    async def _cleanup_task(self) -> None:
        """Background task to clean up expired entries"""
        while True:
            try:
                await asyncio.sleep(60)  # Run cleanup every minute

                with self.lock:
                    current_time = time.time()
                    expired_keys = []

                    for key, entry in self.cache.items():
                        if self._is_expired(entry):
                            expired_keys.append(key)

                    for key in expired_keys:
                        self._remove_entry(key)
            except Exception:
                await asyncio.sleep(60)  # Wait before retrying

# Global cache instance
sentiment_cache = SentimentCache(
    max_size=500,      # Store up to 500 sentiment analyses
    default_ttl=300    # Cache for 5 minutes
)

# Cache warming functionality
class CacheWarmer:
    """Utility for pre-populating cache with common phrases"""

    COMMON_PHRASES = [
        "hello",
        "how are you",
        "good morning",
        "thank you",
        "yes",
        "no",
        "I agree",
        "I disagree",
        "that's interesting",
        "what do you think",
        "can you help me",
        "I don't understand",
        "that makes sense",
        "tell me more",
        "that's great"
    ]

    @staticmethod
    async def warm_cache(analysis_func: callable) -> None:
        """
        Warm cache with common phrases

        Args:
            analysis_func: Function to call for sentiment analysis
        """
        for phrase in CacheWarmer.COMMON_PHRASES:
            try:
                # Check if already cached
                if not sentiment_cache.has(phrase):
                    # Pre-compute sentiment for common phrase
                    result = await analysis_func(phrase)
                    if result:
                        sentiment_cache.set(phrase, result, ttl=600)  # 10 minutes TTL

                # Small delay to avoid overwhelming the API
                await asyncio.sleep(0.1)
            except Exception:
                # Skip phrases that fail during warming
                continue

# Utility functions
def get_cache_stats() -> Dict[str, Any]:
    """Get cache statistics"""
    return sentiment_cache.get_stats()

def clear_cache() -> None:
    """Clear all cache entries"""
    sentiment_cache.clear()

def get_cached_sentiment(text: str) -> Optional[Dict[str, Any]]:
    """Get cached sentiment for text"""
    return sentiment_cache.get(text)

def cache_sentiment(text: str, response: SentimentResponse, ttl: Optional[int] = None) -> None:
    """Cache sentiment response"""
    # Convert Pydantic model to dict for caching
    data = response.model_dump()
    sentiment_cache.set(text, data, ttl)