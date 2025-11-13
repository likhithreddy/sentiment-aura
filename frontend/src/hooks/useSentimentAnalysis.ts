import { useState, useCallback } from 'react';
import { SentimentData } from '../types';
import axios from 'axios';

export const useSentimentAnalysis = () => {
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeText = useCallback(async (text: string) => {
    if (!text.trim()) {
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const response = await axios.post(`${backendUrl}/process_text`, {
        text: text,
      });

      setSentimentData(response.data);
    } catch (err) {
      console.error('Error analyzing sentiment:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

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