import React, { useState, useEffect } from 'react';
import { TranscriptSegment } from '../types';

interface TranscriptDisplayProps {
  transcripts: TranscriptSegment[];
  interimTranscript?: TranscriptSegment | null;
}

const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({ transcripts, interimTranscript }) => {
  const [displayText, setDisplayText] = useState<string>('');

  useEffect(() => {
    // Combine final transcript segments
    const finalText = transcripts
      .filter(segment => segment.is_final)
      .map(segment => segment.text)
      .join(' ');

    // Add interim text if available
    const interimText = interimTranscript?.text || '';
    const combinedText = finalText + (finalText && interimText ? ' ' : '') + interimText;

    setDisplayText(combinedText);
  }, [transcripts, interimTranscript]);

  return (
    <div className="transcript-display">
      <div className="transcript-header">
        <h3>Transcription</h3>
        {interimTranscript && <span className="listening-indicator">🎤 Listening...</span>}
      </div>
      <div className="transcript-content">
        {displayText || (
          <div className="transcript-placeholder">
            Start speaking to see the transcription...
          </div>
        )}
      </div>
      <style>{`
        .transcript-display {
          position: fixed;
          bottom: 20px;
          left: 20px;
          width: 400px;
          max-height: 200px;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 16px;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          z-index: 10; /* Content layer */
        }

        .transcript-header {
          margin-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding-bottom: 8px;
        }

        .transcript-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          display: inline-block;
        }

        .listening-indicator {
          margin-left: 10px;
          font-size: 14px;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        .transcript-content {
          font-size: 14px;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.8);
          overflow-y: auto;
          max-height: 140px;
        }

        .transcript-placeholder {
          color: rgba(255, 255, 255, 0.5);
          font-style: italic;
        }

        @media (max-width: 768px) {
          .transcript-display {
            width: calc(100% - 40px);
            max-width: 400px;
          }
        }
      `}</style>
    </div>
  );
};

export default TranscriptDisplay;