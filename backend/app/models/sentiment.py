from pydantic import BaseModel
from typing import List, Optional

class SentimentRequest(BaseModel):
    text: str

class SentimentResponse(BaseModel):
    sentiment: float  # -1 to 1 (negative to positive)
    sentiment_label: str  # "positive", "negative", "neutral"
    keywords: List[str]
    confidence: float
    emotion_scores: dict  # {"joy": 0.8, "sadness": 0.1, "anger": 0.1, "fear": 0.0}