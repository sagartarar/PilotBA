import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { Table } from 'apache-arrow';
import { clsx } from 'clsx';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';

export interface DataTableProps {
  table: Table;
  className?: string;
  pageSize?: number;
  onRowClick?: (rowIndex: number, rowData: Record<string, unknown>) => void;
}

interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 48;
const OVERSCAN = 5;

export const DataTable: React.FC<DataTableProps> = React.memo(({
  table,
  className,
  pageSize = 100,
  onRowClick,
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [filterText, setFilterText] = useState('');
  const [filterColumn, setFilterColumn] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract column names
  const columns = useMemo(() => {
    return table.schema.fields.map(field => ({
      name: field.name,
      type: field.type.toString(),
    }));
  }, [table]);

  // Convert table to array of objects for easier manipulation
  const rawData = useMemo(() => {
    const data: Record<string, unknown>[] = [];
    for (let i = 0; i < table.numRows; i++) {
      const row: Record<string, unknown> = {};
      for (const col of columns) {
        const column = table.getChild(col.name);
        row[col.name] = column?.get(i);
      }
      data.push(row);
    }
    return data;
  }, [table, columns]);

  // Filter data
  const filteredData = useMemo(() => {
    if (!filterText || !filterColumn) return rawData;
    
    const searchLower = filterText.toLowerCase();
    return rawData.filter(row => {
      const value = row[filterColumn];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(searchLower);
    });
  }, [rawData, filterText, filterColumn]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.column];
      const bVal = b[sortConfig.column];
      
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }
      
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = currentPage * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Virtual scrolling calculations
  const containerHeight = containerRef.current?.clientHeight ?? 400;
  const visibleRowCount = Math.ceil(containerHeight / ROW_HEIGHT) + OVERSCAN * 2;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(paginatedData.length, startIndex + visibleRowCount);
  const visibleRows = paginatedData.slice(startIndex, endIndex);
  const totalHeight = paginatedData.length * ROW_HEIGHT;
  const offsetY = startIndex * ROW_HEIGHT;

  const handleSort = useCallback((column: string) => {
    setSortConfig(prev => {
      if (prev?.column === column) {
        if (prev.direction === 'asc') {
          return { column, direction: 'desc' };
        }
        return null;
      }
      return { column, direction: 'asc' };
    });
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'number') {
      if (Number.isInteger(value)) return value.toLocaleString();
      return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
    }
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    return String(value);
  };

  const exportToCSV = useCallback(() => {
    const headers = columns.map(c => c.name).join(',');
    const rows = sortedData.map(row => 
      columns.map(c => {
        const val = row[c.name];
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.includes(',') ? `"${str}"` : str;
      }).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'export.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [columns, sortedData]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [filterText, filterColumn]);

  const columnOptions = [
    { value: '', label: 'All columns' },
    ...columns.map(c => ({ value: c.name, label: c.name })),
  ];

  return (
    <div className={clsx('flex flex-col h-full', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-3 border-b border-border bg-card">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Select
            options={columnOptions}
            value={filterColumn}
            onChange={setFilterColumn}
            className="w-40"
          />
          <Input
            placeholder="Filter..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="flex-1"
            leftIcon={
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
            }
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {sortedData.length.toLocaleString()} rows
          </span>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
            </svg>
            Export
          </Button>
        </div>
      </div>

      {/* Table */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto"
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight + HEADER_HEIGHT, position: 'relative' }}>
          {/* Header */}
          <div 
            className="sticky top-0 z-10 flex bg-card border-b border-border"
            style={{ height: HEADER_HEIGHT }}
          >
            {columns.map((col) => (
              <button
                key={col.name}
                className={clsx(
                  'flex items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-foreground',
                  'hover:bg-accent/50 transition-colors min-w-[120px] flex-1',
                  sortConfig?.column === col.name && 'bg-accent/30'
                )}
                onClick={() => handleSort(col.name)}
              >
                <span className="truncate">{col.name}</span>
                <span className="text-xs text-muted-foreground">({col.type})</span>
                {sortConfig?.column === col.name && (
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
                    className={clsx(
                      'transition-transform',
                      sortConfig.direction === 'desc' && 'rotate-180'
                    )}
                  >
                    <path d="m18 15-6-6-6 6"/>
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* Rows */}
          <div
            style={{
              position: 'absolute',
              top: HEADER_HEIGHT + offsetY,
              left: 0,
              right: 0,
            }}
          >
            {visibleRows.map((row, idx) => {
              const actualIndex = startIndex + idx;
              return (
                <div
                  key={actualIndex}
                  className={clsx(
                    'flex border-b border-border/50 transition-colors',
                    'hover:bg-accent/30 cursor-pointer',
                    actualIndex % 2 === 0 ? 'bg-card' : 'bg-muted/20'
                  )}
                  style={{ height: ROW_HEIGHT }}
                  onClick={() => onRowClick?.(actualIndex, row)}
                >
                  {columns.map((col) => (
                    <div
                      key={col.name}
                      className="flex items-center px-4 text-sm text-foreground min-w-[120px] flex-1 truncate"
                      title={formatValue(row[col.name])}
                    >
                      {formatValue(row[col.name])}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-3 border-t border-border bg-card">
          <span className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(0)}
              disabled={currentPage === 0}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages - 1)}
              disabled={currentPage >= totalPages - 1}
            >
              Last
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

// Display name for debugging
DataTable.displayName = 'DataTable';

