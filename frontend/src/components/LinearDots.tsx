import React, { useRef, useEffect } from 'react';
import { SentimentData } from '../types';
import { useP5, P5Instance } from '../hooks/useP5';
import { getEmotionColor, getEmotionIntensity, getDominantEmotion, getTemporalEmotionColor } from '../utils/emotionUtils';

// Emotion hue mapping for direct access in effects
const EMOTION_HUES = {
  joy: 45,        // Yellow-Orange
  surprise: 30,   // Orange
  anger: 0,       // Red
  fear: 240,      // Blue
  sadness: 260,   // Purple-Blue
  disgust: 120,   // Green
} as const;

interface LinearDotsProps {
  sentimentData: SentimentData | null;
  isRecording: boolean;
  resetTrigger?: number; // Trigger reset when this value changes
}

// Wave Particle system for free-flowing movement across canvas
class WaveParticle {
  x: number; // Current position X
  y: number; // Current position Y
  vx: number; // Velocity X
  vy: number; // Velocity Y
  baseSpeed: number; // Base movement speed
  waveAmplitude: number; // Wave amplitude
  waveFrequency: number; // Wave frequency
  confidenceMultiplier: number; // Confidence-based intensity
  emotion: keyof typeof EMOTION_HUES; // Current emotion

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.baseSpeed = 1;
    this.waveAmplitude = 50;
    this.waveFrequency = 0.01;
    this.confidenceMultiplier = 1.0;
    this.emotion = 'joy'; // Default emotion
  }

  // Set emotion-specific wave movement patterns
  setEmotionPattern(emotion: keyof typeof EMOTION_HUES, intensity: number, confidence: number) {
    this.emotion = emotion;
    this.confidenceMultiplier = 0.3 + confidence * 1.7; // Scale: 0.3-2.0 based on confidence

    switch (emotion) {
      case 'joy':
        this.baseSpeed = 1.5 * this.confidenceMultiplier;
        this.waveAmplitude = 80 * this.confidenceMultiplier;
        this.waveFrequency = 0.008; // Upward flowing waves
        break;
      case 'anger':
        this.baseSpeed = 3.0 * this.confidenceMultiplier;
        this.waveAmplitude = 100 * this.confidenceMultiplier;
        this.waveFrequency = 0.015; // Fast, sharp horizontal waves
        break;
      case 'fear':
        this.baseSpeed = 2.5 * this.confidenceMultiplier;
        this.waveAmplitude = 40 * this.confidenceMultiplier;
        this.waveFrequency = 0.025; // Erratic, high-frequency small waves
        break;
      case 'sadness':
        this.baseSpeed = 0.8 * this.confidenceMultiplier;
        this.waveAmplitude = 30 * this.confidenceMultiplier;
        this.waveFrequency = 0.005; // Slow, downward flowing waves
        break;
      case 'surprise':
        this.baseSpeed = 2.0 * this.confidenceMultiplier;
        this.waveAmplitude = 120 * this.confidenceMultiplier;
        this.waveFrequency = 0.012; // Bursting circular waves
        break;
      case 'disgust':
        this.baseSpeed = 1.0 * this.confidenceMultiplier;
        this.waveAmplitude = 60 * this.confidenceMultiplier;
        this.waveFrequency = 0.018; // Uneven, wobbling wave patterns
        break;
      default:
        this.baseSpeed = 1.2 * this.confidenceMultiplier;
        this.waveAmplitude = 50 * this.confidenceMultiplier;
        this.waveFrequency = 0.01;
    }
  }

  // Update particle position with wave movement
  update(p5: P5Instance, time: number, emotionIntensity: number) {
    // Calculate wave-based movement
    let waveX = 0, waveY = 0;

    switch (this.emotion) {
      case 'joy':
        // Upward flowing waves
        waveX = Math.sin(this.y * this.waveFrequency + time * 0.5) * this.waveAmplitude;
        waveY = -Math.abs(Math.cos(this.x * this.waveFrequency * 0.7 + time)) * this.waveAmplitude * 0.5;
        break;
      case 'anger':
        // Fast, sharp horizontal waves
        waveX = Math.sin(time * 3 + this.y * this.waveFrequency) * this.waveAmplitude;
        waveY = Math.cos(time * 2 + this.x * this.waveFrequency * 1.5) * this.waveAmplitude * 0.3;
        break;
      case 'fear':
        // Erratic, high-frequency small waves
        waveX = Math.sin(time * 5 + this.y * this.waveFrequency) * this.waveAmplitude * 0.5;
        waveY = Math.cos(time * 4 + this.x * this.waveFrequency * 2) * this.waveAmplitude * 0.5;
        // Add random jitter for fear
        waveX += (p5.random(-1, 1) * this.waveAmplitude * 0.2);
        waveY += (p5.random(-1, 1) * this.waveAmplitude * 0.2);
        break;
      case 'sadness':
        // Slow, downward flowing waves
        waveX = Math.sin(time * 0.3 + this.y * this.waveFrequency * 0.5) * this.waveAmplitude * 0.4;
        waveY = Math.abs(Math.cos(this.x * this.waveFrequency * 0.3 + time * 0.2)) * this.waveAmplitude;
        break;
      case 'surprise':
        // Bursting circular waves from random origin
        const burstOrigin = p5.noise(time * 0.1) * p5.width;
        const burstY = p5.noise(time * 0.1 + 100) * p5.height;
        const distance = p5.dist(this.x, this.y, burstOrigin, burstY);
        const burstWave = Math.sin(distance * 0.01 - time * 2) * this.waveAmplitude;
        const angle = Math.atan2(this.y - burstY, this.x - burstOrigin);
        waveX = Math.cos(angle) * burstWave;
        waveY = Math.sin(angle) * burstWave;
        break;
      case 'disgust':
        // Uneven, wobbling wave patterns
        waveX = Math.sin(time + this.y * this.waveFrequency * 0.8) * this.waveAmplitude;
        waveY = Math.cos(time * 0.7 + this.x * this.waveFrequency * 1.2) * this.waveAmplitude * 0.6;
        break;
      default:
        // Gentle wave pattern
        waveX = Math.sin(time + this.y * this.waveFrequency) * this.waveAmplitude;
        waveY = Math.cos(time * 0.8 + this.x * this.waveFrequency) * this.waveAmplitude * 0.5;
    }

    // Apply wave movement to velocity
    this.vx = waveX * this.baseSpeed * 0.01;
    this.vy = waveY * this.baseSpeed * 0.01;

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Wrap around edges for continuous flow
    if (this.x < -50) this.x = p5.width + 50;
    if (this.x > p5.width + 50) this.x = -50;
    if (this.y < -50) this.y = p5.height + 50;
    if (this.y > p5.height + 50) this.y = -50;
  }

  draw(p5: P5Instance, hue: number, alpha: number, saturation: number = 70, brightness: number = 90) {
    // Size varies slightly with confidence
    const size = 2 + this.confidenceMultiplier * 0.5;

    p5.push();
    p5.colorMode(p5.HSB, 360, 100, 100, 100);
    p5.noStroke();
    p5.fill(hue, saturation, brightness, alpha);
    p5.circle(this.x, this.y, size);
    p5.pop();
  }
}

