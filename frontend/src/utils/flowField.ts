/**
 * Flow Field System for Continuous Particle Movement
 * Extracted from test.js PerlinAura component
 */

// Emotion hue mapping
export const EMOTION_HUES = {
  joy: 45,        // Yellow-Orange
  surprise: 30,   // Orange
  anger: 0,       // Red
  fear: 240,      // Blue
  sadness: 260,   // Purple-Blue
  disgust: 120,   // Green
} as const;

export type EmotionType = keyof typeof EMOTION_HUES;

export interface FlowFieldParams {
  scale: number;
  increment: number;
  timeScale: number;
  angleMultiplier: number;
  turbulence: number;
}

export interface EmotionColorData {
  hue: number;
  saturation: number;
  brightness: number;
  alpha: number;
  confidence: number;
  intensity: number;
  stability: number;
  sharpness: number;
  temporalMomentum: number;
  transitionSpeed: number;
  emotionTrend: string;
  trendIntensity: number;
}

/**
 * Get emotion-specific flow field parameters
 */
export const getEmotionFlowParams = (
  emotion: EmotionType,
  intensity: number,
  emotionColor: EmotionColorData
): FlowFieldParams => {
  // Confidence-based stability modifiers
  const stabilityFactor = 0.5 + emotionColor.stability * 0.5; // 0.5-1.0 based on confidence
  const sharpnessFactor = 0.7 + emotionColor.sharpness * 0.3; // 0.7-1.0 based on confidence
  const confidenceFactor = emotionColor.intensity; // 0.5-1.0 based on confidence

  // Temporal evolution modifiers
  const momentumFactor = 1.0 + emotionColor.temporalMomentum * 0.5; // 1.0-1.5 based on color momentum
  const transitionFactor = emotionColor.transitionSpeed; // 0.3-1.7 based on emotional transition rate
  const trendInfluence = emotionColor.trendIntensity; // 0.0-1.0 based on trend strength

  switch (emotion) {
    case 'joy':
      return {
        scale: (15 - intensity * 5 * sharpnessFactor) / momentumFactor,
        increment: (0.15 + intensity * 0.1 * confidenceFactor) * transitionFactor,
        timeScale: (1.5 + intensity) * stabilityFactor * momentumFactor,
        angleMultiplier: 2.5 * sharpnessFactor * (1 + trendInfluence * 0.5),
        turbulence: 0.1 * (1 - stabilityFactor) * (2 - transitionFactor),
      };
    case 'anger':
      return {
        scale: (25 - intensity * 8 * sharpnessFactor) * momentumFactor,
        increment: (0.2 + intensity * 0.15 * confidenceFactor) * transitionFactor,
        timeScale: (2.0 + intensity * 1.5) * stabilityFactor / momentumFactor,
        angleMultiplier: 3.0 * sharpnessFactor * (1 + trendInfluence * 0.3),
        turbulence: 0.3 * (1 - stabilityFactor) * transitionFactor,
      };
    case 'fear':
      return {
        scale: (30 + intensity * 10 * (2 - stabilityFactor)) * (1 + momentumFactor * 0.5),
        increment: (0.08 + intensity * 0.12 * confidenceFactor) * transitionFactor,
        timeScale: (0.8 + intensity * 0.4 * (2 - stabilityFactor)) / momentumFactor,
        angleMultiplier: (1.8 + Math.sin(Date.now() * 0.001) * 1.5 * (2 - stabilityFactor)) * (1 + trendInfluence),
        turbulence: 0.4 * (2 - stabilityFactor) * (1 + momentumFactor * 0.3),
      };
    case 'sadness':
      return {
        scale: (40 + intensity * 20 / stabilityFactor) / (momentumFactor * 0.8 + 0.2),
        increment: (0.05 + intensity * 0.02 * confidenceFactor) * (2 - transitionFactor),
        timeScale: (0.4 - intensity * 0.2) * stabilityFactor * momentumFactor,
        angleMultiplier: (1.2 + (1 - stabilityFactor) * 0.3) * (1 - trendInfluence * 0.3),
        turbulence: 0.05 * (1 - stabilityFactor) * (2 - transitionFactor),
      };
    case 'surprise':
      return {
        scale: (18 - intensity * 6 * sharpnessFactor) / (1 + momentumFactor * 0.3),
        increment: (0.12 + intensity * 0.18 * confidenceFactor) * transitionFactor * 1.5,
        timeScale: (1.2 + intensity * 2.0) * stabilityFactor * (1 + momentumFactor * 0.5),
        angleMultiplier: (2.0 + Math.cos(Date.now() * 0.0015) * 1.5 * (2 - stabilityFactor)) * (1 + trendInfluence),
        turbulence: 0.2 * (1 - stabilityFactor) * transitionFactor,
      };
    case 'disgust':
      return {
        scale: (35 + intensity * 15 / stabilityFactor) * (1 + momentumFactor * 0.2),
        increment: (0.06 + intensity * 0.08 * confidenceFactor) * (2 - transitionFactor),
        timeScale: (0.6 - intensity * 0.3) * stabilityFactor * momentumFactor,
        angleMultiplier: (1.5 + Math.sin(Date.now() * 0.0005) * 0.8 * (2 - stabilityFactor)) * (1 - trendInfluence * 0.4),
        turbulence: 0.15 * (1 - stabilityFactor) * (2 - transitionFactor),
      };
    default:
      return {
        scale: 20 * stabilityFactor * momentumFactor,
        increment: 0.1 * confidenceFactor * transitionFactor,
        timeScale: 1.0 * stabilityFactor * momentumFactor,
        angleMultiplier: 2.0 * sharpnessFactor * (1 + trendInfluence * 0.2),
        turbulence: 0.1 * (1 - stabilityFactor) * (2 - transitionFactor),
      };
  }
};

