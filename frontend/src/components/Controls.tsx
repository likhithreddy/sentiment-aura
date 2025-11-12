import React from 'react';

interface ControlsProps {
  isRecording: boolean;
  isConnected: boolean;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  isRecording,
  isConnected,
  error,
  onStart,
  onStop,
}) => {
  return (
    <div className="controls">
      <button
        className={`control-button ${isRecording ? 'stop' : 'start'} ${
          isConnected ? 'connected' : ''
        }`}
        onClick={isRecording ? onStop : onStart}
        disabled={!isRecording && isConnected}
      >
        {isRecording ? (
          <>
            <span className="pulse-dot"></span>
            Stop
          </>
        ) : (
          <>
            <span className="microphone-icon">🎤</span>
            Start
          </>
        )}
      </button>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {isRecording && !isConnected && (
        <div className="connecting-indicator">
          🔄 Connecting to Deepgram...
        </div>
      )}

      {isRecording && isConnected && (
        <div className="status-indicator">
          🎤 Recording & Transcribing...
        </div>
      )}

      <style>{`
        .controls {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          z-index: 100;
        }

        .control-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px 32px;
          border: none;
          border-radius: 50px;
          font-size: 18px;
          font-weight: 600;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.2);
          outline: none;
          min-width: 140px;
          justify-content: center;
        }

        .control-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(0, 0, 0, 0.4);
        }

        .control-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .control-button.start {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .control-button.stop {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .control-button.connected {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        .pulse-dot {
          width: 12px;
          height: 12px;
          background: #ff4757;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }

        .microphone-icon {
          font-size: 20px;
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 71, 87, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(255, 71, 87, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(255, 71, 87, 0);
          }
        }

        .error-message {
          background: rgba(255, 71, 87, 0.9);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          box-shadow: 0 2px 10px rgba(255, 71, 87, 0.3);
          backdrop-filter: blur(10px);
        }

        .connecting-indicator,
        .status-indicator {
          background: rgba(79, 172, 254, 0.9);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          box-shadow: 0 2px 10px rgba(79, 172, 254, 0.3);
          backdrop-filter: blur(10px);
          animation: fadeInOut 1.5s infinite;
        }

        .status-indicator {
          background: rgba(76, 175, 80, 0.9);
          box-shadow: 0 2px 10px rgba(76, 175, 80, 0.3);
        }

        @keyframes fadeInOut {
          0%, 100% {
            opacity: 0.7;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Controls;