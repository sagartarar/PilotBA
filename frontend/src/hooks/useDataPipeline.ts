import { useCallback, useMemo } from 'react';
import { Table } from 'apache-arrow';
import { useDataStore } from '../store';
import { ChartData } from '../viz-engine/types';

export interface UseDataPipelineReturn {
  getCurrentTable: () => Table | null;
  tableToChartData: (table: Table, encodings: { x: string; y: string; color?: string; size?: string }) => ChartData;
  sampleData: (table: Table, maxRows: number) => Table;
  getColumnStats: (table: Table, columnName: string) => ColumnStats | null;
}

export interface ColumnStats {
  min: number;
  max: number;
  mean: number;
  count: number;
  nullCount: number;
  distinctCount: number;
}

export function useDataPipeline(): UseDataPipelineReturn {
  const { getCurrentTable } = useDataStore();

  const tableToChartData = useCallback(
    (table: Table, encodings: { x: string; y: string; color?: string; size?: string }): ChartData => {
      const columns = table.schema.fields.map((f) => f.name);
      const values: number[][] = [];

      // Get column indices
      const xIndex = columns.indexOf(encodings.x);
      const yIndex = columns.indexOf(encodings.y);
      const colorIndex = encodings.color ? columns.indexOf(encodings.color) : -1;
      const sizeIndex = encodings.size ? columns.indexOf(encodings.size) : -1;

      if (xIndex === -1 || yIndex === -1) {
        throw new Error('Invalid column encodings');
      }

      // Extract data
      for (let i = 0; i < table.numRows; i++) {
        const row: number[] = [];
        for (const col of columns) {
          const column = table.getChild(col);
          const value = column?.get(i);
          row.push(typeof value === 'number' ? value : 0);
        }
        values.push(row);
      }

      return {
        columns,
        values,
        encodings,
      };
    },
    []
  );

  const sampleData = useCallback((table: Table, maxRows: number): Table => {
    if (table.numRows <= maxRows) {
      return table;
    }

    // Use reservoir sampling for large datasets
    const indices: number[] = [];
    for (let i = 0; i < table.numRows; i++) {
      if (i < maxRows) {
        indices.push(i);
      } else {
        const j = Math.floor(Math.random() * (i + 1));
        if (j < maxRows) {
          indices[j] = i;
        }
      }
    }

    // For now, return the original table (proper sampling requires more Arrow API)
    // In production, you'd use Arrow's slice/filter capabilities
    return table;
  }, []);

  const getColumnStats = useCallback((table: Table, columnName: string): ColumnStats | null => {
    const column = table.getChild(columnName);
    if (!column) return null;

    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    let count = 0;
    let nullCount = 0;
    const distinctValues = new Set<unknown>();

    for (let i = 0; i < column.length; i++) {
      const value = column.get(i);
      
      if (value === null || value === undefined) {
        nullCount++;
        continue;
      }

      distinctValues.add(value);

      if (typeof value === 'number') {
        if (value < min) min = value;
        if (value > max) max = value;
        sum += value;
        count++;
      }
    }

    return {
      min: isFinite(min) ? min : 0,
      max: isFinite(max) ? max : 0,
      mean: count > 0 ? sum / count : 0,
      count,
      nullCount,
      distinctCount: distinctValues.size,
    };
  }, []);

  return {
    getCurrentTable,
    tableToChartData,
    sampleData,
    getColumnStats,
  };
}

