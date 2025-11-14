import React, { useState, useCallback } from 'react';
import PerlinAura from './components/PerlinAura';
import TranscriptDisplay from './components/TranscriptDisplay';
import KeywordsDisplay from './components/KeywordsDisplay';
import Controls from './components/Controls';
import ToastContainer from './components/Toast/ToastContainer';
import { useDeepgram } from './hooks/useDeepgram';
import { useSentimentAnalysis } from './hooks/useSentimentAnalysis';
import { TranscriptSegment } from './types';
import './App.css';

const App: React.FC = () => {
  const [finalTranscripts, setFinalTranscripts] = useState<TranscriptSegment[]>([]);
  const [currentInterim, setCurrentInterim] = useState<TranscriptSegment | null>(null);
  const { analyzeText, clearSentimentData, sentimentData: hookSentimentData } = useSentimentAnalysis();

  const deepgram = useDeepgram({
    onTranscript: useCallback((transcript: TranscriptSegment) => {
      if (transcript.is_final) {
        setFinalTranscripts(prev => [...prev, transcript]);
        setCurrentInterim(null); // Clear interim when final comes in

        // Analyze sentiment for final transcripts
        analyzeText(transcript.text);
      } else {
        // Update interim transcript
        setCurrentInterim(transcript);
      }
    }, [analyzeText]),
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
