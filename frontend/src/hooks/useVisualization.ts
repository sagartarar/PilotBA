import { useCallback, useRef, useState, useEffect } from 'react';
import { VizEngine } from '../viz-engine/VizEngine';
import { VizEngineConfig, ChartData, PerformanceMetrics } from '../viz-engine/types';
import { ScatterPlot } from '../viz-engine/charts/ScatterPlot';
import { BarChart } from '../viz-engine/charts/BarChart';
import { LineChart } from '../viz-engine/charts/LineChart';
import { HeatMap } from '../viz-engine/charts/HeatMap';
import { ChartPrimitive } from '../viz-engine/charts/ChartPrimitive';
import { ChartType } from '../store/chartStore';

export interface UseVisualizationOptions {
  autoStart?: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export interface UseVisualizationReturn {
  engine: VizEngine | null;
  isInitialized: boolean;
  error: string | null;
  initEngine: (container: HTMLElement, config?: Partial<VizEngineConfig>) => Promise<void>;
  addChart: (id: string, type: ChartType, data: ChartData) => void;
  updateChart: (id: string, data: ChartData) => void;
  removeChart: (id: string) => void;
  fitToData: () => void;
  start: () => void;
  stop: () => void;
  destroy: () => void;
  getMetrics: () => PerformanceMetrics | null;
}

function createChart(type: ChartType, data: ChartData): ChartPrimitive {
  switch (type) {
    case 'scatter':
      return new ScatterPlot(data);
    case 'bar':
      return new BarChart(data);
    case 'line':
      return new LineChart(data);
    case 'heatmap':
      return new HeatMap(data);
    default:
      throw new Error(`Unknown chart type: ${type}`);
  }
}

export function useVisualization(options: UseVisualizationOptions = {}): UseVisualizationReturn {
  const { autoStart = true, onMetricsUpdate } = options;
  const engineRef = useRef<VizEngine | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, []);

  // Metrics update interval
  useEffect(() => {
    if (!isInitialized || !onMetricsUpdate) return;

    const interval = setInterval(() => {
      const metrics = engineRef.current?.getMetrics();
      if (metrics) {
        onMetricsUpdate(metrics);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isInitialized, onMetricsUpdate]);

  const initEngine = useCallback(
    async (container: HTMLElement, config?: Partial<VizEngineConfig>) => {
      if (engineRef.current) {
        engineRef.current.destroy();
      }

      setError(null);
      setIsInitialized(false);

      try {
        const rect = container.getBoundingClientRect();
        const engine = new VizEngine({
          container,
          width: rect.width || 800,
          height: rect.height || 400,
          pixelRatio: window.devicePixelRatio,
          antialias: true,
          backgroundColor: '#0f172a',
          ...config,
        });

        await engine.initialize();
        engineRef.current = engine;
        setIsInitialized(true);

        if (autoStart) {
          engine.start();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize visualization';
        setError(message);
        throw err;
      }
    },
    [autoStart]
  );

  const addChart = useCallback((id: string, type: ChartType, data: ChartData) => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    const chart = createChart(type, data);
    engineRef.current.addChart(id, chart);
  }, []);

  const updateChart = useCallback((id: string, data: ChartData) => {
    if (!engineRef.current) return;

    const chart = engineRef.current.getChart(id);
    if (chart) {
      chart.setData(data);
    }
  }, []);

  const removeChart = useCallback((id: string) => {
    if (!engineRef.current) return;
    engineRef.current.removeChart(id);
  }, []);

  const fitToData = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.fitToData();
  }, []);

  const start = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.start();
  }, []);

  const stop = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.stop();
  }, []);

  const destroy = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
      setIsInitialized(false);
    }
  }, []);

  const getMetrics = useCallback((): PerformanceMetrics | null => {
    return engineRef.current?.getMetrics() ?? null;
  }, []);

  return {
    engine: engineRef.current,
    isInitialized,
    error,
    initEngine,
    addChart,
    updateChart,
    removeChart,
    fitToData,
    start,
    stop,
    destroy,
    getMetrics,
  };
}

