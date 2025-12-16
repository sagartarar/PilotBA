import { PerformanceMetrics } from './types';

export class PerformanceMonitor {
  private frameTimings: number[] = [];
  private frameStart: number = 0;
  private drawCallCount: number = 0;
  private vertexCount: number = 0;
  private enabled: boolean = true;

  startFrame(): void {
    if (!this.enabled) return;
    this.frameStart = performance.now();
  }

  endFrame(): void {
    if (!this.enabled) return;
    
    const frameTime = performance.now() - this.frameStart;
    this.frameTimings.push(frameTime);

    // Keep last 60 frames (1 second at 60 FPS)
    if (this.frameTimings.length > 60) {
      this.frameTimings.shift();
    }
  }

  recordDrawCall(vertexCount: number): void {
    if (!this.enabled) return;
    this.drawCallCount++;
    this.vertexCount += vertexCount;
  }

  getMetrics(): PerformanceMetrics {
    const frameTime = this.frameTimings[this.frameTimings.length - 1] || 0;
    const avgFrameTime = this.frameTimings.length > 0
      ? this.frameTimings.reduce((a, b) => a + b, 0) / this.frameTimings.length
      : 0;
    
    const fps = avgFrameTime > 0 ? 1000 / avgFrameTime : 0;

    return {
      fps: Math.round(fps),
      frameTime: Math.round(frameTime * 100) / 100,
      drawCalls: this.drawCallCount,
      vertexCount: this.vertexCount,
    };
  }

  getAverageFPS(): number {
    return this.getMetrics().fps;
  }

  reset(): void {
    this.drawCallCount = 0;
    this.vertexCount = 0;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}


