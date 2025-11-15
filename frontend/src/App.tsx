import React, { useState, useCallback, useMemo } from 'react';
import PerlinAura from './components/PerlinAura';
import TranscriptDisplay from './components/TranscriptDisplay';
import KeywordsDisplay from './components/KeywordsDisplay';
import Controls from './components/Controls';
import ToastContainer from './components/Toast/ToastContainer';
import { useDeepgram } from './hooks/useDeepgram';
import { useSentimentAnalysis } from './hooks/useSentimentAnalysis';
import { TranscriptSegment } from './types';
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
  const { analyzeText, clearSentimentData, sentimentData: hookSentimentData } = useSentimentAnalysis();

  // Create throttled version for real-time sentiment analysis
  const throttledAnalyzeText = useMemo(() =>
    throttle((text: string) => {
      console.log('🧠 Real-time sentiment analysis triggered:', text);
      analyzeText(text);
    }, 2000), // Max 1 call per 2 seconds to prevent API overload
  [analyzeText]
  );

  const deepgram = useDeepgram({
    onTranscript: useCallback((transcript: TranscriptSegment) => {
      console.log('🎤 New transcript received:', transcript.is_final ? 'FINAL' : 'INTERIM', transcript.text);

      if (transcript.is_final) {
        setFinalTranscripts(prev => [...prev, transcript]);
        setCurrentInterim(null); // Clear interim when final comes in

        // Analyze sentiment for final transcripts (non-throttled for immediate results)
        console.log('📊 Analyzing final transcript sentiment:', transcript.text);
        analyzeText(transcript.text);
      } else {
        // Update interim transcript
        setCurrentInterim(transcript);

        // 🚀 KEY FIX: Analyze sentiment for interim transcripts for REAL-TIME updates
        // Only analyze meaningful text (longer than 3 words) to avoid noise
        const wordCount = transcript.text.trim().split(/\s+/).length;
        if (wordCount >= 3) {
          console.log('⚡ Real-time sentiment analysis on interim transcript:', transcript.text);
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
  }, [clearSentimentData, deepgram]);

  // DEBUG: Log sentiment data being passed to PerlinAura
    console.log('🚀 App.tsx - hookSentimentData being passed to PerlinAura:', hookSentimentData);
    console.log('🚀 App.tsx - hookSentimentData.emotion_scores:', hookSentimentData?.emotion_scores);

  return (
    <div className="app">
      <PerlinAura
        sentimentData={hookSentimentData}
        isRecording={deepgram.isRecording}
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
      />

      <ToastContainer />
    </div>
  );
};

export default App;
