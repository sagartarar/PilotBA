import { Table, Vector } from 'apache-arrow';
import { TableMetadata, ColumnStats } from './types';

export class TableStore {
  private tables: Map<string, Table>;
  private metadata: Map<string, TableMetadata>;

  constructor() {
    this.tables = new Map();
    this.metadata = new Map();
  }

  register(id: string, name: string, table: Table): void {
    this.tables.set(id, table);

    // Compute column statistics
    const columnStats = new Map<string, ColumnStats>();
    for (const field of table.schema.fields) {
      const column = table.getChild(field.name);
      if (column) {
        columnStats.set(field.name, this.computeStats(column));
      }
    }

    const metadata: TableMetadata = {
      id,
      name,
      schema: table.schema,
      rowCount: table.numRows,
      columnStats,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.metadata.set(id, metadata);
  }

  get(id: string): Table | undefined {
    return this.tables.get(id);
  }

  getMetadata(id: string): TableMetadata | undefined {
    return this.metadata.get(id);
  }

  delete(id: string): void {
    this.tables.delete(id);
    this.metadata.delete(id);
  }

  list(): TableMetadata[] {
    return Array.from(this.metadata.values());
  }

  getStats(tableId: string, columnName: string): ColumnStats | undefined {
    const metadata = this.metadata.get(tableId);
    return metadata?.columnStats.get(columnName);
  }

  updateTable(id: string, table: Table): void {
    const metadata = this.metadata.get(id);
    if (!metadata) {
      throw new Error(`Table ${id} not found`);
    }

    this.tables.set(id, table);

    // Update metadata
    const columnStats = new Map<string, ColumnStats>();
    for (const field of table.schema.fields) {
      const column = table.getChild(field.name);
      if (column) {
        columnStats.set(field.name, this.computeStats(column));
      }
    }

    metadata.rowCount = table.numRows;
    metadata.columnStats = columnStats;
    metadata.updatedAt = new Date();
  }

  private computeStats(column: Vector): ColumnStats {
    let min: any = Infinity;
    let max: any = -Infinity;
    let nullCount = 0;
    let sum = 0;
    let count = 0;
    const distinct = new Set();

    const isNumeric = this.isNumericColumn(column);

    for (let i = 0; i < column.length; i++) {
      const value = column.get(i);

      if (value === null || value === undefined) {
        nullCount++;
        continue;
      }

      count++;
      distinct.add(value);

      if (isNumeric) {
        const numValue = value as number;
        if (numValue < min) min = numValue;
        if (numValue > max) max = numValue;
        sum += numValue;
      } else {
        // For non-numeric, just track min/max as first/last
        if (min === Infinity) min = value;
        max = value;
      }
    }

    const stats: ColumnStats = {
      min: min === Infinity ? null : min,
      max: max === -Infinity ? null : max,
      nullCount,
      distinctCount: distinct.size,
    };

    if (isNumeric && count > 0) {
      stats.mean = sum / count;

      // Compute standard deviation
      let sumSquaredDiff = 0;
      for (let i = 0; i < column.length; i++) {
        const value = column.get(i);
        if (value !== null && value !== undefined) {
          sumSquaredDiff += Math.pow((value as number) - stats.mean!, 2);
        }
      }
      stats.stddev = Math.sqrt(sumSquaredDiff / count);
    }

    return stats;
  }

  private isNumericColumn(column: Vector): boolean {
    const typeName = column.type.toString();
    return typeName.includes('Int') || typeName.includes('Float');
  }

  clear(): void {
    this.tables.clear();
    this.metadata.clear();
  }

  size(): number {
    return this.tables.size;
  }
}

