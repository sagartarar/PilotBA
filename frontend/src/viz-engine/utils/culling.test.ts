/**
 * Culling Utilities Tests
 * 
 * Comprehensive tests for viewport culling including:
 * - Point culling
 * - Rectangle culling
 * - Line segment culling and clipping
 * - Cohen-Sutherland algorithm
 * - Performance tests
 * 
 * @author Toaster (Senior QA Engineer)
 * @see Design Doc: 01-webgl-rendering-engine.md (Lines 356-366)
 */

import { describe, it, expect } from 'vitest';
import {
  createViewport,
  intersects,
  pointInViewport,
  cullPoints,
  cullRectangles,
  cullLineSegments,
  lineSegmentBounds,
  pointsBounds,
  clipLineSegment,
  clipPolyline,
  completelyInside,
  expandViewport,
  BoundingBox,
  Point,
  Viewport,
  LineSegment,
} from './culling';

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
    });
  }
  return points;
}

/**
 * Generates random rectangles within bounds.
 */
function generateRandomRects(count: number, bounds: BoundingBox): BoundingBox[] {
  const rects: BoundingBox[] = [];
  for (let i = 0; i < count; i++) {
    const x = bounds.x + Math.random() * bounds.width * 0.8;
    const y = bounds.y + Math.random() * bounds.height * 0.8;
    rects.push({
      x,
      y,
      width: Math.random() * bounds.width * 0.2,
      height: Math.random() * bounds.height * 0.2,
    });
  }
  return rects;
}

// ============================================================================
// VIEWPORT CREATION TESTS
// ============================================================================

