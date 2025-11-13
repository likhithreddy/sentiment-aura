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

  // Button variants for different states
  const buttonVariants = {
    connecting: {
      scale: 1,
      backgroundColor: "rgb(156, 163, 175)", // gray-400
    },
    ready: {
      scale: 1,
      backgroundColor: "rgb(255, 255, 255)", // white
    },
    recording: {
      scale: 1,
      backgroundColor: "rgb(239, 68, 68)", // red-500
    },
    hover: {
      scale: 1.05,
      transition: { duration: 0.2 },
    },
    tap: {
      scale: 0.95,
      transition: { duration: 0.1 },
    },
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
            variants={buttonVariants}
            animate={buttonState}
            whileHover={!isDisabled ? "hover" : undefined}
            whileTap={!isDisabled ? "tap" : undefined}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={`
              rounded-full shadow-lg transition-all duration-200 focus:outline-none focus:ring-4
              flex items-center justify-center font-semibold text-sm font-display overflow-hidden
              px-4 py-2 h-10 sm:h-11 lg:h-12 min-w-[100px]
              ${isDisabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}
              ${
                buttonState === "ready"
                  ? "text-gray-900 hover:bg-gray-50 focus:ring-white/20"
                  : "text-white"
              }
              ${
                buttonState === "recording"
                  ? "hover:bg-red-600 focus:ring-red-300"
                  : ""
              }
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
                  <PlayIcon className="w-4 h-4" />
                  Start
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
                      scale: [1, 1.2, 1],
                      opacity: [1, 0.7, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <StopIconSolid className="w-4 h-4" />
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
                     w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12
                     bg-gray-100/90 text-gray-600 rounded-full shadow-md
                     transition-all duration-200 focus:outline-none focus:ring-4
                     focus:ring-gray-100/20 hover:bg-white hover:text-gray-900
                     hover:shadow-lg active:scale-95"
        >
          <RotateCcw
            size={20}
            className="w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-5"
          />
        </motion.button>
      </div>
    </div>
  );
};

export default Controls;
