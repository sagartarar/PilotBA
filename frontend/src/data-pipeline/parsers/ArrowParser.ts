/**
 * Arrow IPC Parser.
 * 
 * Parses Arrow IPC (Inter-Process Communication) format data.
 * This is the native Arrow binary format for zero-copy data transfer.
 * 
 * @see Design Doc: 02-data-processing-pipeline.md
 */

import { Table, tableFromIPC, RecordBatchReader, tableFromArrays } from 'apache-arrow';

export interface ArrowParseOptions {
  streaming?: boolean;
}

export interface ParseResult {
  table: Table;
  rowCount: number;
  columnCount: number;
  schema: any;
}

/**
 * Arrow IPC Parser class.
 */
export class ArrowParser {
  private options: Required<ArrowParseOptions>;

  constructor(options: ArrowParseOptions = {}) {
    this.options = {
      streaming: options.streaming ?? false,
    };
  }

  /**
   * Parses Arrow IPC format into Arrow Table.
   * 
   * @param buffer - ArrayBuffer or Uint8Array containing Arrow IPC data
   * @returns Parse result with Arrow Table
   */
  async parse(buffer: ArrayBuffer | Uint8Array): Promise<ParseResult> {
    try {
      const data = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;

      // Parse using Arrow's tableFromIPC
      const table = tableFromIPC(data);

      // Extract schema information as a plain object (Arrow v14 compatible)
      const schemaInfo = {
        fields: table.schema.fields.map(field => ({
          name: field.name,
          type: field.type.toString(),
          nullable: field.nullable,
        })),
      };

      return {
        table,
        rowCount: table.numRows,
        columnCount: table.numCols,
        schema: schemaInfo,
      };
    } catch (error) {
      throw new Error(`Arrow IPC parsing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Parses Arrow IPC in streaming mode.
   * 
   * @param buffer - ArrayBuffer or Uint8Array containing Arrow IPC stream
   * @param onBatch - Callback for each record batch
   */
  async parseStreaming(
    buffer: ArrayBuffer | Uint8Array,
    onBatch: (batch: Table) => void
  ): Promise<void> {
    try {
      const data = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;

      // Create reader for streaming data
      const reader = await RecordBatchReader.from(data);

      // Process each batch
      for await (const batch of reader) {
        // Convert batch to table using tableFromArrays (Arrow v14 compatible)
        const columns: Record<string, any[]> = {};
        
        for (const field of batch.schema.fields) {
          const column = batch.getChild(field.name);
          if (column) {
            const values: any[] = [];
            for (let i = 0; i < column.length; i++) {
              values.push(column.get(i));
            }
            columns[field.name] = values;
          }
        }
        
        const table = tableFromArrays(columns);
        onBatch(table);
      }
    } catch (error) {
      throw new Error(`Arrow streaming parsing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Parses Arrow Flight data.
   * 
   * Arrow Flight is a framework for high-performance data services.
   */
  async parseFlightData(buffer: ArrayBuffer | Uint8Array): Promise<ParseResult> {
    // Flight data uses Arrow IPC format
    return this.parse(buffer);
  }
}

/**
 * Convenience function to parse Arrow IPC.
 */
export async function parseArrowIPC(
  buffer: ArrayBuffer | Uint8Array,
  options?: ArrowParseOptions
): Promise<Table> {
  const parser = new ArrowParser(options);
  const result = await parser.parse(buffer);
  return result.table;
}

/**
 * Checks if buffer contains valid Arrow IPC data.
 * 
 * Arrow IPC files start with magic bytes: 'ARROW1'
 */
export function isArrowIPCFile(buffer: ArrayBuffer | Uint8Array): boolean {
  const data = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;

  if (data.byteLength < 6) {
    return false;
  }

  const magic = String.fromCharCode(...data.slice(0, 6));
  return magic === 'ARROW1';
}

/**
 * Serializes Arrow Table to IPC format.
 * 
 * @param table - Arrow Table to serialize
 * @returns ArrayBuffer containing IPC data
 */
export function serializeToIPC(table: Table): Uint8Array {
  return table.serialize();
}

