/**
 * File Error Handler
 * 
 * Handles file upload validation and parsing errors
 * with user-friendly messages and recovery guidance.
 */

import { Table } from 'apache-arrow';
import { errorService } from '../ErrorService';
import { PilotBAError, ERROR_CODES, createError } from '../errorCodes';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const VALID_EXTENSIONS = ['.csv', '.json', '.parquet', '.arrow'];
const VALID_MIME_TYPES = [
  'text/csv',
  'application/json',
  'application/octet-stream',
  'application/x-parquet',
];

export interface FileValidationResult {
  valid: boolean;
  error?: PilotBAError;
}

/**
 * Validate file before processing
 */
export function validateFile(file: File): FileValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const error = errorService.captureCode('FILE_TOO_LARGE', {
      fileName: file.name,
      fileSize: file.size,
      maxSize: MAX_FILE_SIZE,
    });
    return { valid: false, error };
  }

  // Check for empty file
  if (file.size === 0) {
    const error = errorService.captureCode('FILE_EMPTY', {
      fileName: file.name,
    });
    return { valid: false, error };
  }

  // Check file extension
  const ext = getFileExtension(file.name);
  if (!VALID_EXTENSIONS.includes(ext)) {
    const error = errorService.captureCode('FILE_INVALID_TYPE', {
      fileName: file.name,
      fileType: file.type,
      extension: ext,
      validExtensions: VALID_EXTENSIONS,
    });
    return { valid: false, error };
  }

  // Check MIME type (if available)
  if (file.type && !VALID_MIME_TYPES.includes(file.type) && !file.type.startsWith('text/')) {
    // Log warning but don't block - MIME types can be unreliable
    errorService.warn('File MIME type may not match extension', {
      fileName: file.name,
      mimeType: file.type,
      extension: ext,
    });
  }

  return { valid: true };
}

/**
 * Get file extension (lowercase)
 */
function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) return '';
  return fileName.slice(lastDot).toLowerCase();
}

/**
 * Handle CSV parsing errors
 */
export function handleCSVError(error: Error, context: { fileName: string; row?: number }): PilotBAError {
  const message = error.message.toLowerCase();

  if (message.includes('encoding') || message.includes('utf')) {
    return errorService.captureCode('CSV_ENCODING_ERROR', context, error.stack);
  }

  return errorService.captureCode('CSV_MALFORMED', {
    ...context,
    originalError: error.message,
  }, error.stack);
}

/**
 * Handle JSON parsing errors
 */
export function handleJSONError(error: Error, context: { fileName: string }): PilotBAError {
  const message = error.message.toLowerCase();

  if (message.includes('array')) {
    return errorService.captureCode('JSON_NOT_ARRAY', context, error.stack);
  }

  return errorService.captureCode('JSON_INVALID', {
    ...context,
    originalError: error.message,
  }, error.stack);
}

/**
 * Handle Parquet parsing errors
 */
export function handleParquetError(error: Error, context: { fileName: string }): PilotBAError {
  return errorService.captureCode('PARQUET_INVALID', {
    ...context,
    originalError: error.message,
  }, error.stack);
}

/**
 * Handle Arrow IPC parsing errors
 */
export function handleArrowError(error: Error, context: { fileName: string }): PilotBAError {
  return errorService.captureCode('ARROW_INVALID', {
    ...context,
    originalError: error.message,
  }, error.stack);
}

/**
 * Log successful file load
 */
export function logFileSuccess(
  fileName: string,
  table: { numRows: number; numCols: number }
): void {
  errorService.info(`Loaded ${fileName}`, {
    fileName,
    rows: table.numRows,
    columns: table.numCols,
  });
}

/**
 * Wrap file parsing with error handling
 */
export async function withFileErrorHandling<T>(
  fileName: string,
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const ext = getFileExtension(fileName);
    const context = { fileName };

    switch (ext) {
      case '.csv':
        throw handleCSVError(error as Error, context);
      case '.json':
        throw handleJSONError(error as Error, context);
      case '.parquet':
        throw handleParquetError(error as Error, context);
      case '.arrow':
        throw handleArrowError(error as Error, context);
      default:
        throw errorService.capture(error as Error, context);
    }
  }
}

