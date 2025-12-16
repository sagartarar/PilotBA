/**
 * Statistics utilities for column statistics computation.
 * 
 * Computes min, max, distinct count, and other statistics for Arrow Table columns.
 */

import { Table, Vector } from 'apache-arrow';

export interface ColumnStats {
  min: any;
  max: any;
  nullCount: number;
  distinctCount?: number;
  mean?: number;
  median?: number;
  stddev?: number;
  quartiles?: [number, number, number]; // Q1, Q2 (median), Q3
}

export interface TableStats {
  rowCount: number;
  columnCount: number;
  columnStats: Map<string, ColumnStats>;
}

/**
 * Statistics class.
 */
export class Statistics {
  /**
   * Computes statistics for all columns in a table.
   * 
   * @param table - Input table
   * @param computeDistinct - Whether to compute distinct count (expensive)
   * @param computeAdvanced - Whether to compute mean, median, stddev
   * @returns Table statistics
   */
  static computeTableStats(
    table: Table,
    computeDistinct: boolean = true,
    computeAdvanced: boolean = false
  ): TableStats {
    const columnStats = new Map<string, ColumnStats>();

    for (const field of table.schema.fields) {
      const column = table.getChild(field.name)!;
      const stats = this.computeColumnStats(
        column,
        computeDistinct,
        computeAdvanced
      );
      columnStats.set(field.name, stats);
    }

    return {
      rowCount: table.numRows,
      columnCount: table.numCols,
      columnStats,
    };
  }

  /**
   * Computes statistics for a single column.
   * 
   * @param column - Column vector
   * @param computeDistinct - Whether to compute distinct count
   * @param computeAdvanced - Whether to compute mean, median, stddev
   * @returns Column statistics
   */
  static computeColumnStats(
    column: Vector,
    computeDistinct: boolean = true,
    computeAdvanced: boolean = false
  ): ColumnStats {
    let min: any = null;
    let max: any = null;
    let nullCount = 0;
    const distinct = computeDistinct ? new Set() : null;

    const numericValues: number[] = [];
    let isNumeric = true;

    // First pass: basic stats
    for (let i = 0; i < column.length; i++) {
      const value = column.get(i);

      if (value === null || value === undefined) {
        nullCount++;
        continue;
      }

      // Track distinct values
      if (distinct) {
        distinct.add(JSON.stringify(value));
      }

      // Track min/max
      if (min === null || value < min) {
        min = value;
      }
      if (max === null || value > max) {
        max = value;
      }

      // Collect numeric values for advanced stats
      if (computeAdvanced && typeof value === 'number') {
        numericValues.push(value);
      } else if (typeof value !== 'number') {
        isNumeric = false;
      }
    }

    const stats: ColumnStats = {
      min,
      max,
      nullCount,
      distinctCount: distinct ? distinct.size : undefined,
    };

    // Compute advanced stats for numeric columns
    if (computeAdvanced && isNumeric && numericValues.length > 0) {
      stats.mean = this.computeMean(numericValues);
      stats.median = this.computeMedian(numericValues);
      stats.stddev = this.computeStdDev(numericValues, stats.mean);
      stats.quartiles = this.computeQuartiles(numericValues);
    }

    return stats;
  }

  /**
   * Computes mean of numeric values.
   */
  private static computeMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Computes median of numeric values.
   */
  private static computeMedian(values: number[]): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    } else {
      return sorted[mid];
    }
  }

  /**
   * Computes standard deviation.
   */
  private static computeStdDev(values: number[], mean: number): number {
    if (values.length === 0) return 0;

    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;

    return Math.sqrt(variance);
  }

  /**
   * Computes quartiles (Q1, Q2/median, Q3).
   */
  private static computeQuartiles(values: number[]): [number, number, number] {
    if (values.length === 0) return [0, 0, 0];

    const sorted = [...values].sort((a, b) => a - b);

    const q1 = this.percentile(sorted, 25);
    const q2 = this.percentile(sorted, 50);
    const q3 = this.percentile(sorted, 75);

    return [q1, q2, q3];
  }

  /**
   * Computes percentile of sorted values.
   */
  private static percentile(sortedValues: number[], p: number): number {
    if (sortedValues.length === 0) return 0;

    const index = (p / 100) * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) {
      return sortedValues[lower];
    }

    const weight = index - lower;
    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
  }

  /**
   * Computes histogram for numeric column.
   * 
   * @param column - Column vector
   * @param bins - Number of bins
   * @returns Histogram bins and counts
   */
  static computeHistogram(
    column: Vector,
    bins: number = 10
  ): { bins: number[]; counts: number[] } {
    const values: number[] = [];

    // Collect numeric values
    for (let i = 0; i < column.length; i++) {
      const value = column.get(i);
      if (typeof value === 'number' && !isNaN(value)) {
        values.push(value);
      }
    }

    if (values.length === 0) {
      return { bins: [], counts: [] };
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const binWidth = (max - min) / bins;

    const binEdges: number[] = [];
    const counts: number[] = new Array(bins).fill(0);

    // Create bin edges
    for (let i = 0; i <= bins; i++) {
      binEdges.push(min + i * binWidth);
    }

    // Count values in each bin
    for (const value of values) {
      let binIndex = Math.floor((value - min) / binWidth);
      if (binIndex === bins) binIndex = bins - 1; // Handle max value
      counts[binIndex]++;
    }

    return { bins: binEdges, counts };
  }

  /**
   * Computes value counts (frequency) for categorical column.
   * 
   * @param column - Column vector
   * @param topN - Return only top N most frequent values
   * @returns Map of value to count
   */
  static computeValueCounts(
    column: Vector,
    topN?: number
  ): Map<any, number> {
    const counts = new Map<any, number>();

    for (let i = 0; i < column.length; i++) {
      const value = column.get(i);
      const key = JSON.stringify(value);
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    if (topN) {
      // Sort by count and take top N
      const sorted = Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN);

      return new Map(sorted);
    }

    return counts;
  }

  /**
   * Computes correlation between two numeric columns.
   * 
   * @param column1 - First column
   * @param column2 - Second column
   * @returns Pearson correlation coefficient (-1 to 1)
   */
  static computeCorrelation(column1: Vector, column2: Vector): number {
    const pairs: Array<[number, number]> = [];

    // Collect paired numeric values
    const length = Math.min(column1.length, column2.length);

    for (let i = 0; i < length; i++) {
      const val1 = column1.get(i);
      const val2 = column2.get(i);

      if (typeof val1 === 'number' && typeof val2 === 'number' &&
          !isNaN(val1) && !isNaN(val2)) {
        pairs.push([val1, val2]);
      }
    }

    if (pairs.length < 2) {
      return 0; // Not enough data
    }

    // Compute means
    const mean1 = pairs.reduce((sum, [v1]) => sum + v1, 0) / pairs.length;
    const mean2 = pairs.reduce((sum, [, v2]) => sum + v2, 0) / pairs.length;

    // Compute correlation
    let numerator = 0;
    let sum1Sq = 0;
    let sum2Sq = 0;

    for (const [v1, v2] of pairs) {
      const diff1 = v1 - mean1;
      const diff2 = v2 - mean2;

      numerator += diff1 * diff2;
      sum1Sq += diff1 * diff1;
      sum2Sq += diff2 * diff2;
    }

    const denominator = Math.sqrt(sum1Sq * sum2Sq);

    if (denominator === 0) {
      return 0;
    }

    return numerator / denominator;
  }
}

