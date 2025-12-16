import { ChartPrimitive } from './ChartPrimitive';
import { ChartData } from '../types';
import { Renderer } from '../Renderer';
import { Camera } from '../Camera';
import lineVertShader from '../shaders/line.vert.glsl?raw';
import lineFragShader from '../shaders/line.frag.glsl?raw';

export class LineChart extends ChartPrimitive {
  private vertexBuffer: WebGLBuffer | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private vertexCount: number = 0;

  constructor(data: ChartData) {
    super(data);
  }

  initialize(renderer: Renderer): void {
    // Compile shaders
    try {
      renderer.compileShader('line', lineVertShader, lineFragShader);
    } catch (e) {
      console.error('Failed to compile line chart shaders:', e);
      throw e;
    }

    this.prepareBuffers(renderer);
  }

  update(_deltaTime: number): void {
    // Animation/update logic here if needed
  }

  render(renderer: Renderer, camera: Camera): void {
    if (!this.visible || this.vertexCount === 0) return;

    if (this.isDirty) {
      this.prepareBuffers(renderer);
      this.isDirty = false;
    }

    const gl = renderer['gl'] as WebGL2RenderingContext;
    const shader = renderer.useShader('line');

    // Bind VAO
    if (this.vao) {
      gl.bindVertexArray(this.vao);
    }

    // Set uniforms
    renderer.setUniform(shader, 'u_viewProjection', camera.getViewProjectionMatrix());

    // Draw line strip
    gl.lineWidth(2.0);
    gl.drawArrays(gl.LINE_STRIP, 0, this.vertexCount);

    gl.bindVertexArray(null);
  }

  destroy(renderer: Renderer): void {
    const gl = renderer['gl'] as WebGL2RenderingContext;

    if (this.vertexBuffer) {
      gl.deleteBuffer(this.vertexBuffer);
      this.vertexBuffer = null;
    }

    if (this.vao) {
      gl.deleteVertexArray(this.vao);
      this.vao = null;
    }
  }

  private prepareBuffers(renderer: Renderer): void {
    const gl = renderer['gl'] as WebGL2RenderingContext;
    const shader = renderer.useShader('line');

    // Create VAO
    if (!this.vao) {
      this.vao = gl.createVertexArray();
    }
    gl.bindVertexArray(this.vao);

    // Vertex data buffer
    const vertexData = this.prepareVertexData();
    this.vertexCount = this.data.values.length;

    if (!this.vertexBuffer) {
      this.vertexBuffer = gl.createBuffer();
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.DYNAMIC_DRAW);

    // Setup vertex attributes
    const posLoc = shader.attributes.get('a_position');
    const colorLoc = shader.attributes.get('a_color');

    const stride = 6 * Float32Array.BYTES_PER_ELEMENT; // 2 pos + 4 color

    if (posLoc !== undefined) {
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, stride, 0);
    }

    if (colorLoc !== undefined) {
      gl.enableVertexAttribArray(colorLoc);
      gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);
    }

    gl.bindVertexArray(null);
  }

  private prepareVertexData(): Float32Array {
    const xIndex = this.data.columns.indexOf(this.data.encodings.x);
    const yIndex = this.data.columns.indexOf(this.data.encodings.y);
    const colorIndex = this.data.encodings.color
      ? this.data.columns.indexOf(this.data.encodings.color)
      : -1;

    const count = this.data.values.length;
    const data = new Float32Array(count * 6); // 2 for position + 4 for color

    // Sort by x value for proper line rendering
    const sortedValues = [...this.data.values].sort((a, b) => a[xIndex] - b[xIndex]);

    // Color normalization
    let colorMin = 0;
    let colorMax = 1;
    if (colorIndex !== -1) {
      const colorValues = sortedValues.map((row) => row[colorIndex]);
      colorMin = Math.min(...colorValues);
      colorMax = Math.max(...colorValues);
    }

    for (let i = 0; i < count; i++) {
      const row = sortedValues[i];

      // Position
      data[i * 6 + 0] = row[xIndex];
      data[i * 6 + 1] = row[yIndex];

      // Color
      const color = colorIndex !== -1
        ? this.normalizeColor(row[colorIndex], colorMin, colorMax)
        : this.defaultColor();

      data[i * 6 + 2] = color.r;
      data[i * 6 + 3] = color.g;
      data[i * 6 + 4] = color.b;
      data[i * 6 + 5] = color.a;
    }

    return data;
  }
}


