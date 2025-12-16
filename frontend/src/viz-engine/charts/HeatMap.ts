/**
 * HeatMap chart implementation with texture-based rendering.
 * 
 * Renders heatmaps efficiently using GPU textures for color mapping.
 * 
 * @see Design Doc: 01-webgl-rendering-engine.md (Lines 475-535)
 */

import { ChartPrimitive, ChartData, BoundingBox } from './ChartPrimitive';
import { Renderer } from '../Renderer';

export interface HeatMapData extends ChartData {
  gridWidth: number;
  gridHeight: number;
  colorMap?: 'viridis' | 'plasma' | 'inferno' | 'magma' | 'turbo';
}

/**
 * HeatMap chart class.
 */
export class HeatMap extends ChartPrimitive {
  private gridWidth: number;
  private gridHeight: number;
  private colorMap: string;
  private dataTexture: WebGLTexture | null = null;
  private colorMapTexture: WebGLTexture | null = null;
  private minValue: number = 0;
  private maxValue: number = 1;

  constructor(data: HeatMapData) {
    super(data);
    this.shaderName = 'heatmap';
    this.gridWidth = data.gridWidth;
    this.gridHeight = data.gridHeight;
    this.colorMap = data.colorMap || 'viridis';
  }

  /**
   * Initializes heatmap resources.
   */
  initialize(renderer: Renderer): void {
    const gl = renderer.getContext();

    // Create data texture
    this.dataTexture = this.createDataTexture(gl);

    // Create color map texture
    this.colorMapTexture = this.createColorMapTexture(gl, this.colorMap);

    // Create geometry buffer (unit quad)
    this.geometryBuffer = this.createQuadBuffer(gl);

    this.isDirty = false;
  }

  /**
   * Updates heatmap (if data changed).
   */
  update(deltaTime: number): void {
    if (!this.isDirty) return;

    // Re-upload data to texture
    // In production, you would only update changed cells
    this.isDirty = false;
  }

  /**
   * Prepares data for GPU upload.
   * 
   * For heatmaps, we use textures instead of vertex buffers.
   */
  prepareBuffers(): Float32Array {
    // Heatmap uses textures, not vertex buffers
    // Return empty array
    return new Float32Array(0);
  }

  /**
   * Creates data texture from grid values.
   */
  private createDataTexture(gl: WebGL2RenderingContext): WebGLTexture {
    const texture = gl.createTexture();
    if (!texture) {
      throw new Error('Failed to create data texture');
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Extract grid data
    const gridData = this.extractGridData();
    
    // Upload to texture (R32F format - single channel float)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,                    // mip level
      gl.R32F,              // internal format
      this.gridWidth,
      this.gridHeight,
      0,                    // border
      gl.RED,               // format
      gl.FLOAT,             // type
      gridData
    );

    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return texture;
  }

  /**
   * Extracts grid data from chart data.
   */
  private extractGridData(): Float32Array {
    const gridData = new Float32Array(this.gridWidth * this.gridHeight);

    // Assuming data.values is a flat array in row-major order
    for (let i = 0; i < this.data.values.length && i < gridData.length; i++) {
      const value = Array.isArray(this.data.values)
        ? this.data.values[i][0]
        : this.data.values.get(i);

      gridData[i] = typeof value === 'number' ? value : 0;

      // Track min/max for normalization
      if (i === 0) {
        this.minValue = gridData[i];
        this.maxValue = gridData[i];
      } else {
        this.minValue = Math.min(this.minValue, gridData[i]);
        this.maxValue = Math.max(this.maxValue, gridData[i]);
      }
    }

    return gridData;
  }

  /**
   * Creates color map texture.
   */
  private createColorMapTexture(
    gl: WebGL2RenderingContext,
    colorMap: string
  ): WebGLTexture {
    const texture = gl.createTexture();
    if (!texture) {
      throw new Error('Failed to create color map texture');
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Generate color map gradient
    const gradientData = this.generateColorGradient(colorMap, 256);

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGB,
      256,                // width
      1,                  // height (1D texture as 2D)
      0,
      gl.RGB,
      gl.UNSIGNED_BYTE,
      gradientData
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return texture;
  }

  /**
   * Generates color gradient data.
   */
  private generateColorGradient(colorMap: string, steps: number): Uint8Array {
    const data = new Uint8Array(steps * 3); // RGB

    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1); // 0 to 1
      const color = this.getColorFromMap(colorMap, t);

      data[i * 3 + 0] = color[0];
      data[i * 3 + 1] = color[1];
      data[i * 3 + 2] = color[2];
    }

