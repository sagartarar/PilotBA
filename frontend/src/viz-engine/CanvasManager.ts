import { Viewport } from './types';

export interface CanvasConfig {
  width: number;
  height: number;
  pixelRatio?: number;
  antialias?: boolean;
  backgroundColor?: string;
}

export class CanvasManager {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private pixelRatio: number;
  private viewport: Viewport;
  private backgroundColor: [number, number, number, number];

  constructor(container: HTMLElement, config: CanvasConfig) {
    this.pixelRatio = config.pixelRatio || window.devicePixelRatio || 1;

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = `${config.width}px`;
    this.canvas.style.height = `${config.height}px`;
    this.canvas.width = config.width * this.pixelRatio;
    this.canvas.height = config.height * this.pixelRatio;

    container.appendChild(this.canvas);

    // Initialize WebGL2 context
    const gl = this.canvas.getContext('webgl2', {
      alpha: false,
      antialias: config.antialias ?? true,
      depth: true,
      powerPreference: 'high-performance',
      desynchronized: true, // Reduces input latency
    });

    if (!gl) {
      throw new Error('WebGL2 is not supported in this browser');
    }

    this.gl = gl;

    // Parse background color
    this.backgroundColor = this.parseColor(config.backgroundColor || '#1a1a1a');

    // Setup viewport
    this.viewport = {
      width: config.width,
      height: config.height,
      pixelRatio: this.pixelRatio,
    };

    this.setupWebGL();
  }

  private setupWebGL(): void {
    const gl = this.gl;

    // Set viewport
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Clear color
    gl.clearColor(
      this.backgroundColor[0],
      this.backgroundColor[1],
      this.backgroundColor[2],
      this.backgroundColor[3]
    );
  }

  private parseColor(color: string): [number, number, number, number] {
    // Simple hex color parser
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return [r, g, b, 1.0];
  }

  getContext(): WebGL2RenderingContext {
    return this.gl;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getViewport(): Viewport {
    return { ...this.viewport };
  }

  resize(width: number, height: number): void {
    this.viewport.width = width;
    this.viewport.height = height;

    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.canvas.width = width * this.pixelRatio;
    this.canvas.height = height * this.pixelRatio;

    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  clear(): void {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  destroy(): void {
    // Lose context to free resources
    const ext = this.gl.getExtension('WEBGL_lose_context');
    if (ext) {
      ext.loseContext();
    }

    // Remove canvas from DOM
    if (this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }
  }
}


