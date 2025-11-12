from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.sentiment import router as sentiment_router
from app.core.config import settings

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

# Include routers
app.include_router(sentiment_router, tags=["sentiment"])

@app.get("/")
async def root():
    return {"message": "Sentiment Aura API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}