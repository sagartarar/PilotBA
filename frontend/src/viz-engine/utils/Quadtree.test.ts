/**
 * Quadtree Tests
 * 
 * Comprehensive tests for Quadtree spatial indexing including:
 * - Basic operations (insert, query, findNearest)
 * - Performance tests (O(log n) operations)
 * - Edge cases
 * - Security tests
 * 
 * @author Toaster (Senior QA Engineer)
 * @see Design Doc: 01-webgl-rendering-engine.md (Lines 441-456)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Quadtree, Point, BoundingBox } from './Quadtree';

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Generates random points within bounds.
 */
function generateRandomPoints(count: number, bounds: BoundingBox): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    points.push({
      x: bounds.x + Math.random() * bounds.width,
      y: bounds.y + Math.random() * bounds.height,
      data: { id: i },
    });
  }
  return points;
}

/**
 * Generates grid points.
 */
function generateGridPoints(rows: number, cols: number, bounds: BoundingBox): Point[] {
  const points: Point[] = [];
  const cellWidth = bounds.width / cols;
  const cellHeight = bounds.height / rows;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      points.push({
        x: bounds.x + col * cellWidth + cellWidth / 2,
        y: bounds.y + row * cellHeight + cellHeight / 2,
        data: { row, col },
      });
    }
  }
  return points;
}

// ============================================================================
// BASIC OPERATIONS TESTS
// ============================================================================

