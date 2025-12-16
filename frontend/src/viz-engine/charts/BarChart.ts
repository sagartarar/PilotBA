import { ChartPrimitive } from './ChartPrimitive';
import { ChartData } from '../types';
import { Renderer } from '../Renderer';
import { Camera } from '../Camera';
import barVertShader from '../shaders/bar.vert.glsl?raw';
import barFragShader from '../shaders/bar.frag.glsl?raw';

export class BarChart extends ChartPrimitive {
  private geometryBuffer: WebGLBuffer | null = null;
  private instanceBuffer: WebGLBuffer | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private instanceCount: number = 0;

  constructor(data: ChartData) {
    super(data);
  }

  initialize(renderer: Renderer): void {
    // Compile shaders
    try {
      renderer.compileShader('bar', barVertShader, barFragShader);
    } catch (e) {
      console.error('Failed to compile bar chart shaders:', e);
      throw e;
    }

    this.prepareBuffers(renderer);
  }

  update(_deltaTime: number): void {
    // Animation/update logic here if needed
  }

  render(renderer: Renderer, camera: Camera): void {
    if (!this.visible || this.instanceCount === 0) return;

    if (this.isDirty) {
      this.prepareBuffers(renderer);
      this.isDirty = false;
    }

    const gl = renderer['gl'] as WebGL2RenderingContext;
    const shader = renderer.useShader('bar');

    // Bind VAO
    if (this.vao) {
      gl.bindVertexArray(this.vao);
    }

    // Set uniforms
    renderer.setUniform(shader, 'u_viewProjection', camera.getViewProjectionMatrix());

    // Draw instances
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.instanceCount);

    gl.bindVertexArray(null);
  }

  destroy(renderer: Renderer): void {
    const gl = renderer['gl'] as WebGL2RenderingContext;

    if (this.geometryBuffer) {
      gl.deleteBuffer(this.geometryBuffer);
      this.geometryBuffer = null;
    }

    if (this.instanceBuffer) {
      gl.deleteBuffer(this.instanceBuffer);
      this.instanceBuffer = null;
    }

    if (this.vao) {
      gl.deleteVertexArray(this.vao);
      this.vao = null;
    }
  }

  private prepareBuffers(renderer: Renderer): void {
    const gl = renderer['gl'] as WebGL2RenderingContext;
    const shader = renderer.useShader('bar');

    // Create VAO
    if (!this.vao) {
      this.vao = gl.createVertexArray();
    }
    gl.bindVertexArray(this.vao);

    // Geometry buffer (unit quad: 0,0 -> 1,1)
    if (!this.geometryBuffer) {
      const geometry = new Float32Array([
        0, 0, // bottom-left
        1, 0, // bottom-right
        0, 1, // top-left
        1, 1, // top-right
      ]);

      this.geometryBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.geometryBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, geometry, gl.STATIC_DRAW);

      const posLoc = shader.attributes.get('a_position');
      if (posLoc !== undefined) {
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(posLoc, 0); // Per-vertex
      }
    }

    // Instance data buffer
    const instanceData = this.prepareInstanceData();
    this.instanceCount = this.data.values.length;

    if (!this.instanceBuffer) {
      this.instanceBuffer = gl.createBuffer();
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, instanceData, gl.DYNAMIC_DRAW);

    // Setup instance attributes
    const rectLoc = shader.attributes.get('a_barRect');
    const colorLoc = shader.attributes.get('a_barColor');

    const stride = 8 * Float32Array.BYTES_PER_ELEMENT; // 8 floats per instance

    if (rectLoc !== undefined) {
      gl.enableVertexAttribArray(rectLoc);
      gl.vertexAttribPointer(rectLoc, 4, gl.FLOAT, false, stride, 0);
      gl.vertexAttribDivisor(rectLoc, 1); // Per-instance
    }

    if (colorLoc !== undefined) {
      gl.enableVertexAttribArray(colorLoc);
      gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, stride, 4 * Float32Array.BYTES_PER_ELEMENT);
      gl.vertexAttribDivisor(colorLoc, 1); // Per-instance
    }

    gl.bindVertexArray(null);
  }

  private prepareInstanceData(): Float32Array {
    const xIndex = this.data.columns.indexOf(this.data.encodings.x);
    const yIndex = this.data.columns.indexOf(this.data.encodings.y);
    const colorIndex = this.data.encodings.color
      ? this.data.columns.indexOf(this.data.encodings.color)
      : -1;

    const count = this.data.values.length;
    const data = new Float32Array(count * 8); // 4 for rect + 4 for color

    // Calculate bar width
    const barWidth = count > 1 ? 0.8 / count : 0.1;

    // Color normalization
    let colorMin = 0;
    let colorMax = 1;
    if (colorIndex !== -1) {
      const colorValues = this.data.values.map((row) => row[colorIndex]);
      colorMin = Math.min(...colorValues);
      colorMax = Math.max(...colorValues);
    }

    for (let i = 0; i < count; i++) {
      const row = this.data.values[i];
      const x = row[xIndex];
      const y = row[yIndex];

      // Bar rectangle (x, y, width, height)
      const barX = x - barWidth / 2;
      const barY = 0; // Start from bottom
      const barHeight = y;

      data[i * 8 + 0] = barX;
      data[i * 8 + 1] = barY;
      data[i * 8 + 2] = barWidth;
      data[i * 8 + 3] = barHeight;

      // Color
      const color = colorIndex !== -1
        ? this.normalizeColor(row[colorIndex], colorMin, colorMax)
        : this.defaultColor();

      data[i * 8 + 4] = color.r;
      data[i * 8 + 5] = color.g;
      data[i * 8 + 6] = color.b;
      data[i * 8 + 7] = color.a;
    }

    return data;
  }
}

