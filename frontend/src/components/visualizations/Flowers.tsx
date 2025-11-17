/**
 * Flowers Visualization Component
 * Organic flower shapes with continuous wave-based movement (like test.js)
 */

import React, { useRef, useEffect } from 'react';
import { SentimentData } from '../../types';
import { useP5, P5Instance } from '../../hooks/useP5';
import { getTemporalEmotionColor, getDominantEmotion, getEmotionIntensity } from '../../utils/emotionUtils';
import { WaveParticle, EMOTION_HUES, EmotionType } from '../../utils/waveParticle';

// P5.js constants (these are normally provided by p5)
const TWO_PI = Math.PI * 2;

interface FlowersProps {
  sentimentData: SentimentData | null;
  isRecording: boolean;
  resetTrigger?: number;
}

// Flower class with continuous wave movement (simplified from test.js approach)
class Flower {
  x: number;        // x position of flower
  y: number;        // y position of flower
  radius: number;   // radius of flower
  roughness: number; // magnitude of how much the circle is distorted
  angle: number;    // how much to rotate the flower by
  color: any;       // color of flower
  sizeScale: number; // scaling factor for flower size
  time: number;     // individual time for organic movement

  // Movement properties using WaveParticle approach
  vx: number = 0;
  vy: number = 0;
  baseSpeed: number;
  waveAmplitude: number;
  waveFrequency: number;
  confidenceMultiplier: number;
  emotion: EmotionType;

  constructor(x: number, y: number, radius: number, roughness: number, angle: number, color: any, sizeScale: number = 2.5) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.roughness = roughness;
    this.angle = angle;
    this.color = color;
    this.sizeScale = sizeScale;
    this.time = Math.random() * 1000; // Random time offset

    // WaveParticle movement properties
    this.baseSpeed = 1;
    this.waveAmplitude = 30;
    this.waveFrequency = 0.01;
    this.confidenceMultiplier = 1.0;
    this.emotion = 'joy';
  }

  // Set emotion pattern like WaveParticle (simplified for flowers)
  setEmotionPattern(emotion: EmotionType, intensity: number, confidence: number) {
    this.emotion = emotion;
    this.confidenceMultiplier = 0.5 + confidence * 1.0; // Scale: 0.5-1.5 for gentler movement

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

  // Update flower position with wave movement (simplified from WaveParticle)
  update(p5: P5Instance, globalTime: number) {
    // Calculate wave-based movement
    let waveX = 0, waveY = 0;
    const localTime = globalTime + this.time;

    switch (this.emotion) {
      case 'joy':
        // Upward flowing waves
        waveX = Math.sin(this.y * this.waveFrequency + localTime * 0.3) * this.waveAmplitude;
        waveY = -Math.abs(Math.cos(this.x * this.waveFrequency * 0.7 + localTime)) * this.waveAmplitude * 0.4;
        break;
      case 'anger':
        // Fast, sharp horizontal waves
        waveX = Math.sin(localTime * 2 + this.y * this.waveFrequency) * this.waveAmplitude;
        waveY = Math.cos(localTime * 1.5 + this.x * this.waveFrequency * 1.5) * this.waveAmplitude * 0.3;
        break;
      case 'fear':
        // Erratic, high-frequency small waves
        waveX = Math.sin(localTime * 4 + this.y * this.waveFrequency) * this.waveAmplitude * 0.4;
        waveY = Math.cos(localTime * 3 + this.x * this.waveFrequency * 2) * this.waveAmplitude * 0.4;
        // Add small jitter for fear
        waveX += (p5.random(-1, 1) * this.waveAmplitude * 0.1);
        waveY += (p5.random(-1, 1) * this.waveAmplitude * 0.1);
        break;
      case 'sadness':
        // Slow, downward flowing waves
        waveX = Math.sin(localTime * 0.2 + this.y * this.waveFrequency * 0.5) * this.waveAmplitude * 0.3;
        waveY = Math.abs(Math.cos(this.x * this.waveFrequency * 0.3 + localTime * 0.15)) * this.waveAmplitude;
        break;
      case 'surprise':
        // Bursting circular waves from random origin
        const burstOrigin = p5.noise(localTime * 0.1) * p5.width;
        const burstY = p5.noise(localTime * 0.1 + 100) * p5.height;
        const distance = p5.dist(this.x, this.y, burstOrigin, burstY);
        const burstWave = Math.sin(distance * 0.01 - localTime * 1.5) * this.waveAmplitude;
        const angle = Math.atan2(this.y - burstY, this.x - burstOrigin);
        waveX = Math.cos(angle) * burstWave;
        waveY = Math.sin(angle) * burstWave;
        break;
      case 'disgust':
        // Uneven, wobbling wave patterns
        waveX = Math.sin(localTime * 0.8 + this.y * this.waveFrequency * 0.8) * this.waveAmplitude;
        waveY = Math.cos(localTime * 0.6 + this.x * this.waveFrequency * 1.2) * this.waveAmplitude * 0.5;
        break;
      default:
        // Gentle wave pattern
        waveX = Math.sin(localTime + this.y * this.waveFrequency) * this.waveAmplitude;
        waveY = Math.cos(localTime * 0.7 + this.x * this.waveFrequency) * this.waveAmplitude * 0.4;
    }

    // Apply wave movement to velocity (slower for flowers)
    this.vx = waveX * this.baseSpeed * 0.005; // Half speed of particles for gentler movement
    this.vy = waveY * this.baseSpeed * 0.005;

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Wrap around edges for continuous flow
    if (this.x < -100) this.x = p5.width + 100;
    if (this.x > p5.width + 100) this.x = -100;
    if (this.y < -100) this.y = p5.height + 100;
    if (this.y > p5.height + 100) this.y = -100;
  }

  // Show method from flowers.js
  show(p5: P5Instance, change: number) {
    p5.noStroke(); // no stroke for the circle
    p5.fill(this.color); // color to fill the blob

    p5.push(); // we enclose things between push and pop so that all transformations within only affect items within
    p5.translate(this.x, this.y); // move to xpos, ypos
    p5.rotate(this.angle + change); // rotate by this.angle+change
    p5.beginShape(); // begin a shape based on the vertex points below

    // The lines below create our vertex points (from flowers.js)
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
    p5.endShape(); // end and create the shape
    p5.pop();
  }
}

