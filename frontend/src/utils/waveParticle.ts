/**
 * Wave Particle System for Continuous Movement
 * Extracted from working test.js implementation
 */

import { P5Instance } from '../hooks/useP5';

// Emotion hue mapping
export const EMOTION_HUES = {
  joy: 45,        // Yellow-Orange
  surprise: 30,   // Orange
  anger: 0,       // Red
  fear: 240,      // Blue
  sadness: 260,   // Purple-Blue
  disgust: 120,   // Green
} as const;

export type EmotionType = keyof typeof EMOTION_HUES;

// Wave Particle system for free-flowing movement across canvas
export class WaveParticle {
  x: number; // Current position X
  y: number; // Current position Y
  vx: number; // Velocity X
  vy: number; // Velocity Y
  baseSpeed: number; // Base movement speed
  waveAmplitude: number; // Wave amplitude
  waveFrequency: number; // Wave frequency
  confidenceMultiplier: number; // Confidence-based intensity
  emotion: EmotionType; // Current emotion

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
  setEmotionPattern(emotion: EmotionType, intensity: number, confidence: number) {
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