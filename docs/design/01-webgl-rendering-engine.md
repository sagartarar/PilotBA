# WebGL Rendering Engine - Low-Level Design

## Overview

The WebGL Rendering Engine is the core visualization component that enables PilotBA to render millions of data points at 60 FPS. This document outlines the architecture, algorithms, and implementation details.

## Performance Requirements

| Metric | Target | Rationale |
|--------|--------|-----------|
| Frame Rate | 60 FPS (16.67ms/frame) | Smooth, responsive interactions |
| Data Points | 10M points | Handle large datasets without degradation |
| Initial Render | < 200ms | Fast first paint |
| Interaction Latency | < 50ms | Responsive zoom/pan/hover |
| Memory Usage | < 500MB for 10M points | Browser stability |

## Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                    VizEngine (Main)                         │
├─────────────────────────────────────────────────────────────┤
│  - Initialization & Lifecycle Management                    │
│  - Coordinate System Setup                                  │
│  - Animation Loop Controller                                │
└─────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Canvas     │  │   Renderer   │  │  Interaction │
│   Manager    │  │   Pipeline   │  │   Handler    │
├──────────────┤  ├──────────────┤  ├──────────────┤
│ - WebGL2     │  │ - Shaders    │  │ - Mouse      │
│   Context    │  │ - Buffers    │  │ - Touch      │
│ - Viewport   │  │ - Draw calls │  │ - Zoom/Pan   │
│ - Resize     │  │ - Batching   │  │ - Hover      │
└──────────────┘  └──────────────┘  └──────────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           ▼
              ┌─────────────────────────┐
              │   Chart Primitives      │
              ├─────────────────────────┤
              │ - BarChart              │
              │ - LineChart             │
              │ - ScatterPlot           │
              │ - HeatMap               │
              └─────────────────────────┘
```

## Core Classes

### 1. VizEngine

**Responsibility:** Main orchestrator for all visualization operations.

```typescript
interface VizEngineConfig {
  container: HTMLElement;
  width: number;
  height: number;
  pixelRatio?: number;
  antialias?: boolean;
}

class VizEngine {
  private canvas: CanvasManager;
  private renderer: Renderer;
  private interaction: InteractionHandler;
  private charts: Map<string, ChartPrimitive>;
  private animationId: number | null;
  
  constructor(config: VizEngineConfig);
  
  // Lifecycle
  initialize(): Promise<void>;
  render(): void;
  destroy(): void;
  
  // Chart management
  addChart(id: string, chart: ChartPrimitive): void;
  removeChart(id: string): void;
  updateChart(id: string, data: ChartData): void;
  
  // Animation loop
  private startAnimationLoop(): void;
  private stopAnimationLoop(): void;
  private tick(timestamp: number): void;
}
```

**Key Algorithms:**

1. **Animation Loop (60 FPS target):**
```typescript
private tick(timestamp: number): void {
  const deltaTime = timestamp - this.lastTimestamp;
  
  // Skip frame if too fast (> 60 FPS)
  if (deltaTime < 16.67) {
    this.animationId = requestAnimationFrame(this.tick.bind(this));
    return;
  }
  
  // Update phase
  this.interaction.update();
  this.charts.forEach(chart => chart.update(deltaTime));
  
  // Render phase
  this.renderer.clear();
  this.charts.forEach(chart => this.renderer.draw(chart));
  
  this.lastTimestamp = timestamp;
  this.animationId = requestAnimationFrame(this.tick.bind(this));
}
```

### 2. CanvasManager

**Responsibility:** Manages WebGL2 context and canvas operations.

```typescript
class CanvasManager {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private pixelRatio: number;
  
  constructor(container: HTMLElement, config: CanvasConfig);
  
  getContext(): WebGL2RenderingContext;
  resize(width: number, height: number): void;
  getViewport(): Viewport;
  
