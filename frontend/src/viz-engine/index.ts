// Main exports for the visualization engine

export { VizEngine } from './VizEngine';
export { CanvasManager } from './CanvasManager';
export { Renderer } from './Renderer';
export { Camera } from './Camera';
export { InteractionHandler } from './InteractionHandler';
export { PerformanceMonitor } from './PerformanceMonitor';

// Chart primitives
export { ChartPrimitive } from './charts/ChartPrimitive';
export { BarChart } from './charts/BarChart';
export { LineChart } from './charts/LineChart';
export { ScatterPlot } from './charts/ScatterPlot';

// Types
export type {
  Point,
  BoundingBox,
  Viewport,
  VizEngineConfig,
  ChartData,
  Encodings,
  Color,
  ShaderProgram,
  PerformanceMetrics,
  InteractionState,
  Mat4,
  BufferInfo,
} from './types';

export { ChartType } from './types';

// Utilities
export { Matrix } from './utils/matrix';

