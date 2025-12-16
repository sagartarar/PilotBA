/**
 * ArrayBuffer Pool for efficient memory management in data pipeline.
 * 
 * Reuses ArrayBuffers to reduce GC pressure and improve performance.
 * 
 * @see Design Doc: 02-data-processing-pipeline.md (Lines 636-667)
 */

export interface BufferPoolConfig {
  maxPoolSize?: number;      // Max buffers per size category
  maxTotalMemory?: number;   // Max total memory (bytes)
}

/**
 * ArrayBuffer Pool class.
 */
export class BufferPool {
  private pools: Map<number, ArrayBuffer[]>;
  private inUse: Map<ArrayBuffer, number>;
  private maxPoolSize: number;
  private maxTotalMemory: number;
  private currentMemory: number;

  constructor(config: BufferPoolConfig = {}) {
    this.pools = new Map();
    this.inUse = new Map();
    this.maxPoolSize = config.maxPoolSize || 10;
    this.maxTotalMemory = config.maxTotalMemory || 500 * 1024 * 1024; // 500MB default
    this.currentMemory = 0;
  }

  /**
   * Acquires a buffer of specified size.
   * 
   * @param size - Size in bytes
   * @returns ArrayBuffer
   */
  acquire(size: number): ArrayBuffer {
    const poolKey = this.roundToPowerOf2(size);
    const pool = this.pools.get(poolKey) || [];

    let buffer: ArrayBuffer;

    if (pool.length > 0) {
      // Reuse existing buffer
      buffer = pool.pop()!;
      this.currentMemory -= buffer.byteLength;
    } else {
      // Create new buffer
      buffer = new ArrayBuffer(poolKey);
    }

    // Track as in-use
    this.inUse.set(buffer, poolKey);
    this.currentMemory += buffer.byteLength;

    return buffer;
  }

  /**
   * Releases a buffer back to the pool.
   * 
   * @param buffer - ArrayBuffer to release
   */
  release(buffer: ArrayBuffer): void {
    const size = this.inUse.get(buffer);

    if (size === undefined) {
      console.warn('Attempting to release buffer not acquired from pool');
      return;
    }

    // Remove from in-use tracking
    this.inUse.delete(buffer);
    this.currentMemory -= buffer.byteLength;

    // Check if we should keep it in pool
    const pool = this.pools.get(size) || [];

    if (pool.length < this.maxPoolSize && this.currentMemory < this.maxTotalMemory) {
      pool.push(buffer);
      this.pools.set(size, pool);
      this.currentMemory += buffer.byteLength;
    }
    // Otherwise, let it be garbage collected
  }

  /**
   * Clears all buffers from pool.
   */
  clear(): void {
    this.pools.clear();
    this.inUse.clear();
    this.currentMemory = 0;
  }

  /**
   * Gets pool statistics.
   */
  getStats(): {
    pooledBuffers: number;
    inUseBuffers: number;
    totalMemory: number;
    pooledMemory: number;
  } {
    let pooledBuffers = 0;
    let pooledMemory = 0;

    this.pools.forEach(pool => {
      pooledBuffers += pool.length;
      pool.forEach(buffer => {
        pooledMemory += buffer.byteLength;
      });
    });

    return {
      pooledBuffers,
      inUseBuffers: this.inUse.size,
      totalMemory: this.currentMemory,
      pooledMemory,
    };
  }

  /**
   * Prunes unused buffers to free memory.
   */
  prune(): void {
    this.pools.forEach((pool, size) => {
      // Keep only half of each pool
      const keepCount = Math.ceil(pool.length / 2);
      pool.length = keepCount;
      this.pools.set(size, pool);
    });

    // Recalculate current memory
    this.recalculateMemory();
  }

  /**
   * Rounds size to nearest power of 2 for better pooling.
   */
  private roundToPowerOf2(size: number): number {
    let power = 1;
    while (power < size) {
      power *= 2;
    }
    return power;
  }

  /**
   * Recalculates total memory usage.
   */
  private recalculateMemory(): void {
    let total = 0;

    // Count pooled buffers
    this.pools.forEach(pool => {
      pool.forEach(buffer => {
        total += buffer.byteLength;
      });
    });

    // Count in-use buffers
    this.inUse.forEach(size => {
      total += size;
    });

    this.currentMemory = total;
  }
}

/**
 * Global buffer pool instance.
 */
export const globalBufferPool = new BufferPool();