  private setupWebGL(): void;
  private handleResize(): void;
}
```

**WebGL2 Context Setup:**
```typescript
private setupWebGL(): void {
  const gl = this.canvas.getContext('webgl2', {
    alpha: false,
    antialias: true,
    depth: true,
    powerPreference: 'high-performance',
    desynchronized: true, // Reduces input latency
  });
  
  if (!gl) {
    throw new Error('WebGL2 not supported');
  }
  
  // Enable features
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  
  this.gl = gl;
}
```

### 3. Renderer

**Responsibility:** Executes draw calls using WebGL2.

```typescript
interface ShaderProgram {
  program: WebGLProgram;
  attributes: Map<string, number>;
  uniforms: Map<string, WebGLUniformLocation>;
}

class Renderer {
  private gl: WebGL2RenderingContext;
  private shaders: Map<string, ShaderProgram>;
  private buffers: Map<string, BufferPool>;
  
  constructor(gl: WebGL2RenderingContext);
  
  // Shader management
  compileShader(name: string, vertex: string, fragment: string): void;
  useShader(name: string): ShaderProgram;
  
  // Buffer management
  createBuffer(name: string, data: Float32Array, usage: number): void;
  updateBuffer(name: string, data: Float32Array): void;
  
  // Drawing
  clear(): void;
  draw(chart: ChartPrimitive): void;
  drawInstanced(chart: ChartPrimitive, instanceCount: number): void;
}
```

**Draw Call Optimization:**
```typescript
// Use instanced rendering for repeated geometry (e.g., scatter points)
drawInstanced(chart: ChartPrimitive, instanceCount: number): void {
  const shader = this.useShader(chart.shaderName);
  
  // Bind geometry buffer (single point quad)
  this.bindBuffer(chart.geometryBuffer);
  
  // Bind instance data buffer (positions, colors, sizes)
  this.bindBuffer(chart.instanceBuffer, 1); // divisor = 1
  
  // Single draw call for all instances
  this.gl.drawArraysInstanced(
    this.gl.TRIANGLE_STRIP,
    0,
    4, // vertices per instance (quad)
    instanceCount
  );
}
```

### 4. ChartPrimitive (Abstract Base)

**Responsibility:** Base class for all chart types.

```typescript
interface ChartData {
  columns: string[];
  values: Float32Array | number[][];
  encodings: Encodings;
}

interface Encodings {
  x: string;  // column name
  y: string;
  color?: string;
  size?: string;
}

abstract class ChartPrimitive {
  protected data: ChartData;
  protected shaderName: string;
  protected geometryBuffer: WebGLBuffer;
  protected instanceBuffer: WebGLBuffer;
  protected isDirty: boolean;
  
  constructor(data: ChartData);
  
  abstract initialize(renderer: Renderer): void;
  abstract update(deltaTime: number): void;
  abstract prepareBuffers(): Float32Array;
  
  setData(data: ChartData): void;
  getBounds(): BoundingBox;
}
```

## Chart Implementations

### BarChart

**Data Structure:**
```typescript
// Each bar: [x, y, width, height, colorR, colorG, colorB, alpha]
// Layout: vec4 position (x, y, width, height) + vec4 color
const bufferLayout = new Float32Array(barCount * 8);
```

**Vertex Shader:**
```glsl
#version 300 es
precision highp float;

// Geometry (unit quad: 0,0 -> 1,1)
in vec2 a_position;

// Instance data
in vec4 a_barRect;    // x, y, width, height
in vec4 a_barColor;   // r, g, b, a

// Uniforms
uniform mat4 u_projection;
uniform mat4 u_view;

out vec4 v_color;

void main() {
  // Scale and position the quad
  vec2 position = a_position * a_barRect.zw + a_barRect.xy;
  
  gl_Position = u_projection * u_view * vec4(position, 0.0, 1.0);
  v_color = a_barColor;
}
```

**Fragment Shader:**
```glsl
#version 300 es
precision highp float;

in vec4 v_color;
out vec4 fragColor;

void main() {
  fragColor = v_color;
}
```

**Performance Optimization:**
- Use instanced rendering: 1 draw call for all bars
- Cull bars outside viewport in CPU before upload
- Pre-compute colors in data pipeline, not in shader

**Complexity:**
- Data preparation: O(n) where n = bar count
- GPU draw: O(1) - single instanced draw call
- Memory: 32 bytes per bar

### LineChart

**Data Structure:**
```typescript
// Polyline approach: vertices + indices
// Each vertex: [x, y, colorR, colorG, colorB, alpha]
const vertexBuffer = new Float32Array(pointCount * 6);
const indexBuffer = new Uint32Array((pointCount - 1) * 2); // lines
```

**Optimization Techniques:**

1. **Line Simplification (Douglas-Peucker):**
```typescript
// Reduce points while maintaining visual fidelity
function simplifyLine(
  points: Point[],
  tolerance: number
): Point[] {
  // Recursive Douglas-Peucker algorithm
  // O(n log n) average, O(n²) worst case
}

