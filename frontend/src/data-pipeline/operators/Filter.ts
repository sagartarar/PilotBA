/**
 * Filter operator with vectorized operations.
 *
 * Implements efficient filtering of Arrow Tables using vectorized comparisons.
 *
 * @see Design Doc: 02-data-processing-pipeline.md (Lines 282-320)
 */

import {
  Table,
  Vector,
  tableFromArrays,
  Bool,
  Utf8,
  predicate,
} from "apache-arrow";

export type FilterOperatorType =
  | "eq"
  | "ne"
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  | "in"
  | "between"
  | "like"
  | "notNull"
  | "isNull";

export interface FilterParams {
  column: string;
  operator: FilterOperatorType;
  value?: any;
  values?: any[]; // For 'in' operator
  min?: any; // For 'between' operator
  max?: any; // For 'between' operator
  pattern?: string; // For 'like' operator
}

/**
 * Filter operator class.
 */
export class FilterOperator {
  /**
   * Applies filter to table.
   *
   * @param table - Input Arrow Table
   * @param params - Filter parameters
   * @returns Filtered table
   */
  static apply(table: Table, params: FilterParams): Table {
    const column = table.getChild(params.column);

    if (!column) {
      throw new Error(`Column '${params.column}' not found in table`);
    }

    // Create boolean mask
    const mask = this.createMask(column, params);

    // Filter table using mask
    return this.filterTable(table, mask);
  }

  /**
   * Applies multiple filters with AND logic.
   *
   * @param table - Input Arrow Table
   * @param filters - Array of filter parameters
   * @returns Filtered table
   */
  static applyMultiple(table: Table, filters: FilterParams[]): Table {
    let result = table;

    for (const filter of filters) {
      result = this.apply(result, filter);
    }

    return result;
  }

  /**
   * Creates boolean mask for filtering.
   */
  private static createMask(column: Vector, params: FilterParams): Uint8Array {
    const length = column.length;
    const mask = new Uint8Array(length);

    switch (params.operator) {
      case "eq":
        return this.maskEqual(column, params.value!);

      case "ne":
        return this.maskNotEqual(column, params.value!);

      case "gt":
        return this.maskGreaterThan(column, params.value!);

      case "lt":
        return this.maskLessThan(column, params.value!);

      case "gte":
        return this.maskGreaterThanOrEqual(column, params.value!);

      case "lte":
        return this.maskLessThanOrEqual(column, params.value!);

      case "in":
        return this.maskIn(column, params.values!);

      case "between":
        return this.maskBetween(column, params.min!, params.max!);

      case "like":
        return this.maskLike(column, params.pattern!);

      case "notNull":
        return this.maskNotNull(column);

      case "isNull":
        return this.maskIsNull(column);

      default:
        throw new Error(`Unknown filter operator: ${params.operator}`);
    }
  }

  /**
   * Vectorized equal comparison.
   */
  private static maskEqual(column: Vector, value: any): Uint8Array {
    const mask = new Uint8Array(column.length);

    for (let i = 0; i < column.length; i++) {
      const val = column.get(i);
      mask[i] = val === value ? 1 : 0;
    }

    return mask;
  }

  /**
   * Vectorized not equal comparison.
   */
  private static maskNotEqual(column: Vector, value: any): Uint8Array {
    const mask = new Uint8Array(column.length);

    for (let i = 0; i < column.length; i++) {
      const val = column.get(i);
      mask[i] = val !== value ? 1 : 0;
    }

    return mask;
  }

  /**
   * Vectorized greater than comparison.
   */
  private static maskGreaterThan(column: Vector, value: any): Uint8Array {
    const mask = new Uint8Array(column.length);

    for (let i = 0; i < column.length; i++) {
      const val = column.get(i);
      mask[i] = val !== null && val > value ? 1 : 0;
    }

    return mask;
  }

  /**
   * Vectorized less than comparison.
   */
  private static maskLessThan(column: Vector, value: any): Uint8Array {
    const mask = new Uint8Array(column.length);

    for (let i = 0; i < column.length; i++) {
      const val = column.get(i);
      mask[i] = val !== null && val < value ? 1 : 0;
    }

    return mask;
  }

  /**
   * Vectorized greater than or equal comparison.
   */
  private static maskGreaterThanOrEqual(
    column: Vector,
    value: any
  ): Uint8Array {
    const mask = new Uint8Array(column.length);

    for (let i = 0; i < column.length; i++) {
      const val = column.get(i);
      mask[i] = val !== null && val >= value ? 1 : 0;
    }

    return mask;
  }

