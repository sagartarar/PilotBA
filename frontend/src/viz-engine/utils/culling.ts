/**
 * Frustum culling utilities for viewport optimization.
 * 
 * Culls geometry outside the viewport to reduce rendering workload.
 * 
 * @see Design Doc: 01-webgl-rendering-engine.md (Lines 356-366)
 */

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface LineSegment {
  start: Point;
  end: Point;
  bounds: BoundingBox;
}

export interface Viewport extends BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Creates a viewport from bounding box.
 */
export function createViewport(bounds: BoundingBox): Viewport {
  return {
    ...bounds,
    minX: bounds.x,
    minY: bounds.y,
    maxX: bounds.x + bounds.width,
    maxY: bounds.y + bounds.height,
  };
}

/**
 * Checks if a bounding box intersects with the viewport.
 * 
 * @param bounds - Bounding box to test
 * @param viewport - Viewport bounds
 * @returns true if intersects, false otherwise
 */
export function intersects(bounds: BoundingBox, viewport: Viewport): boolean {
  return !(
    bounds.x > viewport.maxX ||
    bounds.x + bounds.width < viewport.minX ||
    bounds.y > viewport.maxY ||
    bounds.y + bounds.height < viewport.minY
  );
}

/**
 * Checks if a point is within the viewport.
 * 
 * @param point - Point to test
 * @param viewport - Viewport bounds
 * @returns true if inside viewport, false otherwise
 */
export function pointInViewport(point: Point, viewport: Viewport): boolean {
  return (
    point.x >= viewport.minX &&
    point.x <= viewport.maxX &&
    point.y >= viewport.minY &&
    point.y <= viewport.maxY
  );
}

/**
 * Culls line segments outside viewport.
 * 
 * Uses Cohen-Sutherland algorithm for efficient line clipping.
 * 
 * @param segments - Array of line segments
 * @param viewport - Viewport bounds
 * @returns Filtered array of visible segments
 */
export function cullLineSegments(
  segments: LineSegment[],
  viewport: Viewport
): LineSegment[] {
  return segments.filter(seg => intersects(seg.bounds, viewport));
}

/**
 * Culls points outside viewport with optional margin.
 * 
 * @param points - Array of points
 * @param viewport - Viewport bounds
 * @param margin - Extra margin around viewport (default: 0)
 * @returns Filtered array of visible points
 */
export function cullPoints(
  points: Point[],
  viewport: Viewport,
  margin: number = 0
): Point[] {
  const expandedViewport: Viewport = {
    x: viewport.x - margin,
    y: viewport.y - margin,
    width: viewport.width + 2 * margin,
    height: viewport.height + 2 * margin,
    minX: viewport.minX - margin,
    minY: viewport.minY - margin,
    maxX: viewport.maxX + margin,
    maxY: viewport.maxY + margin,
  };

  return points.filter(point => pointInViewport(point, expandedViewport));
}

/**
 * Culls rectangles (bars) outside viewport.
 * 
 * @param rects - Array of bounding boxes
 * @param viewport - Viewport bounds
 * @returns Filtered array of visible rectangles
 */
export function cullRectangles(
  rects: BoundingBox[],
  viewport: Viewport
): BoundingBox[] {
  return rects.filter(rect => intersects(rect, viewport));
}

/**
 * Computes bounding box for a line segment.
 * 
 * @param start - Start point of line
 * @param end - End point of line
 * @returns Bounding box
 */
