import { SentimentData } from '../types';

/**
 * Emotion hue mapping for continuous color spectrum
 * Each emotion mapped to a distinct hue in the HSB color space
 */
const EMOTION_HUES = {
  joy: 45,        // Yellow-Orange
  surprise: 30,   // Orange
  anger: 0,       // Red
  fear: 240,      // Blue
  sadness: 260,   // Purple-Blue
  disgust: 120,   // Green
} as const;

/**
 * Calculate weighted average hue from emotion scores
 * Creates continuous color spectrum based on emotional composition
 */
export const getEmotionHue = (emotionScores: SentimentData['emotion_scores']): number => {
  let weightedHue = 0;
  let totalWeight = 0;

  // Calculate weighted average of all emotion hues
  Object.entries(emotionScores).forEach(([emotion, score]) => {
    const hue = EMOTION_HUES[emotion as keyof typeof EMOTION_HUES];
    weightedHue += hue * score;
    totalWeight += score;
  });

  // Return normalized hue, fallback to neutral if no emotions
  return totalWeight > 0 ? weightedHue / totalWeight : 180; // Cyan as neutral
};

/**
 * Get dominant emotion from emotion scores
 * Returns the emotion with highest intensity
 */
export const getDominantEmotion = (emotionScores: SentimentData['emotion_scores']): keyof typeof EMOTION_HUES => {
  // Add null check with fallback
  if (!emotionScores || typeof emotionScores !== 'object') {
    return 'joy'; // Default fallback emotion
  }

  let maxScore = 0;
  let dominantEmotion: keyof typeof EMOTION_HUES = 'joy';

  Object.entries(emotionScores).forEach(([emotion, score]) => {
    if (score > maxScore) {
      maxScore = score;
      dominantEmotion = emotion as keyof typeof EMOTION_HUES;
    }
  });

  return dominantEmotion;
};

/**
 * Calculate emotion intensity for visual mapping
 * Combines all emotion scores into single intensity value
 */
export const getEmotionIntensity = (emotionScores: SentimentData['emotion_scores']): number => {
  return Math.max(
    emotionScores.joy * 1.2,      // Joy slightly amplified
    emotionScores.surprise,
    emotionScores.anger * 1.1,    // Anger slightly amplified
    emotionScores.fear,
    emotionScores.sadness * 0.8,  // Sadness slightly muted
    emotionScores.disgust
  );
};

/**
 * Get emotion-specific saturation multiplier
 * Different emotions have different saturation characteristics
 */
export const getEmotionSaturation = (emotionScores: SentimentData['emotion_scores']): number => {
  const dominantEmotion = getDominantEmotion(emotionScores);
  const intensity = getEmotionIntensity(emotionScores);

  // Base saturation with emotion-specific adjustments
  const baseSaturation = 60 + (intensity * 40); // 60-100% base range

  const emotionMultipliers = {
    joy: 1.2,       // Joy should be vibrant
    surprise: 1.1,   // Surprise should be bright
    anger: 1.3,      // Anger should be intense
    fear: 0.9,       // Fear should be slightly muted
    sadness: 0.7,    // Sadness should be desaturated
    disgust: 0.8,    // Disgust should be somewhat muted
  };

  return Math.min(100, baseSaturation * emotionMultipliers[dominantEmotion]);
};

/**
 * Get emotion-specific brightness multiplier
 * Controls how light/dark the visualization appears
 */
export const getEmotionBrightness = (emotionScores: SentimentData['emotion_scores']): number => {
  const dominantEmotion = getDominantEmotion(emotionScores);
  const intensity = getEmotionIntensity(emotionScores);

  // Base brightness with emotion-specific adjustments
  const baseBrightness = 50 + (intensity * 30); // 50-80% base range

  const emotionMultipliers = {
    joy: 1.2,       // Joy should be bright
    surprise: 1.3,   // Surprise should be very bright
    anger: 0.9,      // Anger should be somewhat dark
    fear: 0.7,       // Fear should be dark
    sadness: 0.6,    // Sadness should be very dark
    disgust: 0.8,    // Disgust should be somewhat dark
  };

  return Math.min(100, baseBrightness * emotionMultipliers[dominantEmotion]);
};

