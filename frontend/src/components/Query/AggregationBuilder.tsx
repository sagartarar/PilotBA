import React, { useCallback } from 'react';
import { clsx } from 'clsx';
import { ColumnInfo } from '../../store/dataStore';
import { Button } from '../common/Button';

export type AggregateFunction =
  | 'sum'
  | 'avg'
  | 'count'
  | 'min'
  | 'max'
  | 'stddev'
  | 'variance'
  | 'first'
  | 'last'
  | 'groupBy';

export interface AggregationConfig {
  id: string;
  column: string;
  function: AggregateFunction;
  alias?: string;
  enabled: boolean;
}

interface AggregationBuilderProps {
  columns: ColumnInfo[];
  aggregations: AggregationConfig[];
  onAggregationsChange: (aggregations: AggregationConfig[]) => void;
  className?: string;
}

const AGGREGATE_FUNCTIONS: Array<{ value: AggregateFunction; label: string; description: string }> = [
  { value: 'groupBy', label: 'Group By', description: 'Group rows by this column' },
  { value: 'count', label: 'Count', description: 'Count non-null values' },
  { value: 'sum', label: 'Sum', description: 'Sum of values' },
  { value: 'avg', label: 'Average', description: 'Mean of values' },
  { value: 'min', label: 'Min', description: 'Minimum value' },
  { value: 'max', label: 'Max', description: 'Maximum value' },
  { value: 'stddev', label: 'Std Dev', description: 'Standard deviation' },
  { value: 'variance', label: 'Variance', description: 'Statistical variance' },
  { value: 'first', label: 'First', description: 'First value in group' },
  { value: 'last', label: 'Last', description: 'Last value in group' },
];

