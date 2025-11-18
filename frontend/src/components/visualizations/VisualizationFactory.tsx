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
    // Error handling without console output
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

// Enhanced Registry for future visualization components with search and discovery capabilities
export class VisualizationRegistry {
  private static components: Map<VisualizationType, React.ComponentType<any>> = new Map();
  private static metadata: Map<VisualizationType, { name: string; description: string; category: string }> = new Map();

  static register(type: VisualizationType, component: React.ComponentType<any>, metadata?: { name: string; description: string; category: string }): void {
    this.components.set(type, component);
    if (metadata) {
      this.metadata.set(type, metadata);
    }
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

  static getAllWithMetadata(): Array<{ type: VisualizationType; component: React.ComponentType<any>; metadata?: { name: string; description: string; category: string } }> {
    const results: Array<{ type: VisualizationType; component: React.ComponentType<any>; metadata?: { name: string; description: string; category: string } }> = [];

    for (const [type, component] of this.components.entries()) {
      results.push({
        type,
        component,
        metadata: this.metadata.get(type)
      });
    }

    return results;
  }

  static search(query: string): Array<{ type: VisualizationType; component: React.ComponentType<any>; metadata?: { name: string; description: string; category: string } }> {
    const lowerQuery = query.toLowerCase();
    const results: Array<{ type: VisualizationType; component: React.ComponentType<any>; metadata?: { name: string; description: string; category: string } }> = [];

    for (const [type, component] of this.components.entries()) {
      const metadata = this.metadata.get(type);
      const typeString = type.toLowerCase();
      const nameMatch = metadata?.name.toLowerCase().includes(lowerQuery);
      const descMatch = metadata?.description.toLowerCase().includes(lowerQuery);
      const categoryMatch = metadata?.category.toLowerCase().includes(lowerQuery);
      const typeMatch = typeString.includes(lowerQuery);

      if (nameMatch || descMatch || categoryMatch || typeMatch) {
        results.push({ type, component, metadata });
      }
    }

    return results;
  }

  static findByCategory(category: string): Array<{ type: VisualizationType; component: React.ComponentType<any>; metadata?: { name: string; description: string; category: string } }> {
    const lowerCategory = category.toLowerCase();
    const results: Array<{ type: VisualizationType; component: React.ComponentType<any>; metadata?: { name: string; description: string; category: string } }> = [];

    for (const [type, component] of this.components.entries()) {
      const metadata = this.metadata.get(type);
      if (metadata?.category.toLowerCase() === lowerCategory) {
        results.push({ type, component, metadata });
      }
    }

    return results;
  }

  static getMetadata(type: VisualizationType): { name: string; description: string; category: string } | undefined {
    return this.metadata.get(type);
  }
}

// Register the visualization components with enhanced metadata for search and discovery
VisualizationRegistry.register(
  VisualizationType.LINEAR_DOTS,
  LinearDots as React.ComponentType<any>,
  {
    name: "Linear Dots",
    description: "Wave-based particle visualization with emotion-responsive movement patterns and temporal color evolution",
    category: "particles"
  }
);

VisualizationRegistry.register(
  VisualizationType.FLOWERS,
  Flowers as React.ComponentType<any>,
  {
    name: "Flowers",
    description: "Organic flower shapes with continuous drift and smooth emotion-based color transitions",
    category: "organic"
  }
);