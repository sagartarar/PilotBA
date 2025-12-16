import { VizEngineConfig, PerformanceMetrics } from './types';
import { CanvasManager } from './CanvasManager';
import { Renderer } from './Renderer';
import { Camera } from './Camera';
import { InteractionHandler } from './InteractionHandler';
import { PerformanceMonitor } from './PerformanceMonitor';
import { ChartPrimitive } from './charts/ChartPrimitive';

export class VizEngine {
  private canvas: CanvasManager;
  private renderer: Renderer;
  private camera: Camera;
  private interaction: InteractionHandler;
  private performance: PerformanceMonitor;
  private charts: Map<string, ChartPrimitive>;
  private animationId: number | null = null;
  private lastTimestamp: number = 0;
  private isInitialized: boolean = false;

  constructor(config: VizEngineConfig) {
    // Initialize canvas and WebGL context
    this.canvas = new CanvasManager(config.container, {
      width: config.width,
      height: config.height,
      pixelRatio: config.pixelRatio,
      antialias: config.antialias,
      backgroundColor: config.backgroundColor,
    });

    const gl = this.canvas.getContext();

    // Initialize core components
    this.renderer = new Renderer(gl);
    this.camera = new Camera(this.canvas.getViewport());
    this.interaction = new InteractionHandler(this.canvas.getCanvas(), this.camera);
    this.performance = new PerformanceMonitor();
    this.charts = new Map();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Any async initialization here
    
    this.isInitialized = true;
    console.log('VizEngine initialized');
  }

  start(): void {
    if (!this.isInitialized) {
      throw new Error('VizEngine not initialized. Call initialize() first.');
    }

    if (this.animationId !== null) {
      return; // Already running
    }

    this.startAnimationLoop();
  }

  stop(): void {
    this.stopAnimationLoop();
  }

  addChart(id: string, chart: ChartPrimitive): void {
    if (this.charts.has(id)) {
      console.warn(`Chart with id "${id}" already exists. Replacing.`);
      this.removeChart(id);
    }

    chart.initialize(this.renderer);
    this.charts.set(id, chart);
  }

  removeChart(id: string): void {
    const chart = this.charts.get(id);
    if (chart) {
      chart.destroy(this.renderer);
      this.charts.delete(id);
    }
  }

  getChart(id: string): ChartPrimitive | undefined {
    return this.charts.get(id);
  }

  resize(width: number, height: number): void {
    this.canvas.resize(width, height);
    this.camera.updateViewport(this.canvas.getViewport());
  }

  getMetrics(): PerformanceMetrics {
    return this.performance.getMetrics();
  }

  fitToData(): void {
    // Calculate combined bounds of all charts
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    this.charts.forEach((chart) => {
      const bounds = chart.getBounds();
      if (bounds) {
        minX = Math.min(minX, bounds.minX);
        minY = Math.min(minY, bounds.minY);
        maxX = Math.max(maxX, bounds.maxX);
        maxY = Math.max(maxY, bounds.maxY);
      }
    });

    if (!isFinite(minX)) return;

    // Calculate center and zoom to fit
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const width = maxX - minX;
    const height = maxY - minY;

    this.camera.setPosition(centerX, centerY);

    // Calculate zoom to fit (with some padding)
    const viewport = this.canvas.getViewport();
    const aspect = viewport.width / viewport.height;
    const dataAspect = width / height;

    let zoom;
    if (dataAspect > aspect) {
      // Data is wider
      zoom = (viewport.width * 0.8) / width;
    } else {
      // Data is taller
      zoom = (viewport.height * 0.8) / height;
    }

    this.camera.setZoom(zoom);
  }

  destroy(): void {
    this.stop();

    // Destroy all charts
    this.charts.forEach((chart) => {
      chart.destroy(this.renderer);
    });
    this.charts.clear();

    // Cleanup components
    this.interaction.destroy();
    this.renderer.destroy();
    this.canvas.destroy();
  }

  private startAnimationLoop(): void {
    this.lastTimestamp = performance.now();
    this.animationId = requestAnimationFrame(this.tick.bind(this));
  }

  private stopAnimationLoop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private tick(timestamp: number): void {
    this.performance.startFrame();

    const deltaTime = timestamp - this.lastTimestamp;

    // Update phase
    this.interaction.update();
    this.charts.forEach((chart) => chart.update(deltaTime));

    // Render phase
    this.canvas.clear();
    this.performance.reset();

    this.charts.forEach((chart) => {
      if (chart.isVisible()) {
        chart.render(this.renderer, this.camera);
      }
    });

    this.performance.endFrame();
    this.lastTimestamp = timestamp;

    this.animationId = requestAnimationFrame(this.tick.bind(this));
  }
}

