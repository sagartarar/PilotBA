/**
 * Query Optimizer for data pipeline.
 * 
 * Optimizes query execution plans using predicate pushdown, projection pushdown,
 * and operation reordering strategies.
 * 
 * @see Design Doc: 02-data-processing-pipeline.md (Lines 423-488)
 */

import { Table, Schema } from 'apache-arrow';

export type OperationType = 'filter' | 'aggregate' | 'sort' | 'join' | 'compute' | 'select';

export interface Operation {
  type: OperationType;
  params: any;
  cost?: number;
  selectivity?: number;
}

export interface QueryPlan {
  operations: Operation[];
  estimatedCost: number;
  estimatedRows: number;
}

export interface TableMetadata {
  rowCount: number;
  columnCount: number;
  columnStats: Map<string, ColumnStats>;
}

export interface ColumnStats {
  min: any;
  max: any;
  nullCount: number;
  distinctCount?: number;
}

/**
 * Query Optimizer class.
 */
export class QueryOptimizer {
  /**
   * Optimizes a query plan.
   * 
   * @param operations - Original operations
   * @param metadata - Table metadata for cost estimation
   * @returns Optimized query plan
   */
  static optimize(operations: Operation[], metadata: TableMetadata): QueryPlan {
    if (operations.length === 0) {
      return {
        operations: [],
        estimatedCost: 0,
        estimatedRows: 0,
      };
    }

    // Clone operations for manipulation
    let optimized = [...operations];

    // Apply optimization rules
    optimized = this.applyPredicatePushdown(optimized);
    optimized = this.applyProjectionPushdown(optimized);
    optimized = this.mergeFilters(optimized);
    optimized = this.reorderOperations(optimized);

    // Estimate cost
    const estimatedCost = this.estimateCost(optimized, metadata);
    const estimatedRows = this.estimateRows(optimized, metadata);

    return {
      operations: optimized,
      estimatedCost,
      estimatedRows,
    };
  }

  /**
   * Predicate pushdown: Move filters as early as possible.
   */
  private static applyPredicatePushdown(operations: Operation[]): Operation[] {
    const result: Operation[] = [];
    const filters: Operation[] = [];
    const others: Operation[] = [];

    // Separate filters from other operations
    for (const op of operations) {
      if (op.type === 'filter') {
        filters.push(op);
      } else {
        others.push(op);
      }
    }

    // Place filters first
    result.push(...filters);
    result.push(...others);

    return result;
  }

  /**
   * Projection pushdown: Select only needed columns early.
   * 
   * Identifies which columns are actually needed and adds a select operation early.
   */
  private static applyProjectionPushdown(operations: Operation[]): Operation[] {
    // Analyze which columns are needed
    const neededColumns = this.identifyNeededColumns(operations);

    // If all columns are needed, no optimization
    if (!neededColumns) {
      return operations;
    }

    // Add select operation at the beginning
    const selectOp: Operation = {
      type: 'select',
      params: { columns: Array.from(neededColumns) },
    };

    return [selectOp, ...operations];
  }

  /**
   * Identifies columns needed by operations.
   */
  private static identifyNeededColumns(operations: Operation[]): Set<string> | null {
    const columns = new Set<string>();

    for (const op of operations) {
      switch (op.type) {
        case 'filter':
          columns.add(op.params.column);
          break;

        case 'aggregate':
          op.params.groupBy?.forEach((col: string) => columns.add(col));
          op.params.aggregations?.forEach((agg: any) => columns.add(agg.column));
          break;

        case 'sort':
          columns.add(op.params.column);
          break;

        case 'compute':
          // Parse expression to extract column names
          // Simplified: assume params.dependencies contains needed columns
          if (op.params.dependencies) {
            op.params.dependencies.forEach((col: string) => columns.add(col));
          }
          break;

        case 'join':
          columns.add(op.params.leftOn);
          columns.add(op.params.rightOn);
          break;

        case 'select':
          op.params.columns?.forEach((col: string) => columns.add(col));
          break;
      }
    }

    return columns.size > 0 ? columns : null;
  }

  /**
   * Merges consecutive filter operations.
   */
  private static mergeFilters(operations: Operation[]): Operation[] {
    const result: Operation[] = [];
    let currentFilters: Operation[] = [];

    for (const op of operations) {
      if (op.type === 'filter') {
        currentFilters.push(op);
      } else {
        // Flush current filters
        if (currentFilters.length > 0) {
          if (currentFilters.length === 1) {
            result.push(currentFilters[0]);
          } else {
            // Merge multiple filters into one
            result.push({
              type: 'filter',
              params: {
                filters: currentFilters.map(f => f.params),
              },
            });
          }
          currentFilters = [];
        }
        result.push(op);
      }
    }

    // Flush remaining filters
    if (currentFilters.length > 0) {
      if (currentFilters.length === 1) {
        result.push(currentFilters[0]);
      } else {
        result.push({
          type: 'filter',
          params: {
            filters: currentFilters.map(f => f.params),
          },
        });
      }
    }

    return result;
  }

