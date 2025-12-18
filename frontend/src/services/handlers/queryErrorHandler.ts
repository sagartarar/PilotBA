/**
 * Query Error Handler
 * 
 * Handles data transformation and query errors
 * with user-friendly messages and recovery guidance.
 */

import { errorService } from '../ErrorService';
import { PilotBAError } from '../errorCodes';

/**
 * Handle column not found errors
 */
export function handleColumnNotFound(
  columnName: string,
  availableColumns: string[]
): PilotBAError {
  return errorService.captureCode('COLUMN_NOT_FOUND', {
    requestedColumn: columnName,
    availableColumns,
    suggestion: findSimilarColumn(columnName, availableColumns),
  });
}

/**
 * Handle invalid filter value errors
 */
export function handleInvalidFilterValue(
  value: string,
  columnName: string,
  expectedType: string
): PilotBAError {
  return errorService.captureCode('INVALID_FILTER_VALUE', {
    value,
    columnName,
    expectedType,
    userAction: `Enter a valid ${expectedType} value for column "${columnName}"`,
  });
}

/**
 * Handle aggregation errors
 */
export function handleAggregationError(
  error: Error,
  operation: string,
  columnName: string
): PilotBAError {
  return errorService.captureCode('AGGREGATION_ERROR', {
    operation,
    columnName,
    originalError: error.message,
  }, error.stack);
}

/**
 * Handle sort errors
 */
export function handleSortError(
  error: Error,
  columnName: string,
  direction: string
): PilotBAError {
  return errorService.captureCode('SORT_ERROR', {
    columnName,
    direction,
    originalError: error.message,
  }, error.stack);
}

/**
 * Handle query timeout
 */
export function handleQueryTimeout(
  operation: string,
  durationMs: number,
  dataSize: number
): PilotBAError {
  return errorService.captureCode('QUERY_TIMEOUT', {
    operation,
    durationMs,
    dataSize,
    suggestion: dataSize > 100000 
      ? 'Consider filtering the data first or enabling sampling'
      : 'Try simplifying the query',
  });
}

/**
 * Find similar column name (for suggestions)
 */
function findSimilarColumn(target: string, columns: string[]): string | undefined {
  const targetLower = target.toLowerCase();
  
  // First try exact case-insensitive match
  const exactMatch = columns.find(c => c.toLowerCase() === targetLower);
  if (exactMatch) return exactMatch;

  // Then try prefix match
  const prefixMatch = columns.find(c => 
    c.toLowerCase().startsWith(targetLower) || 
    targetLower.startsWith(c.toLowerCase())
  );
  if (prefixMatch) return prefixMatch;

  // Finally try Levenshtein distance
  let bestMatch: string | undefined;
  let bestDistance = Infinity;

  for (const col of columns) {
    const distance = levenshteinDistance(targetLower, col.toLowerCase());
    if (distance < bestDistance && distance <= 3) {
      bestDistance = distance;
      bestMatch = col;
    }
  }

  return bestMatch;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Wrap query operation with error handling
 */
export async function withQueryErrorHandling<T>(
  operation: string,
  context: Record<string, unknown>,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  const TIMEOUT_MS = 30000; // 30 seconds

  try {
    const result = await Promise.race([
      fn(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), TIMEOUT_MS)
      ),
    ]);
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;

    if ((error as Error).message === 'TIMEOUT') {
      throw handleQueryTimeout(operation, duration, context.dataSize as number || 0);
    }

    throw errorService.capture(error as Error, {
      operation,
      duration,
      ...context,
    });
  }
}

