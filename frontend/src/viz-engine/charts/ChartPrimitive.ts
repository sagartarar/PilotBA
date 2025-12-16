import { ChartData, BoundingBox, Color } from '../types';
import { Renderer } from '../Renderer';
import { Camera } from '../Camera';

export abstract class ChartPrimitive {
  protected data: ChartData;
  protected isDirty: boolean;
  protected bounds: BoundingBox | null;
  protected visible: boolean;

  constructor(data: ChartData) {
    this.data = data;
    this.isDirty = true;
    this.bounds = null;
    this.visible = true;
  }

  abstract initialize(renderer: Renderer): void;
  abstract update(deltaTime: number): void;
  abstract render(renderer: Renderer, camera: Camera): void;
  abstract destroy(renderer: Renderer): void;

  setData(data: ChartData): void {
    this.data = data;
    this.isDirty = true;
    this.bounds = null;
  }

  getData(): ChartData {
    return this.data;
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
  }

  isVisible(): boolean {
    return this.visible;
  }

  getBounds(): BoundingBox | null {
    if (!this.bounds) {
      this.bounds = this.calculateBounds();
    }
    return this.bounds;
  }

  protected calculateBounds(): BoundingBox {
    const xIndex = this.data.columns.indexOf(this.data.encodings.x);
    const yIndex = this.data.columns.indexOf(this.data.encodings.y);

    if (xIndex === -1 || yIndex === -1 || this.data.values.length === 0) {
      return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const row of this.data.values) {
      const x = row[xIndex];
      const y = row[yIndex];

      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    return { minX, minY, maxX, maxY };
  }

  protected getColumnValues(columnName: string): number[] {
    const index = this.data.columns.indexOf(columnName);
    if (index === -1) return [];
    return this.data.values.map((row) => row[index]);
  }

  protected normalizeColor(value: number, min: number, max: number): Color {
    // Simple blue-to-red color scale
    const t = (value - min) / (max - min);
    return {
      r: t,
      g: 0,
      b: 1 - t,
      a: 1,
    };
  }

  protected defaultColor(): Color {
    return { r: 0.2, g: 0.6, b: 1.0, a: 1.0 };
  }
}