export const AggregationBuilder: React.FC<AggregationBuilderProps> = ({
  columns,
  aggregations,
  onAggregationsChange,
  className,
}) => {
  const generateId = () => `agg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const addAggregation = useCallback(() => {
    const firstColumn = columns[0];
    if (!firstColumn) return;

    const newAgg: AggregationConfig = {
      id: generateId(),
      column: firstColumn.name,
      function: 'count',
      enabled: true,
    };

    onAggregationsChange([...aggregations, newAgg]);
  }, [columns, aggregations, onAggregationsChange]);

  const updateAggregation = useCallback(
    (id: string, updates: Partial<AggregationConfig>) => {
      onAggregationsChange(
        aggregations.map((a) => (a.id === id ? { ...a, ...updates } : a))
      );
    },
    [aggregations, onAggregationsChange]
  );

  const removeAggregation = useCallback(
    (id: string) => {
      onAggregationsChange(aggregations.filter((a) => a.id !== id));
    },
    [aggregations, onAggregationsChange]
  );

  const toggleAggregation = useCallback(
    (id: string) => {
      onAggregationsChange(
        aggregations.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
      );
    },
    [aggregations, onAggregationsChange]
  );

  const clearAllAggregations = useCallback(() => {
    onAggregationsChange([]);
  }, [onAggregationsChange]);

  // Get numeric columns for aggregate functions
  const numericColumns = columns.filter((c) =>
    ['Int', 'Float', 'Decimal'].some((t) => c.type.includes(t))
  );

  const getAvailableFunctions = (columnName: string): AggregateFunction[] => {
    const col = columns.find((c) => c.name === columnName);
    if (!col) return ['count', 'groupBy'];

    const isNumeric = ['Int', 'Float', 'Decimal'].some((t) => col.type.includes(t));

    if (isNumeric) {
      return AGGREGATE_FUNCTIONS.map((f) => f.value);
    }

    // Non-numeric columns have limited functions
    return ['count', 'min', 'max', 'first', 'last', 'groupBy'];
  };

  // Separate group by and aggregations for display
  const groupByAggs = aggregations.filter((a) => a.function === 'groupBy');
  const functionAggs = aggregations.filter((a) => a.function !== 'groupBy');

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Aggregations</h3>
        <div className="flex items-center gap-2">
          {aggregations.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllAggregations}>
              Clear All
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={addAggregation}>
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
            Add
          </Button>
        </div>
      </div>

      {aggregations.length === 0 ? (
        <div className="p-4 border-2 border-dashed border-border rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            No aggregations configured. Add aggregations to summarize your data.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Group By Section */}
          {groupByAggs.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Group By
              </h4>
              {groupByAggs.map((agg) => (
                <AggregationRow
                  key={agg.id}
                  aggregation={agg}
                  columns={columns}
                  availableFunctions={getAvailableFunctions(agg.column)}
                  onUpdate={(updates) => updateAggregation(agg.id, updates)}
                  onRemove={() => removeAggregation(agg.id)}
                  onToggle={() => toggleAggregation(agg.id)}
                />
              ))}
            </div>
          )}

          {/* Aggregate Functions Section */}
          {functionAggs.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Aggregate Functions
              </h4>
              {functionAggs.map((agg) => (
                <AggregationRow
                  key={agg.id}
                  aggregation={agg}
                  columns={columns}
                  availableFunctions={getAvailableFunctions(agg.column)}
                  onUpdate={(updates) => updateAggregation(agg.id, updates)}
                  onRemove={() => removeAggregation(agg.id)}
                  onToggle={() => toggleAggregation(agg.id)}
                  showAlias
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Add Buttons */}
      {numericColumns.length > 0 && (
        <div className="pt-2 border-t border-border">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">Quick Add</h4>
          <div className="flex flex-wrap gap-2">
            {['sum', 'avg', 'count', 'min', 'max'].map((fn) => (
              <button
                key={fn}
                onClick={() => {
                  const col = fn === 'count' ? columns[0] : numericColumns[0];
                  if (!col) return;
                  onAggregationsChange([
                    ...aggregations,
                    {
                      id: generateId(),
                      column: col.name,
                      function: fn as AggregateFunction,
                      enabled: true,
                    },
                  ]);
                }}
                className="px-2 py-1 text-xs rounded border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                {fn.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {aggregations.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {groupByAggs.filter((a) => a.enabled).length} group by,{' '}
          {functionAggs.filter((a) => a.enabled).length} aggregate function
          {functionAggs.filter((a) => a.enabled).length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

// Individual aggregation row component
interface AggregationRowProps {
  aggregation: AggregationConfig;
  columns: ColumnInfo[];
  availableFunctions: AggregateFunction[];
  onUpdate: (updates: Partial<AggregationConfig>) => void;
  onRemove: () => void;
  onToggle: () => void;
  showAlias?: boolean;
}

const AggregationRow: React.FC<AggregationRowProps> = ({
  aggregation,
  columns,
  availableFunctions,
  onUpdate,
  onRemove,
  onToggle,
  showAlias = false,
}) => {
  return (
    <div
      className={clsx(
        'flex items-center gap-2 p-3 rounded-lg border transition-all',
        aggregation.enabled
          ? 'bg-card border-border'
          : 'bg-muted/30 border-border/50 opacity-60'
      )}
    >
      {/* Enable/Disable Toggle */}
      <button
        onClick={onToggle}
        className={clsx(
          'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
          aggregation.enabled
            ? 'bg-primary border-primary text-primary-foreground'
            : 'border-border bg-background'
        )}
        title={aggregation.enabled ? 'Disable' : 'Enable'}
      >
        {aggregation.enabled && (
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

      {/* Function Select */}
      <select
        value={aggregation.function}
        onChange={(e) => onUpdate({ function: e.target.value as AggregateFunction })}
        className="w-28 px-2 py-1.5 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        {AGGREGATE_FUNCTIONS.filter((f) => availableFunctions.includes(f.value)).map((fn) => (
          <option key={fn.value} value={fn.value}>
            {fn.label}
          </option>
        ))}
      </select>

      {/* Column Select */}
      <select
        value={aggregation.column}
        onChange={(e) => onUpdate({ column: e.target.value })}
        className="flex-1 min-w-0 px-2 py-1.5 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        {columns.map((col) => (
          <option key={col.name} value={col.name}>
            {col.name}
          </option>
        ))}
      </select>

      {/* Alias Input (optional) */}
      {showAlias && aggregation.function !== 'groupBy' && (
        <input
          type="text"
          value={aggregation.alias || ''}
          onChange={(e) => onUpdate({ alias: e.target.value })}
          placeholder="Alias"
          className="w-24 px-2 py-1.5 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      )}

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

export default AggregationBuilder;

