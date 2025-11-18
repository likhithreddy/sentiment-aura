/**
 * Flowers Visualization Component
 * Organic flower shapes that respond to emotions using noise-based distortion
 */

import React, { useRef, useEffect } from 'react';
import { SentimentData } from '../../types';
import { useP5, P5Instance } from '../../hooks/useP5';
import { getTemporalEmotionColor, getDominantEmotion, getEmotionIntensity } from '../../utils/emotionUtils';

// P5.js constants (these are normally provided by p5)
const TWO_PI = Math.PI * 2;

// Emotion type definition
type EmotionType = 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'disgust';

interface FlowersProps {
  sentimentData: SentimentData | null;
  isRecording: boolean;
  resetTrigger?: number;
}

// Emotion hue mapping for flowers
const EMOTION_HUES = {
  joy: 45,        // Yellow-Orange
  surprise: 30,   // Orange
  anger: 0,       // Red
  fear: 240,      // Blue
  sadness: 260,   // Purple-Blue
  disgust: 120,   // Green
} as const;

// Organic class based on your provided flowers.js code
class Organic {
  radius: number;       // radius of blob
  xpos: number;        // x position of blob
  ypos: number;        // y position of blob
  roughness: number;    // magnitude of how much the circle is distorted
  angle: number;        // how much to rotate the circle by
  color: any;          // color of blob
  targetColor: any;     // target color for smooth transitions
  colorTransitionSpeed: number; // speed of color transitions

  // Movement properties for continuous flow
  vx: number = 0;
  vy: number = 0;
  driftSpeed: number;
  noiseOffsetX: number;
  noiseOffsetY: number;
  emotion: EmotionType = 'joy';
  confidenceMultiplier: number;
  baseSpeed: number;
  waveAmplitude: number;
  waveFrequency: number;

  constructor(radius: number, xpos: number, ypos: number, roughness: number, angle: number, color: any) {
    this.radius = radius;
    this.xpos = xpos;
    this.ypos = ypos;
    this.roughness = roughness;
    this.angle = angle;
    this.color = color;
    this.targetColor = color;
    this.colorTransitionSpeed = 0.1;

    // Initialize movement properties
    this.driftSpeed = 0.1 + Math.random() * 0.3;
    this.noiseOffsetX = Math.random() * 1000;
    this.noiseOffsetY = Math.random() * 1000;
    this.confidenceMultiplier = 1.0;
    this.baseSpeed = 1;
    this.waveAmplitude = 30;
    this.waveFrequency = 0.01;
  }

  // Show method from your flowers.js code
  show(p5: P5Instance, change: number) {
    p5.noStroke(); // no stroke for the circle
    p5.fill(this.color); // color to fill the blob

    p5.push(); //we enclose things between push and pop so that all transformations within only affect items within
    p5.translate(this.xpos, this.ypos); //move to xpos, ypos
    p5.rotate(this.angle + change); //rotate by this.angle+change
    p5.beginShape(); //begin a shape based on the vertex points below

    //The lines below create our vertex points (from your flowers.js)
    let off = 0;
    for (let i = 0; i < TWO_PI; i += 0.1) {
      const offset = p5.map(
        p5.noise(off, change),
        0,
        1,
        -this.roughness,
        this.roughness
      );
      const r = this.radius + offset;
      const x = r * p5.cos(i);
      const y = r * p5.sin(i);
      p5.vertex(x, y);
      off += 0.1;
    }
    p5.endShape(); //end and create the shape
    p5.pop();
  }