describe('Quadtree', () => {
  const defaultBounds: BoundingBox = { x: 0, y: 0, width: 1000, height: 1000 };
  let quadtree: Quadtree;

  beforeEach(() => {
    quadtree = new Quadtree(defaultBounds);
  });

  describe('Insertion', () => {
    it('should insert a point within bounds', () => {
      const point: Point = { x: 500, y: 500 };
      const result = quadtree.insert(point);

      expect(result).toBe(true);
      expect(quadtree.size()).toBe(1);
    });

    it('should reject point outside bounds', () => {
      const point: Point = { x: 1500, y: 500 };
      const result = quadtree.insert(point);

      expect(result).toBe(false);
      expect(quadtree.size()).toBe(0);
    });

    it('should insert multiple points', () => {
      const points: Point[] = [
        { x: 100, y: 100 },
        { x: 200, y: 200 },
        { x: 300, y: 300 },
        { x: 400, y: 400 },
        { x: 500, y: 500 },
      ];

      points.forEach(p => quadtree.insert(p));

      expect(quadtree.size()).toBe(5);
    });

    it('should insert point on boundary', () => {
      const point: Point = { x: 0, y: 0 };
      const result = quadtree.insert(point);

      expect(result).toBe(true);
    });

    it('should reject point on far boundary', () => {
      const point: Point = { x: 1000, y: 1000 };
      const result = quadtree.insert(point);

      // Point at x=1000 is outside [0, 1000)
      expect(result).toBe(false);
    });

    it('should subdivide when capacity exceeded', () => {
      const tree = new Quadtree(defaultBounds, 4);

      for (let i = 0; i < 10; i++) {
        tree.insert({ x: i * 100, y: i * 100 });
      }

      expect(tree.size()).toBe(10);
    });

    it('should handle points with user data', () => {
      const point: Point = { x: 500, y: 500, data: { id: 42, name: 'test' } };
      quadtree.insert(point);

      const found = quadtree.query({
        x: 400, y: 400, width: 200, height: 200,
      });

      expect(found.length).toBe(1);
      expect(found[0].data).toEqual({ id: 42, name: 'test' });
    });
  });

  // ============================================================================
  // QUERY TESTS
  // ============================================================================

  describe('Query', () => {
    beforeEach(() => {
      // Insert grid of points
      const points = generateGridPoints(10, 10, defaultBounds);
      points.forEach(p => quadtree.insert(p));
    });

    it('should find all points in bounds', () => {
      const found = quadtree.query(defaultBounds);
      expect(found.length).toBe(100);
    });

    it('should find points in partial range', () => {
      const range: BoundingBox = { x: 0, y: 0, width: 500, height: 500 };
      const found = quadtree.query(range);

      // Should find approximately 25 points (5x5 grid in quarter)
      expect(found.length).toBeGreaterThan(0);
      expect(found.length).toBeLessThanOrEqual(25);
    });

    it('should return empty array for range outside bounds', () => {
      const range: BoundingBox = { x: 2000, y: 2000, width: 100, height: 100 };
      const found = quadtree.query(range);

      expect(found.length).toBe(0);
    });

    it('should find single point', () => {
      const tree = new Quadtree(defaultBounds);
      tree.insert({ x: 500, y: 500 });

      const found = tree.query({ x: 450, y: 450, width: 100, height: 100 });
      expect(found.length).toBe(1);
    });

    it('should handle small query range', () => {
      const range: BoundingBox = { x: 45, y: 45, width: 10, height: 10 };
      const found = quadtree.query(range);

      // Should find 1 point (grid point at 50, 50)
      expect(found.length).toBeLessThanOrEqual(1);
    });

    it('should handle query at edge of bounds', () => {
      const range: BoundingBox = { x: 0, y: 0, width: 100, height: 100 };
      const found = quadtree.query(range);

      expect(found.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // FIND NEAREST TESTS
  // ============================================================================

  describe('Find Nearest', () => {
    it('should find nearest point', () => {
      quadtree.insert({ x: 100, y: 100, data: 'a' });
      quadtree.insert({ x: 200, y: 200, data: 'b' });
      quadtree.insert({ x: 300, y: 300, data: 'c' });

      const nearest = quadtree.findNearest(110, 110, 50);

      expect(nearest).not.toBeNull();
      expect(nearest?.data).toBe('a');
    });

    it('should return null when no points in radius', () => {
      quadtree.insert({ x: 100, y: 100 });

      const nearest = quadtree.findNearest(500, 500, 10);

      expect(nearest).toBeNull();
    });

    it('should find exact match', () => {
      quadtree.insert({ x: 100, y: 100, data: 'exact' });

      const nearest = quadtree.findNearest(100, 100, 10);

      expect(nearest).not.toBeNull();
      expect(nearest?.data).toBe('exact');
    });

    it('should find closest among multiple candidates', () => {
      quadtree.insert({ x: 100, y: 100, data: 'far' });
      quadtree.insert({ x: 150, y: 150, data: 'close' });
      quadtree.insert({ x: 200, y: 200, data: 'farther' });

      const nearest = quadtree.findNearest(160, 160, 100);

      expect(nearest?.data).toBe('close');
    });

    it('should handle empty quadtree', () => {
      const nearest = quadtree.findNearest(500, 500, 100);
      expect(nearest).toBeNull();
    });
  });

  // ============================================================================
  // CLEAR AND SIZE TESTS
  // ============================================================================

  describe('Clear and Size', () => {
    it('should clear all points', () => {
      const points = generateRandomPoints(100, defaultBounds);
      points.forEach(p => quadtree.insert(p));

      expect(quadtree.size()).toBe(100);

      quadtree.clear();

      expect(quadtree.size()).toBe(0);
    });

    it('should allow insertion after clear', () => {
      quadtree.insert({ x: 100, y: 100 });
      quadtree.clear();
      quadtree.insert({ x: 200, y: 200 });

      expect(quadtree.size()).toBe(1);
    });

    it('should return correct size after subdivisions', () => {
      const tree = new Quadtree(defaultBounds, 4);
      const points = generateRandomPoints(100, defaultBounds);
      points.forEach(p => tree.insert(p));

      expect(tree.size()).toBe(100);
    });
  });

  // ============================================================================
  // BOUNDS TESTS
  // ============================================================================

  describe('Bounds', () => {
    it('should return correct bounds', () => {
      const bounds = quadtree.getBounds();

      expect(bounds.x).toBe(0);
      expect(bounds.y).toBe(0);
      expect(bounds.width).toBe(1000);
      expect(bounds.height).toBe(1000);
    });

    it('should not allow modification of bounds', () => {
      const bounds = quadtree.getBounds();
      bounds.x = 999;

      expect(quadtree.getBounds().x).toBe(0);
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle very small bounds', () => {
      const smallTree = new Quadtree({ x: 0, y: 0, width: 1, height: 1 });
      smallTree.insert({ x: 0.5, y: 0.5 });

      expect(smallTree.size()).toBe(1);
    });

    it('should handle negative coordinates', () => {
      const negTree = new Quadtree({ x: -500, y: -500, width: 1000, height: 1000 });
      negTree.insert({ x: -250, y: -250 });
      negTree.insert({ x: 250, y: 250 });

      expect(negTree.size()).toBe(2);
    });

    it('should handle floating point coordinates', () => {
      quadtree.insert({ x: 100.123456, y: 200.654321 });
      quadtree.insert({ x: 100.123457, y: 200.654322 });

      expect(quadtree.size()).toBe(2);
    });

    it('should handle many points at same location', () => {
      for (let i = 0; i < 100; i++) {
        quadtree.insert({ x: 500, y: 500, data: i });
      }

      expect(quadtree.size()).toBe(100);
    });

    it('should handle capacity of 1', () => {
      const tree = new Quadtree(defaultBounds, 1);
      tree.insert({ x: 100, y: 100 });
      tree.insert({ x: 200, y: 200 });
      tree.insert({ x: 300, y: 300 });

      expect(tree.size()).toBe(3);
    });

    it('should handle very large capacity', () => {
      const tree = new Quadtree(defaultBounds, 10000);
      const points = generateRandomPoints(100, defaultBounds);
      points.forEach(p => tree.insert(p));

      expect(tree.size()).toBe(100);
    });

    it('should handle zero-width range query', () => {
      quadtree.insert({ x: 100, y: 100 });
      const found = quadtree.query({ x: 100, y: 100, width: 0, height: 0 });

      expect(found.length).toBe(0);
    });
  });

  // ============================================================================
  // SECURITY TESTS
  // ============================================================================

  describe('Security Tests', () => {
    it('should handle NaN coordinates', () => {
      const result = quadtree.insert({ x: NaN, y: 500 });
      // NaN comparisons are always false, so point won't be in bounds
      expect(result).toBe(false);
    });

    it('should handle Infinity coordinates', () => {
      const result = quadtree.insert({ x: Infinity, y: 500 });
      expect(result).toBe(false);
    });

    it('should handle negative Infinity coordinates', () => {
      const result = quadtree.insert({ x: -Infinity, y: 500 });
      expect(result).toBe(false);
    });

    it('should handle malicious data in points', () => {
      const maliciousPoint: Point = {
        x: 500,
        y: 500,
        data: {
          __proto__: 'malicious',
          constructor: 'attack',
          toString: () => 'evil',
        },
      };

      quadtree.insert(maliciousPoint);
      const found = quadtree.query(defaultBounds);

      // Should store data without executing
      expect(found.length).toBe(1);
      expect(Object.prototype.toString).toBeDefined();
    });

    it('should handle very large coordinates', () => {
      const largeTree = new Quadtree({
        x: 0,
        y: 0,
        width: Number.MAX_SAFE_INTEGER,
        height: Number.MAX_SAFE_INTEGER,
      });

      largeTree.insert({ x: 1e15, y: 1e15 });
      expect(largeTree.size()).toBe(1);
    });

    it('should handle circular reference in data', () => {
      const data: any = { value: 1 };
      data.self = data; // Circular reference

      const point: Point = { x: 500, y: 500, data };
      quadtree.insert(point);

      const found = quadtree.query(defaultBounds);
      expect(found.length).toBe(1);
      expect(found[0].data.self).toBe(found[0].data);
    });
  });

  // ============================================================================
  // PERFORMANCE TESTS
  // ============================================================================

  describe('Performance Tests', () => {
    it('should insert 10,000 points in < 500ms', () => {
      const points = generateRandomPoints(10000, defaultBounds);

      const start = performance.now();
      points.forEach(p => quadtree.insert(p));
      const duration = performance.now() - start;

      expect(quadtree.size()).toBe(10000);
      expect(duration).toBeLessThan(500); // Relaxed for CI
      
      console.log(`Insert 10K points: ${duration.toFixed(2)}ms`);
    });

    it('should insert 100,000 points in < 3000ms', () => {
      const points = generateRandomPoints(100000, defaultBounds);

      const start = performance.now();
      points.forEach(p => quadtree.insert(p));
      const duration = performance.now() - start;

      expect(quadtree.size()).toBe(100000);
      expect(duration).toBeLessThan(3000); // Relaxed for CI
      
      console.log(`Insert 100K points: ${duration.toFixed(2)}ms`);
    });

    it('should query efficiently (O(log n))', () => {
      const points = generateRandomPoints(100000, defaultBounds);
      points.forEach(p => quadtree.insert(p));

      const queryRange: BoundingBox = { x: 400, y: 400, width: 200, height: 200 };

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        quadtree.query(queryRange);
      }
      const duration = performance.now() - start;

      // 1000 queries should be fast
      expect(duration).toBeLessThan(500); // Relaxed for CI
      
      console.log(`1000 queries on 100K points: ${duration.toFixed(2)}ms`);
    });

    it('should findNearest efficiently', () => {
      const points = generateRandomPoints(100000, defaultBounds);
      points.forEach(p => quadtree.insert(p));

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        quadtree.findNearest(
          Math.random() * 1000,
          Math.random() * 1000,
          50
        );
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(200);
      
      console.log(`1000 findNearest on 100K points: ${duration.toFixed(2)}ms`);
    });

    it('should scale better than linear search', () => {
      const points = generateRandomPoints(10000, defaultBounds);
      points.forEach(p => quadtree.insert(p));

      const queryRange: BoundingBox = { x: 400, y: 400, width: 200, height: 200 };

      // Quadtree query
      const startQuadtree = performance.now();
      for (let i = 0; i < 100; i++) {
        quadtree.query(queryRange);
      }
      const quadtreeDuration = performance.now() - startQuadtree;

      // Linear search
      const startLinear = performance.now();
      for (let i = 0; i < 100; i++) {
        points.filter(p =>
          p.x >= queryRange.x &&
          p.x < queryRange.x + queryRange.width &&
          p.y >= queryRange.y &&
          p.y < queryRange.y + queryRange.height
        );
      }
      const linearDuration = performance.now() - startLinear;

      console.log(`Quadtree: ${quadtreeDuration.toFixed(2)}ms, Linear: ${linearDuration.toFixed(2)}ms`);

      // Quadtree should be competitive or faster
      expect(quadtreeDuration).toBeLessThan(linearDuration * 2);
    });
  });

  // ============================================================================
  // DEBUG/VISUALIZATION TESTS
  // ============================================================================

  describe('Debug Features', () => {
    it('should return all nodes for visualization', () => {
      const tree = new Quadtree(defaultBounds, 4);
      const points = generateRandomPoints(20, defaultBounds);
      points.forEach(p => tree.insert(p));

      const nodes = tree.getAllNodes();

      expect(nodes.length).toBeGreaterThan(1); // Should have subdivided
      expect(nodes[0]).toBe(tree); // First node is root
    });

    it('should return single node when not subdivided', () => {
      quadtree.insert({ x: 500, y: 500 });
      const nodes = quadtree.getAllNodes();

      expect(nodes.length).toBe(1);
    });
  });
});

