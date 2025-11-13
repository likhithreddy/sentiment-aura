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
  // Determine color based on sentiment with richer palette
  const getColor = () => {
    if (sentiment > 0.1) {
      return 'rgba(255, 107, 107, 0.85)'; // Warm coral red
    } else if (sentiment < -0.1) {
      return 'rgba(100, 149, 237, 0.85)'; // Cool cornflower blue
    } else {
      return 'rgba(144, 238, 144, 0.85)'; // Soft mint green
    }
  };

  // Animation variants for each keyword
  const variants = {
    hidden: {
      x: "100vw",
      opacity: 0,
      scale: 0.3,
      rotate: -15
    },
    visible: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        mass: 1,
        delay: index * 0.15, // Staggered entrance
        duration: 0.8
      }
    },
    hover: {
      scale: 1.05,
      rotate: [-2, 2, -2],
      transition: {
        duration: 0.3,
        repeat: Infinity,
        repeatType: "reverse"
      }
    },
    tap: {
      scale: 0.95,
      rotate: 0
    }
  };

  return (
    <motion.div
      className={`inline-block relative px-6 py-3 m-2 rounded-[30px] text-white text-lg font-semibold font-display letter-spacing-[-0.02em] shadow-lg backdrop-blur-xl border border-white/40 cursor-default select-none overflow-hidden transition-all duration-300 hover:shadow-2xl`}
      style={{
        backgroundColor: getColor(),
        background: `linear-gradient(135deg, ${getColor()} 0%, ${getColor()}dd 100%)`
      }}
      variants={variants}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      whileHover="hover"
      whileTap="tap"
      layoutId={`keyword-${keyword}-${index}`}
    >
      <span className="relative z-10 drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]">{keyword}</span>
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
      className="fixed bottom-0 left-0 w-full h-[calc(25vh-1.25rem)] bg-gradient-to-t from-black/90 to-black/80 backdrop-blur-md border-t border-white/15 p-5 text-white font-display z-[40] overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.3)] flex flex-col"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="mb-4 border-b border-white/15 pb-3"
        variants={headerVariants}
      >
        <h3 className="m-0 text-lg font-bold text-white/95 font-display letter-spacing-[0.1em] uppercase opacity-90">Keywords</h3>
      </motion.div>

      <div className="flex items-center gap-4 h-[calc(100%-3.75rem)] overflow-x-auto overflow-y-hidden whitespace-nowrap p-2 scrollbar-none">
        <AnimatePresence mode="popLayout">
          {keywords.length > 0 ? (
            keywords.map((keyword, index) => (
              <KeywordBubble
                key={`${keyword}-${index}`}
                keyword={keyword}
                index={index}
                sentiment={sentiment}
                isVisible={true}
              />
            ))
          ) : (
            <motion.div
              key="placeholder"
              className="text-white/60 italic text-lg text-center w-full"
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
                <div className="text-white/70 text-base font-medium">Keywords will appear here...</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default KeywordsDisplay;