  // Set emotion pattern for movement (like LinearDots WaveParticle)
  setEmotionPattern(emotion: EmotionType, intensity: number, confidence: number) {
    this.emotion = emotion;
    this.confidenceMultiplier = 0.5 + confidence * 1.0; // Scale: 0.5-1.5 for flowers

    switch (emotion) {
      case 'joy':
        this.baseSpeed = 1.0 * this.confidenceMultiplier;
        this.waveAmplitude = 40 * this.confidenceMultiplier;
        this.waveFrequency = 0.008; // Upward flowing waves
        break;
      case 'anger':
        this.baseSpeed = 2.0 * this.confidenceMultiplier;
        this.waveAmplitude = 60 * this.confidenceMultiplier;
        this.waveFrequency = 0.015; // Fast, sharp horizontal waves
        break;
      case 'fear':
        this.baseSpeed = 1.5 * this.confidenceMultiplier;
        this.waveAmplitude = 35 * this.confidenceMultiplier;
        this.waveFrequency = 0.025; // Erratic, high-frequency small waves
        break;
      case 'sadness':
        this.baseSpeed = 0.6 * this.confidenceMultiplier;
        this.waveAmplitude = 25 * this.confidenceMultiplier;
        this.waveFrequency = 0.005; // Slow, downward flowing waves
        break;
      case 'surprise':
        this.baseSpeed = 1.8 * this.confidenceMultiplier;
        this.waveAmplitude = 70 * this.confidenceMultiplier;
        this.waveFrequency = 0.012; // Bursting circular waves
        break;
      case 'disgust':
        this.baseSpeed = 0.8 * this.confidenceMultiplier;
        this.waveAmplitude = 45 * this.confidenceMultiplier;
        this.waveFrequency = 0.018; // Uneven, wobbling wave patterns
        break;
      default:
        this.baseSpeed = 1.0 * this.confidenceMultiplier;
        this.waveAmplitude = 40 * this.confidenceMultiplier;
        this.waveFrequency = 0.01;
    }
  }

  // Update flower position with continuous movement (inspired by flowers.js organic drift)
  update(p5: P5Instance, globalTime: number, emotionIntensity: number) {
    // Calculate organic drift using Perlin noise (like flowers.js)
    const noiseX = p5.noise(this.noiseOffsetX + globalTime * 0.1) * 2 - 1;
    const noiseY = p5.noise(this.noiseOffsetY + globalTime * 0.1) * 2 - 1;

    const organicVx = noiseX * this.driftSpeed;
    const organicVy = noiseY * this.driftSpeed;

    // Add emotion-specific wave movement
    let waveX = 0, waveY = 0;
    const localTime = globalTime + this.noiseOffsetX;

    switch (this.emotion) {
      case 'joy':
        // Upward flowing waves
        waveX = Math.sin(this.ypos * this.waveFrequency + localTime * 0.3) * this.waveAmplitude;
        waveY = -Math.abs(Math.cos(this.xpos * this.waveFrequency * 0.7 + localTime)) * this.waveAmplitude * 0.4;
        break;
      case 'anger':
        // Fast, sharp horizontal waves
        waveX = Math.sin(localTime * 2 + this.ypos * this.waveFrequency) * this.waveAmplitude;
        waveY = Math.cos(localTime * 1.5 + this.xpos * this.waveFrequency * 1.5) * this.waveAmplitude * 0.3;
        break;
      case 'fear':
        // Erratic, high-frequency small waves
        waveX = Math.sin(localTime * 4 + this.ypos * this.waveFrequency) * this.waveAmplitude * 0.4;
        waveY = Math.cos(localTime * 3 + this.xpos * this.waveFrequency * 2) * this.waveAmplitude * 0.4;
        // Add small jitter for fear
        waveX += (p5.random(-1, 1) * this.waveAmplitude * 0.1);
        waveY += (p5.random(-1, 1) * this.waveAmplitude * 0.1);
        break;
      case 'sadness':
        // Slow, downward flowing waves
        waveX = Math.sin(localTime * 0.2 + this.ypos * this.waveFrequency * 0.5) * this.waveAmplitude * 0.3;
        waveY = Math.abs(Math.cos(this.xpos * this.waveFrequency * 0.3 + localTime * 0.15)) * this.waveAmplitude;
        break;
      case 'surprise':
        // Bursting circular waves from random origin
        const burstOrigin = p5.noise(localTime * 0.1) * p5.width;
        const burstY = p5.noise(localTime * 0.1 + 100) * p5.height;
        const distance = p5.dist(this.xpos, this.ypos, burstOrigin, burstY);
        const burstWave = Math.sin(distance * 0.01 - localTime * 1.5) * this.waveAmplitude;
        const angle = Math.atan2(this.ypos - burstY, this.xpos - burstOrigin);
        waveX = Math.cos(angle) * burstWave;
        waveY = Math.sin(angle) * burstWave;
        break;
      case 'disgust':
        // Uneven, wobbling wave patterns
        waveX = Math.sin(localTime * 0.6 + this.ypos * this.waveFrequency * 0.8) * this.waveAmplitude;
        waveY = Math.cos(localTime * 0.5 + this.xpos * this.waveFrequency * 1.2) * this.waveAmplitude * 0.5;
        break;
      default:
        // Gentle wave pattern
        waveX = Math.sin(localTime + this.ypos * this.waveFrequency) * this.waveAmplitude;
        waveY = Math.cos(localTime * 0.7 + this.xpos * this.waveFrequency) * this.waveAmplitude * 0.4;
    }

    // Combine organic drift with wave movement
    this.vx = this.vx * 0.7 + organicVx * 0.3; // 70% wave, 30% organic
    this.vy = this.vy * 0.7 + organicVy * 0.3;

    // Apply damping for smooth movement
    this.vx *= 0.95;
    this.vy *= 0.95;

    // Update position
    this.xpos += this.vx * this.baseSpeed * 0.005; // Slower movement for flowers
    this.ypos += this.vy * this.baseSpeed * 0.005;

    // Wrap around edges for continuous flow
    if (this.xpos < -100) this.xpos = p5.width + 100;
    if (this.xpos > p5.width + 100) this.xpos = -100;
    if (this.ypos < -100) this.ypos = p5.height + 100;
    if (this.ypos > p5.height + 100) this.ypos = -100;
  }

