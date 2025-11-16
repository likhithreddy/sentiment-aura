from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.sentiment import router as sentiment_router
from app.core.config import settings
from app.middleware.rateLimiter import create_rate_limiter, RateLimitMiddleware
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Sentiment Aura API",
    description="API for real-time sentiment analysis",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add rate limiting middleware
try:
    # Create and add rate limiting middleware
    app.add_middleware(
        RateLimitMiddleware,
        requests_per_minute=30,
        burst_size=10,
        enable_queue=False
    )
    logger.info("Rate limiting middleware enabled")
except Exception as e:
    logger.error(f"Failed to initialize rate limiting middleware: {e}")

# Include routers
app.include_router(sentiment_router, prefix="/api", tags=["sentiment"])

@app.get("/")
async def root():
    return {"message": "Sentiment Aura API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}