  /**
   * Vectorized less than or equal comparison.
   */
  private static maskLessThanOrEqual(column: Vector, value: any): Uint8Array {
    const mask = new Uint8Array(column.length);

    for (let i = 0; i < column.length; i++) {
      const val = column.get(i);
      mask[i] = val !== null && val <= value ? 1 : 0;
    }

    return mask;
  }

  /**
   * Vectorized IN operator.
   */
  private static maskIn(column: Vector, values: any[]): Uint8Array {
    const mask = new Uint8Array(column.length);
    const valueSet = new Set(values);

    for (let i = 0; i < column.length; i++) {
      const val = column.get(i);
      mask[i] = valueSet.has(val) ? 1 : 0;
    }

    return mask;
  }

  /**
   * Vectorized BETWEEN operator.
   */
  private static maskBetween(column: Vector, min: any, max: any): Uint8Array {
    const mask = new Uint8Array(column.length);

    for (let i = 0; i < column.length; i++) {
      const val = column.get(i);
      mask[i] = val !== null && val >= min && val <= max ? 1 : 0;
    }

    return mask;
  }

  /**
   * Vectorized LIKE operator (SQL pattern matching).
   */
  private static maskLike(column: Vector, pattern: string): Uint8Array {
    const mask = new Uint8Array(column.length);

    // Convert SQL LIKE pattern to RegExp
    // % -> .*, _ -> .
    const regexPattern = pattern
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // Escape regex special chars
      .replace(/%/g, ".*") // % matches any sequence
      .replace(/_/g, "."); // _ matches single char

    const regex = new RegExp(`^${regexPattern}$`, "i");

    for (let i = 0; i < column.length; i++) {
      const val = column.get(i);
      mask[i] = val !== null && regex.test(String(val)) ? 1 : 0;
    }

    return mask;
  }

  /**
   * Vectorized NOT NULL check.
   */
  private static maskNotNull(column: Vector): Uint8Array {
    const mask = new Uint8Array(column.length);

    for (let i = 0; i < column.length; i++) {
      const val = column.get(i);
      mask[i] = val !== null && val !== undefined ? 1 : 0;
    }

    return mask;
  }

  /**
   * Vectorized IS NULL check.
   */
  private static maskIsNull(column: Vector): Uint8Array {
    const mask = new Uint8Array(column.length);

    for (let i = 0; i < column.length; i++) {
      const val = column.get(i);
      mask[i] = val === null || val === undefined ? 1 : 0;
    }

    return mask;
  }

  /**
   * Filters table using boolean mask.
   */
  private static filterTable(table: Table, mask: Uint8Array): Table {
    // Collect row indices where mask is 1
    const indices: number[] = [];
    for (let i = 0; i < mask.length; i++) {
      if (mask[i] === 1) {
        indices.push(i);
      }
    }

    // Build result data for each column
    const resultData: Record<string, any[]> = {};

    for (const field of table.schema.fields) {
      resultData[field.name] = [];
    }

    // If no rows match, return empty table with same schema
    if (indices.length === 0) {
      return tableFromArrays(resultData);
    }

    // Filter all columns
    for (const field of table.schema.fields) {
      const column = table.getChild(field.name)!;

      for (const index of indices) {
        resultData[field.name].push(column.get(index));
      }
    }

    return tableFromArrays(resultData);
  }

  /**
   * Combines multiple masks with AND logic.
   */
  static combineMasksAnd(masks: Uint8Array[]): Uint8Array {
    if (masks.length === 0) {
      throw new Error("No masks to combine");
    }

    const result = new Uint8Array(masks[0].length);
    result.fill(1);

    for (const mask of masks) {
      for (let i = 0; i < result.length; i++) {
        result[i] = result[i] && mask[i];
      }
    }

    return result;
  }

  /**
   * Combines multiple masks with OR logic.
   */
  static combineMasksOr(masks: Uint8Array[]): Uint8Array {
    if (masks.length === 0) {
      throw new Error("No masks to combine");
    }

    const result = new Uint8Array(masks[0].length);

    for (const mask of masks) {
      for (let i = 0; i < result.length; i++) {
        result[i] = result[i] || mask[i];
      }
    }

    return result;
  }
}
