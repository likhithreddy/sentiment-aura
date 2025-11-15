import React from "react";
import { motion } from "framer-motion";

interface AudioLevelMeterProps {
  audioLevel?: number;
  isActive: boolean;
}

const AudioLevelMeter: React.FC<AudioLevelMeterProps> = ({
  audioLevel = 0,
  isActive,
}) => {
  // Number of bars in the meter
  const barCount = 15;

  // Calculate how many bars should be lit based on audio level
  const litBars = isActive ? Math.ceil((audioLevel || 0) * barCount) : 0;
  const showInactiveBars = !isActive;

  return (
    <div className="flex items-end justify-center h-6 gap-0.5">
      {Array.from({ length: barCount }, (_, index) => {
        const isLit = index < litBars;
        const height = 30 + index * 5; // Increasing height from left to right

        return (
          <motion.div
            key={index}
            className="w-0.5 rounded-full transition-all duration-75"
            style={{ height: `${height}%` }}
            animate={{
              backgroundColor: showInactiveBars
                ? "rgba(255, 255, 255, 0.1)" // Very dim for inactive state
                : isLit
                ? index < 4
                  ? "rgb(34, 197, 94)" // Green
                  : index < 8
                  ? "rgb(250, 204, 21)" // Yellow
                  : "rgb(239, 68, 68)" // Red
                : "rgba(255, 255, 255, 0.2)", // Default inactive
              boxShadow: showInactiveBars
                ? "none"
                : isLit
                ? index < 4
                  ? "0 0 8px rgba(34, 197, 94, 0.6)"
                  : index < 8
                  ? "0 0 8px rgba(250, 204, 21, 0.6)"
                  : "0 0 8px rgba(239, 68, 68, 0.6)"
                : "none",
            }}
            transition={{
              duration: 0.05,
              ease: "easeOut",
            }}
          />
        );
      })}
    </div>
  );
};

export default AudioLevelMeter;