/**
 * Convert sentiment value to additional visual parameters
 * Sentiment affects hue shifting and color temperature
 */
export const getSentimentAdjustments = (sentiment: number) => {
  // Sentiment-driven hue adjustment
  const hueShift = sentiment * 30; // ±30 degrees based on sentiment

  // Color temperature (warm vs cool)
  const colorTemperature = sentiment > 0 ? 'warm' : 'cool';

  // Complementary color intensity
  const complementaryIntensity = Math.abs(sentiment) * 0.3;

  return {
    hueShift,
    colorTemperature,
    complementaryIntensity,
  };
};

/**
 * Get confidence-based visual modifiers
 * Higher confidence = stronger, more stable visuals
 */
export const getConfidenceModifiers = (confidence: number) => {
  return {
    alpha: 0.3 + (confidence * 0.7),      // 30-100% opacity
    stability: confidence,                // 0-1 stability factor
    intensity: 0.5 + (confidence * 0.5),   // 50-100% intensity
    detail: confidence,                    // 0-1 detail level
    // Enhanced confidence modifiers
    saturationBoost: confidence * 20,      // 0-20% additional saturation
    brightnessBoost: confidence * 15,      // 0-15% additional brightness
    contrastMultiplier: 1 + confidence * 0.5, // 1.0-1.5x contrast
    sharpness: 0.5 + confidence * 0.5,     // 0.5-1.0 sharpness factor
    // Confidence-based effect probability
    effectProbability: confidence * 0.8,   // 0-80% chance for special effects
    // Confidence-dependent animation speed
    animationSpeed: 0.5 + confidence * 1.0, // 0.5-1.5x animation speed
  };
};

/**
 * Generate complete HSB color object from sentiment data
 * Combines all emotional and sentiment factors
 */
export const getEmotionColor = (
  sentimentData: SentimentData,
  confidence?: number
): {
  hue: number;
  saturation: number;
  brightness: number;
  alpha: number;
  confidence: number;
  intensity: number;
  stability: number;
  sharpness: number;
} => {
  // Add null check with fallback
  if (!sentimentData || !sentimentData.emotion_scores) {
    // Return default neutral emotion color
    return {
      hue: 180, // Cyan
      saturation: 60,
      brightness: 70,
      alpha: 0.5,
      confidence: 0.5,
      intensity: 0.5,
      stability: 0.5,
      sharpness: 0.5,
    };
  }

  // Base color from emotion scores
  const emotionHue = getEmotionHue(sentimentData.emotion_scores);
  const baseSaturation = getEmotionSaturation(sentimentData.emotion_scores);
  const baseBrightness = getEmotionBrightness(sentimentData.emotion_scores);

  // Sentiment adjustments
  const { hueShift } = getSentimentAdjustments(sentimentData.sentiment);

  // Enhanced confidence adjustments
  const confidenceValue = confidence || sentimentData.confidence;
  const confidenceModifiers = getConfidenceModifiers(confidenceValue);

  // Apply confidence-based enhancements
  const enhancedSaturation = Math.min(100, baseSaturation + confidenceModifiers.saturationBoost);
  const enhancedBrightness = Math.min(100, baseBrightness + confidenceModifiers.brightnessBoost);

  return {
    hue: (emotionHue + hueShift) % 360,  // Wrap around 360 degrees
    saturation: enhancedSaturation,
    brightness: enhancedBrightness,
    alpha: confidenceModifiers.alpha,
    confidence: confidenceValue,
    intensity: confidenceModifiers.intensity,
    stability: confidenceModifiers.stability,
    sharpness: confidenceModifiers.sharpness,
  };
};

// ===== TEMPORAL EVOLUTION SYSTEM =====

/**
 * Sentiment history tracker for temporal evolution
 * Maintains rolling history of sentiment data for smooth transitions
 */
