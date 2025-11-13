import React, { useRef } from 'react';
import { SentimentData } from '../types';
import { useP5, P5Instance } from '../hooks/useP5';

interface PerlinAuraProps {
  sentimentData: SentimentData | null;
  isRecording: boolean;
}

// Flow Field Particle class
class FlowParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  prevX: number;
  prevY: number;
  maxSpeed: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.prevX = x;
    this.prevY = y;
    this.maxSpeed = 2;
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
    this.x += this.vx;
    this.y += this.vy;

    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > this.maxSpeed) {
      this.vx = (this.vx / speed) * this.maxSpeed;
      this.vy = (this.vy / speed) * this.maxSpeed;
    }

    // Limit acceleration
    this.vx *= 0.95;
    this.vy *= 0.95;
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

  draw(p5: P5Instance, hue: number, alpha: number) {
    p5.push();
    p5.colorMode(p5.HSB, 360, 100, 100, 100);
    p5.stroke(hue, 70, 90, alpha);
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

  const setup = (p5: P5Instance, canvasContainer: Element) => {
    console.log('🎨 Flow field setup starting...');

    p5.createCanvas(p5.windowWidth, p5.windowHeight);
    console.log('🎨 Canvas created:', { width: p5.width, height: p5.height });

    // Initialize flow field particles
    const numParticles = 500;
    particlesRef.current = [];
    for (let i = 0; i < numParticles; i++) {
      particlesRef.current.push(new FlowParticle(
        p5.random(p5.width),
        p5.random(p5.height)
      ));
    }

    console.log('🎨 Flow field setup completed successfully');
  };

  const draw = (p5: P5Instance) => {
    timeRef.current += 0.005;

    // Get sentiment data with defaults
    const sentiment = sentimentData?.sentiment || 0;
    const sentimentLabel = sentimentData?.sentiment_label || 'neutral';
    const emotionScores = sentimentData?.emotion_scores || {
      joy: 0.2, sadness: 0.2, anger: 0.2, fear: 0.2, surprise: 0.1, disgust: 0.1
    };

    // Calculate energy and chaos based on emotions
    const energy = Math.max(
      emotionScores.joy * 2.0,
      emotionScores.surprise * 1.8,
      emotionScores.anger * 1.5,
      emotionScores.fear * 1.0,
      emotionScores.sadness * 0.5
    );

    // Map sentiment to color palette
    let baseHue: number;
    if (sentimentLabel === 'positive') {
      baseHue = 30 + sentiment * 30; // Orange to yellow
    } else if (sentimentLabel === 'negative') {
      baseHue = 240 + sentiment * 40; // Blue to purple
    } else {
      baseHue = 120 + sentiment * 60; // Green to cyan
    }

    // Flow field setup
    const scale = 20;
    const cols = Math.floor(p5.width / scale);
    const rows = Math.floor(p5.height / scale);
    let zoff = timeRef.current;
    const increment = 0.1 + energy * 0.05;

    // Clear background with fade effect
    if (isRecording) {
      p5.background(0, 10);
    } else {
      p5.background(0, 25);
    }

    // Generate flow field
    let yoff = 0;
    flowFieldRef.current = [];
    for (let y = 0; y < rows; y++) {
      let xoff = 0;
      flowFieldRef.current[y] = [];
      for (let x = 0; x < cols; x++) {
        const angle = p5.noise(xoff, yoff, zoff) * p5.TWO_PI * 2;
        const v = p5.createVector(p5.cos(angle), p5.sin(angle));
        flowFieldRef.current[y][x] = [v.x, v.y];
        xoff += increment;
      }
      yoff += increment;
    }

    // Update and draw particles
    const particleAlpha = isRecording ? 30 + energy * 20 : 15;

    particlesRef.current.forEach(particle => {
      particle.follow(flowFieldRef.current, cols, rows, scale);
      particle.update();
      particle.edges(p5.width, p5.height);

      if (isRecording || p5.frameCount % 3 === 0) {
        particle.draw(p5, baseHue, particleAlpha);
      }
    });

    // Recording indicator (minimal, no emoji)
    if (isRecording) {
      const pulseAlpha = 50 + p5.sin(timeRef.current * 4) * 30;
      const pulseSize = 8 + p5.sin(timeRef.current * 4) * 3;

      p5.push();
      p5.colorMode(p5.HSB, 360, 100, 100, 100);
      p5.translate(p5.width - 40, 40);

      // Simple circle indicator
      p5.noStroke();
      p5.fill(baseHue, 60, 90, pulseAlpha);
      p5.circle(0, 0, pulseSize);
      p5.pop();
    }

    // Special effects based on emotions (only when recording)
    if (isRecording) {
      // Joy effect - occasional bright particles
      if (emotionScores.joy > 0.6 && p5.frameCount % 10 === 0) {
        for (let i = 0; i < 2; i++) {
          const x = p5.random(p5.width);
          const y = p5.random(p5.height);
          p5.push();
          p5.colorMode(p5.HSB, 360, 100, 100, 100);
          p5.noStroke();
          p5.fill(45, 100, 95, 30 + p5.random(40));
          p5.circle(x, y, 1 + p5.random(2));
          p5.pop();
        }
      }

      // Anger effect - occasional sharp lines
      if (emotionScores.anger > 0.7 && p5.frameCount % 30 === 0) {
        p5.push();
        p5.colorMode(p5.HSB, 360, 100, 100, 100);
        p5.stroke(0, 70, 70, 15);
        p5.strokeWeight(1);
        p5.noFill();
        p5.beginShape();
        let x = p5.random(p5.width);
        let y = 0;
        p5.vertex(x, y);
        for (let j = 0; j < 3; j++) {
          x += p5.random(-50, 50);
          y += p5.height / 3;
          p5.vertex(x, y);
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