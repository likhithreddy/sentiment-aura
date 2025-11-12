#!/usr/bin/env python3

"""
Simple test script to verify the backend sentiment analysis API works correctly.
Tests the Groq-powered sentiment analysis endpoint.
Run this script after starting the backend server to test the API endpoint.
"""

import requests
import json
import time

def test_sentiment_analysis():
    """Test the sentiment analysis endpoint with sample text."""

    # Test data
    test_texts = [
        "I am feeling absolutely wonderful today! This is amazing.",
        "I'm quite frustrated with this situation and feeling angry.",
        "The weather is okay, nothing special about it.",
        "I love spending time with my family and friends, it brings me so much joy!",
        "I'm worried about the upcoming exam and feeling anxious about my performance."
    ]

    # API endpoint
    url = "http://localhost:8000/process_text"

    print("Testing Sentiment Aura Backend API (Powered by Groq)")
    print("=" * 50)

    for i, text in enumerate(test_texts, 1):
        print(f"\nTest {i}: \"{text}\"")
        print("-" * 30)

        try:
            # Send POST request
            response = requests.post(
                url,
                json={"text": text},
                headers={"Content-Type": "application/json"},
                timeout=10
            )

            if response.status_code == 200:
                result = response.json()
                print("✅ Success!")
                print(f"   Sentiment: {result.get('sentiment', 0):.2f}")
                print(f"   Label: {result.get('sentiment_label', 'unknown')}")
                print(f"   Keywords: {result.get('keywords', [])}")
                print(f"   Confidence: {result.get('confidence', 0):.2f}")
                print(f"   Emotions: {result.get('emotion_scores', {})}")
            else:
                print(f"❌ Error: {response.status_code}")
                print(f"   Response: {response.text}")

        except requests.exceptions.ConnectionError:
            print("❌ Connection Error: Backend server is not running or not accessible")
            print("   Make sure to start the backend server first:")
            print("   cd backend && python start.py")
            break

        except requests.exceptions.Timeout:
            print("❌ Timeout Error: Request took too long")

        except Exception as e:
            print(f"❌ Unexpected Error: {str(e)}")

        # Small delay between requests
        time.sleep(1)

    print("\n" + "=" * 40)
    print("Testing complete!")

if __name__ == "__main__":
    test_sentiment_analysis()