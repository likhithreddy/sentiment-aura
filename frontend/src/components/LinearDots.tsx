import React, { useRef, useEffect } from 'react';
import { SentimentData } from '../types';
import { useP5, P5Instance } from '../hooks/useP5';
import { getDominantEmotion, getEmotionIntensity, getTemporalEmotionColor } from '../utils/emotionUtils';
import { WaveParticle, EMOTION_HUES, EmotionType } from '../utils/waveParticle';

interface LinearDotsProps {
  sentimentData: SentimentData | null;
  isRecording: boolean;
  resetTrigger?: number; // Trigger reset when this value changes
}

const LinearDots: React.FC<LinearDotsProps> = ({ sentimentData, isRecording, resetTrigger }) => {
  const timeRef = useRef(0);
  const particlesRef = useRef<WaveParticle[]>([]);
  const previousColorRef = useRef<{ hue: number; saturation: number; brightness: number } | null>(null);
  const p5Ref = useRef<P5Instance | null>(null);

  // P5.js state sync mechanism - bridge React state to P5.js animation loop (like test.js)
  const sentimentDataRef = useRef(sentimentData);

  // Sync React props to P5.js context
  useEffect(() => {
    sentimentDataRef.current = sentimentData;
  }, [sentimentData]);

  const setup = (p5: P5Instance, canvasContainer: Element) => {
    p5.createCanvas(p5.windowWidth, p5.windowHeight);
    p5Ref.current = p5; // Store p5 instance for animation control

    // Initialize wave particles randomly across entire canvas (like test.js)
    const numParticles = 300; // Optimized count for performance
    particlesRef.current = [];

    for (let i = 0; i < numParticles; i++) {
      particlesRef.current.push(new WaveParticle(
        p5.random(p5.width),
        p5.random(p5.height)
      ));
    }

    // Always start continuous animation (like test.js)
    p5.loop(); // Start animation continuously regardless of recording state
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

    const baseHue = emotionColor.hue;
    const particleAlpha = emotionColor.alpha * 100; // Convert to 0-100 range for P5

    // Get dominant emotion for motion dynamics (like test.js)
    const dominantEmotion = getDominantEmotion(emotionScores);
    const emotionIntensity = getEmotionIntensity(emotionScores);

    // Background with gentle fade (like test.js)
    p5.background(0, 0, 0, 25); // Very gentle fade for trail effect

    // Update and draw all particles with continuous wave movement (like test.js)
    particlesRef.current.forEach((particle, index) => {
      // Set emotion pattern with continuous updates (no resets)
      particle.setEmotionPattern(dominantEmotion, emotionIntensity, emotionColor.confidence);

      // Update particle position with wave movement (like test.js)
      particle.update(p5, timeRef.current, emotionIntensity);

      // Draw particle with emotion-specific color
      const hueVariation = (index * 2) % 10 - 5; // ±5 degrees variation for texture
      const hue = (baseHue + hueVariation + 360) % 360;
      particle.draw(p5, hue, particleAlpha, emotionColor.saturation, emotionColor.brightness);
    });

    // Add emotion-specific effects (like test.js)
    if (isRecording && hasValidEmotionData) {
      drawEmotionEffects(p5, emotionScores);
    }
  };

  const drawEmotionEffects = (p5: P5Instance, emotionScores: any) => {
    p5.push();
    p5.colorMode(p5.HSB, 360, 100, 100, 100);

    // Joy effect - bright particles (like test.js)
    if (emotionScores.joy > 0.6 && p5.frameCount % 5 === 0) {
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

    // Anger effect - sharp lines (like test.js)
    if (emotionScores.anger > 0.7 && p5.frameCount % 15 === 0) {
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

    // Fear effect - trembling particles (like test.js)
    if (emotionScores.fear > 0.6 && p5.frameCount % 8 === 0) {
      const fearIntensity = emotionScores.fear;
      const fearHue = EMOTION_HUES.fear;

      for (let i = 0; i < 2; i++) {
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

    // Sadness effect - falling droplets (like test.js)
    if (emotionScores.sadness > 0.7 && p5.frameCount % 20 === 0) {
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

    // Surprise effect - burst patterns (like test.js)
    if (emotionScores.surprise > 0.8 && p5.frameCount % 12 === 0) {
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

    // Disgust effect - disrupted, wavy patterns (like test.js)
    if (emotionScores.disgust > 0.6 && p5.frameCount % 18 === 0) {
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

  const windowResized = (p5: P5Instance) => {
    p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
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

export default LinearDots;