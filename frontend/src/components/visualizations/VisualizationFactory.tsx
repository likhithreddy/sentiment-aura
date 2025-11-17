/**
 * Visualization Factory for Sentiment Aura
 * Factory pattern for creating and managing different visualization types
 */

import React, { Suspense, lazy } from 'react';
import { VisualizationType, VisualizationProps, VisualizationRendererProps } from '../../types/visualizations';

// Lazy loading for performance optimization
const LinearDots = lazy(() => import('../../components/LinearDots'));
const Flowers = lazy(() => import('./Flowers'));

// Loading fallback component
const VisualizationLoader: React.FC = () => (
  <div className="flex items-center justify-center w-full h-full bg-black/20">
    <div className="text-white/60 text-sm font-montserrat">Loading visualization...</div>
  </div>
);

// Error fallback component
const VisualizationError: React.FC<{ error: Error }> = ({ error }) => (
  <div className="flex items-center justify-center w-full h-full bg-red-900/20 border border-red-500/30 rounded-xl">
    <div className="text-red-200 text-sm font-montserrat text-center p-4">
      <div className="font-semibold mb-2">Visualization Error</div>
      <div className="text-xs opacity-80">{error.message}</div>
    </div>
</div>
);

// Main visualization renderer component
export const VisualizationRenderer: React.FC<VisualizationRendererProps> = ({
  type,
  sentimentData,
  isRecording,
  resetTrigger
}) => {
  // Create a stable key that changes when sentiment data changes to force re-rendering
  const sentimentKey = sentimentData
    ? `${sentimentData.sentiment || 0}-${sentimentData.sentiment_label || 'neutral'}-${sentimentData.confidence || 0}-${JSON.stringify(sentimentData.emotion_scores || {}).slice(0, 50)}`
    : 'no-sentiment';

  const renderVisualization = () => {
    switch (type) {
      case VisualizationType.LINEAR_DOTS:
        return (
          <LinearDots
            key={`${type}-${sentimentKey}-${resetTrigger}`}
            sentimentData={sentimentData}
            isRecording={isRecording}
            resetTrigger={resetTrigger}
          />
        );

      case VisualizationType.FLOWERS:
        return (
          <Flowers
            key={`${type}-${sentimentKey}-${resetTrigger}`}
            sentimentData={sentimentData}
            isRecording={isRecording}
            resetTrigger={resetTrigger}
          />
        );

      default:
        // Future visualizations will be added here
        return (
          <div className="flex items-center justify-center w-full h-full">
            <div className="text-white/40 text-sm font-montserrat">
              Visualization "{type}" not yet implemented
            </div>
          </div>
        );
    }
  };

  // Debug logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log('VisualizationRenderer: Sentiment data changed:', {
      type,
      hasSentimentData: !!sentimentData,
      sentimentLabel: sentimentData?.sentiment_label,
      sentiment: sentimentData?.sentiment,
      confidence: sentimentData?.confidence,
      emotionScores: sentimentData?.emotion_scores
    });
  }

  return (
    <div className="w-full h-full">
      <Suspense fallback={<VisualizationLoader />}>
        {renderVisualization()}
      </Suspense>
    </div>
  );
};

// Utility function to create visualization with error boundary
export const createVisualization = (
  type: VisualizationType,
  props: VisualizationProps
): React.ReactElement => {
  const VisualizationComponent = () => {
    try {
      switch (type) {
        case VisualizationType.LINEAR_DOTS:
          return (
            <LinearDots
              sentimentData={props.sentimentData}
              isRecording={props.isRecording}
              resetTrigger={props.resetTrigger}
            />
          );

        case VisualizationType.FLOWERS:
          return (
            <Flowers
              sentimentData={props.sentimentData}
              isRecording={props.isRecording}
              resetTrigger={props.resetTrigger}
            />
          );

        default:
          return (
            <div className="flex items-center justify-center w-full h-full">
              <div className="text-white/40 text-sm font-montserrat text-center">
                <div className="font-semibold mb-2">Coming Soon</div>
                <div>Visualization "{type}" is not yet available</div>
              </div>
            </div>
          );
      }
    } catch (error) {
      console.error(`Error creating visualization ${type}:`, error);
      return <VisualizationError error={error as Error} />;
    }
  };

  return (
    <Suspense fallback={<VisualizationLoader />}>
      <VisualizationComponent />
    </Suspense>
  );
};

// Error boundary class for visualizations
export class VisualizationErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Visualization Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <VisualizationError error={this.state.error || new Error('Unknown error')} />
        )
      );
    }

    return this.props.children;
  }
}

// Wrapper component with error boundary
export const SafeVisualizationRenderer: React.FC<VisualizationRendererProps> = (props) => {
  return (
    <VisualizationErrorBoundary>
      <VisualizationRenderer {...props} />
    </VisualizationErrorBoundary>
  );
};

// Registry for future visualization components
export class VisualizationRegistry {
  private static components: Map<VisualizationType, React.ComponentType<any>> = new Map();

  static register(type: VisualizationType, component: React.ComponentType<any>): void {
    this.components.set(type, component);
  }

  static get(type: VisualizationType): React.ComponentType<any> | null {
    return this.components.get(type) || null;
  }

  static has(type: VisualizationType): boolean {
    return this.components.has(type);
  }

  static getAll(): Map<VisualizationType, React.ComponentType<any>> {
    return new Map(this.components);
  }
}

// Register the visualization components
VisualizationRegistry.register(VisualizationType.LINEAR_DOTS, LinearDots as React.ComponentType<any>);
VisualizationRegistry.register(VisualizationType.FLOWERS, Flowers as React.ComponentType<any>);