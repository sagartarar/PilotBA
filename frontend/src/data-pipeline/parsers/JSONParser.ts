/**
 * JSON Parser with Apache Arrow conversion.
 * 
 * Converts row-major JSON data into columnar Arrow Tables.
 * 
 * @see Design Doc: 02-data-processing-pipeline.md (Lines 140-161)
 */

import { Table, tableFromArrays, Schema, Field, DataType, Int32, Float64, Utf8, Bool, Timestamp, TimeUnit } from 'apache-arrow';

export interface JSONParseOptions {
  schema?: Schema;
  sampleSize?: number;
  inferTypes?: boolean;
  strictSchema?: boolean;
}

export interface ParseResult {
  table: Table;
  rowCount: number;
  columnCount: number;
  parseErrors?: string[];
}

/**
 * JSON Parser class.
 */
export class JSONParser {
  private options: Required<JSONParseOptions>;

  constructor(options: JSONParseOptions = {}) {
    this.options = {
      schema: options.schema || null!,
      sampleSize: options.sampleSize || 1000,
      inferTypes: options.inferTypes ?? true,
      strictSchema: options.strictSchema ?? false,
    };
  }

  /**
   * Parses JSON array into Arrow Table.
   * 
   * @param json - Array of objects or JSON string
   * @returns Parse result with Arrow Table
   */
  async parse(json: any[] | string): Promise<ParseResult> {
    const errors: string[] = [];

    try {
      // Parse JSON string if needed
      const data: any[] = typeof json === 'string' ? JSON.parse(json) : json;

      if (!Array.isArray(data)) {
        throw new Error('JSON data must be an array of objects');
      }

      if (data.length === 0) {
        throw new Error('JSON array is empty');
      }

      // Infer or validate schema
      const schema = this.options.schema || this.inferSchema(data);

      // Convert row-major to column-major
      const columns: Record<string, any[]> = {};
      schema.fields.forEach(field => {
        columns[field.name] = [];
      });

      // Populate columns
      for (let i = 0; i < data.length; i++) {
        const row = data[i];

        if (typeof row !== 'object' || row === null) {
          errors.push(`Row ${i} is not an object, skipping`);
          continue;
        }

        schema.fields.forEach(field => {
          const value = row[field.name];
          const parsedValue = this.parseValue(value, field.type);
          columns[field.name].push(parsedValue);
        });
      }

      // Create Arrow Table
      const table = tableFromArrays(columns);

      return {
        table,
        rowCount: table.numRows,
        columnCount: table.numCols,
        parseErrors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      throw new Error(`JSON parsing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Infers Arrow schema from JSON sample.
   */
  private inferSchema(data: any[]): Schema {
    const sampleData = data.slice(0, Math.min(this.options.sampleSize, data.length));
    
    // Collect all unique keys
    const allKeys = new Set<string>();
    sampleData.forEach(row => {
      if (typeof row === 'object' && row !== null) {
        Object.keys(row).forEach(key => allKeys.add(key));
      }
    });

    const fields: Field[] = [];

    // Infer type for each key
    allKeys.forEach(key => {
      const values = sampleData
        .filter(row => row !== null && row !== undefined)
        .map(row => row[key]);
      
      const dataType = this.inferColumnType(values);
      fields.push(new Field(key, dataType, true)); // nullable = true
    });

    return new Schema(fields);
  }

  /**
   * Infers data type for a column based on sample values.
   */
  private inferColumnType(values: any[]): DataType {
    if (!this.options.inferTypes) {
      return new Utf8(); // Default to string
    }

    let hasNull = false;
    let hasBoolean = false;
    let hasNumber = false;
    let hasInteger = false;
    let hasString = false;
    let hasDate = false;
    let hasObject = false;
    let hasArray = false;

    for (const value of values) {
      if (value === null || value === undefined) {
        hasNull = true;
        continue;
      }

      const type = typeof value;

      if (type === 'boolean') {
        hasBoolean = true;
      } else if (type === 'number') {
        hasNumber = true;
        if (Number.isInteger(value)) {
          hasInteger = true;
        }
      } else if (type === 'string') {
        // Check if it's a date string
        if (this.isDateString(value)) {
          hasDate = true;
        } else {
          hasString = true;
        }
      } else if (type === 'object') {
        if (Array.isArray(value)) {
          hasArray = true;
        } else if (value instanceof Date) {
          hasDate = true;
        } else {
          hasObject = true;
        }
      }
    }

    // Type precedence: string > object/array > date > number > integer > boolean
    if (hasString || hasObject || hasArray) {
      return new Utf8(); // Serialize complex types as JSON strings
    }
    if (hasDate) {
      return new Timestamp(TimeUnit.MILLISECOND);
    }
    if (hasNumber && !hasInteger) {
      return new Float64();
    }
    if (hasInteger && !hasNumber) {
      return new Int32();
    }
    if (hasNumber) {
      return new Float64(); // Mixed int/float
    }
    if (hasBoolean) {
      return new Bool();
    }

    // Default to string
    return new Utf8();
  }

  /**
   * Parses a value according to its data type.
   */
  private parseValue(value: any, dataType: DataType): any {
    if (value === null || value === undefined) {
      return null;
    }

    const typeName = dataType.toString();

    if (typeName.includes('Int')) {
      if (typeof value === 'number') {
        return Math.floor(value);
      }
      if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? null : parsed;
      }
      return null;
    }

    if (typeName.includes('Float') || typeName.includes('Double')) {
      if (typeof value === 'number') {
        return value;
      }
      if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
      }
      return null;
    }

    if (typeName.includes('Bool')) {
      if (typeof value === 'boolean') {
        return value;
      }
      if (typeof value === 'string') {
        const lower = value.toLowerCase();
        if (['true', '1', 'yes'].includes(lower)) return true;
        if (['false', '0', 'no'].includes(lower)) return false;
      }
      if (typeof value === 'number') {
        return value !== 0;
      }
      return null;
    }

    if (typeName.includes('Timestamp')) {
      if (value instanceof Date) {
        return value.getTime();
      }
      if (typeof value === 'string') {
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date.getTime();
      }
      if (typeof value === 'number') {
        return value;
      }
      return null;
    }

    // Default: convert to string
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  /**
   * Checks if a string looks like a date.
   */
  private isDateString(value: string): boolean {
    // ISO 8601 format
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      const date = new Date(value);
      return !isNaN(date.getTime());
    }
    return false;
  }
}

/**
 * Convenience function to parse JSON.
 */
export async function parseJSON(
  json: any[] | string,
  options?: JSONParseOptions
): Promise<Table> {
  const parser = new JSONParser(options);
  const result = await parser.parse(json);
  return result.table;
}

