// Core types for the visualization engine

export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface Viewport {
  width: number;
  height: number;
  pixelRatio: number;
}

export interface VizEngineConfig {
  container: HTMLElement;
  width: number;
  height: number;
  pixelRatio?: number;
  antialias?: boolean;
  backgroundColor?: string;
}

export interface ChartData {
  columns: string[];
  values: number[][];
  encodings: Encodings;
}

export interface Encodings {
  x: string;
  y: string;
  color?: string;
  size?: string;
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface ShaderProgram {
  program: WebGLProgram;
  attributes: Map<string, number>;
  uniforms: Map<string, WebGLUniformLocation | null>;
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  drawCalls: number;
  vertexCount: number;
}

export interface InteractionState {
  isMouseDown: boolean;
  isPanning: boolean;
  mousePos: Point;
  lastMousePos: Point;
  zoom: number;
  pan: Point;
}

export enum ChartType {
  Bar = 'bar',
  Line = 'line',
  Scatter = 'scatter',
  HeatMap = 'heatmap',
}

// Matrix type (4x4 for 3D transformations)
export type Mat4 = Float32Array;

// WebGL Buffer info
export interface BufferInfo {
  buffer: WebGLBuffer;
  size: number;
  usage: number;
  type: number;
}


