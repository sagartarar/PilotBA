import { Table, tableFromArrays, Field, DataType, Schema, Utf8, Int32, Float64, Bool } from 'apache-arrow';
import { DataSource, LoadOptions } from './types';

export class DataLoader {
  async load(source: DataSource): Promise<Table> {
    switch (source.type) {
      case 'json':
        return this.loadJSON(source.data as any[], source.options);
      case 'csv':
        return this.loadCSV(source.data as string, source.options);
      case 'arrow':
        return this.loadArrow(source.data as ArrayBuffer);
      default:
        throw new Error(`Unsupported data source type: ${source.type}`);
    }
  }

  async loadJSON(data: any[], options?: LoadOptions): Promise<Table> {
    if (data.length === 0) {
      throw new Error('Cannot load empty dataset');
    }

    // Infer schema from data if not provided
    const schema = options?.schema || this.inferSchema(data);

    // Build column data
    const columns: Record<string, any[]> = {};
    schema.fields.forEach((field) => {
      columns[field.name] = [];
    });

    // Convert row-major to column-major
    data.forEach((row) => {
      schema.fields.forEach((field) => {
        const value = row[field.name];
        columns[field.name].push(value ?? null);
      });
    });

    return tableFromArrays(columns);
  }

  async loadCSV(csvString: string, options?: LoadOptions): Promise<Table> {
    const delimiter = options?.delimiter || ',';
    const hasHeader = options?.hasHeader ?? true;

    const lines = csvString.trim().split('\n');
    if (lines.length === 0) {
      throw new Error('Cannot load empty CSV');
    }

    // Parse header
    const headers = hasHeader
      ? this.parseCSVLine(lines[0], delimiter)
      : lines[0].split(delimiter).map((_, i) => `col${i}`);

    const dataStartIndex = hasHeader ? 1 : 0;

    // Parse data rows
    const rows: any[] = [];
    for (let i = dataStartIndex; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i], delimiter);
      const row: any = {};
      headers.forEach((header, j) => {
        row[header] = values[j];
      });
      rows.push(row);
    }

    // Infer types and convert
    const columns: Record<string, any[]> = {};
    headers.forEach((header) => {
      columns[header] = [];
    });

    rows.forEach((row) => {
      headers.forEach((header) => {
        const value = row[header];
        columns[header].push(this.inferAndConvert(value));
      });
    });

    return tableFromArrays(columns);
  }

  async loadArrow(buffer: ArrayBuffer): Promise<Table> {
    // Load Arrow IPC format
    const table = Table.from(new Uint8Array(buffer));
    return table;
  }

  inferSchema(data: any[], sampleSize = 100): Schema {
    const sample = data.slice(0, Math.min(sampleSize, data.length));
    const firstRow = sample[0];

    const fields: Field[] = [];

    for (const key of Object.keys(firstRow)) {
      const values = sample.map((row) => row[key]).filter((v) => v !== null && v !== undefined);

      let type: DataType = new Utf8(); // Default to string

      if (values.length > 0) {
        const firstValue = values[0];

        if (typeof firstValue === 'boolean') {
          type = new Bool();
        } else if (typeof firstValue === 'number') {
          // Check if all numbers are integers
          const allIntegers = values.every((v) => Number.isInteger(v));
          type = allIntegers ? new Int32() : new Float64();
        } else if (typeof firstValue === 'string') {
          // Try to parse as number
          const allNumbers = values.every((v) => !isNaN(parseFloat(v)));
          if (allNumbers) {
            type = new Float64();
          }
        }
      }

      fields.push(new Field(key, type, true)); // nullable
    }

    return new Schema(fields);
  }

  validateData(data: any[], schema: Schema): boolean {
    if (data.length === 0) return true;

    for (const row of data) {
      for (const field of schema.fields) {
        const value = row[field.name];

        if (value === null || value === undefined) {
          if (!field.nullable) {
            return false;
          }
          continue;
        }

        // Type checking based on Arrow type
        const typeName = field.type.toString();
        if (typeName.includes('Int') && typeof value !== 'number') {
          return false;
        }
        if (typeName.includes('Float') && typeof value !== 'number') {
          return false;
        }
        if (typeName.includes('Utf8') && typeof value !== 'string') {
          return false;
        }
        if (typeName.includes('Bool') && typeof value !== 'boolean') {
          return false;
        }
      }
    }

    return true;
  }

  private parseCSVLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  private inferAndConvert(value: string): any {
    if (value === '' || value === null || value === undefined) {
      return null;
    }

    // Try boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    // Try number
    const num = parseFloat(value);
    if (!isNaN(num)) {
      return num;
    }

    // Default to string
    return value;
  }
}