interface SentimentHistory {
  colors: Array<{
    hue: number;
    saturation: number;
    brightness: number;
    timestamp: number;
  }>;
  emotions: Array<{
    dominant: keyof typeof EMOTION_HUES;
    intensity: number;
    timestamp: number;
  }>;
  maxAge: number; // Maximum age of history entries in milliseconds
}

class SentimentHistoryTracker {
  private history: SentimentHistory = {
    colors: [],
    emotions: [],
    maxAge: 5000 // 5 seconds of history
  };

  /**
   * Add new sentiment data to history
   */
  addSentiment(sentimentData: SentimentData) {
    if (!sentimentData || !sentimentData.emotion_scores) {
      return; // Skip invalid data
    }

    const now = Date.now();
    const emotionColor = getEmotionColor(sentimentData);
    const dominantEmotion = getDominantEmotion(sentimentData.emotion_scores);
    const intensity = getEmotionIntensity(sentimentData.emotion_scores);

    // Add new entries
    this.history.colors.push({
      hue: emotionColor.hue,
      saturation: emotionColor.saturation,
      brightness: emotionColor.brightness,
      timestamp: now
    });

    this.history.emotions.push({
      dominant: dominantEmotion,
      intensity: intensity,
      timestamp: now
    });

    // Clean old entries
    this.cleanup();
  }

  /**
   * Remove old entries beyond maxAge
   */
  private cleanup() {
    const now = Date.now();
    const cutoff = now - this.history.maxAge;

    this.history.colors = this.history.colors.filter(entry => entry.timestamp > cutoff);
    this.history.emotions = this.history.emotions.filter(entry => entry.timestamp > cutoff);
  }

  /**
   * Get temporal evolution parameters
   */
  getTemporalEvolution() {
    if (this.history.colors.length === 0) {
      return {
        colorMomentum: 0,
        emotionStability: 0.5,
        transitionSpeed: 1.0,
        dominantTrend: 'joy' as keyof typeof EMOTION_HUES,
        trendIntensity: 0.5
      };
    }

    // Calculate color momentum based on recent changes
    const recentColors = this.history.colors.slice(-5); // Last 5 entries
    const colorMomentum = this.calculateColorMomentum(recentColors);

    // Calculate emotion stability based on consistency
    const recentEmotions = this.history.emotions.slice(-10); // Last 10 entries
    const emotionStability = this.calculateEmotionStability(recentEmotions);

    // Determine dominant trend
    const trendData = this.calculateDominantTrend(recentEmotions);

    // Transition speed inversely proportional to stability
    const transitionSpeed = 0.3 + (1.0 - emotionStability) * 1.4; // 0.3-1.7

    return {
      colorMomentum,
      emotionStability,
      transitionSpeed,
      dominantTrend: trendData.dominant,
      trendIntensity: trendData.intensity
    };
  }

  /**
   * Calculate momentum of color changes
   */
  private calculateColorMomentum(colors: SentimentHistory['colors']) {
    if (colors.length < 2) return 0;

    let totalChange = 0;
    for (let i = 1; i < colors.length; i++) {
      const prev = colors[i - 1];
      const curr = colors[i];

      // Calculate weighted color difference
      const hueDiff = Math.min(Math.abs(curr.hue - prev.hue), 360 - Math.abs(curr.hue - prev.hue)) / 360;
      const satDiff = Math.abs(curr.saturation - prev.saturation) / 100;
      const brightDiff = Math.abs(curr.brightness - prev.brightness) / 100;

      totalChange += (hueDiff + satDiff + brightDiff) / 3;
    }

    return Math.min(1.0, totalChange / (colors.length - 1));
  }

  /**
   * Calculate stability of emotional states
   */
  private calculateEmotionStability(emotions: SentimentHistory['emotions']) {
    if (emotions.length === 0) return 0.5;

    const emotionCounts = emotions.reduce((acc, entry) => {
      acc[entry.dominant] = (acc[entry.dominant] || 0) + 1;
      return acc;
    }, {} as Record<keyof typeof EMOTION_HUES, number>);

    const mostFrequentCount = Math.max(...Object.values(emotionCounts));
    return mostFrequentCount / emotions.length;
  }

