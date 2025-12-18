/**
 * Visualization Error Handler
 * 
 * Handles WebGL and chart rendering errors
 * with user-friendly messages and recovery guidance.
 */

import { errorService } from '../ErrorService';
import { PilotBAError } from '../errorCodes';

/**
 * Check WebGL support and return error if not available
 */
export function checkWebGLSupport(): PilotBAError | null {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

  if (!gl) {
    return errorService.captureCode('WEBGL_NOT_SUPPORTED', {
      userAgent: navigator.userAgent,
    });
  }

  return null;
}

/**
 * Handle WebGL context lost
 */
export function handleContextLost(event?: Event): PilotBAError {
  if (event) {
    event.preventDefault();
  }

  return errorService.captureCode('WEBGL_CONTEXT_LOST', {
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handle WebGL context restored
 */
export function handleContextRestored(): void {
  errorService.info('WebGL context restored', {
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handle shader compilation errors
 */
export function handleShaderError(
  shaderType: 'vertex' | 'fragment',
  shaderLog: string
): PilotBAError {
  return errorService.captureCode('SHADER_COMPILE_ERROR', {
    shaderType,
    shaderLog,
  });
}

/**
 * Handle chart rendering errors
 */
export function handleChartRenderError(
  error: Error,
  chartType: string,
  dataSize: number
): PilotBAError {
  return errorService.captureCode('CHART_RENDER_ERROR', {
    chartType,
    dataSize,
    originalError: error.message,
  }, error.stack);
}

/**
 * Handle too many data points warning
 */
export function handleTooManyPoints(
  pointCount: number,
  maxRecommended: number
): PilotBAError {
  return errorService.captureCode('TOO_MANY_POINTS', {
    pointCount,
    maxRecommended,
    suggestion: `Enable sampling to reduce from ${pointCount.toLocaleString()} to ${maxRecommended.toLocaleString()} points`,
  });
}

/**
 * Handle buffer allocation failure
 */
export function handleBufferAllocationError(
  bufferSize: number,
  error: Error
): PilotBAError {
  return errorService.captureCode('BUFFER_ALLOCATION_FAILED', {
    requestedSize: bufferSize,
    originalError: error.message,
  }, error.stack);
}

/**
 * Setup WebGL context event listeners
 */
export function setupWebGLErrorHandlers(canvas: HTMLCanvasElement): () => void {
  const onContextLost = (event: Event) => {
    handleContextLost(event);
  };

  const onContextRestored = () => {
    handleContextRestored();
  };

  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);

  // Return cleanup function
  return () => {
    canvas.removeEventListener('webglcontextlost', onContextLost);
    canvas.removeEventListener('webglcontextrestored', onContextRestored);
  };
}

/**
 * Wrap visualization operation with error handling
 */
export async function withVizErrorHandling<T>(
  chartType: string,
  dataSize: number,
  fn: () => Promise<T> | T
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw handleChartRenderError(error as Error, chartType, dataSize);
  }
}

/**
 * Check if data size exceeds recommended limit and warn
 */
export function checkDataSizeLimit(
  pointCount: number,
  chartType: string
): void {
  const limits: Record<string, number> = {
    scatter: 100000,
    line: 50000,
    bar: 10000,
    heatmap: 1000000,
  };

  const limit = limits[chartType] || 50000;

  if (pointCount > limit) {
    handleTooManyPoints(pointCount, limit);
  }
}