const LinearDots: React.FC<LinearDotsProps> = ({ sentimentData, isRecording, resetTrigger }) => {
  const timeRef = useRef(0);
  const particlesRef = useRef<WaveParticle[]>([]);
  const flowFieldRef = useRef<number[][][]>([]);
  const previousColorRef = useRef<{ hue: number; saturation: number; brightness: number } | null>(null);

  // Reset functionality state
  const resetTransitionFrameRef = useRef(0);
  const isResettingRef = useRef(false);

  // Wave effect state
  const waveOriginRef = useRef<{ x: number; y: number } | null>(null);
  const waveTimeRef = useRef(0);
  const previousEmotionRef = useRef<string>('');

  // P5.js state sync mechanism - bridge React state to P5.js animation loop
  const sentimentDataRef = useRef(sentimentData);

  // Sync React props to P5.js context
  useEffect(() => {
    sentimentDataRef.current = sentimentData;
  }, [sentimentData]);

  // Watch for reset trigger
  useEffect(() => {
    if (resetTrigger && resetTrigger > 0) {
      // Initiate reset sequence
      isResettingRef.current = true;
      resetTransitionFrameRef.current = 0;
      timeRef.current = 0; // Reset time for fresh field
    }
  }, [resetTrigger]);

  const setup = (p5: P5Instance, canvasContainer: Element) => {
    p5.createCanvas(p5.windowWidth, p5.windowHeight);

    // Initialize wave particles randomly across entire canvas
    const numParticles = 300; // Optimized count for performance
    particlesRef.current = [];

    for (let i = 0; i < numParticles; i++) {
      particlesRef.current.push(new WaveParticle(
        p5.random(p5.width),
        p5.random(p5.height)
      ));
    }
  };

  const draw = (p5: P5Instance) => {
    timeRef.current += 0.02; // 4x faster for immediate field evolution

    // Use synced sentiment data from React context
    const currentSentimentData = sentimentDataRef.current;
    const sentiment = currentSentimentData?.sentiment || 0;
    const sentimentLabel = currentSentimentData?.sentiment_label || 'neutral';
    const emotionScores = currentSentimentData?.emotion_scores || {
      joy: 0.4, sadness: 0.2, anger: 0.1, fear: 0.1, surprise: 0.3, disgust: 0.1
    };

    // Calculate energy and chaos based on emotions
    const energy = Math.max(
      emotionScores.joy * 2.0,
      emotionScores.surprise * 1.8,
      emotionScores.anger * 1.5,
      emotionScores.fear * 1.0,
      emotionScores.sadness * 0.5
    );

      // Advanced temporal HSB color system based on emotion scores and history
    let emotionColor;

    // Check if we have valid sentiment data (using synced data)
    const hasValidEmotionData = currentSentimentData &&
      typeof currentSentimentData === 'object' &&
      'emotion_scores' in currentSentimentData &&
      typeof currentSentimentData.emotion_scores === 'object' &&
      currentSentimentData.emotion_scores !== null;

    // Only call if we have valid sentiment data
    if (hasValidEmotionData) {
      emotionColor = getTemporalEmotionColor(currentSentimentData, previousColorRef.current);
      // Update previous color for next frame's temporal evolution
      previousColorRef.current = {
        hue: emotionColor.hue,
        saturation: emotionColor.saturation,
        brightness: emotionColor.brightness
      };
    } else {
      // Use default neutral colors when no sentiment data
      emotionColor = {
        hue: 180, // Cyan
        saturation: 75,
        brightness: 85,
        alpha: 0.9,
        confidence: 0.5,
        intensity: 0.5,
        stability: 0.5,
        sharpness: 0.5,
        temporalMomentum: 0,
        transitionSpeed: 1.0,
        emotionTrend: 'joy' as const,
        trendIntensity: 0.5
      };
    }

    const baseHue = emotionColor.hue;
    const particleAlpha = emotionColor.alpha * 100; // Convert to 0-100 range for P5

    // Get dominant emotion for motion dynamics
    const dominantEmotion = getDominantEmotion(emotionScores);
    const emotionIntensity = getEmotionIntensity(emotionScores);

    // Enhanced confidence-based visual modifiers
    const confidenceIntensity = emotionColor.intensity;
    const stability = emotionColor.stability;
    const sharpness = emotionColor.sharpness;
    const confidence = emotionColor.confidence;

    // Emotion-specific flow field parameters with confidence and temporal integration
    const getEmotionFlowParams = (emotion: keyof typeof EMOTION_HUES, intensity: number) => {
      // Confidence-based stability modifiers
      const stabilityFactor = 0.5 + stability * 0.5; // 0.5-1.0 based on confidence
      const sharpnessFactor = 0.7 + sharpness * 0.3; // 0.7-1.0 based on confidence
      const confidenceFactor = confidenceIntensity; // 0.5-1.0 based on confidence

      // Temporal evolution modifiers
      const momentumFactor = 1.0 + emotionColor.temporalMomentum * 0.5; // 1.0-1.5 based on color momentum
      const transitionFactor = emotionColor.transitionSpeed; // 0.3-1.7 based on emotional transition rate
      const trendInfluence = emotionColor.trendIntensity; // 0.0-1.0 based on trend strength

      switch (emotion) {
        case 'joy':
          return {
            scale: (15 - intensity * 5 * sharpnessFactor) / momentumFactor, // Flow changes with momentum
            increment: (0.15 + intensity * 0.1 * confidenceFactor) * transitionFactor, // Evolution speed varies with transitions
            timeScale: (1.5 + intensity) * stabilityFactor * momentumFactor, // Time flow influenced by momentum
            angleMultiplier: 2.5 * sharpnessFactor * (1 + trendInfluence * 0.5), // Angles influenced by trends
            turbulence: 0.1 * (1 - stability) * (2 - transitionFactor),     // Turbulence inversely related to transition speed
          };
        case 'anger':
          return {
            scale: (25 - intensity * 8 * sharpnessFactor) * momentumFactor, // Chaos intensifies with momentum
            increment: (0.2 + intensity * 0.15 * confidenceFactor) * transitionFactor, // Chaos speed varies with transitions
            timeScale: (2.0 + intensity * 1.5) * stabilityFactor / momentumFactor, // Aggression controlled by momentum
            angleMultiplier: 3.0 * sharpnessFactor * (1 + trendInfluence * 0.3), // Angles sharpen with trends
            turbulence: 0.3 * (1 - stability) * transitionFactor, // Turbulence increases with transition speed
          };
        case 'fear':
          return {
            scale: (30 + intensity * 10 * (2 - stabilityFactor)) * (1 + momentumFactor * 0.5), // Erraticness amplified by momentum
            increment: (0.08 + intensity * 0.12 * confidenceFactor) * transitionFactor, // Fear response speed with transitions
            timeScale: (0.8 + intensity * 0.4 * (2 - stabilityFactor)) / momentumFactor, // Instability modulated by momentum
            angleMultiplier: (1.8 + Math.sin(timeRef.current * 2) * 1.5 * (2 - stabilityFactor)) * (1 + trendInfluence),
            turbulence: 0.4 * (2 - stabilityFactor) * (1 + momentumFactor * 0.3), // Turbulence enhanced by momentum
          };
        case 'sadness':
          return {
            scale: (40 + intensity * 20 / stabilityFactor) / (momentumFactor * 0.8 + 0.2), // Flow softens with high momentum
            increment: (0.05 + intensity * 0.02 * confidenceFactor) * (2 - transitionFactor), // Slower evolution with high transitions
            timeScale: (0.4 - intensity * 0.2) * stabilityFactor * momentumFactor, // Time flow affected by momentum
            angleMultiplier: (1.2 + (1 - stabilityFactor) * 0.3) * (1 - trendInfluence * 0.3), // Angles stabilize with trends
            turbulence: 0.05 * (1 - stability) * (2 - transitionFactor), // Minimal turbulence, reduced by high transitions
          };
        case 'surprise':
          return {
            scale: (18 - intensity * 6 * sharpnessFactor) / (1 + momentumFactor * 0.3), // Bursts focus with momentum
            increment: (0.12 + intensity * 0.18 * confidenceFactor) * transitionFactor * 1.5, // Burst speed enhanced by transitions
            timeScale: (1.2 + intensity * 2.0) * stabilityFactor * (1 + momentumFactor * 0.5), // Burst timing affected by momentum
            angleMultiplier: (2.0 + Math.cos(timeRef.current * 3) * 1.5 * (2 - stabilityFactor)) * (1 + trendInfluence),
            turbulence: 0.2 * (1 - stability) * transitionFactor, // Surprise chaos varies with transition speed
          };
        case 'disgust':
          return {
            scale: (35 + intensity * 15 / stabilityFactor) * (1 + momentumFactor * 0.2), // Pattern complexity with momentum
            increment: (0.06 + intensity * 0.08 * confidenceFactor) * (2 - transitionFactor), // Evolution slows with high transitions
            timeScale: (0.6 - intensity * 0.3) * stabilityFactor * momentumFactor, // Steadiness influenced by momentum
            angleMultiplier: (1.5 + Math.sin(timeRef.current * 0.5) * 0.8 * (2 - stabilityFactor)) * (1 - trendInfluence * 0.4),
            turbulence: 0.15 * (1 - stability) * (2 - transitionFactor), // Wavering reduced by high transitions
          };
        default:
          return {
            scale: 20 * stabilityFactor * momentumFactor,
            increment: (0.1 + energy * 0.05 * confidenceFactor) * transitionFactor,
            timeScale: 1.0 * stabilityFactor * momentumFactor,
            angleMultiplier: 2.0 * sharpnessFactor * (1 + trendInfluence * 0.2),
            turbulence: 0.1 * (1 - stability) * (2 - transitionFactor),
          };
      }
    };

    const flowParams = getEmotionFlowParams(dominantEmotion, emotionIntensity);

    
    // Clear background with reset transition or normal fade
    if (isResettingRef.current) {
      // Smooth exponential reset transition over 20 frames
      const frame = resetTransitionFrameRef.current;

      if (frame === 0) {
        p5.background(0); // Complete clear
      } else if (frame === 1) {
        p5.background(0, 40); // Very dark
      } else if (frame === 2) {
        p5.background(0, 35);
      } else if (frame === 3) {
        p5.background(0, 30);
      } else if (frame === 4) {
        p5.background(0, 26);
      } else if (frame === 5) {
        p5.background(0, 22);
      } else if (frame === 6) {
        p5.background(0, 19);
      } else if (frame === 7) {
        p5.background(0, 16);
      } else if (frame === 8) {
        p5.background(0, 14);
      } else if (frame === 9) {
        p5.background(0, 12);
      } else if (frame === 10) {
        p5.background(0, 10);
      } else if (frame === 11) {
        p5.background(0, 8);
      } else if (frame === 12) {
        p5.background(0, 7);
      } else if (frame === 13) {
        p5.background(0, 6);
      } else if (frame === 14) {
        p5.background(0, 5);
      } else if (frame === 15) {
        p5.background(0, 4);
      } else if (frame === 16) {
        p5.background(0, 3);
      } else if (frame === 17) {
        p5.background(0, 2.5);
      } else if (frame === 18) {
        p5.background(0, 2);
      } else if (frame === 19) {
        p5.background(0, 1.5);
      } else if (frame === 20) {
        p5.background(0, 1);
      } else {
        // End reset transition
        isResettingRef.current = false;
        resetTransitionFrameRef.current = 0;
        return; // Skip frame to avoid conflicts
      }

      resetTransitionFrameRef.current++;
    } else {
      // Normal background fade (reduced for longer line persistence)
      if (isRecording) {
        p5.background(0, 3);
      } else {
        p5.background(0, 1);
      }
    }

    
    // Check for sentiment changes to trigger wave effect
    const currentEmotion = dominantEmotion;
    if (currentEmotion !== previousEmotionRef.current) {
      // Sentiment changed - create new wave
      waveOriginRef.current = {
        x: p5.random(p5.width),
        y: p5.random(p5.height)
      };
      waveTimeRef.current = 0;
      previousEmotionRef.current = currentEmotion;
    }

    // Update wave time
    if (waveTimeRef.current < 2) {
      waveTimeRef.current += 0.05; // Wave spreads over ~2 seconds
    }

    // Update and draw wave particles with confidence-based movement
    const dynamicAlpha = isRecording ? particleAlpha * (1 + energy * 0.5) : particleAlpha;

    // Apply emotion patterns to particles
    particlesRef.current.forEach((particle) => {
      // Set emotion pattern with confidence-based intensity
      particle.setEmotionPattern(dominantEmotion, emotionIntensity, confidence);

      // Update particle position with wave movement
      particle.update(p5, timeRef.current, emotionIntensity);

      // Draw the wave particle
      particle.draw(p5, baseHue, dynamicAlpha, emotionColor.saturation, emotionColor.brightness);
    });

    // Recording indicator with emotion-based color
    if (isRecording) {
      const pulseAlpha = emotionColor.alpha * 100 * (1 + p5.sin(timeRef.current * 4) * 0.5);
      const pulseSize = 8 + p5.sin(timeRef.current * 4) * 3;

      p5.push();
      p5.colorMode(p5.HSB, 360, 100, 100, 100);
      p5.translate(p5.width - 40, 40);

      // Emotion-aware circle indicator
      p5.noStroke();
      p5.fill(baseHue, emotionColor.saturation, emotionColor.brightness, pulseAlpha);
      p5.circle(0, 0, pulseSize);
      p5.pop();
    }

    // Enhanced emotion-specific effects using advanced color system
    if (isRecording) {
      // Joy effect - bright particles with emotion-aware colors
      if (emotionScores.joy > 0.6 && p5.frameCount % 10 === 0) {
        const joyIntensity = emotionScores.joy;
        const particleCount = Math.floor(1 + joyIntensity * 3);

        for (let i = 0; i < particleCount; i++) {
          const x = p5.random(p5.width);
          const y = p5.random(p5.height);
          p5.push();
          p5.colorMode(p5.HSB, 360, 100, 100, 100);
          p5.noStroke();

          // Use emotion-specific color with enhanced brightness for joy
          const joyHue = EMOTION_HUES.joy;
          p5.fill(joyHue, 80 + joyIntensity * 20, 90 + joyIntensity * 10, 20 + joyIntensity * 30);
          p5.circle(x, y, 1 + p5.random(3 * joyIntensity));
          p5.pop();
        }
      }

      // Anger effect - sharp lines with emotion-specific colors
      if (emotionScores.anger > 0.7 && p5.frameCount % 30 === 0) {
        const angerIntensity = emotionScores.anger;
        p5.push();
        p5.colorMode(p5.HSB, 360, 100, 100, 100);

        // Use anger-specific color with enhanced saturation
        const angerHue = EMOTION_HUES.anger;
        p5.stroke(angerHue, 70 + angerIntensity * 30, 50 + angerIntensity * 20, 10 + angerIntensity * 15);
        p5.strokeWeight(1 + angerIntensity * 0.5);
        p5.noFill();
        p5.beginShape();
        let x = p5.random(p5.width);
        let y = 0;
        p5.vertex(x, y);
        for (let j = 0; j < 3; j++) {
          x += p5.random(-50 * angerIntensity, 50 * angerIntensity);
          y += p5.height / 3;
          p5.vertex(x, y);
        }
        p5.endShape();
        p5.pop();
      }

      // Fear effect - trembling particles
      if (emotionScores.fear > 0.6 && p5.frameCount % 15 === 0) {
        const fearIntensity = emotionScores.fear;
        const fearHue = EMOTION_HUES.fear;

        for (let i = 0; i < 3; i++) {
          const x = p5.random(p5.width);
          const y = p5.random(p5.height);
          p5.push();
          p5.colorMode(p5.HSB, 360, 100, 100, 100);
          p5.noStroke();
          p5.fill(fearHue, 60 + fearIntensity * 25, 40 + fearIntensity * 30, 15 + fearIntensity * 20);

          // Trembling effect
          const trembleX = p5.random(-2, 2) * fearIntensity;
          const trembleY = p5.random(-2, 2) * fearIntensity;
          p5.circle(x + trembleX, y + trembleY, 0.5 + p5.random(2 * fearIntensity));
          p5.pop();
        }
      }

      // Sadness effect - slow, falling droplets
      if (emotionScores.sadness > 0.7 && p5.frameCount % 40 === 0) {
        const sadnessIntensity = emotionScores.sadness;
        const sadnessHue = EMOTION_HUES.sadness;

        p5.push();
        p5.colorMode(p5.HSB, 360, 100, 100, 100);
        p5.noStroke();
        p5.fill(sadnessHue, 50 + sadnessIntensity * 20, 30 + sadnessIntensity * 20, 10 + sadnessIntensity * 15);

        // Falling droplet effect
        for (let i = 0; i < 2; i++) {
          const x = p5.random(p5.width);
          const y = 0;
          const size = 1 + p5.random(2) * sadnessIntensity;
          p5.circle(x, y + (p5.frameCount % 60) * 2, size);
        }
        p5.pop();
      }

      // Surprise effect - burst patterns
      if (emotionScores.surprise > 0.8 && p5.frameCount % 25 === 0) {
        const surpriseIntensity = emotionScores.surprise;
        const surpriseHue = EMOTION_HUES.surprise;
        const burstX = p5.random(p5.width);
        const burstY = p5.random(p5.height);

        p5.push();
        p5.colorMode(p5.HSB, 360, 100, 100, 100);
        p5.noStroke();
        p5.fill(surpriseHue, 70 + surpriseIntensity * 30, 85 + surpriseIntensity * 15, 25 + surpriseIntensity * 35);

        // Burst pattern
        for (let i = 0; i < 8; i++) {
          const angle = (p5.TWO_PI / 8) * i;
          const distance = 5 + p5.random(10) * surpriseIntensity;
          const x = burstX + p5.cos(angle) * distance;
          const y = burstY + p5.sin(angle) * distance;
          p5.circle(x, y, 1 + p5.random(2) * surpriseIntensity);
        }
        p5.pop();
      }

      // Disgust effect - disrupted, wavy patterns
      if (emotionScores.disgust > 0.6 && p5.frameCount % 35 === 0) {
        const disgustIntensity = emotionScores.disgust;
        const disgustHue = EMOTION_HUES.disgust;

        p5.push();
        p5.colorMode(p5.HSB, 360, 100, 100, 100);
        p5.stroke(disgustHue, 40 + disgustIntensity * 20, 35 + disgustIntensity * 25, 8 + disgustIntensity * 12);
        p5.strokeWeight(1);
        p5.noFill();
        p5.beginShape();

        // Wavy, disrupted line
        const startX = p5.random(p5.width);
        const startY = p5.random(p5.height);
        p5.vertex(startX, startY);

        for (let j = 0; j < 5; j++) {
          const waveX = startX + j * 20 * disgustIntensity + p5.sin(j * 0.5 + timeRef.current * 2) * 10 * disgustIntensity;
          const waveY = startY + j * 15 * disgustIntensity + p5.cos(j * 0.7 + timeRef.current * 1.5) * 8 * disgustIntensity;
          p5.vertex(waveX, waveY);
        }
        p5.endShape();
        p5.pop();
      }
    }
  };

  const windowResized = (p5: P5Instance) => {
    p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
  };

  const { canvasRef } = useP5({
    setup,
    draw,
    windowResized
  });

  return (
    <div className="perlin-aura-container">
      <div ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      <style>{`
        .perlin-aura-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1; /* Background layer */
        }
      `}</style>
    </div>
  );
};

export default LinearDots;