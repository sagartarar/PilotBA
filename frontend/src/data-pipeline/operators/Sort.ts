/**
 * Sort operator with efficient algorithms.
 *
 * Implements sorting of Arrow Tables using efficient index-based sorting.
 *
 * @see Design Doc: 02-data-processing-pipeline.md (Lines 389-421)
 */

import { Table, Vector, tableFromArrays } from "apache-arrow";

export type SortOrder = "asc" | "desc";

export interface SortParams {
  column: string;
  order: SortOrder;
}

/**
 * Sort operator class.
 */
export class SortOperator {
  /**
   * Applies sort to table.
   *
   * @param table - Input Arrow Table
   * @param params - Sort parameters
   * @returns Sorted table
   */
  static apply(table: Table, params: SortParams): Table {
    const column = table.getChild(params.column);

    if (!column) {
      throw new Error(`Column '${params.column}' not found in table`);
    }

    // Create index array
    const indices = new Uint32Array(table.numRows);
    for (let i = 0; i < table.numRows; i++) {
      indices[i] = i;
    }

    // Sort indices based on column values
    this.sortIndices(indices, column, params.order);

    // Reorder all columns
    return this.reorderTable(table, indices);
  }

  /**
   * Applies multi-column sort to table.
   *
   * @param table - Input Arrow Table
   * @param sorts - Array of sort parameters (in priority order)
   * @returns Sorted table
   */
  static applyMultiple(table: Table, sorts: SortParams[]): Table {
    if (sorts.length === 0) {
      return table;
    }

    // Validate columns
    for (const sort of sorts) {
      if (!table.getChild(sort.column)) {
        throw new Error(`Column '${sort.column}' not found in table`);
      }
    }

    // Create index array
    const indices = new Uint32Array(table.numRows);
    for (let i = 0; i < table.numRows; i++) {
      indices[i] = i;
    }

    // Sort by multiple columns
    this.sortIndicesMultiple(table, indices, sorts);

    // Reorder table
    return this.reorderTable(table, indices);
  }

  /**
   * Sorts indices based on single column.
   */
  private static sortIndices(
    indices: Uint32Array,
    column: Vector,
    order: SortOrder
  ): void {
    // Use Array.prototype.sort for flexibility
    const indicesArray = Array.from(indices);

    indicesArray.sort((a, b) => {
      const valA = column.get(a);
      const valB = column.get(b);

      // Handle nulls (nulls last)
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      // Compare values
      let comparison = 0;
      if (valA < valB) comparison = -1;
      else if (valA > valB) comparison = 1;

      // Apply order
      return order === "asc" ? comparison : -comparison;
    });

    // Copy back to Uint32Array
    indices.set(indicesArray);
  }

  /**
   * Sorts indices based on multiple columns.
   */
  private static sortIndicesMultiple(
    table: Table,
    indices: Uint32Array,
    sorts: SortParams[]
  ): void {
    const indicesArray = Array.from(indices);

    indicesArray.sort((a, b) => {
      for (const sort of sorts) {
        const column = table.getChild(sort.column)!;
        const valA = column.get(a);
        const valB = column.get(b);

        // Handle nulls (nulls last)
        if (valA === null || valA === undefined) {
          if (valB === null || valB === undefined) continue;
          return 1;
        }
        if (valB === null || valB === undefined) {
          return -1;
        }

        // Compare values
        let comparison = 0;
        if (valA < valB) comparison = -1;
        else if (valA > valB) comparison = 1;

        if (comparison !== 0) {
          return sort.order === "asc" ? comparison : -comparison;
        }
      }

      return 0; // All columns equal
    });

    indices.set(indicesArray);
  }

  /**
   * Reorders table according to index array.
   */
  private static reorderTable(table: Table, indices: Uint32Array): Table {
    const reorderedData: Record<string, any[]> = {};

    for (const field of table.schema.fields) {
      const column = table.getChild(field.name)!;
      const columnData: any[] = [];

      for (let i = 0; i < indices.length; i++) {
        columnData.push(column.get(indices[i]));
      }

      reorderedData[field.name] = columnData;
    }

    return tableFromArrays(reorderedData);
  }

  /**
   * Partially sorts table (top-k).
   *
   * More efficient than full sort when only top N rows are needed.
   *
   * @param table - Input table
   * @param params - Sort parameters
   * @param limit - Number of rows to return
   * @returns Table with top-k rows
   */
  static applyTopK(table: Table, params: SortParams, limit: number): Table {
    if (limit >= table.numRows) {
      return this.apply(table, params);
    }

    const column = table.getChild(params.column);
    if (!column) {
      throw new Error(`Column '${params.column}' not found`);
    }

    // Use heap-based partial sort
    const indices = this.partialSort(column, params.order, limit);

    // Reorder table
    return this.reorderTable(table, indices);
  }

  /**
   * Performs partial sort using min/max heap.
   *
   * Returns indices of top-k elements.
   */
  private static partialSort(
    column: Vector,
    order: SortOrder,
    k: number
  ): Uint32Array {
    const heap: Array<{ index: number; value: any }> = [];

    // Build heap
    for (let i = 0; i < column.length; i++) {
      const value = column.get(i);

      if (heap.length < k) {
        heap.push({ index: i, value });
        this.heapifyUp(heap, heap.length - 1, order);
      } else {
        // Compare with root
        const shouldReplace =
          order === "asc" ? value < heap[0].value : value > heap[0].value;

        if (shouldReplace) {
          heap[0] = { index: i, value };
          this.heapifyDown(heap, 0, order);
        }
      }
    }

    // Extract indices
    const indices = new Uint32Array(heap.length);
    for (let i = 0; i < heap.length; i++) {
      indices[i] = heap[i].index;
    }

    return indices;
  }

  /**
   * Heapify up (for heap construction).
   */
  private static heapifyUp(
    heap: Array<{ index: number; value: any }>,
    index: number,
    order: SortOrder
  ): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      const shouldSwap =
        order === "asc"
          ? heap[index].value > heap[parentIndex].value
          : heap[index].value < heap[parentIndex].value;

      if (!shouldSwap) break;

      [heap[index], heap[parentIndex]] = [heap[parentIndex], heap[index]];
      index = parentIndex;
    }
  }

  /**
   * Heapify down (for heap maintenance).
   */
  private static heapifyDown(
    heap: Array<{ index: number; value: any }>,
    index: number,
    order: SortOrder
  ): void {
    const length = heap.length;

    while (true) {
      let largest = index;
      const left = 2 * index + 1;
      const right = 2 * index + 2;

      if (left < length) {
        const shouldSwap =
          order === "asc"
            ? heap[left].value > heap[largest].value
            : heap[left].value < heap[largest].value;
        if (shouldSwap) largest = left;
      }

      if (right < length) {
        const shouldSwap =
          order === "asc"
            ? heap[right].value > heap[largest].value
            : heap[right].value < heap[largest].value;
        if (shouldSwap) largest = right;
      }

      if (largest === index) break;

      [heap[index], heap[largest]] = [heap[largest], heap[index]];
      index = largest;
    }
  }
}
