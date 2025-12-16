/**
 * Data Sampler with multiple sampling strategies.
 * 
 * Implements various sampling algorithms for large dataset visualization.
 * 
 * @see Design Doc: 02-data-processing-pipeline.md (Lines 546-631)
 */

import { Table, Vector, tableFromArrays } from 'apache-arrow';

export type SamplingStrategy = 'random' | 'stratified' | 'systematic' | 'lttb';

export interface SamplingOptions {
  strategy: SamplingStrategy;
  sampleSize: number;
  stratifyColumn?: string;    // For stratified sampling
  xColumn?: string;           // For LTTB
  yColumn?: string;           // For LTTB
  seed?: number;              // For reproducible random sampling
}

/**
 * Data Sampler class.
 */
export class DataSampler {
  /**
   * Samples a table using specified strategy.
   * 
   * @param table - Input table
   * @param options - Sampling options
   * @returns Sampled table
   */
  static sample(table: Table, options: SamplingOptions): Table {
    if (options.sampleSize >= table.numRows) {
      return table; // No sampling needed
    }

    switch (options.strategy) {
      case 'random':
        return this.randomSample(table, options.sampleSize, options.seed);

      case 'stratified':
        if (!options.stratifyColumn) {
          throw new Error('stratifyColumn required for stratified sampling');
        }
        return this.stratifiedSample(table, options.stratifyColumn, options.sampleSize);

      case 'systematic':
        return this.systematicSample(table, options.sampleSize);

      case 'lttb':
        if (!options.xColumn || !options.yColumn) {
          throw new Error('xColumn and yColumn required for LTTB sampling');
        }
        return this.lttbSample(table, options.xColumn, options.yColumn, options.sampleSize);

      default:
        throw new Error(`Unknown sampling strategy: ${options.strategy}`);
    }
  }

  /**
   * Random sampling: Selects random rows.
   * 
   * @param table - Input table
   * @param size - Sample size
   * @param seed - Random seed for reproducibility
   * @returns Sampled table
   */
  static randomSample(table: Table, size: number, seed?: number): Table {
    const indices = this.randomIndices(table.numRows, size, seed);
    return this.selectRows(table, indices);
  }

  /**
   * Stratified sampling: Preserves distribution of a column.
   * 
   * @param table - Input table
   * @param column - Column to stratify by
   * @param size - Target sample size
   * @returns Sampled table
   */
  static stratifiedSample(table: Table, column: string, size: number): Table {
    const col = table.getChild(column);
    if (!col) {
      throw new Error(`Column '${column}' not found`);
    }

    // Group rows by column value
    const groups = new Map<any, number[]>();

    for (let i = 0; i < table.numRows; i++) {
      const value = col.get(i);
      const key = JSON.stringify(value);

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(i);
    }

    // Sample from each group proportionally
    const sampledIndices: number[] = [];
    const groupCount = groups.size;

    groups.forEach((indices) => {
      const groupSize = indices.length;
      const groupSampleSize = Math.max(1, Math.floor((groupSize / table.numRows) * size));
      
      const groupSample = this.randomIndices(groupSize, Math.min(groupSampleSize, groupSize));
      sampledIndices.push(...groupSample.map(i => indices[i]));
    });

    // Trim to exact size if needed
    if (sampledIndices.length > size) {
      sampledIndices.length = size;
    }

    return this.selectRows(table, sampledIndices);
  }

  /**
   * Systematic sampling: Selects every Nth row.
   * 
   * @param table - Input table
   * @param size - Sample size
   * @returns Sampled table
   */
  static systematicSample(table: Table, size: number): Table {
    const step = Math.floor(table.numRows / size);
    const indices: number[] = [];

    for (let i = 0; i < table.numRows && indices.length < size; i += step) {
      indices.push(i);
    }

    return this.selectRows(table, indices);
  }