    return data;
  }

  /**
   * Gets color from predefined color map.
   */
  private getColorFromMap(colorMap: string, t: number): [number, number, number] {
    // Clamp t to [0, 1]
    t = Math.max(0, Math.min(1, t));

    switch (colorMap) {
      case 'viridis':
        return this.viridis(t);
      case 'plasma':
        return this.plasma(t);
      case 'inferno':
        return this.inferno(t);
      case 'magma':
        return this.magma(t);
      case 'turbo':
        return this.turbo(t);
      default:
        // Simple blue-to-red gradient
        return [
          Math.floor(t * 255),
          0,
          Math.floor((1 - t) * 255)
        ];
    }
  }

  /**
   * Viridis color map (perceptually uniform).
   */
  private viridis(t: number): [number, number, number] {
    // Simplified viridis interpolation
    const r = Math.floor((0.267 + t * (0.993 - 0.267)) * 255);
    const g = Math.floor((0.005 + t * (0.906 - 0.005)) * 255);
    const b = Math.floor((0.329 + t * (0.144 - 0.329)) * 255);
    return [r, g, b];
  }

  /**
   * Plasma color map.
   */
  private plasma(t: number): [number, number, number] {
    const r = Math.floor((0.050 + t * (0.940 - 0.050)) * 255);
    const g = Math.floor((0.030 + t * (0.980 - 0.030)) * 255);
    const b = Math.floor((0.528 + t * (0.030 - 0.528)) * 255);
    return [r, g, b];
  }

  /**
   * Inferno color map.
   */
  private inferno(t: number): [number, number, number] {
    const r = Math.floor(t * 255);
    const g = Math.floor(Math.pow(t, 2) * 255);
    const b = Math.floor(Math.pow(t, 3) * 255);
    return [r, g, b];
  }

  /**
   * Magma color map.
   */
  private magma(t: number): [number, number, number] {
    const r = Math.floor(t * 255);
    const g = Math.floor(Math.pow(t, 1.5) * 255);
    const b = Math.floor(Math.pow(t, 2.5) * 255);
    return [r, g, b];
  }

  /**
   * Turbo color map (Google's improved rainbow).
   */
  private turbo(t: number): [number, number, number] {
    const r = Math.floor((0.19 + t * (0.98 - 0.19)) * 255);
    const g = Math.floor(Math.sin(t * Math.PI) * 255);
    const b = Math.floor((0.95 - t * 0.95) * 255);
    return [r, g, b];
  }

  /**
   * Creates unit quad buffer for rendering.
   */
  private createQuadBuffer(gl: WebGL2RenderingContext): WebGLBuffer {
    const buffer = gl.createBuffer();
    if (!buffer) {
      throw new Error('Failed to create quad buffer');
    }

    // Unit quad vertices and texture coordinates
    const vertices = new Float32Array([
      // Position (x, y)  TexCoord (u, v)
      0, 0,              0, 0,
      1, 0,              1, 0,
      0, 1,              0, 1,
      1, 1,              1, 1,
    ]);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    return buffer;
  }

  /**
   * Gets bounding box for heatmap.
   */
  getBounds(): BoundingBox {
    // Assuming heatmap is positioned at origin
    return {
      minX: 0,
      minY: 0,
      maxX: this.gridWidth,
      maxY: this.gridHeight,
    };
  }

  /**
   * Gets textures for rendering.
   */
  getDataTexture(): WebGLTexture | null {
    return this.dataTexture;
  }

  getColorMapTexture(): WebGLTexture | null {
    return this.colorMapTexture;
  }

  getMinValue(): number {
    return this.minValue;
  }

  getMaxValue(): number {
    return this.maxValue;
  }

  /**
   * Cleanup resources.
   */
  destroy(gl: WebGL2RenderingContext): void {
    if (this.dataTexture) {
      gl.deleteTexture(this.dataTexture);
      this.dataTexture = null;
    }

    if (this.colorMapTexture) {
      gl.deleteTexture(this.colorMapTexture);
      this.colorMapTexture = null;
    }

    if (this.geometryBuffer) {
      gl.deleteBuffer(this.geometryBuffer);
      this.geometryBuffer = null;
    }
  }
}

