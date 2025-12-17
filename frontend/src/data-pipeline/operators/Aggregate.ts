/**
 * Aggregate operator with GROUP BY support.
 * 
 * Implements efficient aggregation operations on Arrow Tables.
 * 
 * @see Design Doc: 02-data-processing-pipeline.md (Lines 322-387)
 */

import { Table, Vector, tableFromArrays } from 'apache-arrow';

export type AggregateFunction = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'stddev' | 'variance' | 'first' | 'last';

export interface AggregationSpec {
  column: string;
  function: AggregateFunction;
  alias: string;
}

export interface AggregateParams {
  groupBy: string[];
  aggregations: AggregationSpec[];
}

/**
 * Aggregate operator class.
 */
export class AggregateOperator {
  /**
   * Applies aggregation to table.
   * 
   * @param table - Input Arrow Table
   * @param params - Aggregation parameters
   * @returns Aggregated table
   */
  static apply(table: Table, params: AggregateParams): Table {
    // Validate columns exist
    this.validateColumns(table, params);

    // Group rows by groupBy columns
    const groups = this.createGroups(table, params.groupBy);

    // Compute aggregations for each group
    const resultColumns: Record<string, any[]> = {};

    // Initialize result columns
    params.groupBy.forEach(col => {
      resultColumns[col] = [];
    });

    params.aggregations.forEach(agg => {
      resultColumns[agg.alias] = [];
    });

    // Compute for each group
    groups.forEach((indices, key) => {
      // Add group key values
      const keyParts = key.split('|');
      params.groupBy.forEach((col, i) => {
        resultColumns[col].push(this.parseKeyPart(keyParts[i]));
      });

      // Compute aggregations
      params.aggregations.forEach(agg => {
        const column = table.getChild(agg.column)!;
        const values = indices.map(i => column.get(i)).filter(v => v !== null && v !== undefined);
        const result = this.computeAggregation(values, agg.function);
        resultColumns[agg.alias].push(result);
      });
    });

    // Create result table
    return tableFromArrays(resultColumns);
  }

  /**
   * Validates that required columns exist in table.
   */
  private static validateColumns(table: Table, params: AggregateParams): void {
    const allColumns = new Set([
      ...params.groupBy,
      ...params.aggregations.map(a => a.column),
    ]);

    for (const col of allColumns) {
      if (!table.getChild(col)) {
        throw new Error(`Column '${col}' not found in table`);
      }
    }
  }

  /**
   * Creates groups from table rows.
   * 
   * @returns Map from group key to row indices
   */
  private static createGroups(table: Table, groupBy: string[]): Map<string, number[]> {
    const groups = new Map<string, number[]>();

    for (let i = 0; i < table.numRows; i++) {
      const key = groupBy
        .map(col => {
          const value = table.getChild(col)!.get(i);
          return this.serializeKeyPart(value);
        })
        .join('|');

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(i);
    }

    return groups;
  }

  /**
   * Serializes a value for use in group key.
   */
  private static serializeKeyPart(value: any): string {
    if (value === null || value === undefined) {
      return '__NULL__';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  /**
   * Parses a value from group key.
   */
  private static parseKeyPart(serialized: string): any {
    if (serialized === '__NULL__') {
      return null;
    }
    if (serialized.startsWith('{') || serialized.startsWith('[')) {
      try {
        return JSON.parse(serialized);
      } catch {
        return serialized;
      }
    }
    // Try to parse as number
    const num = Number(serialized);
    if (!isNaN(num)) {
      return num;
    }
    return serialized;
  }

  /**
   * Computes aggregation for a group of values.
   */
  private static computeAggregation(values: any[], func: AggregateFunction): any {
    if (values.length === 0) {
      return null;
    }

    switch (func) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);

      case 'avg':
        return values.reduce((a, b) => a + b, 0) / values.length;

      case 'count':
        return values.length;

      case 'min':
        return Math.min(...values);

      case 'max':
        return Math.max(...values);

      case 'stddev':
        return this.computeStdDev(values);

      case 'variance':
        return this.computeVariance(values);

      case 'first':
        return values[0];

      case 'last':
        return values[values.length - 1];

      default:
        throw new Error(`Unknown aggregation function: ${func}`);
    }
  }

  /**
   * Computes standard deviation.
   */
  private static computeStdDev(values: number[]): number {
    return Math.sqrt(this.computeVariance(values));
  }

  /**
   * Computes variance.
   */
  private static computeVariance(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Applies aggregation without grouping (aggregate entire table).
   */
  static applyGlobal(table: Table, aggregations: AggregationSpec[]): Table {
    const resultColumns: Record<string, any[]> = {};

    aggregations.forEach(agg => {
      const column = table.getChild(agg.column);
      if (!column) {
        throw new Error(`Column '${agg.column}' not found`);
      }

      const values: any[] = [];
      for (let i = 0; i < column.length; i++) {
        const val = column.get(i);
        if (val !== null && val !== undefined) {
          values.push(val);
        }
      }

      const result = this.computeAggregation(values, agg.function);
      resultColumns[agg.alias] = [result];
    });

    return tableFromArrays(resultColumns);
  }
}

