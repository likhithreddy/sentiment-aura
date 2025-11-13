import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlayIcon, StopIcon as StopIconSolid } from "@heroicons/react/24/solid";
import { RotateCcw } from "lucide-react";

interface ControlsProps {
  isRecording: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  isRecording,
  isConnected,
  isConnecting,
  error,
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

  // Button variants for different states - Tailwind-based
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

  // Text variants for smooth transitions
  const textVariants = {
    connecting: { opacity: 1 },
    ready: { opacity: 1 },
    recording: { opacity: 1 },
    exit: { opacity: 0, x: -20 },
  };

  const isDisabled = buttonState === "connecting";

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-black/15 backdrop-blur-lg shadow-[0_4px_30px_rgba(0,0,0,0.1)] py-4 px-4 sm:px-6 md:px-8">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {/* Left spacer - empty div for layout balance */}
        <div />

        {/* Multi-State Button - Centered */}
        <div className="flex-1 flex justify-center">
          <motion.button
            onClick={isRecording ? onStop : onStart}
            disabled={isDisabled}
            whileHover={!isDisabled ? { scale: 1.05 } : undefined}
            whileTap={!isDisabled ? { scale: 0.95 } : undefined}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={`
              ${getButtonStyles()}
              rounded-full transition-all duration-200 focus:outline-none focus:ring-4
              flex items-center justify-center font-semibold text-lg font-montserrat overflow-hidden
              px-6 py-3 h-14 sm:h-16 min-w-[120px]
              focus:ring-white/20
            `}
          >
            <AnimatePresence mode="wait">
              {buttonState === "connecting" && (
                <motion.div
                  key="connecting"
                  variants={textVariants}
                  initial="exit"
                  animate="connecting"
                  exit="exit"
                  className="flex items-center justify-center gap-1 w-full"
                >
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Connecting...</span>
                </motion.div>
              )}

              {buttonState === "ready" && (
                <motion.div
                  key="ready"
                  variants={textVariants}
                  initial="exit"
                  animate="ready"
                  exit="exit"
                  className="flex items-center justify-center gap-1 w-full"
                >
                  <PlayIcon className="w-5 h-5" />
                  <span className="pl-3">Start</span>
                </motion.div>
              )}

              {buttonState === "recording" && (
                <motion.div
                  key="recording"
                  variants={textVariants}
                  initial="exit"
                  animate="recording"
                  exit="exit"
                  className="flex items-center justify-center gap-1 w-full"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.4, 1],
                      opacity: [1, 0.6, 1],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="drop-shadow-lg"
                  >
                    <StopIconSolid className="w-5 h-5" />
                  </motion.div>
                  Stop
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Reset Button - Right side */}
        <motion.button
          onClick={onReset}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center justify-center aspect-square
                     w-14 h-14 sm:w-16 sm:h-16 lg:w-16 lg:h-16
                     bg-white/90 text-gray-700 rounded-full shadow-lg
                     transition-all duration-200 focus:outline-none focus:ring-4
                     focus:ring-white/30 hover:bg-white hover:text-gray-900
                     hover:shadow-xl active:scale-95"
        >
          <RotateCcw
            size={24}
            className="w-6 h-6 sm:w-7 sm:h-7 lg:w-7 lg:h-7"
          />
        </motion.button>
      </div>
    </div>
  );
};

export default Controls;
