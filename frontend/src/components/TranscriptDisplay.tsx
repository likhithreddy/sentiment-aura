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

  // Calculate duration based on text length for consistent scrolling speed
  const duration = Math.max(8, displayText.length * 0.15);

  // Framer Motion variants for the ticker animation
  const tickerVariants = {
    animate: {
      x: [0, -50],
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
    // Container that defines the scrolling area
    <div className="fixed top-24 left-0 right-0 h-20 overflow-hidden z-[50]">
      {/* Center the ticker content vertically */}
      <div className="flex items-center justify-center h-full">
        {/* Animated wrapper that moves the content */}
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
          {/* Duplicate content for seamless infinite scrolling */}
          <span className="text-3xl font-semibold leading-tight text-white font-display pr-8">
            {displayText}
          </span>
          <span className="text-3xl font-semibold leading-tight text-white font-display pr-8">
            {displayText}
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default TranscriptDisplay;