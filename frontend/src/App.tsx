import React, { useState, useCallback, useMemo, useEffect } from 'react';
import TranscriptDisplay from './components/TranscriptDisplay';
import KeywordsDisplay from './components/KeywordsDisplay';
import Controls from './components/Controls';
import ToastContainer from './components/Toast/ToastContainer';
import { useDeepgram } from './hooks/useDeepgram';
import { useSentimentAnalysis } from './hooks/useSentimentAnalysis';
import { TranscriptSegment } from './types';
import { VisualizationType } from './types/visualizations';
import { SafeVisualizationRenderer } from './components/visualizations/VisualizationFactory';
import './App.css';

// Simple throttle implementation for API call limiting
const throttle = (func: Function, limit: number) => {
  let inThrottle: boolean;
  return function(this: any) {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
};

const App: React.FC = () => {
  const [finalTranscripts, setFinalTranscripts] = useState<TranscriptSegment[]>([]);
  const [currentInterim, setCurrentInterim] = useState<TranscriptSegment | null>(null);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [visualizationType, setVisualizationType] = useState<VisualizationType>(VisualizationType.LINEAR_DOTS);
  const { analyzeText, clearSentimentData, sentimentData: hookSentimentData } = useSentimentAnalysis();

  // Debug logging for sentiment data flow
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('App: Sentiment data updated:', {
        hasSentimentData: !!hookSentimentData,
        sentimentLabel: hookSentimentData?.sentiment_label,
        sentiment: hookSentimentData?.sentiment,
        confidence: hookSentimentData?.confidence,
        emotionScores: hookSentimentData?.emotion_scores,
        keywords: hookSentimentData?.keywords?.length || 0,
        timestamp: Date.now()
      });
    }
  }, [hookSentimentData]);

  // Create throttled version for real-time sentiment analysis
  const throttledAnalyzeText = useMemo(() =>
    throttle((text: string) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('App: Analyzing text for sentiment:', { text, timestamp: Date.now() });
      }
      analyzeText(text);
    }, 2000), // Max 1 call per 2 seconds to prevent API overload
  [analyzeText]
  );

  const deepgram = useDeepgram({
    onTranscript: useCallback((transcript: TranscriptSegment) => {
      if (transcript.is_final) {
        setFinalTranscripts(prev => [...prev, transcript]);
        setCurrentInterim(null); // Clear interim when final comes in

        // Analyze sentiment for final transcripts (non-throttled for immediate results)
        analyzeText(transcript.text);
      } else {
        // Update interim transcript
        setCurrentInterim(transcript);

        // Analyze sentiment for interim transcripts for REAL-TIME updates
        // Only analyze meaningful text (longer than 3 words) to avoid noise
        const wordCount = transcript.text.trim().split(/\s+/).length;
        if (wordCount >= 3) {
          throttledAnalyzeText(transcript.text);
        }
      }
    }, [analyzeText, throttledAnalyzeText]),
    onError: useCallback((error: Error) => {
      console.error('Transcription error:', error);
    }, []),
  });

  const handleStart = useCallback(() => {
    setFinalTranscripts([]);
    setCurrentInterim(null);
    deepgram.startRecording();
  }, [deepgram]);

  const handleStop = useCallback(() => {
    deepgram.stopRecording();
  }, [deepgram]);

  const handleReset = useCallback(() => {
    // Clear all transcript data
    setFinalTranscripts([]);
    setCurrentInterim(null);

    // Clear sentiment analysis data (keywords and sentiment)
    clearSentimentData();

    // Stop recording if currently active
    if (deepgram.isRecording) {
      deepgram.stopRecording();
    }

    // Trigger visualization reset
    setResetTrigger(prev => prev + 1);
  }, [clearSentimentData, deepgram]);

  const handleVisualizationChange = useCallback((type: VisualizationType) => {
    setVisualizationType(type);
    console.log('Visualization changed to:', type);
  }, []);

  
  return (
    <div className="app">
      {/* Dynamic Visualization Renderer */}
      <SafeVisualizationRenderer
        type={visualizationType}
        sentimentData={hookSentimentData}
        isRecording={deepgram.isRecording}
        resetTrigger={resetTrigger}
      />

      <TranscriptDisplay transcripts={finalTranscripts} interimTranscript={currentInterim} />

      <KeywordsDisplay
        keywords={hookSentimentData?.keywords || []}
        sentiment={hookSentimentData?.sentiment || 0}
        sentimentData={hookSentimentData || null}
      />

      <Controls
        isRecording={deepgram.isRecording}
        isConnected={deepgram.isConnected}
        isConnecting={deepgram.isConnecting}
        error={deepgram.error}
        recordingDuration={deepgram.recordingDuration}
        audioLevel={deepgram.audioLevel}
        onStart={handleStart}
        onStop={handleStop}
        onReset={handleReset}
        visualizationType={visualizationType}
        onVisualizationChange={handleVisualizationChange}
      />

      <ToastContainer />
    </div>
  );
};

export default App;
