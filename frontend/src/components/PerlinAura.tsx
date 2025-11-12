import React, { useRef } from 'react';
import { SentimentData } from '../types';
import { useP5, P5Instance } from '../hooks/useP5';

interface PerlinAuraProps {
  sentimentData: SentimentData | null;
  isRecording: boolean;
}

const PerlinAura: React.FC<PerlinAuraProps> = ({ sentimentData, isRecording }) => {
  const timeRef = useRef(0);
  const particlesRef = useRef<Array<{
    x: number,
    y: number,
    vx: number,
    vy: number,
    life: number
  }>>([]);

  const setup = (p5: P5Instance, canvasContainer: Element) => {
    console.log('🎨 P5.js setup starting...');

    p5.createCanvas(p5.windowWidth, p5.windowHeight);
    console.log('🎨 Canvas created:', { width: p5.width, height: p5.height });

    // Initialize particles
    particlesRef.current = [];
    for (let i = 0; i < 100; i++) {
      particlesRef.current.push({
        x: p5.random(p5.width),
        y: p5.random(p5.height),
        vx: 0,
        vy: 0,
        life: p5.random()
      });
    }

    console.log('🎨 P5.js setup completed successfully');
  };

  const draw = (p5: P5Instance) => {
      timeRef.current += 0.01;

      // Get sentiment data with defaults
      const sentiment = sentimentData?.sentiment || 0;
      const sentimentLabel = sentimentData?.sentiment_label || 'neutral';
      const emotionScores = sentimentData?.emotion_scores || {
        joy: 0.2, sadness: 0.2, anger: 0.2, fear: 0.2, surprise: 0.1, disgust: 0.1
      };

      // Debug logging every 300 frames (~5 seconds)
      if (p5.frameCount % 300 === 0 && sentimentData) {
        console.log('🎨 Perlin visualization:', {
          sentiment,
          sentimentLabel,
          isRecording
        });
      }

      // Calculate energy and movement parameters
      const energy = Math.max(
        emotionScores.joy * 1.5,
        emotionScores.surprise * 2.0,
        emotionScores.anger * 1.2,
        emotionScores.fear * 0.8,
        emotionScores.sadness * 0.4
      );

      // Clear with fade effect
      p5.background(0, 5);

      // Map sentiment to color palette
      let baseHue: number;
      let saturation: number;
      let brightness: number;

      if (sentimentLabel === 'positive') {
        baseHue = 30 + sentiment * 30; // Orange to yellow
        saturation = 70 + emotionScores.joy * 30;
        brightness = 60 + emotionScores.joy * 40;
      } else if (sentimentLabel === 'negative') {
        baseHue = 240 + sentiment * 40; // Blue to purple
        saturation = 70 + Math.max(emotionScores.sadness, emotionScores.anger) * 30;
        brightness = 40 + Math.max(emotionScores.sadness, emotionScores.anger) * 40;
      } else {
        baseHue = 120 + sentiment * 60; // Green to cyan
        saturation = 40;
        brightness = 70;
      }

      // Dynamic noise parameters
      const noiseScale = 0.005 + energy * 0.015;
      const timeScale = 0.002 + energy * 0.008;

      // Create Perlin noise field visualization using p5.js noise()
      const resolution = 25;
      const cols = Math.floor(p5.width / resolution);
      const rows = Math.floor(p5.height / resolution);

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * resolution;
          const y = j * resolution;

          // Multi-octave Perlin noise using p5.js built-in noise()
          const noise1 = p5.noise(i * noiseScale, j * noiseScale, timeRef.current * timeScale);
          const noise2 = p5.noise(i * noiseScale * 2, j * noiseScale * 2, timeRef.current * timeScale * 1.5);
          const noise3 = p5.noise(i * noiseScale * 4, j * noiseScale * 4, timeRef.current * timeScale * 2);

          // Combine octaves
          const combinedNoise = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;

          // Map noise to visual properties
          const hueOffset = combinedNoise * 40 - 20;
          const finalHue = (baseHue + hueOffset + 360) % 360;
          const size = resolution * (0.3 + combinedNoise * 1.2);
          const alpha = isRecording ?
            10 + combinedNoise * energy * 50 :
            5 + combinedNoise * 10;

          // Draw noise field element
          p5.push();
          p5.colorMode(p5.HSB, 360, 100, 100, 100);
          p5.noStroke();
          p5.fill(finalHue, saturation, brightness, alpha);
          p5.circle(x, y, size);
          p5.pop();

          // Flow visualization with connecting lines
          if (i < cols - 1 && combinedNoise > 0.6 && isRecording) {
            const nextNoise = p5.noise((i + 1) * noiseScale, j * noiseScale, timeRef.current * timeScale);

            if (nextNoise > 0.6) {
              p5.push();
              p5.colorMode(p5.HSB, 360, 100, 100, 100);
              p5.stroke(finalHue, saturation, brightness, combinedNoise * 20);
              p5.strokeWeight(1 + energy * 2);
              p5.line(x, y, (i + 1) * resolution, y);
              p5.pop();
            }
          }
        }
      }

      // Update and draw particles
      if (isRecording) {
        particlesRef.current.forEach(particle => {
          // Update particle physics
          const noiseX = p5.noise(particle.x * noiseScale, particle.y * noiseScale, timeRef.current * timeScale);
          const noiseY = p5.noise(particle.x * noiseScale + 100, particle.y * noiseScale + 100, timeRef.current * timeScale);

          particle.vx += noiseX * energy * 0.5;
          particle.vy += noiseY * energy * 0.5;
          particle.vx *= 0.95; // Damping
          particle.vy *= 0.95;

          particle.x += particle.vx;
          particle.y += particle.vy;

          // Wrap around edges
          if (particle.x < 0) particle.x = p5.width;
          if (particle.x > p5.width) particle.x = 0;
          if (particle.y < 0) particle.y = p5.height;
          if (particle.y > p5.height) particle.y = 0;

          // Update life
          particle.life += 0.02;
          if (particle.life > 1) particle.life = 0;

          // Draw particle
          const particleSize = 2 + energy * 3 + particle.life * 2;
          const particleAlpha = 30 + particle.life * 40;

          p5.push();
          p5.colorMode(p5.HSB, 360, 100, 100, 100);
          p5.noStroke();
          p5.fill(baseHue, saturation, brightness, particleAlpha);
          p5.circle(particle.x, particle.y, particleSize);
          p5.pop();
        });
      }

      // Emotion-based overlay effects
      if (emotionScores.joy > 0.7 && isRecording) {
        // Sparkle effect for joy
        for (let i = 0; i < 3; i++) {
          const x = p5.random(p5.width);
          const y = p5.random(p5.height);
          const size = 1 + p5.random(3);

          p5.push();
          p5.colorMode(p5.HSB, 360, 100, 100, 100);
          p5.noStroke();
          p5.fill(60, 100, 100, 40 + p5.random(60));
          p5.circle(x, y, size);
          p5.pop();
        }
      }

      if (emotionScores.anger > 0.6 && isRecording) {
        // Jagged lightning effect for anger
        p5.push();
        p5.colorMode(p5.HSB, 360, 100, 100, 100);
        p5.stroke(0, 80, 60, 20 + emotionScores.anger * 30);
        p5.strokeWeight(1 + emotionScores.anger * 2);
        p5.noFill();

        p5.beginShape();
        let x = p5.random(p5.width);
        let y = 0;
        p5.vertex(x, y);

        for (let j = 0; j < 5; j++) {
          x += p5.random(-100, 100);
          y += p5.height / 5;
          p5.vertex(x, y);
        }
        p5.endShape();
        p5.pop();
      }

      // Recording indicator
      if (isRecording) {
        const pulseSize = 20 + p5.sin(timeRef.current * 5) * 10;
        const pulseAlpha = 60 + p5.sin(timeRef.current * 3) * 30;

        p5.push();
        p5.colorMode(p5.HSB, 360, 100, 100, 100);
        p5.translate(p5.width - 60, 60);

        // Outer ring
        p5.noFill();
        p5.stroke(baseHue, saturation, brightness, pulseAlpha);
        p5.strokeWeight(3);
        p5.circle(0, 0, pulseSize * 2);

        // Inner pulse
        p5.noStroke();
        p5.fill(baseHue, saturation, brightness, pulseAlpha);
        p5.circle(0, 0, 12);
        p5.pop();
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