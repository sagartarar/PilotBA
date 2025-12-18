/**
 * Quadtree spatial indexing structure for efficient point queries.
 * 
 * Used for O(log n) hover detection and selection in scatter plots.
 * 
 * Time Complexity:
 * - Insert: O(log n) average, O(n) worst case
 * - Query: O(log n) average
 * - findNearest: O(log n) average
 * 
 * @see Design Doc: 01-webgl-rendering-engine.md (Lines 441-456)
 */

export interface Point {
  x: number;
  y: number;
  data?: any; // Optional user data
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Quadtree {
  private bounds: BoundingBox;
  private capacity: number;
  private points: Point[];
  private divided: boolean;
  private northwest?: Quadtree;
  private northeast?: Quadtree;
  private southwest?: Quadtree;
  private southeast?: Quadtree;

  /**
   * Creates a new Quadtree.
   * 
   * @param bounds - The bounding box for this quadtree node
   * @param capacity - Maximum points before subdivision (default: 64)
   */
  constructor(bounds: BoundingBox, capacity: number = 64) {
    this.bounds = bounds;
    this.capacity = capacity;
    this.points = [];
    this.divided = false;
  }

  /**
   * Inserts a point into the quadtree.
   * 
   * @param point - Point to insert
   * @returns true if insertion successful, false otherwise
   */
  insert(point: Point): boolean {
    // Check if point is within bounds
    if (!this.contains(point)) {
      return false;
    }

    // If we have capacity, add the point here
    if (this.points.length < this.capacity) {
      this.points.push(point);
      return true;
    }

    // Otherwise, subdivide and add to children
    if (!this.divided) {
      this.subdivide();
    }

    // Try inserting into children
    return (
      this.northwest!.insert(point) ||
      this.northeast!.insert(point) ||
      this.southwest!.insert(point) ||
      this.southeast!.insert(point)
    );
  }

  /**
   * Queries points within a bounding box.
   * 
   * @param range - The bounding box to query
   * @param found - Optional array to accumulate results
   * @returns Array of points within the range
   */
  query(range: BoundingBox, found: Point[] = []): Point[] {
    // Check if range intersects with this node's bounds
    if (!this.intersects(range)) {
      return found;
    }

    // Check all points in this node
    for (const point of this.points) {
      if (this.pointInBounds(point, range)) {
        found.push(point);
      }
    }

    // If divided, query children
    if (this.divided) {
      this.northwest!.query(range, found);
      this.northeast!.query(range, found);
      this.southwest!.query(range, found);
      this.southeast!.query(range, found);
    }

    return found;
  }

  /**
   * Finds the nearest point to the given coordinates within a radius.
   * 
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param radius - Search radius in pixels
   * @returns Nearest point or null if none found
   */
  findNearest(x: number, y: number, radius: number): Point | null {
    const range: BoundingBox = {
      x: x - radius,
      y: y - radius,
      width: radius * 2,
      height: radius * 2,
    };

    const candidates = this.query(range);

    if (candidates.length === 0) {
      return null;
    }

    // Find closest point
    let nearest: Point | null = null;
    let minDistSq = radius * radius;

    for (const point of candidates) {
      const dx = point.x - x;
      const dy = point.y - y;
      const distSq = dx * dx + dy * dy;

      if (distSq < minDistSq) {
        minDistSq = distSq;
        nearest = point;
      }
    }

    return nearest;
  }

  /**
   * Clears all points from the quadtree.
   */
  clear(): void {
    this.points = [];
    this.divided = false;
    this.northwest = undefined;
    this.northeast = undefined;
    this.southwest = undefined;
    this.southeast = undefined;
  }

  /**
   * Gets the total number of points in the quadtree.
   */
  size(): number {
    let count = this.points.length;

    if (this.divided) {
      count += this.northwest!.size();
      count += this.northeast!.size();
      count += this.southwest!.size();
      count += this.southeast!.size();
    }

    return count;
  }

  /**
   * Subdivides the quadtree into four children.
   */
  private subdivide(): void {
    const x = this.bounds.x;
    const y = this.bounds.y;
    const w = this.bounds.width / 2;
    const h = this.bounds.height / 2;

    this.northwest = new Quadtree(
      { x, y, width: w, height: h },
      this.capacity
    );

    this.northeast = new Quadtree(
      { x: x + w, y, width: w, height: h },
      this.capacity
    );

    this.southwest = new Quadtree(
      { x, y: y + h, width: w, height: h },
      this.capacity
    );

    this.southeast = new Quadtree(
      { x: x + w, y: y + h, width: w, height: h },
      this.capacity
    );

    this.divided = true;

    // Redistribute existing points to children
    for (const point of this.points) {
      this.northwest.insert(point) ||
        this.northeast.insert(point) ||
        this.southwest.insert(point) ||
        this.southeast.insert(point);
    }

    // Clear points from this node after redistribution to avoid duplicates
    this.points = [];
  }

  /**
   * Checks if a point is within this node's bounds.
   */
  private contains(point: Point): boolean {
    return (
      point.x >= this.bounds.x &&
      point.x < this.bounds.x + this.bounds.width &&
      point.y >= this.bounds.y &&
      point.y < this.bounds.y + this.bounds.height
    );
  }

  /**
   * Checks if a point is within a given bounding box.
   */
  private pointInBounds(point: Point, bounds: BoundingBox): boolean {
    return (
      point.x >= bounds.x &&
      point.x < bounds.x + bounds.width &&
      point.y >= bounds.y &&
      point.y < bounds.y + bounds.height
    );
  }

  /**
   * Checks if this node's bounds intersect with a given range.
   */
  private intersects(range: BoundingBox): boolean {
    return !(
      range.x > this.bounds.x + this.bounds.width ||
      range.x + range.width < this.bounds.x ||
      range.y > this.bounds.y + this.bounds.height ||
      range.y + range.height < this.bounds.y
    );
  }

  /**
   * Gets the bounds of this quadtree node (for debugging/visualization).
   */
  getBounds(): BoundingBox {
    return { ...this.bounds };
  }

  /**
   * Returns all quadtree nodes (for debugging/visualization).
   */
  getAllNodes(): Quadtree[] {
    const nodes: Quadtree[] = [this];

    if (this.divided) {
      nodes.push(...this.northwest!.getAllNodes());
      nodes.push(...this.northeast!.getAllNodes());
      nodes.push(...this.southwest!.getAllNodes());
      nodes.push(...this.southeast!.getAllNodes());
    }

    return nodes;
  }
}

