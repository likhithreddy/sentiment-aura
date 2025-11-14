import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface KeywordsDisplayProps {
  keywords: string[];
  sentiment: number;
}

const KeywordBubble: React.FC<{
  keyword: string;
  index: number;
  sentiment: number;
  isVisible: boolean;
}> = ({ keyword, index, sentiment, isVisible }) => {
  // Determine animated color based on sentiment with richer palette
  const getColor = () => {
    if (sentiment > 0.1) {
      return 'rgba(255, 107, 107, 0.85)'; // Warm coral red
    } else if (sentiment < -0.1) {
      return 'rgba(100, 149, 237, 0.85)'; // Cool cornflower blue
    } else {
      return 'rgba(144, 238, 144, 0.85)'; // Soft mint green
    }
  };

  // Get secondary color for gradient animation
  const getSecondaryColor = () => {
    if (sentiment > 0.3) {
      return 'rgba(255, 140, 90, 0.85)'; // Lighter coral
    } else if (sentiment < -0.3) {
      return 'rgba(147, 169, 247, 0.85)'; // Lighter blue
    } else {
      return 'rgba(165, 248, 165, 0.85)'; // Lighter green
    }
  };

  // Animation variants for each keyword with feed-from-bottom effect
  const variants = {
    hidden: {
      y: 150, // Start just outside container bounds for visible feed effect
      opacity: 0,
      scale: 0.8,
      filter: "blur(0.25rem)"
    },
    visible: {
      y: 0, // End at final grid position
      opacity: 1,
      scale: 1,
      filter: "blur(0rem)",
      transition: {
        type: "tween",
        ease: [0.25, 0.1, 0.25, 1], // Custom cubic-bezier for smoothness
        duration: 1.2, // Optimized duration for better visibility
        delay: index * 0.25, // Staggered entrance for feed effect
      }
    },
    hover: {
      scale: 1.05,
      y: -2,
      filter: "brightness(1.15)",
      transition: {
        type: "tween",
        ease: "easeInOut",
        duration: 0.4
      }
    },
    tap: {
      scale: 0.96,
      y: 0,
      transition: {
        type: "tween",
        duration: 0.2
      }
    },
    sentimentChange: {
      scale: [1, 1.12, 1],
      transition: {
        type: "tween",
        duration: 0.8,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div
      className="relative px-1.5 sm:px-2 py-1 rounded-[16px] text-white font-semibold font-montserrat letter-spacing-[0.02em] shadow-lg backdrop-blur-xl border border-white/30 cursor-default select-none overflow-hidden transition-all duration-300 text-xs flex items-center justify-center min-h-[1.75rem] flex-shrink-0"
      variants={variants}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      whileHover="hover"
      whileTap="tap"
      layoutId={`keyword-${keyword}-${index}`}
      style={{
        backgroundColor: getColor(),
        background: `linear-gradient(135deg, ${getColor()} 0%, ${getSecondaryColor()} 100%)`,
        boxShadow: sentiment > 0.1
          ? "0 6px 24px rgba(255, 107, 107, 0.35)"
          : sentiment < -0.1
          ? "0 6px 24px rgba(100, 149, 237, 0.35)"
          : "0 6px 24px rgba(144, 238, 144, 0.35)",
      }}
      transition={{
        backgroundColor: { duration: 1.0, ease: "easeInOut" },
        background: { duration: 1.0, ease: "easeInOut" },
        boxShadow: { duration: 0.8, ease: "easeInOut" },
      }}
    >
      <span className="relative z-10 drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)] truncate text-center">{keyword}</span>
      <div className="keyword-glow absolute -inset-1/2 w-[200%] h-[200%] rounded-[inherit] opacity-0 transition-opacity duration-300 hover:opacity-100 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%)'
        }}
      />
      <div className="keyword-shimmer absolute inset-0 rounded-[inherit]"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.2) 50%, transparent 60%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 3s infinite'
        }}
      />
      <motion.div
        className="absolute inset-0 rounded-[inherit] pointer-events-none"
        variants={{
          hidden: { opacity: 0, scale: 0.8 },
          visible: {
            opacity: [0, 0.4, 0],
            scale: [0.8, 1.1, 1.2],
            transition: {
              duration: 1.0,
              ease: "easeOut",
              times: [0, 0.6, 1]
            }
          }
        }}
        style={{
          background: `radial-gradient(circle, ${getColor()}88 0%, transparent 70%)`,
        }}
      />
    </motion.div>
  );
};

const KeywordsDisplay: React.FC<KeywordsDisplayProps> = ({ keywords, sentiment }) => {
  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.1
      }
    }
  };

  // Header animation variants
  const headerVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 30
      }
    }
  };

  return (
    <motion.div
      className="fixed bottom-0 left-0 w-full h-[calc(33vh-1.25rem)] bg-gradient-to-t from-black/25 to-black/15 backdrop-blur-sm p-5 text-white font-display z-[50] overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="mb-4 border-b border-white/10 pb-3"
        variants={headerVariants}
      >
        <h3 className="m-0 text-lg font-bold text-white/95 font-montserrat letter-spacing-[0.1em] uppercase opacity-90">Keywords</h3>
      </motion.div>

      <div className="relative h-[calc(100%-3.75rem)] p-2 overflow-visible">
        <AnimatePresence mode="popLayout">
          {keywords.length > 0 ? (
            <div className="flex flex-wrap gap-0.5 sm:gap-1 h-full overflow-x-auto overflow-y-auto scrollbar-none justify-between content-start">
              {keywords.map((keyword, index) => (
                  <KeywordBubble
                  key={`${keyword}-${index}`}
                  keyword={keyword}
                  index={index}
                  sentiment={sentiment}
                  isVisible={true}
                />
              ))}
            </div>
          ) : (
            <motion.div
              key="placeholder"
              className="text-white/60 italic text-lg text-center w-full font-montserrat"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: 1,
                scale: 1,
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 25
                }
              }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="flex flex-col items-center gap-3">
                <Sparkles size={28} className="opacity-70 animate-pulse" />
                <div className="text-white/70 text-base font-medium font-montserrat">Keywords will appear here...</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default KeywordsDisplay;