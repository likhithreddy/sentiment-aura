import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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

  // Only render when there's content to display
  if (!displayText.trim()) {
    return null;
  }

  // Calculate duration based on text length for extremely slow scrolling speed
  const duration = Math.max(30, displayText.length * 0.8);

  // Framer Motion variants for the ticker animation
  const tickerVariants = {
    animate: {
      x: ["100%", "-100%"],
      transition: {
        x: {
          duration: duration,
          ease: "linear",
          repeat: Infinity,
        },
      },
    },
  };

  return (
    // Semi-transparent tunnel panel for scrolling area
    <div className="fixed top-[45vh] left-0 right-0 h-32 overflow-hidden z-[60]">
      {/* Glass effect panel with tunnel appearance */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-24 bg-black/20 backdrop-blur-sm border-y border-white/10">
        {/* Gradient edges for tunnel depth effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20" />

        {/* Center the ticker content vertically */}
        <div className="relative flex items-center justify-center h-full">
          {/* Animated wrapper that moves the content extremely slowly */}
          <motion.div
            variants={tickerVariants}
            animate="animate"
            className="flex whitespace-nowrap"
            whileHover={{ animationPlayState: "paused" }}
            style={{
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
            }}
          >
            {/* Single content for proper ticker scrolling */}
            <span className="text-4xl font-light leading-relaxed text-white/95 font-display tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)] px-4">
              {displayText}
            </span>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TranscriptDisplay;