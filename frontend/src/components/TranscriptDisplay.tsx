import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Mic } from 'lucide-react';
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

  return (
    <div className="fixed top-16 left-0 w-full h-[calc(75vh-4rem)] bg-gradient-to-b from-black/80 via-black/60 to-black/80 backdrop-blur-md border-b border-white/10 p-8 text-white font-sans z-[50] overflow-hidden flex flex-col">
      {/* Listening indicator */}
      <div className="flex items-center justify-end mb-4">
        {interimTranscript && (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex items-center gap-2 text-white/70 text-sm"
          >
            <Mic size={16} className="animate-pulse" />
            <span>Listening...</span>
          </motion.div>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center relative overflow-hidden whitespace-nowrap">
        <motion.div
          animate={tickerControls}
          initial={{ x: "100%" }}
          whileHover={{ animationPlayState: "paused" }}
          className="text-3xl font-semibold leading-tight text-white/92 font-display letter-spacing-[-0.02em] whitespace-nowrap pr-24 absolute will-change-transform text-shadow-[0_2px_10px_rgba(0,0,0,0.3)]"
          style={{
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            transform: 'translateZ(0)'
          }}
        >
          {displayText || (
            <div className="text-white/60 italic text-2xl font-medium text-center whitespace-normal max-w-[80%]">
              Start speaking to see the transcription scroll across the screen...
            </div>
          )}
        </motion.div>
      </div>

  </div>
  );
};

export default TranscriptDisplay;