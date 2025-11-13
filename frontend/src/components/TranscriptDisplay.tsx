import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { TranscriptSegment } from '../types';

interface TranscriptDisplayProps {
  transcripts: TranscriptSegment[];
  interimTranscript?: TranscriptSegment | null;
}

const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({ transcripts, interimTranscript }) => {
  const [displayText, setDisplayText] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState(false);
  const tickerControls = useAnimation();

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

  // Start ticker animation when text changes
  useEffect(() => {
    if (displayText && !isAnimating) {
      setIsAnimating(true);

      // Calculate dynamic scroll duration based on text length
      const scrollDuration = Math.max(10, displayText.length * 0.08);

      tickerControls.start({
        x: ["100%", "-200%"],
        transition: {
          x: {
            duration: scrollDuration,
            ease: "linear",
            repeat: Infinity,
            repeatDelay: 2, // Pause before repeating
          }
        }
      });
    } else if (!displayText) {
      tickerControls.stop();
      setIsAnimating(false);
    }
  }, [displayText, tickerControls, isAnimating]);

  // Only render when there's content to display
  if (!displayText.trim()) {
    return null;
  }

  return (
    <motion.div
      animate={tickerControls}
      initial={{ x: "100%" }}
      whileHover={{ animationPlayState: "paused" }}
      className="fixed top-32 text-3xl font-semibold leading-tight text-white font-display whitespace-nowrap will-change-transform z-[50]"
      style={{
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        transform: 'translateZ(0)'
      }}
    >
      {displayText}
    </motion.div>
  );
};

export default TranscriptDisplay;