/**
 * WebGL Buffer Pool for efficient memory management.
 * 
 * Reuses WebGL buffers to avoid frequent allocation/deallocation,
 * reducing GC pressure and improving performance.
 * 
 * @see Design Doc: 01-webgl-rendering-engine.md (Lines 648-676)
 */

export interface BufferPoolConfig {
  maxPoolSize?: number; // Max buffers per size category
  sizes?: number[];     // Pre-allocated buffer sizes
}

export class BufferPool {
  private gl: WebGL2RenderingContext;
  private pools: Map<number, WebGLBuffer[]>;
  private inUse: Map<WebGLBuffer, number>;
  private maxPoolSize: number;

  /**
   * Creates a new BufferPool.
   * 
   * @param gl - WebGL2 rendering context
   * @param config - Pool configuration
   */
  constructor(gl: WebGL2RenderingContext, config: BufferPoolConfig = {}) {
    this.gl = gl;
    this.pools = new Map();
    this.inUse = new Map();
    this.maxPoolSize = config.maxPoolSize || 10;

    // Pre-allocate common buffer sizes
    if (config.sizes) {
      config.sizes.forEach(size => {
        this.pools.set(size, []);
      });
    }
  }

  /**
   * Acquires a buffer of the specified size.
   * 
   * @param size - Size in bytes
   * @param usage - WebGL buffer usage hint (default: DYNAMIC_DRAW)
   * @returns WebGL buffer
   */
  acquire(size: number, usage: number = this.gl.DYNAMIC_DRAW): WebGLBuffer {
    // Round size to nearest power of 2 for better pooling
    const poolKey = this.roundToPowerOf2(size);
    const pool = this.pools.get(poolKey) || [];

    let buffer: WebGLBuffer;

    if (pool.length > 0) {
      // Reuse existing buffer
      buffer = pool.pop()!;
    } else {
      // Create new buffer
      buffer = this.gl.createBuffer()!;
      if (!buffer) {
        throw new Error('Failed to create WebGL buffer');
      }

      // Pre-allocate buffer storage
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, poolKey, usage);
    }

    // Track buffer as in-use
    this.inUse.set(buffer, poolKey);

    return buffer;
  }

  /**
   * Releases a buffer back to the pool.
   * 
   * @param buffer - WebGL buffer to release
   */
  release(buffer: WebGLBuffer): void {
    const size = this.inUse.get(buffer);

    if (size === undefined) {
      console.warn('Attempting to release buffer not acquired from pool');
      return;
    }

    // Remove from in-use tracking
    this.inUse.delete(buffer);

    // Return to pool if not full
    const pool = this.pools.get(size) || [];
    
    if (pool.length < this.maxPoolSize) {
      pool.push(buffer);
      this.pools.set(size, pool);
    } else {
      // Pool is full, delete the buffer
      this.gl.deleteBuffer(buffer);
    }
  }

  /**
   * Clears all buffers from the pool and deletes them.
   */
  clear(): void {
    // Delete all pooled buffers
    this.pools.forEach(pool => {
      pool.forEach(buffer => {
        this.gl.deleteBuffer(buffer);
      });
    });

    this.pools.clear();
    this.inUse.clear();
  }

  /**
   * Gets pool statistics for monitoring.
   */
  getStats(): {
    pooledBuffers: number;
    inUseBuffers: number;
    totalMemory: number;
  } {
    let pooledBuffers = 0;
    let totalMemory = 0;

    this.pools.forEach((pool, size) => {
      pooledBuffers += pool.length;
      totalMemory += pool.length * size;
    });

    const inUseBuffers = this.inUse.size;

    // Add in-use buffer memory
    this.inUse.forEach(size => {
      totalMemory += size;
    });

    return {
      pooledBuffers,
      inUseBuffers,
      totalMemory,
    };
  }

  /**
   * Rounds size to nearest power of 2 for better pooling.
   */
  private roundToPowerOf2(size: number): number {
    // Find next power of 2
    let power = 1;
    while (power < size) {
      power *= 2;
    }
    return power;
  }

  /**
   * Prunes unused buffers to free memory.
   * 
   * @param maxAge - Not used in current implementation (future: LRU tracking)
   */
  prune(maxAge?: number): void {
    // Simple implementation: release half of each pool
    this.pools.forEach((pool, size) => {
      const keepCount = Math.ceil(pool.length / 2);
      const toDelete = pool.splice(keepCount);

      toDelete.forEach(buffer => {
        this.gl.deleteBuffer(buffer);
      });
    });
  }
}

/**
 * Vertex Array Object (VAO) Pool for efficient VAO management.
 */
export class VAOPool {
  private gl: WebGL2RenderingContext;
  private pool: WebGLVertexArrayObject[];
  private inUse: Set<WebGLVertexArrayObject>;
  private maxPoolSize: number;

  constructor(gl: WebGL2RenderingContext, maxPoolSize: number = 10) {
    this.gl = gl;
    this.pool = [];
    this.inUse = new Set();
    this.maxPoolSize = maxPoolSize;
  }

  acquire(): WebGLVertexArrayObject {
    let vao: WebGLVertexArrayObject;

    if (this.pool.length > 0) {
      vao = this.pool.pop()!;
    } else {
      vao = this.gl.createVertexArray()!;
      if (!vao) {
        throw new Error('Failed to create WebGL VAO');
      }
    }

    this.inUse.add(vao);
    return vao;
  }

  release(vao: WebGLVertexArrayObject): void {
    if (!this.inUse.has(vao)) {
      console.warn('Attempting to release VAO not acquired from pool');
      return;
    }

    this.inUse.delete(vao);

    if (this.pool.length < this.maxPoolSize) {
      this.pool.push(vao);
    } else {
      this.gl.deleteVertexArray(vao);
    }
  }

  clear(): void {
    this.pool.forEach(vao => {
      this.gl.deleteVertexArray(vao);
    });

    this.pool = [];
    this.inUse.clear();
  }

  getStats(): { pooled: number; inUse: number } {
    return {
      pooled: this.pool.length,
      inUse: this.inUse.size,
    };
  }
}

