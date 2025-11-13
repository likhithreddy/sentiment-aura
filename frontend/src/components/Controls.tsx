import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, RotateCcw } from 'lucide-react';

interface ControlsProps {
  isRecording: boolean;
  isConnected: boolean;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  isRecording,
  isConnected,
  error,
  onStart,
  onStop,
  onReset,
}) => {

  // Animation variants for buttons
  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
    disabled: { scale: 1, opacity: 0.6 }
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-16 z-[100] bg-black/20 backdrop-blur-md border-b border-white/10">
      <div className="flex items-center justify-between h-full px-8">
        {/* Left spacer */}
        <div className="w-12" />

        {/* Start Button - Centered */}
        <div className="flex-1 flex justify-center">
          <motion.button
            onClick={isRecording ? onStop : onStart}
            disabled={!isRecording && isConnected}
            variants={buttonVariants}
            initial="idle"
            whileHover="hover"
            whileTap="tap"
            animate={!isRecording && isConnected ? 'disabled' : 'idle'}
            className={`inline-flex items-center gap-3 px-8 py-3 bg-white text-gray-900 font-semibold rounded-full shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-white/20 ${
              !isRecording && isConnected
                ? 'opacity-60 cursor-not-allowed bg-white/70'
                : 'hover:bg-gray-100 hover:shadow-xl hover:scale-105 active:scale-95'
            }`}
          >
            {isRecording ? <Square size={20} /> : <Mic size={20} />}
            <span>{isRecording ? 'Stop' : 'Start'}</span>
          </motion.button>
        </div>

        {/* Reset Button - Right side */}
        <div className="w-12 flex justify-end">
          <motion.button
            onClick={onReset}
            variants={buttonVariants}
            initial="idle"
            whileHover="hover"
            whileTap="tap"
            className="flex items-center justify-center w-12 h-12 bg-gray-100/90 text-gray-600 rounded-full shadow-md transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-gray-100/20 hover:bg-white hover:text-gray-900 hover:shadow-lg hover:scale-110 active:scale-95"
          >
            <RotateCcw size={20} />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default Controls;