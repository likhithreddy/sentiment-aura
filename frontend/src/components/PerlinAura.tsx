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

interface PerlinAuraProps {
  sentimentData: SentimentData | null;
  isRecording: boolean;
}

// Enhanced Flow Field Particle class with emotion-specific behaviors
class FlowParticle {
  x: number;
  y: number;
  vx: number;
  prevX: number;
  prevY: number;
  maxSpeed: number;
  baseSpeed: number;
  emotionMultiplier: number;
  wobble: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.prevX = x;
    this.prevY = y;
    this.maxSpeed = 2;
    this.baseSpeed = 2;
    this.emotionMultiplier = 1.0;
    this.wobble = 0;
  }

  follow(vectors: number[][][], cols: number, rows: number, scale: number) {
    const x = Math.floor(this.x / scale);
    const y = Math.floor(this.y / scale);
    const col = Math.min(Math.max(x, 0), cols - 1);
    const row = Math.min(Math.max(y, 0), rows - 1);

    const force = vectors[row]?.[col] || [0, 0];
    this.vx += force[0] * 0.5;
    this.vy += force[1] * 0.5;
  }

  update() {
    this.x += this.vx * this.emotionMultiplier;
    this.y += this.vy * this.emotionMultiplier;

    // Add emotion-specific wobble for certain emotions
    if (this.wobble > 0) {
      this.x += Math.sin(Date.now() * 0.01) * this.wobble;
      this.y += Math.cos(Date.now() * 0.01) * this.wobble;
    }

    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > this.maxSpeed) {
      this.vx = (this.vx / speed) * this.maxSpeed;
      this.vy = (this.vy / speed) * this.maxSpeed;
    }

    // Emotion-specific acceleration limiting
    const damping = this.emotionMultiplier > 1.5 ? 0.98 : 0.95; // Less damping for high energy emotions
    this.vx *= damping;
    this.vy *= damping;
  }

  // Set emotion-specific behavior with confidence integration
  setEmotionBehavior(emotion: keyof typeof EMOTION_HUES, intensity: number, confidence: number = 0.5) {
    // Confidence-based modifiers
    const confidenceStability = 0.5 + confidence * 0.5; // 0.5-1.0
    const confidenceEnergy = 0.7 + confidence * 0.3; // 0.7-1.0

    switch (emotion) {
      case 'joy':
        this.emotionMultiplier = (1.5 + intensity * 1.0) * confidenceEnergy; // More energetic with confidence
        this.wobble = intensity * 0.5 * (2 - confidenceStability); // Less wobble with higher confidence
        break;
      case 'anger':
        this.emotionMultiplier = (2.0 + intensity * 1.5) * confidenceEnergy; // Focused aggression with confidence
        this.wobble = 0; // No wobble, controlled energy
        break;
      case 'fear':
        this.emotionMultiplier = (1.8 + Math.random() * intensity * 2.0) * (2 - confidenceStability); // More erratic with low confidence
        this.wobble = intensity * 1.5 * (2 - confidenceStability); // More nervous wobble with low confidence
        break;
      case 'sadness':
        this.emotionMultiplier = (0.5 - intensity * 0.3) * confidenceStability; // More flowing with confidence
        this.wobble = intensity * 0.2 * (2 - confidenceStability); // Gentle wobble increases with low confidence
        break;
      case 'surprise':
        this.emotionMultiplier = (1.0 + Math.random() * intensity * 3.0) * confidenceEnergy; // More controlled bursts with confidence
        this.wobble = intensity * 0.8 * (2 - confidenceStability); // More predictable with confidence
        break;
      case 'disgust':
        this.emotionMultiplier = (0.7 - intensity * 0.4) * confidenceStability; // More steady with confidence
        this.wobble = intensity * 1.2 * (2 - confidenceStability); // Less uneven movement with confidence
        break;
      default:
        this.emotionMultiplier = 1.0 * confidenceStability;
        this.wobble = 0;
    }

    this.maxSpeed = this.baseSpeed * this.emotionMultiplier;
  }

  edges(width: number, height: number) {
    if (this.x < 0) {
      this.x = width;
      this.prevX = width;
    }
    if (this.x > width) {
      this.x = 0;
      this.prevX = 0;
    }
    if (this.y < 0) {
      this.y = height;
      this.prevY = height;
    }
    if (this.y > height) {
      this.y = 0;
      this.prevY = 0;
    }
  }

  draw(p5: P5Instance, hue: number, alpha: number, saturation: number = 70, brightness: number = 90) {
    p5.push();
    p5.colorMode(p5.HSB, 360, 100, 100, 100);
    p5.stroke(hue, saturation, brightness, alpha);
    p5.strokeWeight(1);
    p5.line(this.prevX, this.prevY, this.x, this.y);
    p5.pop();

    this.prevX = this.x;
    this.prevY = this.y;
  }
}

