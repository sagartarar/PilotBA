/**
 * Sanitization Utilities for PilotBA
 * 
 * Provides XSS protection and input validation
 * for user-provided data and file content.
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize file names to prevent path traversal and special characters
 */
export function sanitizeFileName(name: string): string {
  return name
    // Remove path traversal attempts
    .replace(/\.\./g, '_')
    // Remove invalid file system characters
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    // Remove leading/trailing dots and spaces
    .replace(/^[\s.]+|[\s.]+$/g, '')
    // Collapse multiple underscores
    .replace(/_+/g, '_')
    // Limit length
    .slice(0, 255);
}

/**
 * Sanitize display values to prevent XSS
 * Escapes HTML entities for safe display in the DOM
 */
export function sanitizeDisplay(value: unknown): string {
  if (value === null || value === undefined) return '';
  
  const stringValue = String(value);
  return DOMPurify.sanitize(stringValue, {
    ALLOWED_TAGS: [], // Strip all HTML tags
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize HTML content with limited allowed tags
 * For rich text that needs some formatting
 */
export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'span', 'code', 'pre'],
    ALLOWED_ATTR: ['class'],
  });
}

/**
 * Validate and sanitize filter input values
 * Blocks SQL-like injection patterns
 */
export function validateFilterValue(value: string): { valid: boolean; sanitized: string; error?: string } {
  // Check for dangerous patterns
  const dangerousPatterns = [
    /;\s*--/i,                    // SQL comment
    /'\s*OR\s+/i,                 // SQL OR injection
    /'\s*AND\s+/i,                // SQL AND injection
    /UNION\s+SELECT/i,            // SQL UNION injection
    /DROP\s+TABLE/i,              // SQL DROP
    /DELETE\s+FROM/i,             // SQL DELETE
    /INSERT\s+INTO/i,             // SQL INSERT
    /UPDATE\s+.*\s+SET/i,         // SQL UPDATE
    /<script/i,                   // Script injection
    /javascript:/i,               // JavaScript protocol
    /on\w+\s*=/i,                 // Event handlers
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(value)) {
      return {
        valid: false,
        sanitized: '',
        error: 'Invalid characters detected in input',
      };
    }
  }

  // Sanitize the value
  const sanitized = value
    // Remove null bytes
    .replace(/\x00/g, '')
    // Escape single quotes for safety
    .replace(/'/g, "''")
    // Trim whitespace
    .trim();

  return {
    valid: true,
    sanitized,
  };
}

/**
 * Validate column name to prevent injection
 */
export function validateColumnName(name: string, availableColumns: string[]): { valid: boolean; error?: string } {
  // Check if column exists in available columns
  if (!availableColumns.includes(name)) {
    return {
      valid: false,
      error: `Column "${name}" not found`,
    };
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /[;'"\\]/,           // SQL special chars
    /\s/,                // Whitespace (columns shouldn't have spaces in our context)
    /^__/,               // Double underscore prefix (internal)
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(name)) {
      return {
        valid: false,
        error: 'Invalid column name format',
      };
    }
  }

  return { valid: true };
}

/**
 * Sanitize URL parameters
 */
export function sanitizeURLParam(param: string): string {
  return encodeURIComponent(param)
    .replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

/**
 * Check if a string contains potential XSS vectors
 */
export function containsXSS(value: string): boolean {
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:/i,
    /vbscript:/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<svg.*onload/i,
    /<img.*onerror/i,
  ];

  return xssPatterns.some(pattern => pattern.test(value));
}

/**
 * Escape string for use in regular expressions
 */
export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validate file extension against allowed list
 */
export function isValidFileExtension(fileName: string, allowedExtensions: string[]): boolean {
  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
  return allowedExtensions.includes(ext);
}

/**
 * Check file magic bytes for type validation
 * Returns detected file type or null
 */
export async function detectFileType(file: File): Promise<string | null> {
  const buffer = await file.slice(0, 8).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Check magic bytes
  const signatures: Record<string, number[]> = {
    // CSV doesn't have magic bytes, but we check for common patterns
    'application/json': [0x7B], // { or [
    'application/x-parquet': [0x50, 0x41, 0x52, 0x31], // PAR1
    'application/vnd.apache.arrow.file': [0x41, 0x52, 0x52, 0x4F, 0x57, 0x31], // ARROW1
  };

  // JSON can start with { or [
  if (bytes[0] === 0x7B || bytes[0] === 0x5B) {
    return 'application/json';
  }

  // Check Parquet
  if (bytes.slice(0, 4).every((b, i) => b === signatures['application/x-parquet'][i])) {
    return 'application/x-parquet';
  }

  // Check Arrow
  if (bytes.slice(0, 6).every((b, i) => b === signatures['application/vnd.apache.arrow.file'][i])) {
    return 'application/vnd.apache.arrow.file';
  }

  // Default to CSV for text files
  // Check if first bytes are printable ASCII
  const isPrintable = bytes.every(b => (b >= 0x20 && b <= 0x7E) || b === 0x0A || b === 0x0D || b === 0x09);
  if (isPrintable) {
    return 'text/csv';
  }

  return null;
}

