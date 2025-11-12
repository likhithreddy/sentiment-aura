from fastapi import APIRouter, HTTPException
from app.models.sentiment import SentimentRequest, SentimentResponse
from app.core.config import settings
import groq
import json
import logging

router = APIRouter()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Groq client
client = groq.Groq(api_key=settings.groq_api_key)

@router.post("/process_text", response_model=SentimentResponse)
async def process_text(request: SentimentRequest):
    """
    Process text to extract sentiment and keywords using Groq API.
    """
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")

        # Create the prompt for Groq
        prompt = f"""
        Analyze the sentiment and extract keywords from the following text.
        Respond with a JSON object containing:
        - sentiment: a float between -1 (very negative) and 1 (very positive)
        - sentiment_label: one of "positive", "negative", or "neutral"
        - keywords: a list of 3-5 important keywords or topics
        - confidence: a float between 0 and 1 indicating confidence in the analysis
        - emotion_scores: a dictionary with emotion names as keys and scores 0-1 as values. Include these emotions: "joy", "sadness", "anger", "fear", "surprise", "disgust"

        Text to analyze: "{request.text}"

        Respond only with valid JSON, no other text.
        """

        # Make API call to Groq
        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {"role": "system", "content": "You are a sentiment analysis expert. Always respond with valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=500,
            response_format={"type": "json_object"}
        )

        # Extract and parse the response
        response_text = response.choices[0].message.content.strip()

        # Try to extract JSON from response
        try:
            # Remove any markdown code block markers
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()

            result = json.loads(response_text)
        except json.JSONDecodeError:
            logger.error(f"Failed to parse JSON response: {response_text}")
            # Fallback to basic analysis
            result = {
                "sentiment": 0.0,
                "sentiment_label": "neutral",
                "keywords": ["unknown"],
                "confidence": 0.5,
                "emotion_scores": {"joy": 0.2, "sadness": 0.2, "anger": 0.2, "fear": 0.2, "surprise": 0.1, "disgust": 0.1}
            }

        # Validate and normalize the response
        sentiment = max(-1.0, min(1.0, float(result.get("sentiment", 0.0))))

        if sentiment > 0.1:
            sentiment_label = "positive"
        elif sentiment < -0.1:
            sentiment_label = "negative"
        else:
            sentiment_label = "neutral"

        keywords = result.get("keywords", [])
        if not isinstance(keywords, list):
            keywords = [str(keywords)]

        confidence = max(0.0, min(1.0, float(result.get("confidence", 0.5))))

        # Ensure emotion scores are valid
        emotion_scores = result.get("emotion_scores", {})
        required_emotions = ["joy", "sadness", "anger", "fear", "surprise", "disgust"]
        for emotion in required_emotions:
            if emotion not in emotion_scores:
                emotion_scores[emotion] = 0.1
            emotion_scores[emotion] = max(0.0, min(1.0, float(emotion_scores[emotion])))

        return SentimentResponse(
            sentiment=sentiment,
            sentiment_label=sentiment_label,
            keywords=keywords[:5],  # Limit to 5 keywords
            confidence=confidence,
            emotion_scores=emotion_scores
        )

    except Exception as e:
        logger.error(f"Error processing text: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing text: {str(e)}")