const PerlinAura: React.FC<PerlinAuraProps> = ({ sentimentData, isRecording }) => {
  const timeRef = useRef(0);
  const particlesRef = useRef<FlowParticle[]>([]);
  const flowFieldRef = useRef<number[][][]>([]);
  const previousColorRef = useRef<{ hue: number; saturation: number; brightness: number } | null>(null);

  // P5.js state sync mechanism - bridge React state to P5.js animation loop
  const sentimentDataRef = useRef(sentimentData);

  // Sync React props to P5.js context
  useEffect(() => {
    sentimentDataRef.current = sentimentData;
  }, [sentimentData]);

  const setup = (p5: P5Instance, canvasContainer: Element) => {
    p5.createCanvas(p5.windowWidth, p5.windowHeight);

    // Initialize flow field particles
    const numParticles = 500;
    particlesRef.current = [];
    for (let i = 0; i < numParticles; i++) {
      particlesRef.current.push(new FlowParticle(
        p5.random(p5.width),
        p5.random(p5.height)
      ));
    }
  };

  const draw = (p5: P5Instance) => {
    timeRef.current += 0.005;

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

    // Flow field setup with emotion-specific parameters
    const scale = flowParams.scale;
    const cols = Math.floor(p5.width / scale);
    const rows = Math.floor(p5.height / scale);
    let zoff = timeRef.current * flowParams.timeScale;
    const increment = flowParams.increment;

    // Clear background with fade effect
    if (isRecording) {
      p5.background(0, 10);
    } else {
      p5.background(0, 2);
    }

    // Generate emotion-specific flow field
    let yoff = 0;
    flowFieldRef.current = [];
    for (let y = 0; y < rows; y++) {
      let xoff = 0;
      flowFieldRef.current[y] = [];
      for (let x = 0; x < cols; x++) {
        // Apply emotion-specific angle multiplier for different motion dynamics
        const angle = p5.noise(xoff, yoff, zoff) * p5.TWO_PI * flowParams.angleMultiplier;

        // Add confidence-based emotion-specific turbulence
        let turbulenceX = 0, turbulenceY = 0;
        const turbulenceLevel = flowParams.turbulence || 0.1;

        if (turbulenceLevel > 0.01) {
          // Apply confidence-based turbulence
          const turbulenceIntensity = turbulenceLevel * emotionIntensity;

          if (dominantEmotion === 'anger') {
            // Sharp, directional turbulence for anger
            turbulenceX = (p5.random(-1, 1) * turbulenceIntensity);
            turbulenceY = (p5.random(-1, 1) * turbulenceIntensity);
          } else if (dominantEmotion === 'fear') {
            // Erratic, unpredictable turbulence for fear
            if (p5.random() < turbulenceIntensity) {
              turbulenceX = p5.random(-2, 2) * turbulenceLevel;
              turbulenceY = p5.random(-2, 2) * turbulenceLevel;
            }
          } else if (dominantEmotion === 'surprise') {
            // Burst-like turbulence for surprise
            if (p5.random() < turbulenceIntensity * 0.5) {
              const burstAngle = p5.random(p5.TWO_PI);
              const burstMagnitude = p5.random(1, 3) * turbulenceLevel;
              turbulenceX = p5.cos(burstAngle) * burstMagnitude;
              turbulenceY = p5.sin(burstAngle) * burstMagnitude;
            }
          } else {
            // Gentle, general turbulence for other emotions
            turbulenceX = p5.random(-0.5, 0.5) * turbulenceLevel;
            turbulenceY = p5.random(-0.5, 0.5) * turbulenceLevel;
          }
        }

        const v = p5.createVector(
          p5.cos(angle) + turbulenceX,
          p5.sin(angle) + turbulenceY
        );
        v.normalize(); // Keep vectors normalized for consistent flow speed
        flowFieldRef.current[y][x] = [v.x, v.y];
        xoff += increment;
      }
      yoff += increment;
    }

    // Update and draw particles with emotion-specific behaviors
    const dynamicAlpha = isRecording ? particleAlpha * (1 + energy * 0.5) : particleAlpha;

    // Apply emotion-specific behaviors to particles
    particlesRef.current.forEach((particle, index) => {
      // Set emotion behavior with slight variations for organic movement
      const intensityVariation = 1.0 + (index % 3 - 1) * 0.1; // ±10% variation
      particle.setEmotionBehavior(dominantEmotion, Math.min(1.0, emotionIntensity * intensityVariation), confidence);

      particle.follow(flowFieldRef.current, cols, rows, scale);
      particle.update();
      particle.edges(p5.width, p5.height);

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

export default PerlinAura;