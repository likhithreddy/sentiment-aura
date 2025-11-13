export interface SentimentData {
  sentiment: number;
  sentiment_label: string;
  keywords: string[];
  confidence: number;
  emotion_scores: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    disgust: number;
  };
}

export interface TranscriptSegment {
  text: string;
  is_final: boolean;
  timestamp: number;
}

export interface ConnectionState {
  isRecording: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}