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
  color: any;          // color of the blob

  constructor(radius: number, xpos: number, ypos: number, roughness: number, angle: number, color: any) {
    this.radius = radius;
    this.xpos = xpos;
    this.ypos = ypos;
    this.roughness = roughness;
    this.angle = angle;
    this.color = color;
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
}

const Flowers: React.FC<FlowersProps> = ({ sentimentData, isRecording, resetTrigger }) => {
  const flowersRef = useRef<Organic[]>([]);
  const lastSentimentRef = useRef<SentimentData | null>(null);
  const timeRef = useRef(0);
  const resetTriggerRef = useRef(0);

  // P5.js state sync mechanism - bridge React state to P5.js animation loop (like original PerlinAura)
  const sentimentDataRef = useRef(sentimentData);

  // Sync React props to P5.js context with enhanced debugging and validation
  useEffect(() => {
    // Debug logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log('Flowers: Sentiment data sync useEffect triggered:', {
        hasSentimentData: !!sentimentData,
        sentimentLabel: sentimentData?.sentiment_label,
        sentiment: sentimentData?.sentiment,
        confidence: sentimentData?.confidence,
        emotionScores: sentimentData?.emotion_scores,
        timestamp: Date.now()
      });
    }

    // Validate sentiment data structure
    if (sentimentData && typeof sentimentData === 'object') {
      // Ensure emotion_scores exists and is an object
      if (!sentimentData.emotion_scores || typeof sentimentData.emotion_scores !== 'object') {
        console.warn('Flowers: Invalid emotion_scores in sentiment data:', sentimentData.emotion_scores);
        // Add fallback emotion_scores
        sentimentData.emotion_scores = {
          joy: 0.4, sadness: 0.2, anger: 0.1, fear: 0.1, surprise: 0.3, disgust: 0.1
        };
      }
    }

    sentimentDataRef.current = sentimentData;
  }, [sentimentData]);

  const initializeFlowers = (p5: P5Instance) => {
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

    // Create 110 organics as in your flowers.js
    for (let i = 0; i < 110; i++) {
      const radius = 0.1 + 1 * i;
      const x = p5.width / 2;
      const y = p5.height / 2;
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
    initializeFlowers(p5);
  };

  const draw = (p5: P5Instance) => {
    // Background - soft purple tone matching your original code
    p5.background(232, 218, 239);

    timeRef.current += 0.01;

    // Use synced sentiment data from React context (like original PerlinAura)
    const currentSentimentData = sentimentDataRef.current;

    // Update flower colors based on sentiment data (continuous updates like original)
    if (currentSentimentData) {
      updateFlowerColors(p5, currentSentimentData);

      // Add emotion-specific effects similar to original PerlinAura
      if (isRecording && currentSentimentData.emotion_scores) {
        drawEmotionEffects(p5, currentSentimentData.emotion_scores);
      }
    }

    // Draw all flowers using the same logic as your flowers.js
    for (const flower of flowersRef.current) {
      flower.show(p5, timeRef.current);
    }

    // Add subtle recording indicator
    if (isRecording) {
      drawRecordingIndicator(p5);
    }
  };

  const updateFlowerColors = (p5: P5Instance, sentimentData: SentimentData) => {
    if (!sentimentData || !sentimentData.emotion_scores) return;

    const emotionColor = getTemporalEmotionColor(sentimentData);

    // Update flower colors based on emotion
    for (const flower of flowersRef.current) {
      const hue = emotionColor.hue;
      const saturation = emotionColor.saturation;
      const brightness = emotionColor.brightness;

      // Create P5 color from HSB values
      const alpha = 150 + sentimentData.confidence * 100; // 150-250
      flower.color = p5.color(`hsb(${hue}, ${saturation}%, ${brightness}%, ${alpha})`);
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
    const emotionColor = currentSentimentData ? getTemporalEmotionColor(currentSentimentData) : null;

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
    p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
    initializeFlowers(p5);
  };

  // Proper useP5 hook usage following the LinearDots pattern
  const { canvasRef, p5Instance } = useP5({
    setup,
    draw,
    windowResized
  });

  // Properly handle reset triggers using React patterns
  useEffect(() => {
    if (resetTrigger !== resetTriggerRef.current) {
      resetTriggerRef.current = resetTrigger;
      // Re-initialize flowers when reset is triggered
      if (p5Instance) {
        initializeFlowers(p5Instance);
      }
    }
  }, [resetTrigger, p5Instance]);

  return (
    <div className="w-full h-full">
      <div ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default Flowers;