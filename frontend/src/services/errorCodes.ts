/**
 * Error Types and Codes for PilotBA
 * 
 * Provides structured error handling with user-friendly messages
 * and actionable guidance for recovery.
 */

export type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info' | 'debug';

export type ErrorCategory =
  | 'file_upload'
  | 'file_parse'
  | 'db_connection'
  | 'db_query'
  | 'transform'
  | 'filter'
  | 'aggregation'
  | 'webgl'
  | 'chart_render'
  | 'memory'
  | 'network'
  | 'validation'
  | 'auth'
  | 'unknown';

export interface PilotBAError {
  id: string;
  timestamp: Date;
  severity: ErrorSeverity;
  category: ErrorCategory;
  code: string;
  message: string;
  userAction?: string;
  technicalDetails?: string;
  context?: Record<string, unknown>;
  recoverable: boolean;
}

export interface ErrorCodeDefinition {
  code: string;
  message: string;
  userAction: string;
  severity: ErrorSeverity;
  recoverable: boolean;
}

/**
 * Error code registry organized by category
 * Format: CATEGORY_CODE (e.g., 1xxx = File, 2xxx = Parse, etc.)
 */
export const ERROR_CODES = {
  // File Upload Errors (1xxx)
  FILE_TOO_LARGE: {
    code: '1001',
    message: 'File exceeds maximum size',
    userAction: 'Upload a file smaller than 100MB',
    severity: 'error' as ErrorSeverity,
    recoverable: true,
  },
  FILE_INVALID_TYPE: {
    code: '1002',
    message: 'Unsupported file format',
    userAction: 'Upload CSV, JSON, or Parquet files',
    severity: 'error' as ErrorSeverity,
    recoverable: true,
  },
  FILE_EMPTY: {
    code: '1003',
    message: 'File is empty',
    userAction: 'Upload a file with data',
    severity: 'error' as ErrorSeverity,
    recoverable: true,
  },
  FILE_READ_ERROR: {
    code: '1004',
    message: 'Could not read file',
    userAction: 'Try uploading the file again',
    severity: 'error' as ErrorSeverity,
    recoverable: true,
  },
  FILE_LOADED: {
    code: '1100',
    message: 'File loaded successfully',
    userAction: '',
    severity: 'info' as ErrorSeverity,
    recoverable: true,
  },

  // Parse Errors (2xxx)
  CSV_MALFORMED: {
    code: '2001',
    message: 'CSV formatting error',
    userAction: 'Check the file for missing columns or incorrect delimiters',
    severity: 'error' as ErrorSeverity,
    recoverable: true,
  },
  CSV_ENCODING_ERROR: {
    code: '2002',
    message: 'Invalid character encoding',
    userAction: 'Save the file as UTF-8 and try again',
    severity: 'error' as ErrorSeverity,
    recoverable: true,
  },
  JSON_INVALID: {
    code: '2003',
    message: 'Invalid JSON syntax',
    userAction: 'Validate your JSON using a JSON validator',
    severity: 'error' as ErrorSeverity,
    recoverable: true,
  },
  JSON_NOT_ARRAY: {
    code: '2004',
    message: 'JSON must be an array of objects',
    userAction: 'Ensure your JSON is formatted as [{...}, {...}]',
    severity: 'error' as ErrorSeverity,
    recoverable: true,
  },
  PARQUET_INVALID: {
    code: '2005',
    message: 'Invalid Parquet file',
    userAction: 'Ensure the file is a valid Parquet format',
    severity: 'error' as ErrorSeverity,
    recoverable: true,
  },
  ARROW_INVALID: {
    code: '2006',
    message: 'Invalid Arrow IPC file',
    userAction: 'Ensure the file is a valid Arrow IPC format',
    severity: 'error' as ErrorSeverity,
    recoverable: true,
  },

  // Transform/Query Errors (3xxx)
  COLUMN_NOT_FOUND: {
    code: '3001',
    message: 'Column not found',
    userAction: 'Select a valid column from the dataset',
    severity: 'error' as ErrorSeverity,
    recoverable: true,
  },
  INVALID_FILTER_VALUE: {
    code: '3002',
    message: 'Invalid filter value',
    userAction: 'Enter a valid value for the selected column type',
    severity: 'warning' as ErrorSeverity,
    recoverable: true,
  },
  AGGREGATION_ERROR: {
    code: '3003',
    message: 'Aggregation failed',
    userAction: 'Check that the column supports the selected aggregation',
    severity: 'error' as ErrorSeverity,
    recoverable: true,
  },
  SORT_ERROR: {
    code: '3004',
    message: 'Sort operation failed',
    userAction: 'Try sorting by a different column',
    severity: 'error' as ErrorSeverity,
    recoverable: true,
  },
  QUERY_TIMEOUT: {
    code: '3005',
    message: 'Query took too long',
    userAction: 'Try filtering the data first to reduce the dataset size',
    severity: 'warning' as ErrorSeverity,
    recoverable: true,
  },

  // WebGL/Visualization Errors (4xxx)
  WEBGL_NOT_SUPPORTED: {
    code: '4001',
    message: 'WebGL is not available',
    userAction: 'Use Chrome, Firefox, or Edge with hardware acceleration enabled',
    severity: 'critical' as ErrorSeverity,
    recoverable: false,
  },
  WEBGL_CONTEXT_LOST: {
    code: '4002',
    message: 'Graphics context was lost',
    userAction: 'Refresh the page to restore visualization',
    severity: 'error' as ErrorSeverity,
    recoverable: true,
  },
  CHART_RENDER_ERROR: {
    code: '4003',
    message: 'Chart rendering failed',
    userAction: 'Try reducing the data size or changing chart type',
    severity: 'error' as ErrorSeverity,
    recoverable: true,
  },
  SHADER_COMPILE_ERROR: {
    code: '4004',
    message: 'Graphics shader compilation failed',
    userAction: 'This may be a browser compatibility issue. Try a different browser.',
    severity: 'critical' as ErrorSeverity,
    recoverable: false,
  },
  TOO_MANY_POINTS: {
    code: '4005',
    message: 'Too many data points to render',
    userAction: 'Enable data sampling or filter the dataset',
    severity: 'warning' as ErrorSeverity,
    recoverable: true,
  },

  // Memory Errors (5xxx)
  OUT_OF_MEMORY: {
    code: '5001',
    message: 'Browser ran out of memory',
    userAction: 'Close other tabs and try with a smaller dataset',
    severity: 'critical' as ErrorSeverity,
    recoverable: false,
  },
  BUFFER_ALLOCATION_FAILED: {
    code: '5002',
    message: 'Could not allocate memory buffer',
    userAction: 'Try reducing the dataset size',
    severity: 'error' as ErrorSeverity,
    recoverable: true,
  },

  // Network Errors (6xxx)
  NETWORK_ERROR: {
    code: '6001',
    message: 'Network request failed',
    userAction: 'Check your internet connection and try again',
    severity: 'error' as ErrorSeverity,
    recoverable: true,
  },
  API_ERROR: {
    code: '6002',
    message: 'Server error',
    userAction: 'Please try again later',
    severity: 'error' as ErrorSeverity,
    recoverable: true,
  },
  TIMEOUT: {
    code: '6003',
    message: 'Request timed out',
    userAction: 'Check your connection and try again',
    severity: 'error' as ErrorSeverity,
    recoverable: true,
  },

  // Validation Errors (7xxx)
  INVALID_INPUT: {
    code: '7001',
    message: 'Invalid input',
    userAction: 'Check your input and try again',
    severity: 'warning' as ErrorSeverity,
    recoverable: true,
  },
  REQUIRED_FIELD: {
    code: '7002',
    message: 'Required field is missing',
    userAction: 'Fill in all required fields',
    severity: 'warning' as ErrorSeverity,
    recoverable: true,
  },

  // Auth Errors (8xxx)
  UNAUTHORIZED: {
    code: '8001',
    message: 'Authentication required',
    userAction: 'Please log in to continue',
    severity: 'error' as ErrorSeverity,
    recoverable: true,
  },
  SESSION_EXPIRED: {
    code: '8002',
    message: 'Session has expired',
    userAction: 'Please log in again',
    severity: 'warning' as ErrorSeverity,
    recoverable: true,
  },

  // Unknown/Generic Errors (9xxx)
  UNKNOWN_ERROR: {
    code: '9999',
    message: 'An unexpected error occurred',
    userAction: 'Please try again or contact support',
    severity: 'error' as ErrorSeverity,
    recoverable: true,
  },
} as const;