  /**
   * LTTB (Largest Triangle Three Buckets) sampling.
   * 
   * Downsampling algorithm optimized for time series visualization.
   * Preserves visual characteristics of the data.
   * 
   * @param table - Input table
   * @param xColumn - X-axis column (typically time)
   * @param yColumn - Y-axis column (typically value)
   * @param size - Target sample size
   * @returns Sampled table
   * 
   * @see https://skemman.is/bitstream/1946/15343/3/SS_MSthesis.pdf
   */
  static lttbSample(table: Table, xColumn: string, yColumn: string, size: number): Table {
    const x = table.getChild(xColumn);
    const y = table.getChild(yColumn);

    if (!x || !y) {
      throw new Error(`Columns '${xColumn}' or '${yColumn}' not found`);
    }

    if (size >= table.numRows) {
      return table;
    }

    const bucketSize = (table.numRows - 2) / (size - 2);
    const sampledIndices = [0]; // Always include first point

    let a = 0; // Index of current point in result

    for (let i = 0; i < size - 2; i++) {
      // Calculate bucket range for current bucket
      const bucketStart = Math.floor((i + 1) * bucketSize) + 1;
      const bucketEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, table.numRows);

      // Calculate average point in next bucket
      let avgX = 0;
      let avgY = 0;
      let avgCount = 0;

      const nextBucketStart = bucketEnd;
      const nextBucketEnd = Math.min(Math.floor((i + 3) * bucketSize) + 1, table.numRows);

      for (let j = nextBucketStart; j < nextBucketEnd; j++) {
        avgX += x.get(j) as number;
        avgY += y.get(j) as number;
        avgCount++;
      }

      if (avgCount > 0) {
        avgX /= avgCount;
        avgY /= avgCount;
      }

      // Find point in current bucket with largest triangle area
      let maxArea = -1;
      let maxIndex = bucketStart;

      const aX = x.get(a) as number;
      const aY = y.get(a) as number;

      for (let j = bucketStart; j < bucketEnd; j++) {
        const bX = x.get(j) as number;
        const bY = y.get(j) as number;

        // Calculate triangle area using cross product
        const area = Math.abs(
          (aX - avgX) * (bY - aY) - (aX - bX) * (avgY - aY)
        ) * 0.5;

        if (area > maxArea) {
          maxArea = area;
          maxIndex = j;
        }
      }

      sampledIndices.push(maxIndex);
      a = maxIndex; // Update current point
    }

    sampledIndices.push(table.numRows - 1); // Always include last point

    return this.selectRows(table, sampledIndices);
  }

  /**
   * Generates random indices.
   */
  private static randomIndices(max: number, count: number, seed?: number): number[] {
    // Simple seeded random number generator
    let random = seed !== undefined
      ? this.seededRandom(seed)
      : Math.random;

    const indices: number[] = [];
    const selected = new Set<number>();

    while (indices.length < count && indices.length < max) {
      const index = Math.floor(random() * max);
      if (!selected.has(index)) {
        selected.add(index);
        indices.push(index);
      }
    }

    return indices.sort((a, b) => a - b); // Keep in order
  }

  /**
   * Seeded random number generator (simple LCG).
   */
  private static seededRandom(seed: number): () => number {
    let state = seed;

    return () => {
      // Linear Congruential Generator
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  }

  /**
   * Selects specific rows from table by indices.
   */
  private static selectRows(table: Table, indices: number[]): Table {
    const resultColumns: Record<string, any[]> = {};

    // Initialize columns
    table.schema.fields.forEach(field => {
      resultColumns[field.name] = [];
    });

    // Populate with selected rows
    for (const index of indices) {
      table.schema.fields.forEach(field => {
        const column = table.getChild(field.name)!;
        resultColumns[field.name].push(column.get(index));
      });
    }

    return tableFromArrays(resultColumns);
  }

  /**
   * Adaptive sampling: Chooses strategy based on data characteristics.
   */
  static adaptiveSample(table: Table, targetSize: number): Table {
    // If table is small, no sampling needed
    if (table.numRows <= targetSize) {
      return table;
    }

    // Try to detect if data is time series
    const hasTimeColumn = table.schema.fields.some(field =>
      field.name.toLowerCase().includes('time') ||
      field.name.toLowerCase().includes('date') ||
      field.name.toLowerCase().includes('timestamp')
    );

    if (hasTimeColumn) {
      // Use LTTB for time series
      const timeColumn = table.schema.fields.find(field =>
        field.name.toLowerCase().includes('time') ||
        field.name.toLowerCase().includes('date')
      )!.name;

      const valueColumn = table.schema.fields.find(field =>
        !field.name.toLowerCase().includes('time') &&
        !field.name.toLowerCase().includes('date')
      )?.name;

      if (valueColumn) {
        return this.lttbSample(table, timeColumn, valueColumn, targetSize);
      }
    }

    // Default to random sampling
    return this.randomSample(table, targetSize);
  }
}

