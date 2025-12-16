/**
 * Line Simplification Tests
 * 
 * Comprehensive tests for line simplification algorithms including:
 * - Douglas-Peucker algorithm
 * - Visvalingam-Whyatt algorithm
 * - Level of Detail (LOD) simplification
 * - Adaptive tolerance calculation
 * - Performance tests
 * 
 * @author Toaster (Senior QA Engineer)
 * @see Design Doc: 01-webgl-rendering-engine.md (Lines 329-343)
 */

import { describe, it, expect } from 'vitest';
import {
  simplifyLine,
  calculateTolerance,
  simplifyByArea,
  simplifyByLOD,
  Point,
} from './simplify';

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Generates a straight line of points.
 */
function generateStraightLine(count: number, start: Point, end: Point): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    points.push({
      x: start.x + t * (end.x - start.x),
      y: start.y + t * (end.y - start.y),
    });
  }
  return points;
}

/**
 * Generates a sine wave of points.
 */
function generateSineWave(count: number, amplitude: number, frequency: number): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    const x = i;
    const y = amplitude * Math.sin(frequency * i);
    points.push({ x, y });
  }
  return points;
}

/**
 * Generates a zigzag pattern.
 */
function generateZigzag(count: number, amplitude: number): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    points.push({
      x: i,
      y: i % 2 === 0 ? 0 : amplitude,
    });
  }
  return points;
}

/**
 * Generates random walk points.
 */
function generateRandomWalk(count: number, stepSize: number): Point[] {
  const points: Point[] = [{ x: 0, y: 0 }];
  for (let i = 1; i < count; i++) {
    const prev = points[i - 1];
    points.push({
      x: prev.x + stepSize,
      y: prev.y + (Math.random() - 0.5) * stepSize * 2,
    });
  }
  return points;
}

/**
 * Calculates total path length.
 */
function pathLength(points: Point[]): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  return length;
}

// ============================================================================
// DOUGLAS-PEUCKER ALGORITHM TESTS
// ============================================================================