  /**
   * Calculate dominant emotional trend
   */
  private calculateDominantTrend(emotions: SentimentHistory['emotions']) {
    if (emotions.length === 0) {
      return { dominant: 'joy' as keyof typeof EMOTION_HUES, intensity: 0.5 };
    }

    // Weight recent emotions more heavily
    const now = Date.now();
    let weightedSum = { joy: 0, anger: 0, fear: 0, sadness: 0, surprise: 0, disgust: 0 };
    let totalWeight = 0;

    emotions.forEach(entry => {
      const age = now - entry.timestamp;
      const weight = Math.exp(-age / 2000); // Exponential decay over 2 seconds

      weightedSum[entry.dominant] += weight * entry.intensity;
      totalWeight += weight;
    });

    // Find dominant trend
    let maxScore = 0;
    let dominantEmotion: keyof typeof EMOTION_HUES = 'joy';

    Object.entries(weightedSum).forEach(([emotion, score]) => {
      if (score > maxScore) {
        maxScore = score;
        dominantEmotion = emotion as keyof typeof EMOTION_HUES;
      }
    });

    const intensity = totalWeight > 0 ? maxScore / totalWeight : 0.5;

    return { dominant: dominantEmotion, intensity: Math.min(1.0, intensity) };
  }
}

// Global history tracker instance
export const sentimentHistory = new SentimentHistoryTracker();

/**
 * Apply temporal evolution to emotion color
 * Creates smooth transitions based on historical sentiment data
 */
export const getTemporalEmotionColor = (
  currentSentimentData: SentimentData,
  previousColor?: { hue: number; saturation: number; brightness: number }
) => {
  // Add current sentiment to history
  sentimentHistory.addSentiment(currentSentimentData);

  // Get current emotion color
  const currentColor = getEmotionColor(currentSentimentData);

  // Get temporal evolution parameters
  const evolution = sentimentHistory.getTemporalEvolution();

  // If no previous color, return current
  if (!previousColor) {
    return {
      ...currentColor,
      temporalMomentum: evolution.colorMomentum,
      transitionSpeed: evolution.transitionSpeed,
      emotionTrend: evolution.dominantTrend,
      trendIntensity: evolution.trendIntensity
    };
  }

  // Calculate smooth color interpolation with momentum
  const interpolationFactor = Math.min(1.0, evolution.transitionSpeed * 0.1); // Smooth transitions

  // Apply momentum-based easing
  const easeFactor = 0.7 + (evolution.colorMomentum * 0.3); // More momentum = less easing

  // Interpolate hue with circular consideration
  let hueDiff = currentColor.hue - previousColor.hue;
  if (hueDiff > 180) hueDiff -= 360;
  if (hueDiff < -180) hueDiff += 360;

  const interpolatedHue = (previousColor.hue + hueDiff * interpolationFactor * easeFactor + 360) % 360;

  // Interpolate saturation and brightness
  const interpolatedSaturation = previousColor.saturation +
    (currentColor.saturation - previousColor.saturation) * interpolationFactor * easeFactor;

  const interpolatedBrightness = previousColor.brightness +
    (currentColor.brightness - previousColor.brightness) * interpolationFactor * easeFactor;

  return {
    hue: interpolatedHue,
    saturation: interpolatedSaturation,
    brightness: interpolatedBrightness,
    alpha: currentColor.alpha,
    confidence: currentColor.confidence,
    intensity: currentColor.intensity,
    stability: currentColor.stability,
    sharpness: currentColor.sharpness,
    temporalMomentum: evolution.colorMomentum,
    transitionSpeed: evolution.transitionSpeed,
    emotionTrend: evolution.dominantTrend,
    trendIntensity: evolution.trendIntensity
  };
};