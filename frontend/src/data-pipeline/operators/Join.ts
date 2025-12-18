/**
 * Join operator for table joins.
 *
 * Implements various types of SQL-like joins between Arrow Tables.
 */

import { Table, Vector, tableFromArrays, Schema, Field } from "apache-arrow";

export type JoinType = "inner" | "left" | "right" | "full" | "cross";

export interface JoinParams {
  type: JoinType;
  leftOn: string; // Left table join column
  rightOn: string; // Right table join column
  suffix?: string; // Suffix for duplicate column names (default: '_right')
}

/**
 * Join operator class.
 */
export class JoinOperator {
  /**
   * Joins two tables.
   *
   * @param left - Left table
   * @param right - Right table
   * @param params - Join parameters
   * @returns Joined table
   */
  static apply(left: Table, right: Table, params: JoinParams): Table {
    const suffix = params.suffix || "_right";

    switch (params.type) {
      case "inner":
        return this.innerJoin(
          left,
          right,
          params.leftOn,
          params.rightOn,
          suffix
        );

      case "left":
        return this.leftJoin(
          left,
          right,
          params.leftOn,
          params.rightOn,
          suffix
        );

      case "right":
        return this.rightJoin(
          left,
          right,
          params.leftOn,
          params.rightOn,
          suffix
        );

      case "full":
        return this.fullJoin(
          left,
          right,
          params.leftOn,
          params.rightOn,
          suffix
        );

      case "cross":
        return this.crossJoin(left, right, suffix);

      default:
        throw new Error(`Unknown join type: ${params.type}`);
    }
  }

  /**
   * Inner join: Returns rows with matching keys in both tables.
   */
  private static innerJoin(
    left: Table,
    right: Table,
    leftOn: string,
    rightOn: string,
    suffix: string
  ): Table {
    // Build hash map for right table
    const rightIndex = this.buildIndex(right, rightOn);

    const leftColumn = left.getChild(leftOn);
    const rightColumn = right.getChild(rightOn);

    if (!leftColumn || !rightColumn) {
      throw new Error(`Join columns not found`);
    }

    // Result columns
    const resultColumns: Record<string, any[]> = {};

    // Initialize columns
    this.initializeResultColumns(left, right, suffix, resultColumns);

    // Perform join
    for (let i = 0; i < left.numRows; i++) {
      const key = leftColumn.get(i);
      const rightIndices = rightIndex.get(this.serializeKey(key));

      if (rightIndices) {
        for (const j of rightIndices) {
          // Add left row
          this.addRow(left, i, resultColumns, "");
          // Add right row
          this.addRow(right, j, resultColumns, suffix);
        }
      }
    }

    return tableFromArrays(resultColumns);
  }

  /**
   * Left join: Returns all rows from left table, with matches from right.
   */
  private static leftJoin(
    left: Table,
    right: Table,
    leftOn: string,
    rightOn: string,
    suffix: string
  ): Table {
    const rightIndex = this.buildIndex(right, rightOn);
    const leftColumn = left.getChild(leftOn);
    const rightColumn = right.getChild(rightOn);

    if (!leftColumn || !rightColumn) {
      throw new Error(`Join columns not found`);
    }

    const resultColumns: Record<string, any[]> = {};
    this.initializeResultColumns(left, right, suffix, resultColumns);

    for (let i = 0; i < left.numRows; i++) {
      const key = leftColumn.get(i);
      const rightIndices = rightIndex.get(this.serializeKey(key));

      if (rightIndices && rightIndices.length > 0) {
        for (const j of rightIndices) {
          this.addRow(left, i, resultColumns, "");
          this.addRow(right, j, resultColumns, suffix);
        }
      } else {
        // No match, add left row with nulls for right columns
        this.addRow(left, i, resultColumns, "");
        this.addNullRow(right, resultColumns, suffix);
      }
    }

    return tableFromArrays(resultColumns);
  }

  /**
   * Right join: Returns all rows from right table, with matches from left.
   */
  private static rightJoin(
    left: Table,
    right: Table,
    leftOn: string,
    rightOn: string,
    suffix: string
  ): Table {
    // Right join is equivalent to left join with tables swapped
    const result = this.leftJoin(right, left, rightOn, leftOn, "_left");

    // Reorder columns to match expected output
    return result;
  }