export function lineSegmentBounds(start: Point, end: Point): BoundingBox {
  const minX = Math.min(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxX = Math.max(start.x, end.x);
  const maxY = Math.max(start.y, end.y);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Computes bounding box for an array of points.
 * 
 * @param points - Array of points
 * @returns Bounding box
 */
export function pointsBounds(points: Point[]): BoundingBox {
  if (points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const point of points) {
    if (point.x < minX) minX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.x > maxX) maxX = point.x;
    if (point.y > maxY) maxY = point.y;
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Cohen-Sutherland region codes for line clipping.
 */
const INSIDE = 0; // 0000
const LEFT = 1;   // 0001
const RIGHT = 2;  // 0010
const BOTTOM = 4; // 0100
const TOP = 8;    // 1000

/**
 * Computes region code for a point relative to viewport.
 */
function computeOutCode(x: number, y: number, viewport: Viewport): number {
  let code = INSIDE;

  if (x < viewport.minX) {
    code |= LEFT;
  } else if (x > viewport.maxX) {
    code |= RIGHT;
  }

  if (y < viewport.minY) {
    code |= BOTTOM;
  } else if (y > viewport.maxY) {
    code |= TOP;
  }

  return code;
}

/**
 * Clips a line segment to viewport using Cohen-Sutherland algorithm.
 * 
 * @param start - Start point of line
 * @param end - End point of line
 * @param viewport - Viewport bounds
 * @returns Clipped line segment or null if completely outside
 */
export function clipLineSegment(
  start: Point,
  end: Point,
  viewport: Viewport
): LineSegment | null {
  let x0 = start.x;
  let y0 = start.y;
  let x1 = end.x;
  let y1 = end.y;

  let outcode0 = computeOutCode(x0, y0, viewport);
  let outcode1 = computeOutCode(x1, y1, viewport);

  while (true) {
    if ((outcode0 | outcode1) === 0) {
      // Both points inside viewport
      return {
        start: { x: x0, y: y0 },
        end: { x: x1, y: y1 },
        bounds: lineSegmentBounds({ x: x0, y: y0 }, { x: x1, y: y1 }),
      };
    } else if ((outcode0 & outcode1) !== 0) {
      // Both points outside viewport on same side
      return null;
    } else {
      // Line needs clipping
      let x = 0;
      let y = 0;

      // Pick point outside viewport
      const outcodeOut = outcode0 !== 0 ? outcode0 : outcode1;

      // Find intersection point
      if ((outcodeOut & TOP) !== 0) {
        x = x0 + (x1 - x0) * (viewport.maxY - y0) / (y1 - y0);
        y = viewport.maxY;
      } else if ((outcodeOut & BOTTOM) !== 0) {
        x = x0 + (x1 - x0) * (viewport.minY - y0) / (y1 - y0);
        y = viewport.minY;
      } else if ((outcodeOut & RIGHT) !== 0) {
        y = y0 + (y1 - y0) * (viewport.maxX - x0) / (x1 - x0);
        x = viewport.maxX;
      } else if ((outcodeOut & LEFT) !== 0) {
        y = y0 + (y1 - y0) * (viewport.minX - x0) / (x1 - x0);
        x = viewport.minX;
      }

      // Replace point outside viewport with intersection point
      if (outcodeOut === outcode0) {
        x0 = x;
        y0 = y;
        outcode0 = computeOutCode(x0, y0, viewport);
      } else {
        x1 = x;
        y1 = y;
        outcode1 = computeOutCode(x1, y1, viewport);
      }
    }
  }
}

/**
 * Clips a polyline to viewport.
 * 
 * @param points - Array of points forming the polyline
 * @param viewport - Viewport bounds
 * @returns Array of clipped line segments
 */
export function clipPolyline(
  points: Point[],
  viewport: Viewport
): LineSegment[] {
  const clipped: LineSegment[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const segment = clipLineSegment(points[i], points[i + 1], viewport);
    if (segment !== null) {
      clipped.push(segment);
    }
  }

  return clipped;
}

/**
 * Checks if a bounding box is completely inside viewport.
 * 
 * @param bounds - Bounding box to test
 * @param viewport - Viewport bounds
 * @returns true if completely inside, false otherwise
 */
export function completelyInside(bounds: BoundingBox, viewport: Viewport): boolean {
  return (
    bounds.x >= viewport.minX &&
    bounds.x + bounds.width <= viewport.maxX &&
    bounds.y >= viewport.minY &&
    bounds.y + bounds.height <= viewport.maxY
  );
}

/**
 * Expands viewport by a margin (useful for pre-fetching nearby data).
 * 
 * @param viewport - Original viewport
 * @param margin - Margin to add (in same units as viewport)
 * @returns Expanded viewport
 */
export function expandViewport(viewport: Viewport, margin: number): Viewport {
  return createViewport({
    x: viewport.x - margin,
    y: viewport.y - margin,
    width: viewport.width + 2 * margin,
    height: viewport.height + 2 * margin,
  });
}

