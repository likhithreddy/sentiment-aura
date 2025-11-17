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

    // Update flower colors based on sentiment data
    if (sentimentData && sentimentData !== lastSentimentRef.current) {
      updateFlowerColors(p5, sentimentData);
      lastSentimentRef.current = sentimentData;
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

  const drawRecordingIndicator = (p5: P5Instance) => {
    p5.noFill();
    p5.stroke(255, 100, 100, 150);
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