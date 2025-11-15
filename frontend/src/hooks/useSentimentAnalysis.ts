import { useState, useCallback } from 'react';
import { SentimentData } from '../types';
import axios from 'axios';
import { useToast } from './useToast';

export const useSentimentAnalysis = () => {
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success, error: toastError, warning } = useToast();

  const analyzeText = useCallback(async (text: string) => {
    if (!text.trim()) {
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      console.log('🤖 Calling sentiment analysis API with text:', text);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      console.log('📡 Backend URL:', backendUrl);

      const response = await axios.post(`${backendUrl}/process_text`, {
        text: text,
      });

      console.log('📊 API Response received:', response.data);
      console.log('📈 Sentiment score:', response.data.sentiment);
      console.log('🏷️ Sentiment label:', response.data.sentiment_label);
      console.log('🔑 Keywords found:', response.data.keywords?.length || 0);
      console.log('💪 Confidence score:', response.data.confidence);
      console.log('😊 Emotion scores:', response.data.emotion_scores);

      setSentimentData(prev => {
        // If no previous data, use new data directly
        if (!prev) {
          return response.data;
        }

        // Merge new keywords with existing ones, avoiding duplicates
        const existingKeywords = prev.keywords || [];
        const newKeywords = response.data.keywords || [];
        const allKeywords = [...existingKeywords];

        // Add new keywords that don't already exist
        newKeywords.forEach(keyword => {
          if (!allKeywords.includes(keyword)) {
            allKeywords.push(keyword);
          }
        });

        // Return merged data with new sentiment and accumulated keywords
        return {
          sentiment: response.data.sentiment,
          sentiment_label: response.data.sentiment_label,
          confidence: response.data.confidence,
          emotion_scores: response.data.emotion_scores,
          keywords: allKeywords
        };
      });

      const mergedData = {
        sentiment: response.data.sentiment,
        sentiment_label: response.data.sentiment_label,
        confidence: response.data.confidence,
        emotion_scores: response.data.emotion_scores,
        keywords: allKeywords
      };

      console.log('🔄 Sentiment data updated in state:', mergedData);
      console.log('🎯 Total keywords accumulated:', allKeywords.length);
      console.log('📊 Dominant emotion:', Object.entries(response.data.emotion_scores || {})
        .reduce((a, b) => (a[1] > b[1] ? a : b))[0]);

      // Show success toast for successful analysis
      const sentimentLabel = response.data.sentiment_label || 'analyzed';
      const keywordsCount = response.data.keywords?.length || 0;
      success('Analysis Complete', `Detected ${sentimentLabel} sentiment with ${keywordsCount} keywords found.`);

    } catch (err) {
      console.error('Error analyzing sentiment:', err);
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      toastError('Analysis Failed', 'Unable to analyze text sentiment. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [success, toastError]);

  const clearSentimentData = useCallback(() => {
    setSentimentData(null);
    setError(null);
    setIsAnalyzing(false);
  }, []);

  return {
    sentimentData,
    isAnalyzing,
    error,
    analyzeText,
    clearSentimentData,
  };
};