// Auto-adjust tolerance based on zoom level
const tolerance = calculateTolerance(zoomLevel, screenWidth);
const simplified = simplifyLine(rawPoints, tolerance);
```

2. **Level of Detail (LOD):**
```typescript
// Different resolutions for different zoom levels
const LOD_LEVELS = [
  { zoom: [0, 1], step: 100 },    // Show every 100th point
  { zoom: [1, 5], step: 10 },     // Show every 10th point
  { zoom: [5, 50], step: 1 },     // Show all points
];
```

3. **Frustum Culling:**
```typescript
// Only upload line segments within viewport
function cullLineSegments(
  segments: LineSegment[],
  viewport: BoundingBox
): LineSegment[] {
  return segments.filter(seg => 
    intersects(seg.bounds, viewport)
  );
}
```

**Complexity:**
- Simplification: O(n log n)
- Culling: O(n)
- GPU draw: O(visible segments)
- Memory: 24 bytes per vertex

### ScatterPlot

**Data Structure:**
```typescript
// Each point: [x, y, size, colorR, colorG, colorB, alpha]
// Packed layout: vec3 position + vec4 color
const instanceBuffer = new Float32Array(pointCount * 7);
```

**Shader Approach:**

**Vertex Shader:**
```glsl
#version 300 es
precision highp float;

// Geometry (single point)
in vec2 a_quad;  // [-1,-1] to [1,1] square

// Instance data
in vec3 a_point;     // x, y, size
in vec4 a_color;     // r, g, b, a

uniform mat4 u_projection;
uniform mat4 u_view;
uniform float u_pixelRatio;

out vec4 v_color;
out vec2 v_quad;

void main() {
  // Calculate point position
  vec4 worldPos = u_view * vec4(a_point.xy, 0.0, 1.0);
  
  // Scale quad by point size (in pixels)
  vec2 offset = a_quad * a_point.z * u_pixelRatio;
  
  gl_Position = u_projection * (worldPos + vec4(offset, 0.0, 0.0));
  
  v_color = a_color;
  v_quad = a_quad;
}
```

**Fragment Shader (Circular Points):**
```glsl
#version 300 es
precision highp float;

in vec4 v_color;
in vec2 v_quad;

out vec4 fragColor;

void main() {
  // Create circular point with antialiasing
  float dist = length(v_quad);
  float alpha = 1.0 - smoothstep(0.9, 1.0, dist);
  
  if (dist > 1.0) discard;
  
  fragColor = vec4(v_color.rgb, v_color.a * alpha);
}
```

**Performance Optimizations:**

1. **Spatial Indexing (Quadtree):**
```typescript
// For efficient point queries (hover, selection)
class Quadtree {
  private bounds: BoundingBox;
  private capacity: number = 64;
  private points: Point[] = [];
  private divided: boolean = false;
  private children: Quadtree[] = [];
  
  insert(point: Point): void;
  query(range: BoundingBox): Point[];
  
  // O(log n) average for point queries
  findNearest(x: number, y: number, radius: number): Point | null;
}
```

2. **GPU-Based Culling:**
```glsl
// Cull points outside viewport in vertex shader
if (worldPos.x < u_viewportMin.x || worldPos.x > u_viewportMax.x ||
    worldPos.y < u_viewportMin.y || worldPos.y > u_viewportMax.y) {
  gl_Position = vec4(0.0, 0.0, -1.0, 1.0); // Behind camera
}
```

**Complexity:**
- Data upload: O(n)
- Quadtree build: O(n log n)
- Point query: O(log n) average
- GPU draw: O(visible points)
- Memory: 28 bytes per point

### HeatMap

**Data Structure:**
```typescript
// Grid-based heatmap: width × height cells
// Each cell: [value, colorR, colorG, colorB, alpha]
const gridData = new Float32Array(width * height * 5);
```

**Rendering Approach:**

1. **Texture-Based (Preferred for large grids):**
```typescript
// Upload data as texture, use fragment shader for color mapping
const texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texImage2D(
  gl.TEXTURE_2D,
  0,
  gl.R32F,  // Single channel float
  width,
  height,
  0,
  gl.RED,
  gl.FLOAT,
  valueData
);
```

**Fragment Shader:**
```glsl
#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_dataTexture;
uniform sampler2D u_colorMap;  // Color gradient lookup