/**
 * Get error definition by code
 */
export function getErrorByCode(code: string): ErrorCodeDefinition | undefined {
  return Object.values(ERROR_CODES).find((e) => e.code === code);
}

/**
 * Create a PilotBAError from an error code
 */
export function createError(
  errorKey: keyof typeof ERROR_CODES,
  context?: Record<string, unknown>,
  technicalDetails?: string
): PilotBAError {
  const errorDef = ERROR_CODES[errorKey];
  
  return {
    id: generateErrorId(),
    timestamp: new Date(),
    severity: errorDef.severity,
    category: getCategoryFromCode(errorDef.code),
    code: errorDef.code,
    message: errorDef.message,
    userAction: errorDef.userAction,
    technicalDetails,
    context,
    recoverable: errorDef.recoverable,
  };
}

/**
 * Generate unique error ID
 */
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Get category from error code prefix
 */
function getCategoryFromCode(code: string): ErrorCategory {
  const prefix = code.charAt(0);
  const categoryMap: Record<string, ErrorCategory> = {
    '1': 'file_upload',
    '2': 'file_parse',
    '3': 'transform',
    '4': 'webgl',
    '5': 'memory',
    '6': 'network',
    '7': 'validation',
    '8': 'auth',
    '9': 'unknown',
  };
  return categoryMap[prefix] || 'unknown';
}

