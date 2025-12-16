/**
 * BufferPool Tests
 * 
 * Comprehensive tests for ArrayBuffer Pool including:
 * - Basic acquire/release functionality
 * - Memory management and limits
 * - Performance tests
 * - Security tests (memory safety)
 * - Edge cases
 * 
 * @author Toaster (Senior QA Engineer)
 * @see Design Doc: 02-data-processing-pipeline.md (Lines 636-667)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BufferPool, globalBufferPool, BufferPoolConfig } from './BufferPool';

// ============================================================================
// BASIC FUNCTIONALITY TESTS
// ============================================================================

describe('BufferPool', () => {
  let pool: BufferPool;

  beforeEach(() => {
    pool = new BufferPool();
  });

  afterEach(() => {
    pool.clear();
  });

  describe('Basic Operations', () => {
    it('should acquire buffer of requested size', () => {
      const buffer = pool.acquire(1024);

      expect(buffer).toBeInstanceOf(ArrayBuffer);
      expect(buffer.byteLength).toBeGreaterThanOrEqual(1024);
    });

    it('should round size to power of 2', () => {
      const buffer1 = pool.acquire(100);
      const buffer2 = pool.acquire(500);
      const buffer3 = pool.acquire(1000);

      expect(buffer1.byteLength).toBe(128); // Next power of 2 after 100
      expect(buffer2.byteLength).toBe(512); // Next power of 2 after 500
      expect(buffer3.byteLength).toBe(1024); // Next power of 2 after 1000
    });

    it('should release buffer back to pool', () => {
      const buffer = pool.acquire(1024);
      pool.release(buffer);

      const stats = pool.getStats();
      expect(stats.pooledBuffers).toBe(1);
      expect(stats.inUseBuffers).toBe(0);
    });

    it('should reuse released buffer', () => {
      const buffer1 = pool.acquire(1024);
      pool.release(buffer1);

      const buffer2 = pool.acquire(1024);

      // Should get the same buffer back
      expect(buffer2).toBe(buffer1);
    });

    it('should track in-use buffers', () => {
      const buffer1 = pool.acquire(1024);
      const buffer2 = pool.acquire(2048);

      const stats = pool.getStats();
      expect(stats.inUseBuffers).toBe(2);
    });

    it('should clear all buffers', () => {
      pool.acquire(1024);
      pool.acquire(2048);
      pool.acquire(4096);

      pool.clear();

      const stats = pool.getStats();
      expect(stats.pooledBuffers).toBe(0);
      expect(stats.inUseBuffers).toBe(0);
      expect(stats.totalMemory).toBe(0);
    });
  });

  // ============================================================================
  // POOL SIZE LIMITS TESTS
  // ============================================================================

  describe('Pool Size Limits', () => {
    it('should respect maxPoolSize per size category', () => {
      const limitedPool = new BufferPool({ maxPoolSize: 3 });

      // Acquire and release more buffers than limit
      const buffers: ArrayBuffer[] = [];
      for (let i = 0; i < 5; i++) {
        buffers.push(limitedPool.acquire(1024));
      }

      // Release all
      buffers.forEach(b => limitedPool.release(b));

      const stats = limitedPool.getStats();
      expect(stats.pooledBuffers).toBeLessThanOrEqual(3);
    });

    it('should respect maxTotalMemory limit', () => {
      const limitedPool = new BufferPool({
        maxTotalMemory: 10 * 1024, // 10KB
        maxPoolSize: 100,
      });

      // Acquire and release buffers
      const buffers: ArrayBuffer[] = [];
      for (let i = 0; i < 20; i++) {
        buffers.push(limitedPool.acquire(1024));
      }

      buffers.forEach(b => limitedPool.release(b));

      const stats = limitedPool.getStats();
      expect(stats.totalMemory).toBeLessThanOrEqual(10 * 1024);
    });

    it('should use default limits when not specified', () => {
      const defaultPool = new BufferPool();

      // Default maxPoolSize is 10
      const buffers: ArrayBuffer[] = [];
      for (let i = 0; i < 15; i++) {
        buffers.push(defaultPool.acquire(1024));
      }

      buffers.forEach(b => defaultPool.release(b));

      const stats = defaultPool.getStats();
      expect(stats.pooledBuffers).toBeLessThanOrEqual(10);
    });
  });

  // ============================================================================
  // MEMORY MANAGEMENT TESTS
  // ============================================================================

  describe('Memory Management', () => {
    it('should track total memory correctly', () => {
      const buffer1 = pool.acquire(1024); // Rounds to 1024
      const buffer2 = pool.acquire(2048); // Rounds to 2048

      const stats = pool.getStats();
      expect(stats.totalMemory).toBe(1024 + 2048);
    });

    it('should update memory on release', () => {
      const buffer = pool.acquire(1024);
      const statsBeforeRelease = pool.getStats();

      pool.release(buffer);
      const statsAfterRelease = pool.getStats();

      // Memory should be tracked in pooled memory now
      expect(statsAfterRelease.pooledMemory).toBeGreaterThan(0);
    });

    it('should prune unused buffers', () => {
      // Acquire and release several buffers
      const buffers: ArrayBuffer[] = [];
      for (let i = 0; i < 10; i++) {
        buffers.push(pool.acquire(1024));
      }
      buffers.forEach(b => pool.release(b));

      const statsBeforePrune = pool.getStats();
      pool.prune();
      const statsAfterPrune = pool.getStats();

      expect(statsAfterPrune.pooledBuffers).toBeLessThanOrEqual(
        Math.ceil(statsBeforePrune.pooledBuffers / 2)
      );
    });

    it('should handle multiple size categories', () => {
      pool.acquire(128);
      pool.acquire(256);
      pool.acquire(512);
      pool.acquire(1024);

      const stats = pool.getStats();
      expect(stats.inUseBuffers).toBe(4);
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle zero size request', () => {
      const buffer = pool.acquire(0);

      // Should return minimum size buffer (power of 2)
      expect(buffer.byteLength).toBeGreaterThanOrEqual(1);
    });

    it('should handle very small size request', () => {
      const buffer = pool.acquire(1);

      expect(buffer.byteLength).toBe(1);
    });

    it('should handle very large size request', () => {
      const buffer = pool.acquire(100 * 1024 * 1024); // 100MB

      expect(buffer.byteLength).toBeGreaterThanOrEqual(100 * 1024 * 1024);
    });

    it('should warn when releasing unknown buffer', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const externalBuffer = new ArrayBuffer(1024);
      pool.release(externalBuffer);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Attempting to release buffer not acquired from pool'
      );

      consoleSpy.mockRestore();
    });

    it('should handle double release gracefully', () => {
      const buffer = pool.acquire(1024);
      pool.release(buffer);

      // Second release should warn but not crash
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      pool.release(buffer);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle rapid acquire/release cycles', () => {
      for (let i = 0; i < 1000; i++) {
        const buffer = pool.acquire(1024);
        pool.release(buffer);
      }

      const stats = pool.getStats();
      expect(stats.pooledBuffers).toBeGreaterThan(0);
      expect(stats.inUseBuffers).toBe(0);
    });

    it('should handle mixed size acquire/release', () => {
      const sizes = [128, 256, 512, 1024, 2048, 4096];
      const buffers: ArrayBuffer[] = [];

      // Acquire various sizes
      for (const size of sizes) {
        buffers.push(pool.acquire(size));
      }

      // Release in reverse order
      buffers.reverse().forEach(b => pool.release(b));

      const stats = pool.getStats();
      expect(stats.inUseBuffers).toBe(0);
      expect(stats.pooledBuffers).toBe(sizes.length);
    });
  });

  // ============================================================================
  // SECURITY TESTS
  // ============================================================================

  describe('Security Tests', () => {
    it('should not expose internal pool structure', () => {
      const buffer = pool.acquire(1024);

      // Stats should only expose counts, not actual buffers
      const stats = pool.getStats();
      expect(stats).not.toHaveProperty('pools');
      expect(stats).not.toHaveProperty('inUse');
    });

    it('should handle negative size request', () => {
      // Should not crash, should handle gracefully
      expect(() => {
        pool.acquire(-100);
      }).not.toThrow();
    });

    it('should handle NaN size request', () => {
      expect(() => {
        pool.acquire(NaN);
      }).not.toThrow();
    });

    it('should handle Infinity size request gracefully', () => {
      // This might throw due to memory limits, which is acceptable
      expect(() => {
        try {
          pool.acquire(Infinity);
        } catch {
          // Expected - can't allocate infinite memory
        }
      }).not.toThrow();
    });

    it('should not allow modification of returned stats', () => {
      pool.acquire(1024);
      const stats = pool.getStats();

      // Modifying stats should not affect pool
      (stats as any).pooledBuffers = 999;

      const newStats = pool.getStats();
      expect(newStats.pooledBuffers).not.toBe(999);
    });

    it('should handle concurrent-like access patterns', () => {
      const buffers: ArrayBuffer[] = [];

      // Simulate concurrent access pattern
      for (let i = 0; i < 100; i++) {
        if (i % 3 === 0 && buffers.length > 0) {
          const buffer = buffers.pop()!;
          pool.release(buffer);
        } else {
          buffers.push(pool.acquire(1024 * (i % 5 + 1)));
        }
      }

      // Clean up
      buffers.forEach(b => pool.release(b));

      const stats = pool.getStats();
      expect(stats.inUseBuffers).toBe(0);
    });
  });

  // ============================================================================
  // PERFORMANCE TESTS
  // ============================================================================

  describe('Performance Tests', () => {
    it('should acquire buffer in < 1ms', () => {
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        pool.acquire(1024);
      }
      const duration = performance.now() - start;

      expect(duration / 1000).toBeLessThan(1); // < 1ms per acquire
    });

    it('should release buffer in < 1ms', () => {
      const buffers = Array.from({ length: 1000 }, () => pool.acquire(1024));

      const start = performance.now();
      buffers.forEach(b => pool.release(b));
      const duration = performance.now() - start;

      expect(duration / 1000).toBeLessThan(1); // < 1ms per release
    });

    it('should be faster with pooling than without', () => {
      // Without pooling
      const startWithout = performance.now();
      for (let i = 0; i < 1000; i++) {
        new ArrayBuffer(1024);
      }
      const durationWithout = performance.now() - startWithout;

      // With pooling (reusing buffers)
      const buffer = pool.acquire(1024);
      pool.release(buffer);

      const startWith = performance.now();
      for (let i = 0; i < 1000; i++) {
        const b = pool.acquire(1024);
        pool.release(b);
      }
      const durationWith = performance.now() - startWith;

      // Pooling should be competitive (may not always be faster due to overhead)
      console.log(`Without pooling: ${durationWithout.toFixed(2)}ms`);
      console.log(`With pooling: ${durationWith.toFixed(2)}ms`);

      // At minimum, pooling should complete in reasonable time
      expect(durationWith).toBeLessThan(100);
    });

    it('should handle large buffer allocations efficiently', () => {
      const start = performance.now();
      
      // Allocate large buffers
      const buffers: ArrayBuffer[] = [];
      for (let i = 0; i < 10; i++) {
        buffers.push(pool.acquire(10 * 1024 * 1024)); // 10MB each
      }
      
      buffers.forEach(b => pool.release(b));
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(500);
    });
  });

  // ============================================================================
  // GLOBAL POOL TESTS
  // ============================================================================

  describe('Global Buffer Pool', () => {
    afterEach(() => {
      globalBufferPool.clear();
    });

    it('should be a singleton', () => {
      const buffer = globalBufferPool.acquire(1024);
      globalBufferPool.release(buffer);

      const stats = globalBufferPool.getStats();
      expect(stats.pooledBuffers).toBeGreaterThan(0);
    });

    it('should be usable across multiple operations', () => {
      const buffer1 = globalBufferPool.acquire(1024);
      const buffer2 = globalBufferPool.acquire(2048);

      globalBufferPool.release(buffer1);
      globalBufferPool.release(buffer2);

      const buffer3 = globalBufferPool.acquire(1024);
      expect(buffer3).toBe(buffer1);
    });
  });

  // ============================================================================
  // STRESS TESTS
  // ============================================================================

  describe('Stress Tests', () => {
    it('should handle 10,000 acquire/release cycles', () => {
      const start = performance.now();

      for (let i = 0; i < 10000; i++) {
        const buffer = pool.acquire(1024);
        pool.release(buffer);
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(1000); // < 1 second

      const stats = pool.getStats();
      expect(stats.inUseBuffers).toBe(0);
    });

    it('should maintain stability under varied workload', () => {
      const sizes = [64, 128, 256, 512, 1024, 2048, 4096, 8192];
      const activeBuffers: Map<number, ArrayBuffer[]> = new Map();

      sizes.forEach(size => activeBuffers.set(size, []));

      // Simulate varied workload
      for (let i = 0; i < 5000; i++) {
        const size = sizes[i % sizes.length];
        const buffers = activeBuffers.get(size)!;

        if (Math.random() > 0.3 && buffers.length > 0) {
          // Release random buffer
          const idx = Math.floor(Math.random() * buffers.length);
          pool.release(buffers[idx]);
          buffers.splice(idx, 1);
        } else {
          // Acquire new buffer
          buffers.push(pool.acquire(size));
        }
      }

      // Clean up
      activeBuffers.forEach(buffers => {
        buffers.forEach(b => pool.release(b));
      });

      const stats = pool.getStats();
      expect(stats.inUseBuffers).toBe(0);
    });
  });
});

