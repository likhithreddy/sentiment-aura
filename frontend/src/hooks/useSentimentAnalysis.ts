import { useState, useCallback, useEffect } from 'react';
import { SentimentData } from '../types';
import axios from 'axios';
import { useToast } from './useToast';
import { retryWithBackoff, withTimeout, requestDeduplicator, createTextCacheKey } from '../utils/networkUtils';
import { CircuitBreaker } from '../utils/networkUtils';
import { enhanceError } from '../types/errors';
import { sentimentCache, isCacheHit } from '../utils/cacheManager';

export const useSentimentAnalysis = () => {
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success, error: toastError, warning } = useToast();

  // Circuit breaker for API resilience
  const circuitBreaker = new CircuitBreaker({
    failureThreshold: 3,
    recoveryTimeout: 30000, // 30 seconds
    monitoringPeriod: 60000 // 1 minute
  });

  const analyzeText = useCallback(async (text: string) => {
    if (!text.trim()) {
      return;
    }

    // Check cache first for immediate response
    const cachedResult = sentimentCache.get(text);
    if (cachedResult) {
      setSentimentData(prev => {
        // If no previous data, use cached data directly
        if (!prev) {
          return cachedResult;
        }

        // Merge cached keywords with existing ones, avoiding duplicates
        const existingKeywords = prev.keywords || [];
        const newKeywords = cachedResult.keywords || [];
        const allKeywords = [...existingKeywords];

        // Add new keywords that don't already exist
        newKeywords.forEach(keyword => {
          if (!allKeywords.includes(keyword)) {
            allKeywords.push(keyword);
          }
        });

        // Return merged data with cached sentiment and accumulated keywords
        const mergedData = {
          sentiment: cachedResult.sentiment,
          sentiment_label: cachedResult.sentiment_label,
          confidence: cachedResult.confidence,
          emotion_scores: cachedResult.emotion_scores,
          keywords: allKeywords
        };

        return mergedData;
      });

      // Show subtle cache hit notification
      const sentimentLabel = cachedResult.sentiment_label || 'analyzed';
      const keywordsCount = cachedResult.keywords?.length || 0;
      success('Analysis Complete', `Detected ${sentimentLabel} sentiment with ${keywordsCount} keywords found. (cached)`);
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    // Create cache key for deduplication
    const cacheKey = createTextCacheKey(text);

    try {
      // Use production URL in production build, fallback to localhost for development
      const backendUrl = import.meta.env.PROD
        ? import.meta.env.VITE_BACKEND_URL || 'https://sentiment-aura.onrender.com'
        : import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

      // Enhanced API call with retry, timeout, and circuit breaker
      const response = await requestDeduplicator.execute(cacheKey, () =>
        circuitBreaker.execute(() =>
          retryWithBackoff(async () => {
            const apiCall = axios.post(`${backendUrl}/process_text`, {
              text: text,
            });

            return withTimeout(apiCall, 15000, 'Sentiment analysis request timed out');
          }, {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 8000
          }, (error, attempt) => {
            // Show retry notification to user
            if (attempt === 1) {
              warning('Connection Issue', 'Retrying sentiment analysis...');
            }
          })
        )
      );


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
        const mergedData = {
          sentiment: response.data.sentiment,
          sentiment_label: response.data.sentiment_label,
          confidence: response.data.confidence,
          emotion_scores: response.data.emotion_scores,
          keywords: allKeywords
        };

        return mergedData;
      });

      // Store result in cache for future use
      sentimentCache.set(text, response.data);

      // Show success toast for successful analysis
      const sentimentLabel = response.data.sentiment_label || 'analyzed';
      const keywordsCount = response.data.keywords?.length || 0;
      success('Analysis Complete', `Detected ${sentimentLabel} sentiment with ${keywordsCount} keywords found.`);

    } catch (err) {
      // Enhanced error handling
      const enhancedError = enhanceError(err);
      setError(enhancedError.userMessage);

      // Show user-friendly error message based on error type
      switch (enhancedError.category) {
        case 'rate_limit':
          warning('Rate Limited', enhancedError.userMessage);
          break;
        case 'timeout':
          toastError('Request Timeout', enhancedError.userMessage);
          break;
        case 'network':
          warning('Network Issue', enhancedError.userMessage);
          break;
        default:
          toastError('Analysis Failed', enhancedError.userMessage);
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [success, toastError, warning]);

  
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