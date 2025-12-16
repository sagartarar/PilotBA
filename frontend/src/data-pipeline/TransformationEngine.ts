import { Table, tableFromArrays, Vector } from 'apache-arrow';
import {
  FilterParams,
  AggregateParams,
  SortParams,
  ComputeParams,
  LimitParams,
} from './types';

export class TransformationEngine {
  filter(table: Table, params: FilterParams): Table {
    const column = table.getChild(params.column);
    if (!column) {
      throw new Error(`Column ${params.column} not found`);
    }

    // Create boolean mask
    const mask = this.createFilterMask(column, params);

    // Filter all columns
    const filteredData: Record<string, any[]> = {};
    
    for (const field of table.schema.fields) {
      filteredData[field.name] = [];
    }

    for (let i = 0; i < table.numRows; i++) {
      if (mask[i]) {
        for (const field of table.schema.fields) {
          const col = table.getChild(field.name);
          filteredData[field.name].push(col?.get(i));
        }
      }
    }

    return tableFromArrays(filteredData);
  }

  aggregate(table: Table, params: AggregateParams): Table {
    // Build groups using composite key
    const groups = new Map<string, number[]>();

    for (let i = 0; i < table.numRows; i++) {
      const keyParts = params.groupBy.map((col) => {
        const column = table.getChild(col);
        return column?.get(i) ?? 'null';
      });
      const key = keyParts.join('|');

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(i);
    }

    // Compute aggregations for each group
    const resultData: Record<string, any[]> = {};

    // Initialize result columns
    params.groupBy.forEach((col) => {
      resultData[col] = [];
    });
    params.aggregations.forEach((agg) => {
      resultData[agg.alias] = [];
    });

    // Process each group
    groups.forEach((indices, key) => {
      const keyParts = key.split('|');

      // Add group key values
      params.groupBy.forEach((col, i) => {
        const value = keyParts[i];
        resultData[col].push(value === 'null' ? null : this.parseValue(value));
      });

      // Compute aggregations
      params.aggregations.forEach((agg) => {
        const column = table.getChild(agg.column);
        if (!column) {
          throw new Error(`Column ${agg.column} not found`);
        }

        const values = indices
          .map((i) => column.get(i))
          .filter((v) => v !== null && v !== undefined);

        const result = this.computeAggregation(values, agg.function);
        resultData[agg.alias].push(result);
      });
    });

    return tableFromArrays(resultData);
  }

  sort(table: Table, params: SortParams): Table {
    const column = table.getChild(params.column);
    if (!column) {
      throw new Error(`Column ${params.column} not found`);
    }

    // Create index array
    const indices = new Uint32Array(table.numRows);
    for (let i = 0; i < table.numRows; i++) {
      indices[i] = i;
    }

    // Sort indices based on column values
    const sortFn = (a: number, b: number) => {
      const valA = column.get(a);
      const valB = column.get(b);

      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (valA < valB) return params.order === 'asc' ? -1 : 1;
      if (valA > valB) return params.order === 'asc' ? 1 : -1;
      return 0;
    };

    indices.sort(sortFn);

    // Reorder all columns
    const sortedData: Record<string, any[]> = {};

    for (const field of table.schema.fields) {
      const col = table.getChild(field.name);
      sortedData[field.name] = Array.from(indices).map((i) => col?.get(i));
    }

    return tableFromArrays(sortedData);
  }

  compute(table: Table, params: ComputeParams): Table {
    const resultData: Record<string, any[]> = {};

    // Copy existing columns
    for (const field of table.schema.fields) {
      const col = table.getChild(field.name);
      resultData[field.name] = [];
      for (let i = 0; i < table.numRows; i++) {
        resultData[field.name].push(col?.get(i));
      }
    }

    // Compute new column
    resultData[params.alias] = [];

    if (typeof params.expression === 'function') {
      for (let i = 0; i < table.numRows; i++) {
        const row: any = {};
        for (const field of table.schema.fields) {
          const col = table.getChild(field.name);
          row[field.name] = col?.get(i);
        }
        resultData[params.alias].push(params.expression(row));
      }
    } else {
      // Simple expression evaluation (e.g., "price * quantity")
      for (let i = 0; i < table.numRows; i++) {
        const row: any = {};
        for (const field of table.schema.fields) {
          const col = table.getChild(field.name);
          row[field.name] = col?.get(i);
        }
        
        try {
          // eslint-disable-next-line no-new-func
          const fn = new Function(...Object.keys(row), `return ${params.expression}`);
          const result = fn(...Object.values(row));
          resultData[params.alias].push(result);
        } catch {
          resultData[params.alias].push(null);
        }
      }
    }

    return tableFromArrays(resultData);
  }

  limit(table: Table, params: LimitParams): Table {
    const offset = params.offset || 0;
    const end = Math.min(offset + params.count, table.numRows);

    const limitedData: Record<string, any[]> = {};

    for (const field of table.schema.fields) {
      const col = table.getChild(field.name);
      limitedData[field.name] = [];

      for (let i = offset; i < end; i++) {
        limitedData[field.name].push(col?.get(i));
      }
    }

    return tableFromArrays(limitedData);
  }

  private createFilterMask(column: Vector, params: FilterParams): Uint8Array {
    const mask = new Uint8Array(column.length);

    for (let i = 0; i < column.length; i++) {
      const value = column.get(i);

      switch (params.operator) {
        case 'eq':
          mask[i] = value === params.value ? 1 : 0;
          break;
        case 'ne':
          mask[i] = value !== params.value ? 1 : 0;
          break;
        case 'gt':
          mask[i] = value > params.value ? 1 : 0;
          break;
        case 'lt':
          mask[i] = value < params.value ? 1 : 0;
          break;
        case 'gte':
          mask[i] = value >= params.value ? 1 : 0;
          break;
        case 'lte':
          mask[i] = value <= params.value ? 1 : 0;
          break;
        case 'in':
          mask[i] = (params.value as any[]).includes(value) ? 1 : 0;
          break;
        case 'between':
          mask[i] = value >= params.value && value <= params.value2! ? 1 : 0;
          break;
        case 'contains':
          mask[i] =
            value !== null &&
            value !== undefined &&
            String(value).toLowerCase().includes(String(params.value).toLowerCase())
              ? 1
              : 0;
          break;
        default:
          mask[i] = 0;
      }
    }

    return mask;
  }

  private computeAggregation(values: any[], func: string): any {
    if (values.length === 0) return null;

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
      case 'stddev': {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
      }
      case 'first':
        return values[0];
      case 'last':
        return values[values.length - 1];
      default:
        throw new Error(`Unknown aggregation function: ${func}`);
    }
  }

  private parseValue(value: string): any {
    // Try to parse number
    const num = parseFloat(value);
    if (!isNaN(num)) return num;

    // Try to parse boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    return value;
  }
}