  /**
   * Full outer join: Returns all rows from both tables.
   */
  private static fullJoin(
    left: Table,
    right: Table,
    leftOn: string,
    rightOn: string,
    suffix: string
  ): Table {
    const rightIndex = this.buildIndex(right, rightOn);
    const leftColumn = left.getChild(leftOn);
    const rightColumn = right.getChild(rightOn);

    if (!leftColumn || !rightColumn) {
      throw new Error(`Join columns not found`);
    }

    const resultColumns: Record<string, any[]> = {};
    this.initializeResultColumns(left, right, suffix, resultColumns);

    const matchedRightRows = new Set<number>();

    // Add left rows with matches
    for (let i = 0; i < left.numRows; i++) {
      const key = leftColumn.get(i);
      const rightIndices = rightIndex.get(this.serializeKey(key));

      if (rightIndices && rightIndices.length > 0) {
        for (const j of rightIndices) {
          this.addRow(left, i, resultColumns, "");
          this.addRow(right, j, resultColumns, suffix);
          matchedRightRows.add(j);
        }
      } else {
        this.addRow(left, i, resultColumns, "");
        this.addNullRow(right, resultColumns, suffix);
      }
    }

    // Add unmatched right rows
    for (let j = 0; j < right.numRows; j++) {
      if (!matchedRightRows.has(j)) {
        this.addNullRow(left, resultColumns, "");
        this.addRow(right, j, resultColumns, suffix);
      }
    }

    return tableFromArrays(resultColumns);
  }

  /**
   * Cross join: Cartesian product of both tables.
   */
  private static crossJoin(left: Table, right: Table, suffix: string): Table {
    const resultColumns: Record<string, any[]> = {};
    this.initializeResultColumns(left, right, suffix, resultColumns);

    for (let i = 0; i < left.numRows; i++) {
      for (let j = 0; j < right.numRows; j++) {
        this.addRow(left, i, resultColumns, "");
        this.addRow(right, j, resultColumns, suffix);
      }
    }

    return tableFromArrays(resultColumns);
  }

  /**
   * Builds index (hash map) for join column.
   */
  private static buildIndex(
    table: Table,
    column: string
  ): Map<string, number[]> {
    const index = new Map<string, number[]>();
    const col = table.getChild(column);

    if (!col) {
      throw new Error(`Column '${column}' not found`);
    }

    for (let i = 0; i < table.numRows; i++) {
      const key = this.serializeKey(col.get(i));

      if (!index.has(key)) {
        index.set(key, []);
      }
      index.get(key)!.push(i);
    }

    return index;
  }

  /**
   * Serializes a key for indexing.
   */
  private static serializeKey(value: any): string {
    if (value === null || value === undefined) {
      return "__NULL__";
    }
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    return String(value);
  }

  /**
   * Initializes result columns.
   */
  private static initializeResultColumns(
    left: Table,
    right: Table,
    suffix: string,
    resultColumns: Record<string, any[]>
  ): void {
    // Add left columns
    left.schema.fields.forEach((field) => {
      resultColumns[field.name] = [];
    });

    // Add right columns with suffix for duplicates
    right.schema.fields.forEach((field) => {
      const colName = left.getChild(field.name)
        ? `${field.name}${suffix}`
        : field.name;
      resultColumns[colName] = [];
    });
  }

  /**
   * Adds a row to result columns.
   */
  private static addRow(
    table: Table,
    rowIndex: number,
    resultColumns: Record<string, any[]>,
    suffix: string
  ): void {
    table.schema.fields.forEach((field) => {
      const col = table.getChild(field.name)!;
      const value = col.get(rowIndex);

      const colName =
        suffix && resultColumns[`${field.name}${suffix}`]
          ? `${field.name}${suffix}`
          : field.name;

      resultColumns[colName].push(value);
    });
  }

  /**
   * Adds a null row to result columns.
   */
  private static addNullRow(
    table: Table,
    resultColumns: Record<string, any[]>,
    suffix: string
  ): void {
    table.schema.fields.forEach((field) => {
      const colName =
        suffix && resultColumns[`${field.name}${suffix}`]
          ? `${field.name}${suffix}`
          : field.name;

      resultColumns[colName].push(null);
    });
  }
}
