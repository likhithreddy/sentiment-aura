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

  
  // Wave effect state
  const waveOriginRef = useRef<{ x: number; y: number } | null>(null);
  const waveTimeRef = useRef(0);
  const previousEmotionRef = useRef<string>('');

  // P5.js state sync mechanism - bridge React state to P5.js animation loop
  const sentimentDataRef = useRef(sentimentData);

  // Sync React props to P5.js context
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

    
    // Normal background fade (reduced for longer line persistence)
    if (isRecording) {
      p5.background(0, 3);
    } else {
      p5.background(0, 1);
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
    // Store old dimensions for position scaling
    const oldWidth = p5.width;
    const oldHeight = p5.height;

    // Resize canvas
    p5.resizeCanvas(p5.windowWidth, p5.windowHeight);

    // Calculate scaling factors to preserve particle positions
    const scaleX = p5.width / oldWidth;
    const scaleY = p5.height / oldHeight;

    // Scale existing particle positions proportionally
    particlesRef.current.forEach((particle) => {
      particle.x *= scaleX;
      particle.y *= scaleY;
    });
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