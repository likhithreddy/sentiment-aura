import React from "react";
import { PlayIcon, StopIcon as StopIconSolid } from "@heroicons/react/24/solid";
import { RotateCcw } from "lucide-react";
import AudioLevelMeter from "./AudioLevelMeter";
import VisualizationSelector from "./VisualizationSelector";
import { VisualizationType } from "../types/visualizations";

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
  visualizationType: VisualizationType;
  onVisualizationChange: (type: VisualizationType) => void;
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
  visualizationType,
  onVisualizationChange,
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
    <div className="fixed top-0 left-0 right-0 z-[100] bg-transparent py-4 px-6 sm:px-8 md:px-12">
      <div className="bg-gradient-to-t from-black/25 to-black/15 backdrop-blur-sm border border-white/20 rounded-[3rem] px-8 py-4 shadow-xl w-full">
        <div className="flex items-center justify-between">

          {/* Left: Audio Timer */}
          <div className="flex-1 flex justify-start">
            <div className={`flex items-center justify-center transition-all duration-200 ${
              isRecording
                ? 'text-white/90'
                : 'text-white/50'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-3 transition-all duration-200 ${
                isRecording
                  ? 'bg-red-500 animate-pulse'
                  : 'bg-gray-400'
              }`} />
              <span className={`text-sm font-montserrat font-medium transition-all duration-200 ${
                isRecording
                  ? 'text-white/90'
                  : 'text-white/50'
              }`}>
                {isRecording && recordingDuration !== undefined
                  ? formatDuration(recordingDuration)
                  : '00:00'
                }
              </span>
            </div>
          </div>

          {/* Center: Control Buttons */}
          <div className="flex items-center gap-3">
            {/* Visualization Selector Dropdown */}
            <VisualizationSelector
              currentType={visualizationType}
              onTypeChange={onVisualizationChange}
              disabled={isConnecting}
            />

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
            <AudioLevelMeter
              audioLevel={audioLevel}
              isActive={isRecording}
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default Controls;
