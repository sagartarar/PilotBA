import React, { useState, useMemo, useCallback } from 'react';
import type { Table } from 'apache-arrow';
import { clsx } from 'clsx';
import { DatasetMetadata } from '../../store/dataStore';
import { Button } from '../common/Button';

interface DataPreviewProps {
  table: Table;
  metadata: DatasetMetadata;
}

type SampleMode = 'head' | 'tail' | 'random';

export const DataPreview: React.FC<DataPreviewProps> = ({ table, metadata }) => {
  const [sampleMode, setSampleMode] = useState<SampleMode>('head');
  const [sampleSize, setSampleSize] = useState(100);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Get sample rows based on mode
  const sampleRows = useMemo(() => {
    const rows: Array<Record<string, unknown>> = [];
    const numRows = Math.min(sampleSize, table.numRows);

    let indices: number[] = [];

    if (sampleMode === 'head') {
      indices = Array.from({ length: numRows }, (_, i) => i);
    } else if (sampleMode === 'tail') {
      indices = Array.from({ length: numRows }, (_, i) => table.numRows - numRows + i);
    } else {
      // random
      const randomSet = new Set<number>();
      while (randomSet.size < numRows) {
        randomSet.add(Math.floor(Math.random() * table.numRows));
      }
      indices = Array.from(randomSet).sort((a, b) => a - b);
    }

    for (const idx of indices) {
      const row: Record<string, unknown> = { __index: idx };
      for (const field of table.schema.fields) {
        const column = table.getChild(field.name);
        row[field.name] = column?.get(idx);
      }
      rows.push(row);
    }

    // Sort if needed
    if (sortColumn) {
      rows.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];

        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        let comparison = 0;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }

        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return rows;
  }, [table, sampleMode, sampleSize, sortColumn, sortDirection]);

  const handleSort = useCallback((columnName: string) => {
    if (sortColumn === columnName) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(columnName);
      setSortDirection('asc');
    }
  }, [sortColumn]);

  const formatValue = (value: unknown): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">null</span>;
    }
    if (typeof value === 'boolean') {
      return (
        <span className={value ? 'text-green-500' : 'text-red-500'}>
          {value ? 'true' : 'false'}
        </span>
      );
    }
    if (typeof value === 'number') {
      return <span className="font-mono">{formatNumber(value)}</span>;
    }
    if (value instanceof Date) {
      return <span>{value.toISOString()}</span>;
    }
    const str = String(value);
    if (str.length > 50) {
      return (
        <span title={str} className="cursor-help">
          {str.slice(0, 50)}...
        </span>
      );
    }
    return str;
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sample:</span>
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(['head', 'tail', 'random'] as SampleMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setSampleMode(mode)}
                className={clsx(
                  'px-3 py-1.5 text-sm font-medium transition-colors',
                  sampleMode === mode
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:text-foreground'
                )}
              >
                {mode === 'head' ? 'First' : mode === 'tail' ? 'Last' : 'Random'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows:</span>
          <select
            value={sampleSize}
            onChange={(e) => setSampleSize(Number(e.target.value))}
            className="px-3 py-1.5 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {[10, 25, 50, 100, 250, 500].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Showing {sampleRows.length} of {metadata.rowCount.toLocaleString()} rows
          </span>
          {sampleMode === 'random' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSampleMode('random')} // Re-trigger random
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-1"
              >
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
              Reshuffle
            </Button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground w-16">
                  #
                </th>
                {metadata.columns.map((col) => (
                  <th
                    key={col.name}
                    className="px-3 py-2 text-left text-xs font-semibold text-foreground cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleSort(col.name)}
                  >
                    <div className="flex items-center gap-1">
                      <span className="truncate max-w-[150px]">{col.name}</span>
                      {sortColumn === col.name && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={clsx(
                            'flex-shrink-0 transition-transform',
                            sortDirection === 'desc' && 'rotate-180'
                          )}
                        >
                          <path d="m18 15-6-6-6 6" />
                        </svg>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-normal mt-0.5">
                      {formatType(col.type)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sampleRows.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="border-b border-border/50 hover:bg-accent/50 transition-colors"
                >
                  <td className="px-3 py-2 text-xs text-muted-foreground font-mono">
                    {String(row.__index)}
                  </td>
                  {metadata.columns.map((col) => (
                    <td
                      key={col.name}
                      className="px-3 py-2 text-foreground max-w-[200px] truncate"
                    >
                      {formatValue(row[col.name])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metadata.columns.slice(0, 4).map((col) => {
          const values = sampleRows.map((r) => r[col.name]).filter((v) => v !== null);
          const isNumeric = ['Int', 'Float', 'Decimal'].some((t) => col.type.includes(t));

          return (
            <div key={col.name} className="bg-card border border-border rounded-lg p-3">
              <div className="text-xs text-muted-foreground truncate mb-1">{col.name}</div>
              {isNumeric && values.length > 0 ? (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Min</span>
                    <span className="font-mono text-foreground">
                      {formatNumber(Math.min(...(values as number[])))}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Max</span>
                    <span className="font-mono text-foreground">
                      {formatNumber(Math.max(...(values as number[])))}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Avg</span>
                    <span className="font-mono text-foreground">
                      {formatNumber(
                        (values as number[]).reduce((a, b) => a + b, 0) / values.length
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Unique</span>
                    <span className="font-mono text-foreground">
                      {new Set(values.map(String)).size}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Non-null</span>
                    <span className="font-mono text-foreground">{values.length}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Utility functions
function formatNumber(value: number): string {
  if (Number.isInteger(value)) return value.toLocaleString();
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatType(type: string): string {
  return type
    .replace(/</g, '')
    .replace(/>/g, '')
    .replace(/,.*$/, '')
    .replace('Utf8', 'String')
    .replace('Float64', 'Float')
    .replace('Int64', 'Int')
    .replace('Int32', 'Int')
    .replace('Bool', 'Bool');
}

