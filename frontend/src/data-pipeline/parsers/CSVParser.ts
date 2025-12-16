/**
 * CSV Parser with Apache Arrow conversion.
 * 
 * Parses CSV data into Apache Arrow Tables for efficient columnar operations.
 * 
 * @see Design Doc: 02-data-processing-pipeline.md (Lines 124-137)
 */

// Note: apache-arrow will need to be installed via npm
// npm install apache-arrow

import { Table, tableFromArrays, Schema, Field, DataType, Int32, Float64, Utf8, Bool } from 'apache-arrow';

export interface CSVParseOptions {
  delimiter?: string;
  hasHeader?: boolean;
  schema?: Schema;
  sampleSize?: number;
  nullValues?: string[];
  skipEmptyLines?: boolean;
  trim?: boolean;
}

export interface ParseResult {
  table: Table;
  rowCount: number;
  columnCount: number;
  parseErrors?: string[];
}

/**
 * CSV Parser class.
 */
export class CSVParser {
  private options: Required<CSVParseOptions>;

  constructor(options: CSVParseOptions = {}) {
    this.options = {
      delimiter: options.delimiter || ',',
      hasHeader: options.hasHeader ?? true,
      schema: options.schema || null!,
      sampleSize: options.sampleSize || 1000,
      nullValues: options.nullValues || ['', 'null', 'NULL', 'N/A', 'NA'],
      skipEmptyLines: options.skipEmptyLines ?? true,
      trim: options.trim ?? true,
    };
  }

  /**
   * Parses CSV string into Arrow Table.
   * 
   * @param csvString - CSV data as string
   * @returns Parse result with Arrow Table
   */
  async parse(csvString: string): Promise<ParseResult> {
    const errors: string[] = [];

    try {
      // Split into lines
      const lines = csvString.split(/\r?\n/);
      
      // Filter empty lines if needed
      const dataLines = this.options.skipEmptyLines
        ? lines.filter(line => line.trim().length > 0)
        : lines;

      if (dataLines.length === 0) {
        throw new Error('CSV data is empty');
      }

      // Parse header
      let headers: string[];
      let dataStartIndex = 0;

      if (this.options.hasHeader) {
        headers = this.parseLine(dataLines[0]);
        dataStartIndex = 1;
      } else {
        // Generate column names: col0, col1, col2, etc.
        const firstRow = this.parseLine(dataLines[0]);
        headers = firstRow.map((_, i) => `col${i}`);
      }

      // Get data rows
      const rows = dataLines.slice(dataStartIndex).map(line => this.parseLine(line));

      // Validate row lengths
      const expectedLength = headers.length;
      const invalidRows = rows.filter(row => row.length !== expectedLength);
      
      if (invalidRows.length > 0) {
        errors.push(`Found ${invalidRows.length} rows with incorrect column count`);
      }

      // Filter rows with correct length
      const validRows = rows.filter(row => row.length === expectedLength);

      if (validRows.length === 0) {
        throw new Error('No valid data rows found');
      }

      // Infer schema if not provided
      const schema = this.options.schema || this.inferSchema(headers, validRows);

      // Convert to columnar format
      const columns: Record<string, any[]> = {};
      headers.forEach(header => {
        columns[header] = [];
      });

      // Populate columns
      for (const row of validRows) {
        headers.forEach((header, i) => {
          const rawValue = row[i];
          const field = schema.fields.find(f => f.name === header);
          const parsedValue = this.parseValue(rawValue, field?.type);
          columns[header].push(parsedValue);
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
      throw new Error(`CSV parsing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Parses a single CSV line into fields.
   * 
   * Handles quoted fields and escaped quotes.
   */
  private parseLine(line: string): string[] {
    const fields: string[] = [];
    let currentField = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i += 2;
          continue;
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
          i++;
          continue;
        }
      }

      if (char === this.options.delimiter && !inQuotes) {
        // End of field
        fields.push(this.options.trim ? currentField.trim() : currentField);
        currentField = '';
        i++;
        continue;
      }

      currentField += char;
      i++;
    }

    // Add last field
    fields.push(this.options.trim ? currentField.trim() : currentField);

    return fields;
  }

  /**
   * Infers Arrow schema from sample data.
   */
  private inferSchema(headers: string[], rows: string[][]): Schema {
    const sampleRows = rows.slice(0, Math.min(this.options.sampleSize, rows.length));
    const fields: Field[] = [];

    for (let colIndex = 0; colIndex < headers.length; colIndex++) {
      const columnName = headers[colIndex];
      const columnValues = sampleRows.map(row => row[colIndex]);
      
      const dataType = this.inferColumnType(columnValues);
      fields.push(new Field(columnName, dataType, true)); // nullable = true
    }

    return new Schema(fields);
  }

  /**
   * Infers data type for a column based on sample values.
   */
  private inferColumnType(values: string[]): DataType {
    let hasInt = false;
    let hasFloat = false;
    let hasBool = false;
    let hasString = false;

    for (const value of values) {
      if (this.isNull(value)) {
        continue;
      }

      if (this.isBool(value)) {
        hasBool = true;
      } else if (this.isInt(value)) {
        hasInt = true;
      } else if (this.isFloat(value)) {
        hasFloat = true;
      } else {
        hasString = true;
      }
    }

    // Type precedence: string > float > int > bool
    if (hasString) {
      return new Utf8();
    }
    if (hasFloat) {
      return new Float64();
    }
    if (hasInt) {
      return new Int32();
    }
    if (hasBool) {
      return new Bool();
    }

    // Default to string
    return new Utf8();
  }

  /**
   * Parses a value according to its data type.
   */
  private parseValue(rawValue: string, dataType?: DataType): any {
    if (this.isNull(rawValue)) {
      return null;
    }

    if (!dataType) {
      return rawValue;
    }

    const typeName = dataType.toString();

    if (typeName.includes('Int')) {
      const parsed = parseInt(rawValue, 10);
      return isNaN(parsed) ? null : parsed;
    }

    if (typeName.includes('Float') || typeName.includes('Double')) {
      const parsed = parseFloat(rawValue);
      return isNaN(parsed) ? null : parsed;
    }

    if (typeName.includes('Bool')) {
      return this.parseBool(rawValue);
    }

    // Default: return as string
    return rawValue;
  }

  /**
   * Checks if value should be treated as null.
   */
  private isNull(value: string): boolean {
    return this.options.nullValues.includes(value);
  }

  /**
   * Checks if value looks like an integer.
   */
  private isInt(value: string): boolean {
    return /^-?\d+$/.test(value);
  }

  /**
   * Checks if value looks like a float.
   */
  private isFloat(value: string): boolean {
    return /^-?\d+\.\d+$/.test(value) || /^-?\d+(\.\d+)?[eE][+-]?\d+$/.test(value);
  }

  /**
   * Checks if value looks like a boolean.
   */
  private isBool(value: string): boolean {
    const lower = value.toLowerCase();
    return ['true', 'false', 't', 'f', 'yes', 'no', 'y', 'n', '1', '0'].includes(lower);
  }

  /**
   * Parses boolean value.
   */
  private parseBool(value: string): boolean | null {
    const lower = value.toLowerCase();
    if (['true', 't', 'yes', 'y', '1'].includes(lower)) {
      return true;
    }
    if (['false', 'f', 'no', 'n', '0'].includes(lower)) {
      return false;
    }
    return null;
  }
}

/**
 * Convenience function to parse CSV.
 */
export async function parseCSV(
  csvString: string,
  options?: CSVParseOptions
): Promise<Table> {
  const parser = new CSVParser(options);
  const result = await parser.parse(csvString);
  return result.table;
}