  /**
   * Reorders operations for optimal execution.
   * 
   * General rule: filters > aggregates > sorts
   */
  private static reorderOperations(operations: Operation[]): Operation[] {
    // Don't reorder across certain boundaries (e.g., aggregates)
    const groups: Operation[][] = [];
    let currentGroup: Operation[] = [];

    for (const op of operations) {
      if (op.type === 'aggregate' || op.type === 'join') {
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
          currentGroup = [];
        }
        groups.push([op]);
      } else {
        currentGroup.push(op);
      }
    }

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    // Reorder within each group
    const reordered = groups.map(group => {
      if (group.length === 1) return group;

      return group.sort((a, b) => {
        const priorityA = this.getOperationPriority(a.type);
        const priorityB = this.getOperationPriority(b.type);
        return priorityA - priorityB;
      });
    });

    return reordered.flat();
  }

  /**
   * Gets execution priority for operation type (lower = earlier).
   */
  private static getOperationPriority(type: OperationType): number {
    const priorities: Record<OperationType, number> = {
      select: 1,      // Projection first
      filter: 2,      // Filters early
      compute: 3,     // Computed columns
      aggregate: 4,   // Aggregation
      sort: 5,        // Sort late
      join: 6,        // Join last
    };

    return priorities[type] || 10;
  }

  /**
   * Estimates cost of query plan.
   */
  private static estimateCost(operations: Operation[], metadata: TableMetadata): number {
    let cost = 0;
    let rows = metadata.rowCount;

    for (const op of operations) {
      switch (op.type) {
        case 'filter':
          cost += rows * 0.1; // O(n) scan
          rows *= this.estimateSelectivity(op, metadata); // Reduce rows
          break;

        case 'aggregate':
          cost += rows * 2; // O(n) with hash table overhead
          rows = Math.max(1, rows * 0.1); // Assume 10% unique groups
          break;

        case 'sort':
          cost += rows * Math.log2(Math.max(1, rows)); // O(n log n)
          break;

        case 'join':
          cost += rows * 10; // Hash join overhead
          rows *= 2; // Assume join doubles rows (rough estimate)
          break;

        case 'compute':
          cost += rows * 0.5; // Simpler than filter
          break;

        case 'select':
          cost += rows * 0.05; // Column projection is cheap
          break;

        default:
          cost += rows;
      }
    }

    return cost;
  }

  /**
   * Estimates selectivity of a filter (fraction of rows retained).
   */
  private static estimateSelectivity(operation: Operation, metadata: TableMetadata): number {
    if (operation.type !== 'filter') {
      return 1.0;
    }

    const params = operation.params;
    const columnStats = metadata.columnStats.get(params.column);

    if (!columnStats) {
      return 0.5; // Default: 50% selectivity
    }

    // Use statistics to estimate selectivity
    switch (params.operator) {
      case 'eq':
        return columnStats.distinctCount
          ? 1 / columnStats.distinctCount
          : 0.1;

      case 'ne':
        return 0.9;

      case 'gt':
      case 'lt':
      case 'gte':
      case 'lte':
        return 0.33; // Assume 1/3 of range

      case 'in':
        const inValues = params.values?.length || 1;
        return columnStats.distinctCount
          ? Math.min(1.0, inValues / columnStats.distinctCount)
          : 0.1;

      case 'between':
        return 0.25; // Assume 25% of range

      case 'isNull':
        return columnStats.nullCount / metadata.rowCount;

      case 'notNull':
        return 1 - (columnStats.nullCount / metadata.rowCount);

      default:
        return 0.5;
    }
  }

  /**
   * Estimates number of rows after query execution.
   */
  private static estimateRows(operations: Operation[], metadata: TableMetadata): number {
    let rows = metadata.rowCount;

    for (const op of operations) {
      switch (op.type) {
        case 'filter':
          rows *= this.estimateSelectivity(op, metadata);
          break;

        case 'aggregate':
          rows = Math.max(1, rows * 0.1); // Assume 10% groups
          break;

        case 'join':
          rows *= 2; // Rough estimate
          break;
      }
    }

    return Math.ceil(rows);
  }
}