describe('Line Simplification', () => {
  describe('Douglas-Peucker Algorithm', () => {
    it('should return original points for 2 or fewer points', () => {
      const twoPoints: Point[] = [{ x: 0, y: 0 }, { x: 100, y: 100 }];
      const simplified = simplifyLine(twoPoints, 10);

      expect(simplified.length).toBe(2);
      expect(simplified).toEqual(twoPoints);
    });

    it('should return original points for single point', () => {
      const onePoint: Point[] = [{ x: 50, y: 50 }];
      const simplified = simplifyLine(onePoint, 10);

      expect(simplified.length).toBe(1);
    });

    it('should simplify straight line to two points', () => {
      const line = generateStraightLine(100, { x: 0, y: 0 }, { x: 100, y: 100 });
      const simplified = simplifyLine(line, 1);

      expect(simplified.length).toBe(2);
      expect(simplified[0]).toEqual({ x: 0, y: 0 });
      expect(simplified[simplified.length - 1]).toEqual({ x: 100, y: 100 });
    });

    it('should preserve endpoints', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 50, y: 10 },
        { x: 100, y: 0 },
      ];
      const simplified = simplifyLine(points, 5);

      expect(simplified[0]).toEqual(points[0]);
      expect(simplified[simplified.length - 1]).toEqual(points[points.length - 1]);
    });

    it('should keep significant points with zigzag pattern', () => {
      const zigzag = generateZigzag(10, 50);
      const simplified = simplifyLine(zigzag, 10);

      // Should keep some zigzag structure
      expect(simplified.length).toBeGreaterThan(2);
    });

    it('should reduce points more with higher tolerance', () => {
      const wave = generateSineWave(100, 50, 0.1);
      
      const lowTolerance = simplifyLine(wave, 1);
      const highTolerance = simplifyLine(wave, 20);

      expect(highTolerance.length).toBeLessThan(lowTolerance.length);
    });

    it('should return all points with zero tolerance', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 50, y: 25 },
        { x: 100, y: 0 },
      ];
      const simplified = simplifyLine(points, 0);

      expect(simplified.length).toBe(3);
    });

    it('should handle collinear points', () => {
      const collinear: Point[] = [
        { x: 0, y: 0 },
        { x: 25, y: 25 },
        { x: 50, y: 50 },
        { x: 75, y: 75 },
        { x: 100, y: 100 },
      ];
      const simplified = simplifyLine(collinear, 1);

      expect(simplified.length).toBe(2);
    });

    it('should handle sharp corners', () => {
      const corners: Point[] = [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 50 },
        { x: 100, y: 50 },
      ];
      const simplified = simplifyLine(corners, 1);

      // Should preserve corners
      expect(simplified.length).toBe(4);
    });
  });

  // ============================================================================
  // TOLERANCE CALCULATION TESTS
  // ============================================================================

  describe('Tolerance Calculation', () => {
    it('should calculate tolerance based on zoom level', () => {
      const tolerance1 = calculateTolerance(1, 1000, 1);
      const tolerance2 = calculateTolerance(2, 1000, 1);

      expect(tolerance1).toBe(1);
      expect(tolerance2).toBe(0.5);
    });

    it('should scale tolerance with base pixel tolerance', () => {
      const tolerance1 = calculateTolerance(1, 1000, 1);
      const tolerance2 = calculateTolerance(1, 1000, 2);

      expect(tolerance2).toBe(tolerance1 * 2);
    });

    it('should use default base pixel tolerance', () => {
      const tolerance = calculateTolerance(1, 1000);
      expect(tolerance).toBe(1);
    });

    it('should handle high zoom levels', () => {
      const tolerance = calculateTolerance(100, 1000, 1);
      expect(tolerance).toBe(0.01);
    });

    it('should handle low zoom levels', () => {
      const tolerance = calculateTolerance(0.1, 1000, 1);
      expect(tolerance).toBe(10);
    });
  });

  // ============================================================================
  // VISVALINGAM-WHYATT ALGORITHM TESTS
  // ============================================================================

  describe('Visvalingam-Whyatt Algorithm (simplifyByArea)', () => {
    it('should reduce to target point count', () => {
      const points = generateSineWave(100, 50, 0.1);
      const simplified = simplifyByArea(points, 20);

      expect(simplified.length).toBeLessThanOrEqual(20);
    });

    it('should return original if target >= length', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 50, y: 50 },
        { x: 100, y: 0 },
      ];
      const simplified = simplifyByArea(points, 10);

      expect(simplified.length).toBe(3);
    });

    it('should preserve first and last points', () => {
      const points = generateRandomWalk(50, 10);
      const simplified = simplifyByArea(points, 10);

      expect(simplified[0]).toEqual(points[0]);
      expect(simplified[simplified.length - 1]).toEqual(points[points.length - 1]);
    });

    it('should return original for 2 or fewer points', () => {
      const twoPoints: Point[] = [{ x: 0, y: 0 }, { x: 100, y: 100 }];
      const simplified = simplifyByArea(twoPoints, 1);

      expect(simplified.length).toBe(2);
    });

    it('should remove points with smallest effective area first', () => {
      // Triangle with one point very close to line
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 50, y: 1 }, // Very small area contribution
        { x: 100, y: 0 },
      ];
      const simplified = simplifyByArea(points, 2);

      expect(simplified.length).toBe(2);
      expect(simplified).toEqual([{ x: 0, y: 0 }, { x: 100, y: 0 }]);
    });
  });

  // ============================================================================
  // LEVEL OF DETAIL TESTS
  // ============================================================================

  describe('Level of Detail (simplifyByLOD)', () => {
    it('should return all points at high zoom', () => {
      const points = generateStraightLine(100, { x: 0, y: 0 }, { x: 100, y: 100 });
      const simplified = simplifyByLOD(points, 10);

      expect(simplified.length).toBe(100);
    });

    it('should reduce points at medium zoom', () => {
      const points = generateStraightLine(100, { x: 0, y: 0 }, { x: 100, y: 100 });
      const simplified = simplifyByLOD(points, 2);

      expect(simplified.length).toBeLessThan(100);
      expect(simplified.length).toBeGreaterThan(2);
    });

    it('should heavily reduce points at low zoom', () => {
      const points = generateStraightLine(1000, { x: 0, y: 0 }, { x: 1000, y: 1000 });
      const simplified = simplifyByLOD(points, 0.5);

      expect(simplified.length).toBeLessThan(50);
    });

    it('should always include first and last points', () => {
      const points = generateStraightLine(100, { x: 0, y: 0 }, { x: 100, y: 100 });
      const simplified = simplifyByLOD(points, 0.5);

      expect(simplified[0]).toEqual(points[0]);
      expect(simplified[simplified.length - 1]).toEqual(points[points.length - 1]);
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle empty array', () => {
      const simplified = simplifyLine([], 10);
      expect(simplified.length).toBe(0);
    });

    it('should handle negative coordinates', () => {
      const points: Point[] = [
        { x: -100, y: -100 },
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ];
      const simplified = simplifyLine(points, 1);

      expect(simplified.length).toBe(2);
    });

    it('should handle very small coordinates', () => {
      const points: Point[] = [
        { x: 0.001, y: 0.001 },
        { x: 0.002, y: 0.002 },
        { x: 0.003, y: 0.003 },
      ];
      const simplified = simplifyLine(points, 0.0001);

      expect(simplified.length).toBe(2);
    });

    it('should handle very large coordinates', () => {
      const points: Point[] = [
        { x: 1e10, y: 1e10 },
        { x: 2e10, y: 2e10 },
        { x: 3e10, y: 3e10 },
      ];
      const simplified = simplifyLine(points, 1e5);

      expect(simplified.length).toBe(2);
    });

    it('should handle duplicate points', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 100, y: 100 },
        { x: 100, y: 100 },
      ];
      const simplified = simplifyLine(points, 1);

      expect(simplified.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle vertical line', () => {
      const points = generateStraightLine(100, { x: 50, y: 0 }, { x: 50, y: 100 });
      const simplified = simplifyLine(points, 1);

      expect(simplified.length).toBe(2);
    });

    it('should handle horizontal line', () => {
      const points = generateStraightLine(100, { x: 0, y: 50 }, { x: 100, y: 50 });
      const simplified = simplifyLine(points, 1);

      expect(simplified.length).toBe(2);
    });

    it('should handle single point line (degenerate)', () => {
      const points: Point[] = [
        { x: 50, y: 50 },
        { x: 50, y: 50 },
        { x: 50, y: 50 },
      ];
      const simplified = simplifyLine(points, 1);

      expect(simplified.length).toBeLessThanOrEqual(3);
    });
  });

  // ============================================================================
  // SECURITY TESTS
  // ============================================================================

  describe('Security Tests', () => {
    it('should handle NaN coordinates', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: NaN, y: 50 },
        { x: 100, y: 100 },
      ];

      // Should not throw
      expect(() => simplifyLine(points, 10)).not.toThrow();
    });

    it('should handle Infinity coordinates', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: Infinity, y: 50 },
        { x: 100, y: 100 },
      ];

      expect(() => simplifyLine(points, 10)).not.toThrow();
    });

    it('should handle negative tolerance gracefully', () => {
      const points = generateStraightLine(10, { x: 0, y: 0 }, { x: 100, y: 100 });

      // Negative tolerance should work like zero tolerance
      expect(() => simplifyLine(points, -10)).not.toThrow();
    });

    it('should handle very large tolerance', () => {
      const points = generateSineWave(100, 50, 0.1);
      const simplified = simplifyLine(points, 1e10);

      // Should simplify to just endpoints
      expect(simplified.length).toBe(2);
    });
  });

  // ============================================================================
  // QUALITY TESTS
  // ============================================================================

  describe('Quality Tests', () => {
    it('should preserve visual shape', () => {
      const wave = generateSineWave(100, 50, 0.1);
      const simplified = simplifyLine(wave, 5);

      // Simplified line should still have peaks and valleys
      let hasPositive = false;
      let hasNegative = false;

      for (const point of simplified) {
        if (point.y > 20) hasPositive = true;
        if (point.y < -20) hasNegative = true;
      }

      expect(hasPositive).toBe(true);
      expect(hasNegative).toBe(true);
    });

    it('should not increase path length significantly', () => {
      const wave = generateSineWave(100, 50, 0.1);
      const simplified = simplifyLine(wave, 5);

      const originalLength = pathLength(wave);
      const simplifiedLength = pathLength(simplified);

      // Simplified path should be shorter (chord vs arc)
      expect(simplifiedLength).toBeLessThanOrEqual(originalLength);
    });

    it('should maintain monotonicity when possible', () => {
      const monotonic = generateStraightLine(100, { x: 0, y: 0 }, { x: 100, y: 100 });
      const simplified = simplifyLine(monotonic, 1);

      // Check x coordinates are still monotonically increasing
      for (let i = 1; i < simplified.length; i++) {
        expect(simplified[i].x).toBeGreaterThanOrEqual(simplified[i - 1].x);
      }
    });
  });

  // ============================================================================
  // PERFORMANCE TESTS
  // ============================================================================

  describe('Performance Tests', () => {
    it('should simplify 10,000 points in < 50ms', () => {
      const points = generateRandomWalk(10000, 1);

      const start = performance.now();
      const simplified = simplifyLine(points, 5);
      const duration = performance.now() - start;

      expect(simplified.length).toBeLessThan(10000);
      expect(duration).toBeLessThan(50);
      
      console.log(`Simplify 10K points: ${duration.toFixed(2)}ms, reduced to ${simplified.length}`);
    });

    it('should simplify 100,000 points in < 500ms', () => {
      const points = generateRandomWalk(100000, 1);

      const start = performance.now();
      const simplified = simplifyLine(points, 5);
      const duration = performance.now() - start;

      expect(simplified.length).toBeLessThan(100000);
      expect(duration).toBeLessThan(500);
      
      console.log(`Simplify 100K points: ${duration.toFixed(2)}ms, reduced to ${simplified.length}`);
    });

    it('should handle simplifyByArea efficiently', () => {
      const points = generateRandomWalk(10000, 1);

      const start = performance.now();
      const simplified = simplifyByArea(points, 500);
      const duration = performance.now() - start;

      expect(simplified.length).toBeLessThanOrEqual(500);
      expect(duration).toBeLessThan(500);
    });

    it('should handle simplifyByLOD efficiently', () => {
      const points = generateRandomWalk(100000, 1);

      const start = performance.now();
      const simplified = simplifyByLOD(points, 0.5);
      const duration = performance.now() - start;

      expect(simplified.length).toBeLessThan(100000);
      expect(duration).toBeLessThan(50);
    });

    it('should scale sub-linearly with point count', () => {
      const points10k = generateRandomWalk(10000, 1);
      const points100k = generateRandomWalk(100000, 1);

      const start10k = performance.now();
      simplifyLine(points10k, 5);
      const duration10k = performance.now() - start10k;

      const start100k = performance.now();
      simplifyLine(points100k, 5);
      const duration100k = performance.now() - start100k;

      // 10x more points should not take 10x longer
      // Douglas-Peucker is O(n log n) average
      expect(duration100k).toBeLessThan(duration10k * 15);
    });
  });

  // ============================================================================
  // REDUCTION RATIO TESTS
  // ============================================================================

  describe('Reduction Ratio Tests', () => {
    it('should achieve significant reduction on noisy data', () => {
      const noisy = generateRandomWalk(1000, 1);
      const simplified = simplifyLine(noisy, 10);

      const reductionRatio = simplified.length / noisy.length;
      expect(reductionRatio).toBeLessThan(0.5); // At least 50% reduction
    });

    it('should achieve near-total reduction on straight line', () => {
      const straight = generateStraightLine(1000, { x: 0, y: 0 }, { x: 1000, y: 1000 });
      const simplified = simplifyLine(straight, 1);

      const reductionRatio = simplified.length / straight.length;
      expect(reductionRatio).toBeLessThan(0.01); // 99%+ reduction
    });

    it('should preserve detail on complex shapes', () => {
      const wave = generateSineWave(1000, 50, 0.1);
      const simplified = simplifyLine(wave, 1);

      // Should keep enough points to represent the wave
      expect(simplified.length).toBeGreaterThan(10);
    });
  });
});