  // Smooth color transition without disrupting movement
  transitionColor(p5: P5Instance, newColor: any) {
    this.targetColor = newColor;
    this.colorTransitionSpeed = 0.05; // Smooth transitions for flowers
  }

  // Update color with smooth interpolation
  updateColor(p5: P5Instance) {
    // Simple linear interpolation for smooth color transitions
    this.color = p5.lerpColor(this.color, this.targetColor, this.colorTransitionSpeed);
  }
}

const Flowers: React.FC<FlowersProps> = ({ sentimentData, isRecording, resetTrigger }) => {
  const flowersRef = useRef<Organic[]>([]);
  const lastSentimentRef = useRef<SentimentData | null>(null);
  const timeRef = useRef(0);
  const p5Ref = useRef<P5Instance | null>(null);
  const previousColorRef = useRef<{ hue: number; saturation: number; brightness: number } | null>(null);

  // P5.js state sync mechanism - bridge React state to P5.js animation loop (like original PerlinAura)
  const sentimentDataRef = useRef(sentimentData);

  // Sync React props to P5.js context with validation
  useEffect(() => {
    // Create a safe copy of sentiment data to avoid mutations
    let safeSentimentData = sentimentData;

    if (sentimentData && typeof sentimentData === 'object') {
      // Ensure emotion_scores exists and is an object
      if (!sentimentData.emotion_scores || typeof sentimentData.emotion_scores !== 'object') {
        // Create safe copy with fallback emotion_scores instead of mutating original
        safeSentimentData = {
          ...sentimentData,
          emotion_scores: {
            joy: 0.4, sadness: 0.2, anger: 0.1, fear: 0.1, surprise: 0.3, disgust: 0.1
          }
        };
      }
    }

    sentimentDataRef.current = safeSentimentData;
  }, [sentimentData]);

  const initializeFlowers = (p5: P5Instance) => {
    // Only initialize once - prevent recreation
    if (flowersRef.current.length > 0) {
      return;
    }

    flowersRef.current = [];

    // Color palette from your flowers.js
    const colorsPalette = [
      p5.color(146, 167, 202, 30),
      p5.color(186, 196, 219, 30),
      p5.color(118, 135, 172, 30),
      p5.color(76, 41, 81, 30),
      p5.color(144, 62, 92, 30),
      p5.color(178, 93, 119, 30),
      p5.color(215, 118, 136, 30),
      p5.color(246, 156, 164, 30),
    ];

    // Create 110 organics as in your flowers.js, randomly positioned across canvas
    for (let i = 0; i < 110; i++) {
      const radius = 0.1 + 1 * i;
      const x = p5.random(p5.width); // Random position across entire width
      const y = p5.random(p5.height); // Random position across entire height
      const roughness = i * 1;
      const angle = i * p5.random(90);
      const color = colorsPalette[p5.floor(p5.random(8))];

      flowersRef.current.push(
        new Organic(radius, x, y, roughness, angle, color)
      );
    }
  };

  const setup = (p5: P5Instance) => {
    p5.createCanvas(p5.windowWidth, p5.windowHeight);
    p5Ref.current = p5; // Store p5 instance for later use
    initializeFlowers(p5);
  };

  const draw = (p5: P5Instance) => {
    timeRef.current += 0.02; // Same time progression as test.js

    // Use synced sentiment data from React context (like test.js)
    const currentSentimentData = sentimentDataRef.current;
    const emotionScores = currentSentimentData?.emotion_scores || {
      joy: 0.4, sadness: 0.2, anger: 0.1, fear: 0.1, surprise: 0.3, disgust: 0.1
    };

    // Advanced temporal HSB color system based on emotion scores and history (like test.js)
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
      // Use default neutral colors when no sentiment data (like test.js)
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

    // Get dominant emotion for motion dynamics (like test.js)
    const dominantEmotion = getDominantEmotion(emotionScores);
    const emotionIntensity = getEmotionIntensity(emotionScores);

    // Background - gentle fade for trail effect (black like LinearDots)
    if (isRecording) {
      p5.background(0, 3);
    } else {
      p5.background(0, 1);
    }

    // Update all flowers with continuous wave movement (like test.js)
    flowersRef.current.forEach((flower) => {
      // Set emotion pattern with continuous updates (no resets)
      flower.setEmotionPattern(dominantEmotion, emotionIntensity, emotionColor.confidence);

      // Update flower position with wave movement
      flower.update(p5, timeRef.current, emotionIntensity);

      // Update flower color with smooth interpolation
      flower.updateColor(p5);
    });

    // Update flower colors based on sentiment data (continuous updates like test.js)
    updateFlowerColors(p5, currentSentimentData);

    // Draw all flowers with continuous wave movement
    for (const flower of flowersRef.current) {
      flower.show(p5, timeRef.current);
    }

    // Add emotion-specific effects (like test.js)
    if (isRecording && hasValidEmotionData) {
      drawEmotionEffects(p5, emotionScores);
    }
  };

  const updateFlowerColors = (p5: P5Instance, sentimentData: SentimentData) => {
    if (!sentimentData || !sentimentData.emotion_scores) return;

    // Use temporal emotion color system with previous color tracking for smooth transitions
    const emotionColor = getTemporalEmotionColor(sentimentData, previousColorRef.current);

    // Update previous color for next frame's temporal evolution
    previousColorRef.current = {
      hue: emotionColor.hue,
      saturation: emotionColor.saturation,
      brightness: emotionColor.brightness
    };

    // Update flower colors based on emotion with smooth transitions
    for (const flower of flowersRef.current) {
      const hue = emotionColor.hue;
      const saturation = emotionColor.saturation;
      const brightness = emotionColor.brightness;

      // Create P5 color from HSB values
      const alpha = 150 + sentimentData.confidence * 100; // 150-250
      const newColor = p5.color(`hsb(${hue}, ${saturation}%, ${brightness}%, ${alpha})`);

      // Use smooth color transition instead of abrupt change
      flower.transitionColor(p5, newColor);
    }
  };

  const drawEmotionEffects = (p5: P5Instance, emotionScores: any) => {
    p5.push();
    p5.colorMode(p5.HSB, 360, 100, 100, 100);

    // Joy effect - bright particles around flowers
    if (emotionScores.joy > 0.6 && p5.frameCount % 10 === 0) {
      const joyIntensity = emotionScores.joy;
      const joyHue = EMOTION_HUES.joy;

      for (let i = 0; i < 3; i++) {
        const x = p5.random(p5.width);
        const y = p5.random(p5.height);
        p5.noStroke();
        p5.fill(joyHue, 80 + joyIntensity * 20, 90 + joyIntensity * 10, 20 + joyIntensity * 30);
        p5.circle(x, y, 2 + p5.random(4 * joyIntensity));
      }
    }

    // Anger effect - sharp lines cutting through flowers
    if (emotionScores.anger > 0.7 && p5.frameCount % 30 === 0) {
      const angerIntensity = emotionScores.anger;
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
    }

    // Fear effect - trembling particles
    if (emotionScores.fear > 0.6 && p5.frameCount % 15 === 0) {
      const fearIntensity = emotionScores.fear;
      const fearHue = EMOTION_HUES.fear;

      for (let i = 0; i < 4; i++) {
        const x = p5.random(p5.width);
        const y = p5.random(p5.height);
        p5.noStroke();
        p5.fill(fearHue, 60 + fearIntensity * 25, 40 + fearIntensity * 30, 15 + fearIntensity * 20);

        // Trembling effect
        const trembleX = p5.random(-3, 3) * fearIntensity;
        const trembleY = p5.random(-3, 3) * fearIntensity;
        p5.circle(x + trembleX, y + trembleY, 1 + p5.random(3 * fearIntensity));
      }
    }

    // Sadness effect - falling droplets
    if (emotionScores.sadness > 0.7 && p5.frameCount % 40 === 0) {
      const sadnessIntensity = emotionScores.sadness;
      const sadnessHue = EMOTION_HUES.sadness;

      p5.noStroke();
      p5.fill(sadnessHue, 50 + sadnessIntensity * 20, 30 + sadnessIntensity * 20, 10 + sadnessIntensity * 15);

      for (let i = 0; i < 2; i++) {
        const x = p5.random(p5.width);
        const y = (p5.frameCount % 60) * 3;
        p5.circle(x, y, 1 + p5.random(2) * sadnessIntensity);
      }
    }

    // Surprise effect - burst patterns
    if (emotionScores.surprise > 0.8 && p5.frameCount % 25 === 0) {
      const surpriseIntensity = emotionScores.surprise;
      const surpriseHue = EMOTION_HUES.surprise;
      const burstX = p5.random(p5.width);
      const burstY = p5.random(p5.height);

      p5.noStroke();
      p5.fill(surpriseHue, 70 + surpriseIntensity * 30, 85 + surpriseIntensity * 15, 25 + surpriseIntensity * 35);

      // Burst pattern
      for (let i = 0; i < 8; i++) {
        const angle = (p5.TWO_PI / 8) * i;
        const distance = 8 + p5.random(15) * surpriseIntensity;
        const x = burstX + p5.cos(angle) * distance;
        const y = burstY + p5.sin(angle) * distance;
        p5.circle(x, y, 1 + p5.random(3) * surpriseIntensity);
      }
    }

    // Disgust effect - disrupted, wavy patterns
    if (emotionScores.disgust > 0.6 && p5.frameCount % 35 === 0) {
      const disgustIntensity = emotionScores.disgust;
      const disgustHue = EMOTION_HUES.disgust;

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
    }

    p5.pop();
  };

  const drawRecordingIndicator = (p5: P5Instance) => {
    const currentSentimentData = sentimentDataRef.current;
    const emotionColor = currentSentimentData ? getTemporalEmotionColor(currentSentimentData, previousColorRef.current) : null;

    // Use emotion-based color for recording indicator
    if (emotionColor) {
      p5.noFill();
      p5.stroke(emotionColor.hue, emotionColor.saturation, emotionColor.brightness, emotionColor.alpha * 100);
    } else {
      p5.noFill();
      p5.stroke(255, 100, 100, 150);
    }
    p5.strokeWeight(2);

    // Pulsing circle to indicate recording
    const pulseSize = 20 + Math.sin(timeRef.current * 3) * 5;
    p5.ellipse(p5.width - 50, 50, pulseSize, pulseSize);
  };

  const windowResized = (p5: P5Instance) => {
    // Store old dimensions for position scaling
    const oldWidth = p5.width;
    const oldHeight = p5.height;

    // Resize canvas
    p5.resizeCanvas(p5.windowWidth, p5.windowHeight);

    // Calculate scaling factors to preserve particle positions
    const scaleX = p5.width / oldWidth;
    const scaleY = p5.height / oldHeight;

    // Scale existing particle positions proportionally
    flowersRef.current.forEach((flower) => {
      flower.xpos *= scaleX;
      flower.ypos *= scaleY;
    });
  };

  // Proper useP5 hook usage following the LinearDots pattern
  const { canvasRef, p5Instance } = useP5({
    setup,
    draw,
    windowResized
  });

  // Removed resetTrigger logic to prevent particle recreation
  // Particles should maintain continuous movement without resets

  return (
    <div className="w-full h-full">
      <div ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default Flowers;