/**
 * Generate emotion-specific flow field
 */
export const generateFlowField = (
  p5: any, // P5Instance
  width: number,
  height: number,
  time: number,
  params: FlowFieldParams,
  dominantEmotion: EmotionType,
  emotionIntensity: number
): number[][][] => {
  const scale = params.scale;
  const cols = Math.floor(width / scale);
  const rows = Math.floor(height / scale);
  const zoff = time * params.timeScale;
  const increment = params.increment;

  let yoff = 0;
  const flowField: number[][][] = [];

  for (let y = 0; y < rows; y++) {
    let xoff = 0;
    flowField[y] = [];
    for (let x = 0; x < cols; x++) {
      // Apply emotion-specific angle multiplier for different motion dynamics
      const angle = p5.noise(xoff, yoff, zoff) * p5.TWO_PI * params.angleMultiplier;

      // Add confidence-based emotion-specific turbulence
      let turbulenceX = 0, turbulenceY = 0;
      const turbulenceLevel = params.turbulence || 0.1;

      if (turbulenceLevel > 0.01) {
        const turbulenceIntensity = turbulenceLevel * emotionIntensity;

        if (dominantEmotion === 'anger') {
          turbulenceX = (p5.random(-1, 1) * turbulenceIntensity);
          turbulenceY = (p5.random(-1, 1) * turbulenceIntensity);
        } else if (dominantEmotion === 'fear') {
          if (p5.random() < turbulenceIntensity) {
            turbulenceX = p5.random(-2, 2) * turbulenceLevel;
            turbulenceY = p5.random(-2, 2) * turbulenceLevel;
          }
        } else if (dominantEmotion === 'surprise') {
          if (p5.random() < turbulenceIntensity * 0.5) {
            const burstAngle = p5.random(p5.TWO_PI);
            const burstMagnitude = p5.random(1, 3) * turbulenceLevel;
            turbulenceX = p5.cos(burstAngle) * burstMagnitude;
            turbulenceY = p5.sin(burstAngle) * burstMagnitude;
          }
        } else {
          turbulenceX = p5.random(-0.5, 0.5) * turbulenceLevel;
          turbulenceY = p5.random(-0.5, 0.5) * turbulenceLevel;
        }
      }

      const v = p5.createVector(
        p5.cos(angle) + turbulenceX,
        p5.sin(angle) + turbulenceY
      );
      v.normalize();
      flowField[y][x] = [v.x, v.y];
      xoff += increment;
    }
    yoff += increment;
  }

  return flowField;
};