import React, { useRef, useEffect, useCallback, useState } from 'react';
import { clsx } from 'clsx';
import { VizEngine } from '../../viz-engine/VizEngine';
import { ScatterPlot } from '../../viz-engine/charts/ScatterPlot';
import { BarChart } from '../../viz-engine/charts/BarChart';
import { LineChart } from '../../viz-engine/charts/LineChart';
import { HeatMap } from '../../viz-engine/charts/HeatMap';
import { ChartData } from '../../viz-engine/types';
import { ChartType, ChartConfig } from '../../store/chartStore';
import { useUIStore } from '../../store';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorBoundary';

export interface ChartContainerProps {
  config: ChartConfig;
  data: ChartData;
  className?: string;
  onError?: (error: Error) => void;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  config,
  data,
  className,
  onError,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<VizEngine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { updatePerformanceMetrics } = useUIStore();

  // Initialize visualization engine
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    try {
      const engine = new VizEngine({
        container,
        width: rect.width || 800,
        height: rect.height || 400,
        pixelRatio: window.devicePixelRatio,
        antialias: true,
        backgroundColor: '#1a1a2e',
      });

      engineRef.current = engine;

      engine.initialize().then(() => {
        setIsLoading(false);
        engine.start();
      }).catch((err) => {
        setError(err.message);
        onError?.(err);
      });

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize chart';
      setError(message);
      onError?.(err instanceof Error ? err : new Error(message));
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, [onError]);

  // Update chart when config or data changes
  useEffect(() => {
    if (!engineRef.current || isLoading || error) return;

    const engine = engineRef.current;

    try {
      // Remove existing chart
      engine.removeChart('main');

      // Create new chart based on type
      let chart;
      switch (config.type) {
        case 'scatter':
          chart = new ScatterPlot(data);
          break;
        case 'bar':
          chart = new BarChart(data);
          break;
        case 'line':
          chart = new LineChart(data);
          break;
        case 'heatmap':
          chart = new HeatMap(data);
          break;
        default:
          throw new Error(`Unknown chart type: ${config.type}`);
      }

      engine.addChart('main', chart);
      engine.fitToData();

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create chart';
      setError(message);
      onError?.(err instanceof Error ? err : new Error(message));
    }
  }, [config.type, data, isLoading, error, onError]);

  // Handle resize
  useEffect(() => {
    if (!containerRef.current || !engineRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          engineRef.current?.resize(width, height);
        }
      }
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  // Update performance metrics
  useEffect(() => {
    if (!engineRef.current) return;

    const interval = setInterval(() => {
      const metrics = engineRef.current?.getMetrics();
      if (metrics) {
        updatePerformanceMetrics({
          fps: metrics.fps,
          frameTime: metrics.frameTime,
          drawCalls: metrics.drawCalls,
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [updatePerformanceMetrics]);

  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    // Re-trigger initialization by unmounting/remounting
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={clsx(
        'relative w-full h-full min-h-[300px] rounded-lg overflow-hidden bg-card',
        className
      )}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm z-10">
          <LoadingSpinner size="lg" label="Initializing chart..." />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-card z-10">
          <ErrorMessage
            title="Chart Error"
            message={error}
            onRetry={handleRetry}
          />
        </div>
      )}

      {/* Chart title overlay */}
      {config.title && !isLoading && !error && (
        <div className="absolute top-4 left-4 z-10">
          <h3 className="text-sm font-medium text-foreground/80 bg-card/60 backdrop-blur-sm px-2 py-1 rounded">
            {config.title}
          </h3>
        </div>
      )}

      {/* WebGL canvas will be rendered here by VizEngine */}
    </div>
  );
};

