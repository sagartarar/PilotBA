import { Point, InteractionState } from './types';
import { Camera } from './Camera';

export class InteractionHandler {
  private canvas: HTMLCanvasElement;
  private camera: Camera;
  private state: InteractionState;
  private listeners: Map<string, () => void>;

  constructor(canvas: HTMLCanvasElement, camera: Camera) {
    this.canvas = canvas;
    this.camera = camera;
    this.state = {
      isMouseDown: false,
      isPanning: false,
      mousePos: { x: 0, y: 0 },
      lastMousePos: { x: 0, y: 0 },
      zoom: 1,
      pan: { x: 0, y: 0 },
    };
    this.listeners = new Map();

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const onMouseDown = this.onMouseDown.bind(this);
    const onMouseMove = this.onMouseMove.bind(this);
    const onMouseUp = this.onMouseUp.bind(this);
    const onWheel = this.onWheel.bind(this);
    const onContextMenu = this.onContextMenu.bind(this);

    this.canvas.addEventListener('mousedown', onMouseDown);
    this.canvas.addEventListener('mousemove', onMouseMove);
    this.canvas.addEventListener('mouseup', onMouseUp);
    this.canvas.addEventListener('wheel', onWheel, { passive: false });
    this.canvas.addEventListener('contextmenu', onContextMenu);

    // Store for cleanup
    this.listeners.set('mousedown', onMouseDown);
    this.listeners.set('mousemove', onMouseMove);
    this.listeners.set('mouseup', onMouseUp);
    this.listeners.set('wheel', onWheel);
    this.listeners.set('contextmenu', onContextMenu);
  }

  private getMousePos(e: MouseEvent): Point {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  private onMouseDown(e: MouseEvent): void {
    this.state.isMouseDown = true;
    this.state.lastMousePos = this.getMousePos(e);

    // Right click or Ctrl+click for panning
    if (e.button === 2 || e.ctrlKey) {
      this.state.isPanning = true;
      e.preventDefault();
    }
  }

  private onMouseMove(e: MouseEvent): void {
    this.state.mousePos = this.getMousePos(e);

    if (this.state.isMouseDown && this.state.isPanning) {
      const dx = this.state.mousePos.x - this.state.lastMousePos.x;
      const dy = this.state.mousePos.y - this.state.lastMousePos.y;

      this.camera.pan(dx, dy);
      
      this.state.lastMousePos = this.state.mousePos;
    }
  }

  private onMouseUp(_e: MouseEvent): void {
    this.state.isMouseDown = false;
    this.state.isPanning = false;
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();

    const mousePos = this.getMousePos(e);
    
    // Zoom factor based on wheel delta
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;

    this.camera.zoomAt(mousePos, zoomFactor);
  }

  private onContextMenu(e: Event): void {
    e.preventDefault();
  }

  update(): void {
    // Update logic if needed
  }

  getState(): InteractionState {
    return { ...this.state };
  }

  destroy(): void {
    // Remove event listeners
    this.listeners.forEach((handler, event) => {
      this.canvas.removeEventListener(event, handler as EventListener);
    });
    this.listeners.clear();
  }
}