void main() {
  float value = texture(u_dataTexture, v_texCoord).r;
  
  // Normalize value to [0, 1]
  float normalized = (value - u_minValue) / (u_maxValue - u_minValue);
  
  // Lookup color from gradient
  fragColor = texture(u_colorMap, vec2(normalized, 0.5));
}
```

2. **Instance-Based (For sparse or interactive heatmaps):**
```typescript
// Similar to bar chart, but with cell grid
```

**Performance:**
- Texture approach: Single draw call for entire heatmap
- Update: O(changed cells) with texture sub-updates
- Memory: 4 bytes per cell (texture) vs 20 bytes (instanced)

## Interaction Handling

### InteractionHandler

```typescript
interface InteractionState {
  isMouseDown: boolean;
  mousePos: Point;
  lastMousePos: Point;
  zoom: number;
  pan: Point;
}

class InteractionHandler {
  private state: InteractionState;
  private canvas: HTMLCanvasElement;
  private camera: Camera;
  
  constructor(canvas: HTMLCanvasElement, camera: Camera);
  
  // Event handlers
  private onMouseDown(e: MouseEvent): void;
  private onMouseMove(e: MouseEvent): void;
  private onMouseUp(e: MouseEvent): void;
  private onWheel(e: WheelEvent): void;
  
  // State updates
  update(): void;
  getHoveredPoint(charts: ChartPrimitive[]): Point | null;
}
```

**Efficient Hit Testing:**
```typescript
// Use quadtree for O(log n) point queries
getHoveredPoint(charts: ChartPrimitive[]): Point | null {
  const mouseWorld = this.camera.screenToWorld(this.state.mousePos);
  
  for (const chart of charts) {
    if (chart instanceof ScatterPlot) {
      const point = chart.quadtree.findNearest(
        mouseWorld.x,
        mouseWorld.y,
        10 // pixel radius
      );
      if (point) return point;
    }
  }
  
  return null;
}
```

## Camera & Projection

```typescript
class Camera {
  private position: Point = { x: 0, y: 0 };
  private zoom: number = 1;
  private viewMatrix: mat4;
  private projectionMatrix: mat4;
  
  constructor(viewport: Viewport);
  
  setPosition(x: number, y: number): void;
  setZoom(zoom: number): void;
  
  getViewMatrix(): mat4;
  getProjectionMatrix(): mat4;
  
  screenToWorld(screen: Point): Point;
  worldToScreen(world: Point): Point;
  
  private updateMatrices(): void;
}
```

**Matrix Calculations:**
```typescript
private updateMatrices(): void {
  // View matrix (camera transform)
  this.viewMatrix = mat4.create();
  mat4.translate(this.viewMatrix, this.viewMatrix, [
    -this.position.x,
    -this.position.y,
    0
  ]);
  mat4.scale(this.viewMatrix, this.viewMatrix, [
    this.zoom,
    this.zoom,
    1
  ]);
  
  // Orthographic projection (2D)
  const aspect = this.viewport.width / this.viewport.height;
  this.projectionMatrix = mat4.create();
  mat4.ortho(
    this.projectionMatrix,
    -aspect,  // left
    aspect,   // right
    -1,       // bottom
    1,        // top
    -1,       // near
    1         // far
  );
}
```

## Memory Management

### Buffer Pooling

```typescript
class BufferPool {
  private pools: Map<number, WebGLBuffer[]> = new Map();
  private inUse: Set<WebGLBuffer> = new Set();
  
