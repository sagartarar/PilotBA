import { ChartPrimitive } from './ChartPrimitive';
import { ChartData } from '../types';
import { Renderer } from '../Renderer';
import { Camera } from '../Camera';
import scatterVertShader from '../shaders/scatter.vert.glsl?raw';
import scatterFragShader from '../shaders/scatter.frag.glsl?raw';

export class ScatterPlot extends ChartPrimitive {
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
      renderer.compileShader('scatter', scatterVertShader, scatterFragShader);
    } catch (e) {
      console.error('Failed to compile scatter plot shaders:', e);
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
    const shader = renderer.useShader('scatter');

    // Bind VAO
    if (this.vao) {
      gl.bindVertexArray(this.vao);
    }

    // Set uniforms
    renderer.setUniform(shader, 'u_projection', camera.getProjectionMatrix());
    renderer.setUniform(shader, 'u_view', camera.getViewMatrix());
    
    const viewport = camera['viewport'];
    renderer.setUniform(shader, 'u_resolution', [viewport.width, viewport.height]);
    renderer.setUniform(shader, 'u_pixelRatio', viewport.pixelRatio);

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
    const shader = renderer.useShader('scatter');

    // Create VAO
    if (!this.vao) {
      this.vao = gl.createVertexArray();
    }
    gl.bindVertexArray(this.vao);

    // Geometry buffer (unit quad: -1,-1 to 1,1 for circular points)
    if (!this.geometryBuffer) {
      const geometry = new Float32Array([
        -1, -1, // bottom-left
        1, -1, // bottom-right
        -1, 1, // top-left
        1, 1, // top-right
      ]);

      this.geometryBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.geometryBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, geometry, gl.STATIC_DRAW);

      const quadLoc = shader.attributes.get('a_quad');
      if (quadLoc !== undefined) {
        gl.enableVertexAttribArray(quadLoc);
        gl.vertexAttribPointer(quadLoc, 2, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(quadLoc, 0); // Per-vertex
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
    const pointLoc = shader.attributes.get('a_point');
    const colorLoc = shader.attributes.get('a_color');

    const stride = 7 * Float32Array.BYTES_PER_ELEMENT; // 7 floats per instance

    if (pointLoc !== undefined) {
      gl.enableVertexAttribArray(pointLoc);
      gl.vertexAttribPointer(pointLoc, 3, gl.FLOAT, false, stride, 0);
      gl.vertexAttribDivisor(pointLoc, 1); // Per-instance
    }

    if (colorLoc !== undefined) {
      gl.enableVertexAttribArray(colorLoc);
      gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, stride, 3 * Float32Array.BYTES_PER_ELEMENT);
      gl.vertexAttribDivisor(colorLoc, 1); // Per-instance
    }

    gl.bindVertexArray(null);
  }

  private prepareInstanceData(): Float32Array {
    const xIndex = this.data.columns.indexOf(this.data.encodings.x);
    const yIndex = this.data.columns.indexOf(this.data.encodings.y);
    const sizeIndex = this.data.encodings.size
      ? this.data.columns.indexOf(this.data.encodings.size)
      : -1;
    const colorIndex = this.data.encodings.color
      ? this.data.columns.indexOf(this.data.encodings.color)
      : -1;

    const count = this.data.values.length;
    const data = new Float32Array(count * 7); // 3 for point (x, y, size) + 4 for color

    // Size normalization
    const defaultSize = 5; // pixels
    let sizeMin = defaultSize;
    let sizeMax = defaultSize;
    if (sizeIndex !== -1) {
      const sizeValues = this.data.values.map((row) => row[sizeIndex]);
      sizeMin = Math.min(...sizeValues);
      sizeMax = Math.max(...sizeValues);
    }

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

      // Point position and size
      data[i * 7 + 0] = row[xIndex];
      data[i * 7 + 1] = row[yIndex];
      
      const size = sizeIndex !== -1
        ? 2 + (row[sizeIndex] - sizeMin) / (sizeMax - sizeMin) * 8 // 2-10 pixels
        : defaultSize;
      data[i * 7 + 2] = size;

      // Color
      const color = colorIndex !== -1
        ? this.normalizeColor(row[colorIndex], colorMin, colorMax)
        : this.defaultColor();

      data[i * 7 + 3] = color.r;
      data[i * 7 + 4] = color.g;
      data[i * 7 + 5] = color.b;
      data[i * 7 + 6] = color.a;
    }

    return data;
  }
}


