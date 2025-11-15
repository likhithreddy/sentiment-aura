import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { getEmotionColor, getEmotionIntensity, getDominantEmotion, getTemporalEmotionColor } from '../utils/emotionUtils';
import { SentimentData } from '../types';

interface KeywordsDisplayProps {
  keywords: string[];
  sentiment: number;
  sentimentData?: SentimentData | null;
}

const KeywordBubble: React.FC<{
  keyword: string;
  index: number;
  sentiment: number;
  sentimentData?: SentimentData | null;
  isVisible: boolean;
}> = ({ keyword, index, sentiment, sentimentData, isVisible }) => {
  // Temporal state for smooth transitions
  const previousColorRef = React.useRef<{ hue: number; saturation: number; brightness: number } | null>(null);

  // Advanced temporal emotion-based color system
  const getEmotionColors = () => {
    if (sentimentData) {
      // Use temporal emotion color system for smooth transitions
      const emotionColor = getTemporalEmotionColor(sentimentData, previousColorRef.current);
      const dominantEmotion = sentimentData?.emotion_scores ?
        getDominantEmotion(sentimentData.emotion_scores) : 'joy';
      const intensity = sentimentData?.emotion_scores ?
        getEmotionIntensity(sentimentData.emotion_scores) : 0.5;

      // Update previous color for next render
      previousColorRef.current = {
        hue: emotionColor.hue,
        saturation: emotionColor.saturation,
        brightness: emotionColor.brightness
      };

      // Convert HSB to RGB for CSS
      const hslToRgb = (h: number, s: number, l: number, a: number = 0.85) => {
        return `hsla(${h}, ${s}%, ${l}%, ${a})`;
      };

      // Enhanced color with emotion-specific adjustments
      const primaryHue = emotionColor.hue;
      const primarySat = emotionColor.saturation;
      const primaryLight = emotionColor.brightness;

      // Secondary color with slight hue shift for gradient effect
      const secondaryHue = (primaryHue + 30) % 360;

      return {
        primary: hslToRgb(primaryHue, primarySat, primaryLight, 0.85),
        secondary: hslToRgb(secondaryHue, primarySat * 0.8, primaryLight * 1.1, 0.85),
        glow: hslToRgb(primaryHue, primarySat * 1.2, primaryLight * 1.2, 0.3),
        dominantEmotion,
        intensity
      };
    } else {
      // Fallback to simple sentiment mapping
      const getFallbackColor = (value: number, shift: number = 0) => {
        const hue = value > 0.1 ? 0 + shift : value < -0.1 ? 210 + shift : 120 + shift;
        const sat = value > 0.1 ? 70 : value < -0.1 ? 60 : 50;
        const light = value > 0.1 ? 55 : value < -0.1 ? 50 : 60;
        return `hsla(${hue}, ${sat}%, ${light}%, 0.85)`;
      };

      return {
        primary: getFallbackColor(sentiment),
        secondary: getFallbackColor(sentiment, 20),
        glow: getFallbackColor(sentiment, -10),
        dominantEmotion: 'neutral' as const,
        intensity: Math.abs(sentiment)
      };
    }
  };

  const colors = getEmotionColors();

  // Emotion-responsive animation variants
  const getEmotionSpecificAnimations = () => {
    const baseDelay = index * 0.25;
    const intensityMultiplier = 1 + colors.intensity * 0.5;

    // Emotion-specific animation parameters
    const getEmotionParams = () => {
      switch (colors.dominantEmotion) {
        case 'joy':
          return {
            entranceDuration: 0.8, // Bouncy, quick entrance
            exitDuration: 0.6,
            hoverScale: 1.08,
            hoverY: -3,
            entranceScale: [0.6, 1.1, 1], // Bouncy effect
          };
        case 'anger':
          return {
            entranceDuration: 0.5, // Sharp, aggressive entrance
            exitDuration: 0.3,
            hoverScale: 1.06,
            hoverY: -1,
            entranceScale: [0.8, 1.05, 1], // Sharp snap
          };
        case 'fear':
          return {
            entranceDuration: 1.0, // Hesitant, trembling entrance
            exitDuration: 0.8,
            hoverScale: 1.03,
            hoverY: -1,
            entranceScale: [0.7, 1.02, 0.98, 1], // Trembling effect
          };
        case 'sadness':
          return {
            entranceDuration: 1.5, // Slow, flowing entrance
            exitDuration: 1.2,
            hoverScale: 1.02,
            hoverY: -0.5,
            entranceScale: [0.5, 0.8, 1], // Gradual growth
          };
        case 'surprise':
          return {
            entranceDuration: 0.4, // Sudden burst entrance
            exitDuration: 0.6,
            hoverScale: 1.12,
            hoverY: -4,
            entranceScale: [0.9, 1.15, 1], // Burst effect
          };
        case 'disgust':
          return {
            entranceDuration: 1.1, // Reluctant, uneven entrance
            exitDuration: 0.9,
            hoverScale: 1.01,
            hoverY: -0.5,
            entranceScale: [0.6, 0.85, 0.95, 1], // Uneven growth
          };
        default:
          return {
            entranceDuration: 1.2,
            exitDuration: 0.8,
            hoverScale: 1.05,
            hoverY: -2,
            entranceScale: [0.8, 1], // Smooth entrance
          };
      }
    };

    const emotionParams = getEmotionParams();

    return {
      hidden: {
        y: 150,
        opacity: 0,
        scale: emotionParams.entranceScale[0],
        filter: "blur(0.25rem)",
        rotate: colors.dominantEmotion === 'surprise' ? Math.random() * 10 - 5 : 0,
      },
      visible: {
        y: 0,
        opacity: 1,
        scale: emotionParams.entranceScale[emotionParams.entranceScale.length - 1],
        filter: "blur(0rem)",
        rotate: 0,
        transition: {
          type: "tween",
          ease: colors.dominantEmotion === 'joy' ? [0.68, -0.55, 0.265, 1.55] : // Bouncy
                 colors.dominantEmotion === 'anger' ? [0.25, 0.46, 0.45, 0.94] : // Sharp
                 [0.25, 0.1, 0.25, 1], // Default smooth
          duration: emotionParams.entranceDuration / intensityMultiplier,
          delay: baseDelay,
          scale: { duration: emotionParams.entranceDuration / intensityMultiplier },
          rotate: { duration: 0.3 },
        }
      },
      hover: {
        scale: emotionParams.hoverScale,
        y: emotionParams.hoverY,
        filter: `brightness(${1.1 + colors.intensity * 0.2})`,
        transition: {
          type: "tween",
          ease: "easeInOut",
          duration: colors.dominantEmotion === 'surprise' ? 0.2 : 0.4,
        }
      },
      tap: {
        scale: emotionParams.hoverScale * 0.9,
        y: 0,
        transition: {
          type: "tween",
          duration: 0.1,
        }
      },
      sentimentChange: {
        scale: [1, 1.12 * intensityMultiplier, 1],
        filter: ["brightness(1)", `brightness(${1.2 + colors.intensity * 0.3})`, "brightness(1)"],
        transition: {
          type: "tween",
          duration: 0.8,
          ease: "easeInOut"
        }
      }
    };
  };

  const variants = getEmotionSpecificAnimations();

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
        backgroundColor: colors.primary,
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
        boxShadow: `0 6px 24px ${colors.glow.replace('0.3', '0.35')}`,
        border: `1px solid ${colors.glow.replace('0.3', '0.2')}`,
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
          background: `radial-gradient(circle, ${colors.glow.replace('0.3', '0.4')} 0%, transparent 70%)`
        }}
      />
      <div className="keyword-shimmer absolute inset-0 rounded-[inherit]"
        style={{
          backgroundImage: `linear-gradient(105deg, transparent 40%, ${colors.glow.replace('0.3', '0.3')} 50%, transparent 60%)`,
          backgroundSize: '200% 100%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          animation: colors.dominantEmotion === 'joy' ? 'shimmer 1.5s infinite' :
                       colors.dominantEmotion === 'anger' ? 'shimmer 0.8s infinite' :
                       colors.dominantEmotion === 'fear' ? 'shimmer 2.2s infinite' :
                       colors.dominantEmotion === 'sadness' ? 'shimmer 4s infinite' :
                       'shimmer 3s infinite'
        }}
      />
      <motion.div
        className="absolute inset-0 rounded-[inherit] pointer-events-none"
        variants={{
          hidden: { opacity: 0, scale: 0.8 },
          visible: {
            opacity: [0, 0.4 * colors.intensity, 0],
            scale: [0.8, 1.1 * (1 + colors.intensity * 0.2), 1.2 * (1 + colors.intensity * 0.1)],
            transition: {
              duration: colors.dominantEmotion === 'surprise' ? 0.6 :
                         colors.dominantEmotion === 'anger' ? 0.4 :
                         colors.dominantEmotion === 'sadness' ? 1.5 : 1.0,
              ease: colors.dominantEmotion === 'joy' ? "easeOut" :
                     colors.dominantEmotion === 'fear' ? "easeInOut" :
                     "easeOut",
              times: [0, 0.6, 1]
            }
          }
        }}
        style={{
          background: `radial-gradient(circle, ${colors.glow.replace('0.3', '0.5')} 0%, transparent 70%)`,
        }}
      />
    </motion.div>
  );
};

const KeywordsDisplay: React.FC<KeywordsDisplayProps> = ({ keywords, sentiment, sentimentData }) => {
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
            <div className="flex flex-wrap gap-0.5 sm:gap-1 h-full overflow-x-auto overflow-y-auto scrollbar-none content-start">
              {keywords.map((keyword, index) => (
                  <KeywordBubble
                  key={`${keyword}-${index}`}
                  keyword={keyword}
                  index={index}
                  sentiment={sentiment}
                  sentimentData={sentimentData}
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