describe('Culling Utilities', () => {
  describe('Viewport Creation', () => {
    it('should create viewport from bounding box', () => {
      const bounds: BoundingBox = { x: 100, y: 200, width: 800, height: 600 };
      const viewport = createViewport(bounds);

      expect(viewport.x).toBe(100);
      expect(viewport.y).toBe(200);
      expect(viewport.width).toBe(800);
      expect(viewport.height).toBe(600);
      expect(viewport.minX).toBe(100);
      expect(viewport.minY).toBe(200);
      expect(viewport.maxX).toBe(900);
      expect(viewport.maxY).toBe(800);
    });

    it('should handle zero-origin viewport', () => {
      const viewport = createViewport({ x: 0, y: 0, width: 1920, height: 1080 });

      expect(viewport.minX).toBe(0);
      expect(viewport.minY).toBe(0);
      expect(viewport.maxX).toBe(1920);
      expect(viewport.maxY).toBe(1080);
    });

    it('should handle negative origin viewport', () => {
      const viewport = createViewport({ x: -500, y: -500, width: 1000, height: 1000 });

      expect(viewport.minX).toBe(-500);
      expect(viewport.minY).toBe(-500);
      expect(viewport.maxX).toBe(500);
      expect(viewport.maxY).toBe(500);
    });
  });

  // ============================================================================
  // INTERSECTION TESTS
  // ============================================================================

  describe('Intersection Tests', () => {
    const viewport = createViewport({ x: 0, y: 0, width: 1000, height: 1000 });

    it('should detect intersection when box is inside viewport', () => {
      const box: BoundingBox = { x: 400, y: 400, width: 200, height: 200 };
      expect(intersects(box, viewport)).toBe(true);
    });

    it('should detect intersection when box overlaps left edge', () => {
      const box: BoundingBox = { x: -100, y: 400, width: 200, height: 200 };
      expect(intersects(box, viewport)).toBe(true);
    });

    it('should detect intersection when box overlaps right edge', () => {
      const box: BoundingBox = { x: 900, y: 400, width: 200, height: 200 };
      expect(intersects(box, viewport)).toBe(true);
    });

    it('should detect intersection when box overlaps top edge', () => {
      const box: BoundingBox = { x: 400, y: -100, width: 200, height: 200 };
      expect(intersects(box, viewport)).toBe(true);
    });

    it('should detect intersection when box overlaps bottom edge', () => {
      const box: BoundingBox = { x: 400, y: 900, width: 200, height: 200 };
      expect(intersects(box, viewport)).toBe(true);
    });

    it('should detect no intersection when box is to the left', () => {
      const box: BoundingBox = { x: -300, y: 400, width: 100, height: 100 };
      expect(intersects(box, viewport)).toBe(false);
    });

    it('should detect no intersection when box is to the right', () => {
      const box: BoundingBox = { x: 1100, y: 400, width: 100, height: 100 };
      expect(intersects(box, viewport)).toBe(false);
    });

    it('should detect no intersection when box is above', () => {
      const box: BoundingBox = { x: 400, y: -300, width: 100, height: 100 };
      expect(intersects(box, viewport)).toBe(false);
    });

    it('should detect no intersection when box is below', () => {
      const box: BoundingBox = { x: 400, y: 1100, width: 100, height: 100 };
      expect(intersects(box, viewport)).toBe(false);
    });

    it('should detect intersection when viewport is inside box', () => {
      const largeBox: BoundingBox = { x: -100, y: -100, width: 1200, height: 1200 };
      expect(intersects(largeBox, viewport)).toBe(true);
    });
  });

  // ============================================================================
  // POINT IN VIEWPORT TESTS
  // ============================================================================

  describe('Point In Viewport', () => {
    const viewport = createViewport({ x: 0, y: 0, width: 1000, height: 1000 });

    it('should detect point inside viewport', () => {
      expect(pointInViewport({ x: 500, y: 500 }, viewport)).toBe(true);
    });

    it('should detect point on left edge', () => {
      expect(pointInViewport({ x: 0, y: 500 }, viewport)).toBe(true);
    });

    it('should detect point on right edge', () => {
      expect(pointInViewport({ x: 1000, y: 500 }, viewport)).toBe(true);
    });

    it('should detect point on top edge', () => {
      expect(pointInViewport({ x: 500, y: 0 }, viewport)).toBe(true);
    });

    it('should detect point on bottom edge', () => {
      expect(pointInViewport({ x: 500, y: 1000 }, viewport)).toBe(true);
    });

    it('should detect point at corner', () => {
      expect(pointInViewport({ x: 0, y: 0 }, viewport)).toBe(true);
      expect(pointInViewport({ x: 1000, y: 1000 }, viewport)).toBe(true);
    });

    it('should reject point outside left', () => {
      expect(pointInViewport({ x: -1, y: 500 }, viewport)).toBe(false);
    });

    it('should reject point outside right', () => {
      expect(pointInViewport({ x: 1001, y: 500 }, viewport)).toBe(false);
    });

    it('should reject point outside top', () => {
      expect(pointInViewport({ x: 500, y: -1 }, viewport)).toBe(false);
    });

    it('should reject point outside bottom', () => {
      expect(pointInViewport({ x: 500, y: 1001 }, viewport)).toBe(false);
    });
  });

  // ============================================================================
  // CULL POINTS TESTS
  // ============================================================================

  describe('Cull Points', () => {
    const viewport = createViewport({ x: 0, y: 0, width: 1000, height: 1000 });

    it('should keep points inside viewport', () => {
      const points: Point[] = [
        { x: 500, y: 500 },
        { x: 100, y: 100 },
        { x: 900, y: 900 },
      ];

      const culled = cullPoints(points, viewport);
      expect(culled.length).toBe(3);
    });

    it('should remove points outside viewport', () => {
      const points: Point[] = [
        { x: 500, y: 500 },
        { x: -100, y: 500 },
        { x: 1100, y: 500 },
      ];

      const culled = cullPoints(points, viewport);
      expect(culled.length).toBe(1);
    });

    it('should apply margin when specified', () => {
      const points: Point[] = [
        { x: -50, y: 500 },
        { x: 1050, y: 500 },
      ];

      const culledWithoutMargin = cullPoints(points, viewport, 0);
      const culledWithMargin = cullPoints(points, viewport, 100);

      expect(culledWithoutMargin.length).toBe(0);
      expect(culledWithMargin.length).toBe(2);
    });

    it('should handle empty points array', () => {
      const culled = cullPoints([], viewport);
      expect(culled.length).toBe(0);
    });

    it('should handle all points outside', () => {
      const points: Point[] = [
        { x: -100, y: -100 },
        { x: 1100, y: 1100 },
      ];

      const culled = cullPoints(points, viewport);
      expect(culled.length).toBe(0);
    });
  });

  // ============================================================================
  // CULL RECTANGLES TESTS
  // ============================================================================

  describe('Cull Rectangles', () => {
    const viewport = createViewport({ x: 0, y: 0, width: 1000, height: 1000 });

    it('should keep rectangles inside viewport', () => {
      const rects: BoundingBox[] = [
        { x: 100, y: 100, width: 200, height: 200 },
        { x: 500, y: 500, width: 100, height: 100 },
      ];

      const culled = cullRectangles(rects, viewport);
      expect(culled.length).toBe(2);
    });

    it('should keep rectangles partially overlapping viewport', () => {
      const rects: BoundingBox[] = [
        { x: -100, y: 500, width: 200, height: 100 },
      ];

      const culled = cullRectangles(rects, viewport);
      expect(culled.length).toBe(1);
    });

    it('should remove rectangles outside viewport', () => {
      const rects: BoundingBox[] = [
        { x: -300, y: 500, width: 100, height: 100 },
        { x: 1200, y: 500, width: 100, height: 100 },
      ];

      const culled = cullRectangles(rects, viewport);
      expect(culled.length).toBe(0);
    });
  });

  // ============================================================================
  // LINE SEGMENT BOUNDS TESTS
  // ============================================================================

  describe('Line Segment Bounds', () => {
    it('should compute bounds for horizontal line', () => {
      const bounds = lineSegmentBounds({ x: 100, y: 200 }, { x: 500, y: 200 });

      expect(bounds.x).toBe(100);
      expect(bounds.y).toBe(200);
      expect(bounds.width).toBe(400);
      expect(bounds.height).toBe(0);
    });

    it('should compute bounds for vertical line', () => {
      const bounds = lineSegmentBounds({ x: 200, y: 100 }, { x: 200, y: 500 });

      expect(bounds.x).toBe(200);
      expect(bounds.y).toBe(100);
      expect(bounds.width).toBe(0);
      expect(bounds.height).toBe(400);
    });

    it('should compute bounds for diagonal line', () => {
      const bounds = lineSegmentBounds({ x: 100, y: 100 }, { x: 500, y: 400 });

      expect(bounds.x).toBe(100);
      expect(bounds.y).toBe(100);
      expect(bounds.width).toBe(400);
      expect(bounds.height).toBe(300);
    });

    it('should handle reversed points', () => {
      const bounds = lineSegmentBounds({ x: 500, y: 400 }, { x: 100, y: 100 });

      expect(bounds.x).toBe(100);
      expect(bounds.y).toBe(100);
    });
  });

  // ============================================================================
  // POINTS BOUNDS TESTS
  // ============================================================================

  describe('Points Bounds', () => {
    it('should compute bounds for multiple points', () => {
      const points: Point[] = [
        { x: 100, y: 200 },
        { x: 500, y: 100 },
        { x: 300, y: 600 },
      ];

      const bounds = pointsBounds(points);

      expect(bounds.x).toBe(100);
      expect(bounds.y).toBe(100);
      expect(bounds.width).toBe(400);
      expect(bounds.height).toBe(500);
    });

    it('should handle single point', () => {
      const bounds = pointsBounds([{ x: 100, y: 200 }]);

      expect(bounds.x).toBe(100);
      expect(bounds.y).toBe(200);
      expect(bounds.width).toBe(0);
      expect(bounds.height).toBe(0);
    });

    it('should handle empty points', () => {
      const bounds = pointsBounds([]);

      expect(bounds.x).toBe(0);
      expect(bounds.y).toBe(0);
      expect(bounds.width).toBe(0);
      expect(bounds.height).toBe(0);
    });
  });

  // ============================================================================
  // CLIP LINE SEGMENT TESTS (COHEN-SUTHERLAND)
  // ============================================================================

  describe('Clip Line Segment', () => {
    const viewport = createViewport({ x: 0, y: 0, width: 1000, height: 1000 });

    it('should return line completely inside viewport', () => {
      const clipped = clipLineSegment(
        { x: 200, y: 200 },
        { x: 800, y: 800 },
        viewport
      );

      expect(clipped).not.toBeNull();
      expect(clipped?.start.x).toBe(200);
      expect(clipped?.end.x).toBe(800);
    });

    it('should return null for line completely outside viewport', () => {
      const clipped = clipLineSegment(
        { x: -200, y: -200 },
        { x: -100, y: -100 },
        viewport
      );

      expect(clipped).toBeNull();
    });

    it('should clip line crossing left edge', () => {
      const clipped = clipLineSegment(
        { x: -100, y: 500 },
        { x: 500, y: 500 },
        viewport
      );

      expect(clipped).not.toBeNull();
      expect(clipped?.start.x).toBe(0);
      expect(clipped?.end.x).toBe(500);
    });

    it('should clip line crossing right edge', () => {
      const clipped = clipLineSegment(
        { x: 500, y: 500 },
        { x: 1500, y: 500 },
        viewport
      );

      expect(clipped).not.toBeNull();
      expect(clipped?.start.x).toBe(500);
      expect(clipped?.end.x).toBe(1000);
    });

    it('should clip line crossing top edge', () => {
      const clipped = clipLineSegment(
        { x: 500, y: -100 },
        { x: 500, y: 500 },
        viewport
      );

      expect(clipped).not.toBeNull();
      expect(clipped?.start.y).toBe(0);
    });

    it('should clip line crossing bottom edge', () => {
      const clipped = clipLineSegment(
        { x: 500, y: 500 },
        { x: 500, y: 1500 },
        viewport
      );

      expect(clipped).not.toBeNull();
      expect(clipped?.end.y).toBe(1000);
    });

    it('should clip diagonal line crossing multiple edges', () => {
      const clipped = clipLineSegment(
        { x: -100, y: -100 },
        { x: 1100, y: 1100 },
        viewport
      );

      expect(clipped).not.toBeNull();
      expect(clipped?.start.x).toBeCloseTo(0, 1);
      expect(clipped?.start.y).toBeCloseTo(0, 1);
      expect(clipped?.end.x).toBeCloseTo(1000, 1);
      expect(clipped?.end.y).toBeCloseTo(1000, 1);
    });

    it('should return null for line parallel to viewport outside', () => {
      const clipped = clipLineSegment(
        { x: -100, y: -100 },
        { x: 1100, y: -100 },
        viewport
      );

      expect(clipped).toBeNull();
    });
  });

  // ============================================================================
  // CLIP POLYLINE TESTS
  // ============================================================================

  describe('Clip Polyline', () => {
    const viewport = createViewport({ x: 0, y: 0, width: 1000, height: 1000 });

    it('should clip polyline inside viewport', () => {
      const points: Point[] = [
        { x: 100, y: 100 },
        { x: 500, y: 500 },
        { x: 900, y: 100 },
      ];

      const clipped = clipPolyline(points, viewport);
      expect(clipped.length).toBe(2);
    });

    it('should clip polyline crossing viewport boundary', () => {
      const points: Point[] = [
        { x: -100, y: 500 },
        { x: 500, y: 500 },
        { x: 1100, y: 500 },
      ];

      const clipped = clipPolyline(points, viewport);
      expect(clipped.length).toBe(2);
    });

    it('should handle polyline completely outside', () => {
      const points: Point[] = [
        { x: -300, y: -300 },
        { x: -200, y: -200 },
        { x: -100, y: -100 },
      ];

      const clipped = clipPolyline(points, viewport);
      expect(clipped.length).toBe(0);
    });

    it('should handle single segment polyline', () => {
      const points: Point[] = [
        { x: 100, y: 100 },
        { x: 900, y: 900 },
      ];

      const clipped = clipPolyline(points, viewport);
      expect(clipped.length).toBe(1);
    });
  });

  // ============================================================================
  // COMPLETELY INSIDE TESTS
  // ============================================================================

  describe('Completely Inside', () => {
    const viewport = createViewport({ x: 0, y: 0, width: 1000, height: 1000 });

    it('should return true for box completely inside', () => {
      const box: BoundingBox = { x: 100, y: 100, width: 200, height: 200 };
      expect(completelyInside(box, viewport)).toBe(true);
    });

    it('should return false for box partially inside', () => {
      const box: BoundingBox = { x: -100, y: 500, width: 200, height: 100 };
      expect(completelyInside(box, viewport)).toBe(false);
    });

    it('should return false for box completely outside', () => {
      const box: BoundingBox = { x: -300, y: -300, width: 100, height: 100 };
      expect(completelyInside(box, viewport)).toBe(false);
    });

    it('should handle box touching edges', () => {
      const box: BoundingBox = { x: 0, y: 0, width: 1000, height: 1000 };
      expect(completelyInside(box, viewport)).toBe(true);
    });
  });

  // ============================================================================
  // EXPAND VIEWPORT TESTS
  // ============================================================================

  describe('Expand Viewport', () => {
    const viewport = createViewport({ x: 100, y: 100, width: 800, height: 600 });

    it('should expand viewport by margin', () => {
      const expanded = expandViewport(viewport, 50);

      expect(expanded.minX).toBe(50);
      expect(expanded.minY).toBe(50);
      expect(expanded.maxX).toBe(950);
      expect(expanded.maxY).toBe(750);
    });

    it('should handle zero margin', () => {
      const expanded = expandViewport(viewport, 0);

      expect(expanded.minX).toBe(viewport.minX);
      expect(expanded.maxX).toBe(viewport.maxX);
    });

    it('should handle negative margin (shrink)', () => {
      const shrunk = expandViewport(viewport, -50);

      expect(shrunk.minX).toBe(150);
      expect(shrunk.maxX).toBe(850);
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle zero-size viewport', () => {
      const viewport = createViewport({ x: 500, y: 500, width: 0, height: 0 });
      const point: Point = { x: 500, y: 500 };

      expect(pointInViewport(point, viewport)).toBe(true);
    });

    it('should handle very large coordinates', () => {
      const viewport = createViewport({
        x: 1e10,
        y: 1e10,
        width: 1e10,
        height: 1e10,
      });
      const point: Point = { x: 1.5e10, y: 1.5e10 };

      expect(pointInViewport(point, viewport)).toBe(true);
    });

    it('should handle negative coordinates', () => {
      const viewport = createViewport({ x: -1000, y: -1000, width: 2000, height: 2000 });
      const point: Point = { x: -500, y: -500 };

      expect(pointInViewport(point, viewport)).toBe(true);
    });

    it('should handle floating point precision', () => {
      const viewport = createViewport({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 });
      const point: Point = { x: 0.5, y: 0.5 };

      expect(pointInViewport(point, viewport)).toBe(true);
    });
  });

  // ============================================================================
  // SECURITY TESTS
  // ============================================================================

  describe('Security Tests', () => {
    it('should handle NaN coordinates', () => {
      const viewport = createViewport({ x: 0, y: 0, width: 1000, height: 1000 });
      const point: Point = { x: NaN, y: 500 };

      // NaN comparisons are always false
      expect(pointInViewport(point, viewport)).toBe(false);
    });

    it('should handle Infinity coordinates', () => {
      const viewport = createViewport({ x: 0, y: 0, width: 1000, height: 1000 });
      const point: Point = { x: Infinity, y: 500 };

      expect(pointInViewport(point, viewport)).toBe(false);
    });

    it('should handle negative Infinity', () => {
      const viewport = createViewport({ x: 0, y: 0, width: 1000, height: 1000 });
      const point: Point = { x: -Infinity, y: 500 };

      expect(pointInViewport(point, viewport)).toBe(false);
    });
  });

  // ============================================================================
  // PERFORMANCE TESTS
  // ============================================================================

  describe('Performance Tests', () => {
    const viewport = createViewport({ x: 0, y: 0, width: 1000, height: 1000 });

    it('should cull 100,000 points in < 50ms', () => {
      const points = generateRandomPoints(100000, { x: -500, y: -500, width: 2000, height: 2000 });

      const start = performance.now();
      const culled = cullPoints(points, viewport);
      const duration = performance.now() - start;

      expect(culled.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(50);
      
      console.log(`Cull 100K points: ${duration.toFixed(2)}ms, kept: ${culled.length}`);
    });

    it('should cull 100,000 rectangles in < 50ms', () => {
      const rects = generateRandomRects(100000, { x: -500, y: -500, width: 2000, height: 2000 });

      const start = performance.now();
      const culled = cullRectangles(rects, viewport);
      const duration = performance.now() - start;

      expect(culled.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(50);
    });

    it('should clip 10,000 line segments in < 100ms', () => {
      const segments: Array<{ start: Point; end: Point }> = [];
      for (let i = 0; i < 10000; i++) {
        segments.push({
          start: { x: Math.random() * 2000 - 500, y: Math.random() * 2000 - 500 },
          end: { x: Math.random() * 2000 - 500, y: Math.random() * 2000 - 500 },
        });
      }

      const start = performance.now();
      let clippedCount = 0;
      for (const seg of segments) {
        const clipped = clipLineSegment(seg.start, seg.end, viewport);
        if (clipped) clippedCount++;
      }
      const duration = performance.now() - start;

      expect(clippedCount).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100);
      
      console.log(`Clip 10K segments: ${duration.toFixed(2)}ms, kept: ${clippedCount}`);
    });
  });
});

