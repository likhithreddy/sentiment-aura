/**
 * Visualization Type Definitions for Sentiment Aura
 * Defines interfaces for multiple visualization types and factory pattern
 */

import { SentimentData } from './index';

// Enum for all available visualization types
export enum VisualizationType {
  LINEAR_DOTS = 'linearDots',
  FLOWERS = 'flowers',
  // Future visualizations will be added here
  // WAVE_FIELD = 'waveField',
  // PARTICLE_SYSTEM = 'particleSystem',
  // FRACTAL_TREES = 'fractalTrees',
}

// Base interface for all visualization components
export interface VisualizationProps {
  sentimentData: SentimentData | null;
  isRecording: boolean;
  resetTrigger?: number;
  onVisualizationChange?: (type: VisualizationType) => void;
}

// Configuration for visualization metadata
export interface VisualizationConfig {
  type: VisualizationType;
  name: string;
  description: string;
  icon?: string;
  category: 'generative' | 'reactive' | 'analytical';
  complexity: 'simple' | 'moderate' | 'complex';
  performance: 'light' | 'moderate' | 'intensive';
}

// Registry of all available visualizations
export const VISUALIZATION_REGISTRY: Record<VisualizationType, VisualizationConfig> = {
  [VisualizationType.LINEAR_DOTS]: {
    type: VisualizationType.LINEAR_DOTS,
    name: 'Linear Dots',
    description: 'Emotional particle field with wave dynamics',
    category: 'generative',
    complexity: 'moderate',
    performance: 'intensive'
  },
  [VisualizationType.FLOWERS]: {
    type: VisualizationType.FLOWERS,
    name: 'Flowers',
    description: 'Organic flower shapes that respond to emotions',
    category: 'generative',
    complexity: 'moderate',
    performance: 'moderate'
  },
  // Future visualizations will be registered here
};

// Factory function type for creating visualization components
export type VisualizationFactory = (props: VisualizationProps) => React.ReactElement;

// Registry for visualization factory functions
export const visualizationFactories: Map<VisualizationType, VisualizationFactory> = new Map();

// Utility function to register a visualization
export function registerVisualization(
  type: VisualizationType,
  factory: VisualizationFactory
): void {
  visualizationFactories.set(type, factory);
}

// Utility function to get available visualizations
export function getAvailableVisualizations(): VisualizationConfig[] {
  return Object.values(VISUALIZATION_REGISTRY);
}

// Utility function to get visualization config
export function getVisualizationConfig(type: VisualizationType): VisualizationConfig | null {
  return VISUALIZATION_REGISTRY[type] || null;
}

// Props for the visualization selector component
export interface VisualizationSelectorProps {
  currentType: VisualizationType;
  onTypeChange: (type: VisualizationType) => void;
  disabled?: boolean;
}

// Props for the main visualization renderer
export interface VisualizationRendererProps {
  type: VisualizationType;
  sentimentData: SentimentData | null;
  isRecording: boolean;
  resetTrigger?: number;
}

// Hook return type for visualization management
export interface UseVisualizationReturn {
  currentType: VisualizationType;
  setType: (type: VisualizationType) => void;
  availableVisualizations: VisualizationConfig[];
  currentConfig: VisualizationConfig | null;
}