  acquire(size: number): WebGLBuffer {
    const pool = this.pools.get(size) || [];
    
    if (pool.length > 0) {
      const buffer = pool.pop()!;
      this.inUse.add(buffer);
      return buffer;
    }
    
    // Create new buffer
    const buffer = this.gl.createBuffer()!;
    this.inUse.add(buffer);
    return buffer;
  }
  
  release(buffer: WebGLBuffer, size: number): void {
    this.inUse.delete(buffer);
    
    const pool = this.pools.get(size) || [];
    pool.push(buffer);
    this.pools.set(size, pool);
  }
}
```

## Performance Monitoring

```typescript
class PerformanceMonitor {
  private frameTimings: number[] = [];
  private drawCallCount: number = 0;
  
  startFrame(): void {
    this.frameStart = performance.now();
  }
  
  endFrame(): void {
    const frameTime = performance.now() - this.frameStart;
    this.frameTimings.push(frameTime);
    
    // Keep last 60 frames
    if (this.frameTimings.length > 60) {
      this.frameTimings.shift();
    }
  }
  
  getAverageFPS(): number {
    const avgFrameTime = this.frameTimings.reduce((a, b) => a + b) / 
                         this.frameTimings.length;
    return 1000 / avgFrameTime;
  }
  
  getMetrics(): PerformanceMetrics {
    return {
      fps: this.getAverageFPS(),
      frameTime: this.frameTimings[this.frameTimings.length - 1],
      drawCalls: this.drawCallCount,
    };
  }
}
```

## File Structure

```
frontend/src/viz-engine/
├── index.ts                 # Main export
├── VizEngine.ts            # Main engine class
├── CanvasManager.ts        # Canvas & WebGL setup
├── Renderer.ts             # WebGL rendering
├── InteractionHandler.ts   # Mouse/touch events
├── Camera.ts               # View & projection
├── PerformanceMonitor.ts   # FPS tracking
├── charts/
│   ├── ChartPrimitive.ts   # Base class
│   ├── BarChart.ts         # Bar chart implementation
│   ├── LineChart.ts        # Line chart implementation
│   ├── ScatterPlot.ts      # Scatter plot implementation
│   └── HeatMap.ts          # Heatmap implementation
├── shaders/
│   ├── bar.vert.glsl
│   ├── bar.frag.glsl
│   ├── line.vert.glsl
│   ├── line.frag.glsl
│   ├── scatter.vert.glsl
│   ├── scatter.frag.glsl
│   ├── heatmap.vert.glsl
│   └── heatmap.frag.glsl
├── utils/
│   ├── BufferPool.ts       # Buffer management
│   ├── Quadtree.ts         # Spatial indexing
│   ├── simplify.ts         # Line simplification
│   └── culling.ts          # Frustum culling
└── types/
    └── index.ts            # TypeScript interfaces
```

## Testing Strategy

### Unit Tests
- Individual shader compilation
- Matrix math operations
- Quadtree operations
- Line simplification algorithm

### Integration Tests
- Full rendering pipeline
- Chart data updates
- Interaction events
- Memory leak detection

### Performance Tests (Benchmarks)
```typescript
describe('Performance', () => {
  it('should render 10M points at 60 FPS', async () => {
    const data = generateTestData(10_000_000);
    const engine = new VizEngine(config);
    const scatter = new ScatterPlot(data);
    
    engine.addChart('test', scatter);
    
    const metrics = await measurePerformance(engine, { duration: 1000 });
    
    expect(metrics.avgFPS).toBeGreaterThan(60);
    expect(metrics.p99FrameTime).toBeLessThan(16.67);
  });
});
```

## Next Steps

After design approval, implementation will proceed in this order:

1. Core infrastructure (VizEngine, CanvasManager, Renderer)
2. Camera & interaction system
3. BarChart primitive (simplest)
4. ScatterPlot with quadtree
5. LineChart with simplification
6. HeatMap with textures
7. Performance optimization & profiling

## References

- WebGL2 Specification: https://www.khronos.org/webgl/
- GPU Gems (Instanced Rendering): https://developer.nvidia.com/gpugems
- Douglas-Peucker Algorithm: https://en.wikipedia.org/wiki/Ramer–Douglas–Peucker_algorithm
- Quadtree Spatial Index: https://en.wikipedia.org/wiki/Quadtree


