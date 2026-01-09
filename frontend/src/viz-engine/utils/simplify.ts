/**
 * Line simplification algorithms for optimizing line chart rendering.
 * 
 * Implements Douglas-Peucker algorithm to reduce point count while
 * maintaining visual fidelity.
 * 
 * @see Design Doc: 01-webgl-rendering-engine.md (Lines 329-343)
 */

export interface Point {
  x: number;
  y: number;
}

/**
 * Douglas-Peucker line simplification algorithm.
 * 
 * Recursively simplifies a polyline by removing points that contribute
 * less than the tolerance threshold to the line's shape.
 * 
 * Time Complexity:
 * - Average: O(n log n)
 * - Worst: O(n²)
 * 
 * @param points - Array of points to simplify
 * @param tolerance - Distance threshold (in same units as points)
 * @returns Simplified array of points
 */
export function simplifyLine(points: Point[], tolerance: number): Point[] {
  if (points.length <= 2) {
    return points;
  }

  // Handle invalid tolerance values gracefully
  // Negative tolerance would cause infinite recursion
  // Zero tolerance means keep all points
  if (tolerance <= 0) {
    return [...points];
  }

  return douglasPeucker(points, tolerance);
}

/**
 * Recursive Douglas-Peucker implementation.
 */
function douglasPeucker(points: Point[], tolerance: number): Point[] {
  if (points.length <= 2) {
    return points;
  }

  // Find point with maximum distance from line between first and last
  let maxDistance = 0;
  let maxIndex = 0;

  const first = points[0];
  const last = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(points[i], first, last);

    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  // If max distance is greater than tolerance, recursively simplify
  if (maxDistance > tolerance) {
    // Recursively simplify both segments
    const left = douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
    const right = douglasPeucker(points.slice(maxIndex), tolerance);

    // Combine results (remove duplicate point at junction)
    return [...left.slice(0, -1), ...right];
  } else {
    // All points between first and last can be removed
    return [first, last];
  }
}

/**
 * Calculates perpendicular distance from point to line segment.
 * 
 * @param point - Point to measure distance from
 * @param lineStart - Start of line segment
 * @param lineEnd - End of line segment
 * @returns Perpendicular distance
 */
function perpendicularDistance(
  point: Point,
  lineStart: Point,
  lineEnd: Point
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;

  // Handle degenerate case (line is a point)
  if (dx === 0 && dy === 0) {
    return distance(point, lineStart);
  }

  // Calculate perpendicular distance using cross product
  const numerator = Math.abs(
    dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x
  );
  const denominator = Math.sqrt(dx * dx + dy * dy);

  return numerator / denominator;
}

/**
 * Euclidean distance between two points.
 */
function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates adaptive tolerance based on zoom level and screen dimensions.
 * 
 * The tolerance decreases as zoom increases (more detail needed).
 * 
 * @param zoomLevel - Current zoom level (1 = 100%)
 * @param screenWidth - Width of viewport in pixels
 * @param basePixelTolerance - Base tolerance in pixels (default: 1)
 * @returns Tolerance in data space
 */
export function calculateTolerance(
  zoomLevel: number,
  screenWidth: number,
  basePixelTolerance: number = 1
): number {
  // Tolerance in data space = pixel tolerance / zoom
  return basePixelTolerance / zoomLevel;
}

/**
 * Visvalingam-Whyatt algorithm (alternative simplification method).
 * 
 * Removes points based on triangle area (effective area).
 * Better for maintaining shape at all scales.
 * 
 * @param points - Array of points to simplify
 * @param targetPointCount - Desired number of points
 * @returns Simplified array of points
 */
export function simplifyByArea(points: Point[], targetPointCount: number): Point[] {
  if (points.length <= targetPointCount || points.length <= 2) {
    return points;
  }

  // Create array of points with their effective areas
  const pointsWithArea: Array<{ point: Point; area: number; index: number }> = [];

  // Calculate initial areas
  for (let i = 1; i < points.length - 1; i++) {
    const area = triangleArea(points[i - 1], points[i], points[i + 1]);
    pointsWithArea.push({ point: points[i], area, index: i });
  }

  // Always keep first and last points
  const result = [points[0]];
  const removed = new Set<number>();

  // Remove points with smallest areas until we reach target count
  while (pointsWithArea.length + 2 - removed.size > targetPointCount) {
    // Find point with minimum area that hasn't been removed
    let minArea = Infinity;
    let minIndex = -1;

    for (let i = 0; i < pointsWithArea.length; i++) {
      if (!removed.has(i) && pointsWithArea[i].area < minArea) {
        minArea = pointsWithArea[i].area;
        minIndex = i;
      }
    }

    if (minIndex === -1) break;

    removed.add(minIndex);

    // Recalculate areas for neighbors
    if (minIndex > 0 && !removed.has(minIndex - 1)) {
      const prevIndex = findPreviousNonRemoved(minIndex - 1, removed);
      const nextIndex = findNextNonRemoved(minIndex + 1, removed, pointsWithArea.length);

      if (prevIndex !== -1 && nextIndex !== -1) {
        const prevPoint = prevIndex === -1 ? points[0] : pointsWithArea[prevIndex].point;
        const currPoint = pointsWithArea[minIndex - 1].point;
        const nextPoint = nextIndex === pointsWithArea.length ? 
          points[points.length - 1] : pointsWithArea[nextIndex].point;

        pointsWithArea[minIndex - 1].area = triangleArea(prevPoint, currPoint, nextPoint);
      }
    }
  }

  // Build result array
  for (let i = 0; i < pointsWithArea.length; i++) {
    if (!removed.has(i)) {
      result.push(pointsWithArea[i].point);
    }
  }

  result.push(points[points.length - 1]);

  return result;
}

/**
 * Calculates area of triangle formed by three points.
 */
function triangleArea(p1: Point, p2: Point, p3: Point): number {
  return Math.abs(
    (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)) / 2
  );
}

/**
 * Finds previous non-removed index.
 */
function findPreviousNonRemoved(start: number, removed: Set<number>): number {
  for (let i = start; i >= 0; i--) {
    if (!removed.has(i)) {
      return i;
    }
  }
  return -1;
}

/**
 * Finds next non-removed index.
 */
function findNextNonRemoved(start: number, removed: Set<number>, length: number): number {
  for (let i = start; i < length; i++) {
    if (!removed.has(i)) {
      return i;
    }
  }
  return length;
}

/**
 * Level of Detail (LOD) point selector.
 * 
 * Selects every Nth point based on zoom level.
 * Fast but less sophisticated than Douglas-Peucker.
 * 
 * @param points - Array of points
 * @param zoomLevel - Current zoom level
 * @returns Simplified array of points
 */
export function simplifyByLOD(points: Point[], zoomLevel: number): Point[] {
  const LOD_LEVELS = [
    { zoom: [0, 1], step: 100 },      // Very zoomed out
    { zoom: [1, 5], step: 10 },       // Medium zoom
    { zoom: [5, 50], step: 1 },       // Close zoom - all points
  ];

  // Find appropriate LOD level
  let step = 1;
  for (const level of LOD_LEVELS) {
    if (zoomLevel >= level.zoom[0] && zoomLevel < level.zoom[1]) {
      step = level.step;
      break;
    }
  }

  if (step === 1) {
    return points;
  }

  // Always include first and last points
  const result = [points[0]];

  for (let i = step; i < points.length - 1; i += step) {
    result.push(points[i]);
  }

  result.push(points[points.length - 1]);

  return result;
}