const Flowers: React.FC<FlowersProps> = ({ sentimentData, isRecording, resetTrigger }) => {
  const flowersRef = useRef<Flower[]>([]);
  const timeRef = useRef(0);
  const p5Ref = useRef<P5Instance | null>(null);
  const previousColorRef = useRef<{ hue: number; saturation: number; brightness: number } | null>(null);
  const lastResetTriggerRef = useRef(0);

  // P5.js state sync mechanism - bridge React state to P5.js animation loop (like test.js)
  const sentimentDataRef = useRef(sentimentData);

  // Handle reset trigger - reinitialize flowers when reset occurs
  useEffect(() => {
    if (resetTrigger && resetTrigger !== lastResetTriggerRef.current && p5Ref.current) {
      // Clear previous state to prevent stale data
      timeRef.current = 0;
      previousColorRef.current = null;
      lastResetTriggerRef.current = resetTrigger;

      // Reinitialize flowers
      initializeFlowers(p5Ref.current);
    }
  }, [resetTrigger]);

  // Sync React props to P5.js context
  useEffect(() => {
    sentimentDataRef.current = sentimentData;
  }, [sentimentData]);

  const initializeFlowers = (p5: P5Instance) => {
    flowersRef.current = [];

    // Enhanced color palette with richer, more vibrant colors
    const colorsPalette = [
      p5.color(146, 167, 202, 40),  // Soft blue
      p5.color(186, 196, 219, 40),  // Light blue
      p5.color(118, 135, 172, 40),  // Deep blue
      p5.color(76, 41, 81, 40),     // Deep purple
      p5.color(144, 62, 92, 40),    // Medium purple
      p5.color(178, 93, 119, 40),   // Rose purple
      p5.color(215, 118, 136, 40),  // Pink
      p5.color(246, 156, 164, 40),  // Light pink
      p5.color(255, 198, 87, 40),   // Golden yellow
      p5.color(255, 167, 38, 40),   // Orange
      p5.color(255, 121, 63, 40),   // Coral
      p5.color(255, 71, 87, 40),    // Red
      p5.color(131, 255, 131, 40),  // Light green
      p5.color(87, 255, 87, 40),    // Green
      p5.color(156, 255, 255, 40),  // Cyan
      p5.color(87, 199, 255, 40),   // Sky blue
    ];

    // Create 150 flowers with enhanced colors and size
    for (let i = 0; i < 150; i++) {
      const radius = 0.1 + 1.2 * i;
      const x = p5.width / 2;
      const y = p5.height / 2;
      const roughness = i * 1;
      const angle = i * p5.random(90);
      const color = colorsPalette[p5.floor(p5.random(16))]; // Use enhanced 16-color palette

      flowersRef.current.push(
        new Flower(x, y, radius, roughness, angle, color, 2.5) // Apply 2.5x size scaling
      );
    }
  };

  const setup = (p5: P5Instance) => {
    p5.createCanvas(p5.windowWidth, p5.windowHeight);
    p5Ref.current = p5; // Store p5 instance for animation control
    initializeFlowers(p5);

    // Always start animation for continuous flower movement (like test.js)
    p5.loop(); // Start animation continuously
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
    p5.background(0, 0, 0, 25); // Very gentle fade for trail effect

    // Update all flowers with continuous wave movement (like test.js)
    flowersRef.current.forEach((flower) => {
      // Set emotion pattern with continuous updates (no resets)
      flower.setEmotionPattern(dominantEmotion, emotionIntensity, emotionColor.confidence);

      // Update flower position with wave movement
      flower.update(p5, timeRef.current);
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

    // Use temporal emotion color system like test.js
    const emotionColor = getTemporalEmotionColor(sentimentData, previousColorRef.current);

    const dominantEmotion = getDominantEmotion(sentimentData);

    // Update flower colors based on emotion with unique variations for each flower
    flowersRef.current.forEach((flower, index) => {
      const baseHue = EMOTION_HUES[dominantEmotion as keyof typeof EMOTION_HUES] || emotionColor.hue;

      // Gentle hue variations within emotion family for smooth transitions
      const hueVariation = (index * 3) % 20 - 10; // ±10 degrees for smoother transitions
      const hue = (baseHue + hueVariation + 360) % 360;

      // Smooth saturation transitions
      const saturation = emotionColor.saturation * 0.9;
      const brightness = emotionColor.brightness * 0.9;
      const alpha = emotionColor.alpha * 255 * 0.7;

      flower.color = p5.color(`hsb(${hue}, ${saturation}%, ${brightness}%, ${alpha})`);
    });
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

    p5.pop();
  };

  const windowResized = (p5: P5Instance) => {
    p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
    initializeFlowers(p5);
  };

  // Proper useP5 hook usage (like test.js)
  const { canvasRef, p5Instance } = useP5({
    setup,
    draw,
    windowResized
  });

  return (
    <div className="w-full h-full">
      <div ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default Flowers;