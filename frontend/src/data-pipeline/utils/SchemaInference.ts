/**
 * Schema Inference utilities.
 * 
 * Automatically infers Arrow schema from raw data.
 */

import { Schema, Field, DataType, Int32, Float64, Utf8, Bool, Timestamp, TimeUnit } from 'apache-arrow';

export interface InferenceOptions {
  sampleSize?: number;       // Number of rows to sample for inference
  strictTypes?: boolean;     // If true, mixed types become strings
  inferDates?: boolean;      // Try to detect date strings
  nullValues?: string[];     // Values to treat as null
}

/**
 * Schema Inference class.
 */
export class SchemaInference {
  private options: Required<InferenceOptions>;

  constructor(options: InferenceOptions = {}) {
    this.options = {
      sampleSize: options.sampleSize || 1000,
      strictTypes: options.strictTypes ?? true,
      inferDates: options.inferDates ?? true,
      nullValues: options.nullValues || ['', 'null', 'NULL', 'N/A', 'NA', 'nan', 'NaN'],
    };
  }

  /**
   * Infers schema from array of objects.
   * 
   * @param data - Array of row objects
   * @returns Inferred Arrow Schema
   */
  inferFromObjects(data: any[]): Schema {
    if (data.length === 0) {
      throw new Error('Cannot infer schema from empty data');
    }

    // Collect all column names
    const columnNames = this.collectColumnNames(data);

    // Sample data for inference
    const sample = data.slice(0, Math.min(this.options.sampleSize, data.length));

    // Infer type for each column
    const fields: Field[] = [];

    for (const columnName of columnNames) {
      const values = sample.map(row => row[columnName]);
      const dataType = this.inferColumnType(values);
      fields.push(new Field(columnName, dataType, true)); // nullable = true
    }

    return new Schema(fields);
  }

  /**
   * Infers schema from array of arrays (with headers).
   * 
   * @param headers - Column headers
   * @param data - Array of row arrays
   * @returns Inferred Arrow Schema
   */
  inferFromArrays(headers: string[], data: any[][]): Schema {
    if (headers.length === 0) {
      throw new Error('Headers cannot be empty');
    }

    // Sample data for inference
    const sample = data.slice(0, Math.min(this.options.sampleSize, data.length));

    // Infer type for each column
    const fields: Field[] = [];

    for (let colIndex = 0; colIndex < headers.length; colIndex++) {
      const columnName = headers[colIndex];
      const values = sample.map(row => row[colIndex]);
      const dataType = this.inferColumnType(values);
      fields.push(new Field(columnName, dataType, true));
    }

    return new Schema(fields);
  }

  /**
   * Collects all unique column names from objects.
   */
  private collectColumnNames(data: any[]): string[] {
    const names = new Set<string>();

    for (const row of data) {
      if (typeof row === 'object' && row !== null) {
        Object.keys(row).forEach(key => names.add(key));
      }
    }

    return Array.from(names);
  }

  /**
   * Infers data type for a column based on sample values.
   */
  private inferColumnType(values: any[]): DataType {
    // Track what types we've seen
    const types = {
      null: 0,
      boolean: 0,
      integer: 0,
      float: 0,
      date: 0,
      string: 0,
      object: 0,
    };

    for (const value of values) {
      if (this.isNull(value)) {
        types.null++;
        continue;
      }

      const type = typeof value;

      if (type === 'boolean') {
        types.boolean++;
      } else if (type === 'number') {
        if (Number.isInteger(value)) {
          types.integer++;
        } else {
          types.float++;
        }
      } else if (type === 'string') {
        if (this.options.inferDates && this.looksLikeDate(value)) {
          types.date++;
        } else {
          types.string++;
        }
      } else if (value instanceof Date) {
        types.date++;
      } else if (type === 'object') {
        types.object++;
      }
    }

    // Decide type based on counts
    return this.selectBestType(types);
  }

  /**
   * Selects best type based on type counts.
   */
  private selectBestType(types: Record<string, number>): DataType {
    const total = Object.values(types).reduce((a, b) => a + b, 0);

    if (total === 0 || total === types.null) {
      return new Utf8(); // Default to string for all nulls
    }

    // If strictTypes, any mixed type becomes string
    if (this.options.strictTypes) {
      const nonNullTypes = Object.entries(types)
        .filter(([key]) => key !== 'null')
        .filter(([_, count]) => count > 0);

      if (nonNullTypes.length > 1) {
        // Mixed types - use string
        return new Utf8();
      }
    }

    // Determine dominant type
    if (types.object > 0 || types.string > total * 0.5) {
      return new Utf8();
    }

    if (types.date > total * 0.8) {
      return new Timestamp(TimeUnit.MILLISECOND);
    }

    if (types.float > 0) {
      return new Float64();
    }

    if (types.integer > total * 0.8) {
      return new Int32();
    }

    if (types.boolean > total * 0.8) {
      return new Bool();
    }

    // Default to string
    return new Utf8();
  }

  /**
   * Checks if value should be treated as null.
   */
  private isNull(value: any): boolean {
    if (value === null || value === undefined) {
      return true;
    }

    if (typeof value === 'string') {
      return this.options.nullValues.includes(value);
    }

    return false;
  }

  /**
   * Checks if a string looks like a date.
   */
  private looksLikeDate(value: string): boolean {
    // ISO 8601 format: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      const date = new Date(value);
      return !isNaN(date.getTime());
    }

    // Common date formats
    const datePatterns = [
      /^\d{1,2}\/\d{1,2}\/\d{4}$/,       // MM/DD/YYYY or DD/MM/YYYY
      /^\d{4}\/\d{1,2}\/\d{1,2}$/,       // YYYY/MM/DD
      /^\d{1,2}-\d{1,2}-\d{4}$/,         // MM-DD-YYYY
    ];

    if (datePatterns.some(pattern => pattern.test(value))) {
      const date = new Date(value);
      return !isNaN(date.getTime());
    }

    return false;
  }
}

/**
 * Convenience function to infer schema from objects.
 */
export function inferSchema(data: any[], options?: InferenceOptions): Schema {
  const inference = new SchemaInference(options);
  return inference.inferFromObjects(data);
}

