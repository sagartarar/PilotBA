import React, { useCallback } from 'react';
import { clsx } from 'clsx';
import { ColumnInfo } from '../../store/dataStore';
import { Button } from '../common/Button';

export interface SortConfig {
  id: string;
  column: string;
  direction: 'asc' | 'desc';
  nullsFirst: boolean;
  enabled: boolean;
}

interface SortBuilderProps {
  columns: ColumnInfo[];
  sorts: SortConfig[];
  onSortsChange: (sorts: SortConfig[]) => void;
  className?: string;
}

export const SortBuilder: React.FC<SortBuilderProps> = ({
  columns,
  sorts,
  onSortsChange,
  className,
}) => {
  const generateId = () => `sort_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const addSort = useCallback(() => {
    // Find a column not already in sorts
    const usedColumns = new Set(sorts.map((s) => s.column));
    const availableColumn = columns.find((c) => !usedColumns.has(c.name)) || columns[0];

    if (!availableColumn) return;

    const newSort: SortConfig = {
      id: generateId(),
      column: availableColumn.name,
      direction: 'asc',
      nullsFirst: false,
      enabled: true,
    };

    onSortsChange([...sorts, newSort]);
  }, [columns, sorts, onSortsChange]);

  const updateSort = useCallback(
    (id: string, updates: Partial<SortConfig>) => {
      onSortsChange(sorts.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    },
    [sorts, onSortsChange]
  );

  const removeSort = useCallback(
    (id: string) => {
      onSortsChange(sorts.filter((s) => s.id !== id));
    },
    [sorts, onSortsChange]
  );

  const toggleSort = useCallback(
    (id: string) => {
      onSortsChange(sorts.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
    },
    [sorts, onSortsChange]
  );

  const clearAllSorts = useCallback(() => {
    onSortsChange([]);
  }, [onSortsChange]);

  // Reorder sorts (move up/down)
  const moveSort = useCallback(
    (id: string, direction: 'up' | 'down') => {
      const index = sorts.findIndex((s) => s.id === id);
      if (index === -1) return;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= sorts.length) return;

      const newSorts = [...sorts];
      [newSorts[index], newSorts[newIndex]] = [newSorts[newIndex], newSorts[index]];
      onSortsChange(newSorts);
    },
    [sorts, onSortsChange]
  );

  return (
    <div className={clsx('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Sort Order</h3>
        <div className="flex items-center gap-2">
          {sorts.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllSorts}>
              Clear All
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={addSort}
            disabled={sorts.length >= columns.length}
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
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            Add Sort
          </Button>
        </div>
      </div>

      {/* Sort List */}
      {sorts.length === 0 ? (
        <div className="p-4 border-2 border-dashed border-border rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            No sort order defined. Add sorts to order your results.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorts.map((sort, index) => (
            <SortRow
              key={sort.id}
              sort={sort}
              columns={columns}
              index={index}
              totalSorts={sorts.length}
              onUpdate={(updates) => updateSort(sort.id, updates)}
              onRemove={() => removeSort(sort.id)}
              onToggle={() => toggleSort(sort.id)}
              onMove={(direction) => moveSort(sort.id, direction)}
            />
          ))}
        </div>
      )}

      {/* Info */}
      {sorts.length > 1 && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
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
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          Drag to reorder. First sort has highest priority.
        </div>
      )}

      {/* Summary */}
      {sorts.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {sorts.filter((s) => s.enabled).length} of {sorts.length} sort
          {sorts.length !== 1 ? 's' : ''} active
        </div>
      )}
    </div>
  );
};

// Individual sort row component
interface SortRowProps {
  sort: SortConfig;
  columns: ColumnInfo[];
  index: number;
  totalSorts: number;
  onUpdate: (updates: Partial<SortConfig>) => void;
  onRemove: () => void;
  onToggle: () => void;
  onMove: (direction: 'up' | 'down') => void;
}

const SortRow: React.FC<SortRowProps> = ({
  sort,
  columns,
  index,
  totalSorts,
  onUpdate,
  onRemove,
  onToggle,
  onMove,
}) => {
  return (
    <div
      className={clsx(
        'flex items-center gap-2 p-3 rounded-lg border transition-all',
        sort.enabled ? 'bg-card border-border' : 'bg-muted/30 border-border/50 opacity-60'
      )}
    >
      {/* Priority indicator */}
      <span className="w-6 h-6 flex items-center justify-center text-xs font-medium text-muted-foreground bg-muted rounded">
        {index + 1}
      </span>

      {/* Enable/Disable Toggle */}
      <button
        onClick={onToggle}
        className={clsx(
          'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
          sort.enabled
            ? 'bg-primary border-primary text-primary-foreground'
            : 'border-border bg-background'
        )}
        title={sort.enabled ? 'Disable' : 'Enable'}
      >
        {sort.enabled && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

      {/* Column Select */}
      <select
        value={sort.column}
        onChange={(e) => onUpdate({ column: e.target.value })}
        className="flex-1 min-w-0 px-2 py-1.5 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        {columns.map((col) => (
          <option key={col.name} value={col.name}>
            {col.name}
          </option>
        ))}
      </select>

      {/* Direction Toggle */}
      <button
        onClick={() => onUpdate({ direction: sort.direction === 'asc' ? 'desc' : 'asc' })}
        className={clsx(
          'flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border transition-colors',
          sort.direction === 'asc'
            ? 'bg-blue-500/10 border-blue-500/30 text-blue-500'
            : 'bg-orange-500/10 border-orange-500/30 text-orange-500'
        )}
        title={sort.direction === 'asc' ? 'Ascending' : 'Descending'}
      >
        {sort.direction === 'asc' ? (
          <>
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
            >
              <path d="m3 8 4-4 4 4" />
              <path d="M7 4v16" />
              <path d="M11 12h4" />
              <path d="M11 16h7" />
              <path d="M11 20h10" />
            </svg>
            ASC
          </>
        ) : (
          <>
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
            >
              <path d="m3 16 4 4 4-4" />
              <path d="M7 20V4" />
              <path d="M11 4h10" />
              <path d="M11 8h7" />
              <path d="M11 12h4" />
            </svg>
            DESC
          </>
        )}
      </button>

      {/* Nulls First Toggle */}
      <button
        onClick={() => onUpdate({ nullsFirst: !sort.nullsFirst })}
        className={clsx(
          'px-2 py-1.5 text-xs rounded-md border transition-colors',
          sort.nullsFirst
            ? 'bg-purple-500/10 border-purple-500/30 text-purple-500'
            : 'bg-muted border-border text-muted-foreground'
        )}
        title={sort.nullsFirst ? 'Nulls first' : 'Nulls last'}
      >
        {sort.nullsFirst ? 'Nulls ↑' : 'Nulls ↓'}
      </button>

      {/* Move Up/Down */}
      <div className="flex flex-col">
        <button
          onClick={() => onMove('up')}
          disabled={index === 0}
          className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          title="Move up"
        >
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
          >
            <path d="m18 15-6-6-6 6" />
          </svg>
        </button>
        <button
          onClick={() => onMove('down')}
          disabled={index === totalSorts - 1}
          className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          title="Move down"
        >
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
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        title="Remove"
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
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
  );
};

export default SortBuilder;

