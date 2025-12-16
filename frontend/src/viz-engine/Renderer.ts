import { ShaderProgram, BufferInfo } from './types';

export class Renderer {
  private gl: WebGL2RenderingContext;
  private shaders: Map<string, ShaderProgram>;
  private buffers: Map<string, BufferInfo>;
  private currentShader: ShaderProgram | null;
  private drawCallCount: number;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.shaders = new Map();
    this.buffers = new Map();
    this.currentShader = null;
    this.drawCallCount = 0;
  }

  compileShader(name: string, vertexSource: string, fragmentSource: string): void {
    const gl = this.gl;

    // Compile vertex shader
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    if (!vertexShader) throw new Error('Failed to create vertex shader');

    gl.shaderSource(vertexShader, vertexSource);
    gl.compileShader(vertexShader);

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(vertexShader);
      gl.deleteShader(vertexShader);
      throw new Error(`Vertex shader compilation failed: ${info}`);
    }

    // Compile fragment shader
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fragmentShader) throw new Error('Failed to create fragment shader');

    gl.shaderSource(fragmentShader, fragmentSource);
    gl.compileShader(fragmentShader);

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(fragmentShader);
      gl.deleteShader(fragmentShader);
      throw new Error(`Fragment shader compilation failed: ${info}`);
    }

    // Link program
    const program = gl.createProgram();
    if (!program) throw new Error('Failed to create shader program');

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(`Shader program linking failed: ${info}`);
    }

    // Clean up shaders (no longer needed after linking)
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    // Get attribute and uniform locations
    const attributes = new Map<string, number>();
    const uniforms = new Map<string, WebGLUniformLocation | null>();

    const numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < numAttributes; i++) {
      const info = gl.getActiveAttrib(program, i);
      if (info) {
        const location = gl.getAttribLocation(program, info.name);
        attributes.set(info.name, location);
      }
    }

    const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < numUniforms; i++) {
      const info = gl.getActiveUniform(program, i);
      if (info) {
        const location = gl.getUniformLocation(program, info.name);
        uniforms.set(info.name, location);
      }
    }

    this.shaders.set(name, { program, attributes, uniforms });
  }

  useShader(name: string): ShaderProgram {
    const shader = this.shaders.get(name);
    if (!shader) {
      throw new Error(`Shader "${name}" not found`);
    }

    if (this.currentShader !== shader) {
      this.gl.useProgram(shader.program);
      this.currentShader = shader;
    }

    return shader;
  }

  createBuffer(name: string, data: Float32Array | Uint32Array, usage: number, type: number): WebGLBuffer {
    const gl = this.gl;
    const buffer = gl.createBuffer();
    
    if (!buffer) {
      throw new Error('Failed to create buffer');
    }

    gl.bindBuffer(type, buffer);
    gl.bufferData(type, data, usage);

    this.buffers.set(name, {
      buffer,
      size: data.length,
      usage,
      type,
    });

    return buffer;
  }

  updateBuffer(name: string, data: Float32Array | Uint32Array): void {
    const bufferInfo = this.buffers.get(name);
    if (!bufferInfo) {
      throw new Error(`Buffer "${name}" not found`);
    }

    const gl = this.gl;
    gl.bindBuffer(bufferInfo.type, bufferInfo.buffer);

    if (data.length <= bufferInfo.size) {
      // Update existing buffer (faster)
      gl.bufferSubData(bufferInfo.type, 0, data);
    } else {
      // Reallocate buffer
      gl.bufferData(bufferInfo.type, data, bufferInfo.usage);
      bufferInfo.size = data.length;
    }
  }

  deleteBuffer(name: string): void {
    const bufferInfo = this.buffers.get(name);
    if (bufferInfo) {
      this.gl.deleteBuffer(bufferInfo.buffer);
      this.buffers.delete(name);
    }
  }

  setUniform(shader: ShaderProgram, name: string, value: number | number[] | Float32Array): void {
    const location = shader.uniforms.get(name);
    if (!location) return;

    const gl = this.gl;

    if (typeof value === 'number') {
      gl.uniform1f(location, value);
    } else if (value.length === 2) {
      gl.uniform2f(location, value[0], value[1]);
    } else if (value.length === 3) {
      gl.uniform3f(location, value[0], value[1], value[2]);
    } else if (value.length === 4) {
      gl.uniform4f(location, value[0], value[1], value[2], value[3]);
    } else if (value.length === 16) {
      gl.uniformMatrix4fv(location, false, value);
    }
  }

  clear(): void {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.drawCallCount = 0;
  }

  getDrawCallCount(): number {
    return this.drawCallCount;
  }

  resetDrawCallCount(): void {
    this.drawCallCount = 0;
  }

  destroy(): void {
    // Delete all shaders
    this.shaders.forEach((shader) => {
      this.gl.deleteProgram(shader.program);
    });
    this.shaders.clear();

    // Delete all buffers
    this.buffers.forEach((bufferInfo) => {
      this.gl.deleteBuffer(bufferInfo.buffer);
    });
    this.buffers.clear();

    this.currentShader = null;
  }
}


