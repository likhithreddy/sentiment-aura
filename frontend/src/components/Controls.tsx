import React from "react";
import { PlayIcon, StopIcon as StopIconSolid } from "@heroicons/react/24/solid";
import { RotateCcw } from "lucide-react";
import AudioLevelMeter from "./AudioLevelMeter";

interface ControlsProps {
  isRecording: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  recordingDuration?: number;
  audioLevel?: number;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  isRecording,
  isConnected,
  isConnecting,
  error,
  recordingDuration,
  audioLevel,
  onStart,
  onStop,
  onReset,
}) => {
  // Determine button state
  const getButtonState = () => {
    if (isRecording) return "recording";
    if (isConnecting) return "connecting";
    if (isConnected) return "ready";
    return "ready"; // Default to ready (idle state)
  };

  const buttonState = getButtonState();

  // Button styles for different states - Pure Tailwind
  const getButtonStyles = () => {
    switch (buttonState) {
      case "connecting":
        return "bg-gray-400 text-white cursor-not-allowed";
      case "ready":
        return "bg-white text-gray-900 hover:bg-gray-100 cursor-pointer shadow-lg";
      case "recording":
        return "bg-red-500 text-white hover:bg-red-600 cursor-pointer shadow-lg";
      default:
        return "bg-white text-gray-900 hover:bg-gray-100 cursor-pointer shadow-lg";
    }
  };

  const isDisabled = buttonState === "connecting";

  // Format recording duration for display
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-transparent py-4 px-4 sm:px-6 md:px-8">
      <div className="flex items-center justify-between max-w-6xl mx-auto">

        {/* Left: Audio Timer */}
        <div className="flex-1 flex justify-start">
          {isRecording && recordingDuration !== undefined && (
            <div className="flex items-center justify-center px-4 py-2 bg-red-500/20 backdrop-blur-sm rounded-full border border-red-500/30">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-3 animate-pulse" />
              <span className="text-white/90 text-sm font-montserrat font-medium">
                {formatDuration(recordingDuration)}
              </span>
            </div>
          )}
        </div>

        {/* Center: Control Buttons */}
        <div className="flex items-center gap-4">
          {/* Start/Stop Button */}
          <button
            onClick={isRecording ? onStop : onStart}
            disabled={isDisabled}
            className={`
              ${getButtonStyles()}
              rounded-full transition-all duration-200 focus:outline-none focus:ring-4
              flex items-center justify-center font-semibold text-lg font-montserrat
              px-6 py-3 h-14 min-w-[120px] focus:ring-white/20
            `}
          >
            {buttonState === "connecting" && (
              <div className="flex items-center justify-center gap-2 w-full">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Connecting...</span>
              </div>
            )}

            {buttonState === "ready" && (
              <div className="flex items-center justify-center gap-2 w-full">
                <PlayIcon className="w-5 h-5" />
                <span>Start</span>
              </div>
            )}

            {buttonState === "recording" && (
              <div className="flex items-center justify-center gap-2 w-full">
                <div className="w-5 h-5 flex items-center justify-center">
                  <StopIconSolid className="w-5 h-5" />
                </div>
                <span>Stop</span>
              </div>
            )}
          </button>

          {/* Reset Button */}
          <button
            onClick={onReset}
            className="flex items-center justify-center w-14 h-14
                       bg-white/90 text-gray-700 rounded-full shadow-lg
                       transition-all duration-200 focus:outline-none focus:ring-4
                       focus:ring-white/30 hover:bg-white hover:text-gray-900
                       hover:shadow-xl active:scale-95"
          >
            <RotateCcw size={24} className="w-6 h-6" />
          </button>
        </div>

        {/* Right: Audio Level Meter */}
        <div className="flex-1 flex justify-end">
          {isRecording && (
            <div className="w-24 h-6 bg-black/30 backdrop-blur-sm rounded-lg p-2 border border-white/10">
              <AudioLevelMeter
                audioLevel={audioLevel}
                isActive={isRecording}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Controls;
