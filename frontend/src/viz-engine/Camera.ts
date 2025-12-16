import { Point, Mat4, Viewport, BoundingBox } from './types';
import { Matrix } from './utils/matrix';

export class Camera {
  private position: Point;
  private zoom: number;
  private viewport: Viewport;
  private viewMatrix: Mat4;
  private projectionMatrix: Mat4;
  private viewProjectionMatrix: Mat4;
  private inverseViewProjectionMatrix: Mat4;
  private isDirty: boolean;

  constructor(viewport: Viewport) {
    this.viewport = viewport;
    this.position = { x: 0, y: 0 };
    this.zoom = 1;
    this.viewMatrix = Matrix.identity();
    this.projectionMatrix = Matrix.identity();
    this.viewProjectionMatrix = Matrix.identity();
    this.inverseViewProjectionMatrix = Matrix.identity();
    this.isDirty = true;

    this.updateMatrices();
  }

  setPosition(x: number, y: number): void {
    this.position.x = x;
    this.position.y = y;
    this.isDirty = true;
  }

  getPosition(): Point {
    return { ...this.position };
  }

  setZoom(zoom: number): void {
    // Clamp zoom to reasonable range
    this.zoom = Math.max(0.01, Math.min(1000, zoom));
    this.isDirty = true;
  }

  getZoom(): number {
    return this.zoom;
  }

  pan(dx: number, dy: number): void {
    // Pan is in screen space, convert to world space
    const worldDx = dx / this.zoom;
    const worldDy = dy / this.zoom;
    this.position.x -= worldDx;
    this.position.y += worldDy; // Flip Y for screen coordinates
    this.isDirty = true;
  }

  zoomAt(point: Point, zoomDelta: number): void {
    // Zoom toward/away from a specific point
    const oldZoom = this.zoom;
    this.zoom *= zoomDelta;
    this.zoom = Math.max(0.01, Math.min(1000, this.zoom));

    // Adjust position to keep point fixed
    const zoomRatio = this.zoom / oldZoom;
    const worldPoint = this.screenToWorld(point);
    
    this.position.x = worldPoint.x - (worldPoint.x - this.position.x) / zoomRatio;
    this.position.y = worldPoint.y - (worldPoint.y - this.position.y) / zoomRatio;
    
    this.isDirty = true;
  }

  updateViewport(viewport: Viewport): void {
    this.viewport = viewport;
    this.isDirty = true;
  }

  getViewMatrix(): Mat4 {
    if (this.isDirty) {
      this.updateMatrices();
    }
    return this.viewMatrix;
  }

  getProjectionMatrix(): Mat4 {
    if (this.isDirty) {
      this.updateMatrices();
    }
    return this.projectionMatrix;
  }

  getViewProjectionMatrix(): Mat4 {
    if (this.isDirty) {
      this.updateMatrices();
    }
    return this.viewProjectionMatrix;
  }

  screenToWorld(screen: Point): Point {
    if (this.isDirty) {
      this.updateMatrices();
    }

    // Normalize screen coordinates to [-1, 1]
    const normalized = {
      x: (screen.x / this.viewport.width) * 2 - 1,
      y: -(screen.y / this.viewport.height) * 2 + 1, // Flip Y
    };

    // Transform by inverse view-projection matrix
    return Matrix.transformPoint(this.inverseViewProjectionMatrix, normalized);
  }

  worldToScreen(world: Point): Point {
    if (this.isDirty) {
      this.updateMatrices();
    }

    // Transform by view-projection matrix
    const clip = Matrix.transformPoint(this.viewProjectionMatrix, world);

    // Convert from clip space [-1, 1] to screen space
    return {
      x: ((clip.x + 1) * 0.5) * this.viewport.width,
      y: ((1 - clip.y) * 0.5) * this.viewport.height, // Flip Y
    };
  }

  getVisibleBounds(): BoundingBox {
    const topLeft = this.screenToWorld({ x: 0, y: 0 });
    const bottomRight = this.screenToWorld({
      x: this.viewport.width,
      y: this.viewport.height,
    });

    return {
      minX: topLeft.x,
      maxX: bottomRight.x,
      minY: bottomRight.y,
      maxY: topLeft.y,
    };
  }

  private updateMatrices(): void {
    // View matrix: translate by negative position, then scale by zoom
    const translate = Matrix.translate(-this.position.x, -this.position.y, 0);
    const scale = Matrix.scale(this.zoom, this.zoom, 1);
    this.viewMatrix = Matrix.multiply(scale, translate);

    // Projection matrix: orthographic for 2D
    const aspect = this.viewport.width / this.viewport.height;
    this.projectionMatrix = Matrix.ortho(
      -aspect,
      aspect,
      -1,
      1,
      -1,
      1
    );

    // Combined view-projection
    this.viewProjectionMatrix = Matrix.multiply(
      this.projectionMatrix,
      this.viewMatrix
    );

    // Inverse for screen-to-world transforms
    this.inverseViewProjectionMatrix = Matrix.invert(this.viewProjectionMatrix);

    this.isDirty = false;
  }
}


