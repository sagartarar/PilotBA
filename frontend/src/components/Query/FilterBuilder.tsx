import React, { useCallback } from 'react';
import { clsx } from 'clsx';
import { ColumnInfo } from '../../store/dataStore';
import { Button } from '../common/Button';

export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'in'
  | 'notIn'
  | 'isNull'
  | 'isNotNull'
  | 'between';

export interface FilterCondition {
  id: string;
  column: string;
  operator: FilterOperator;
  value: string | number | boolean | null;
  value2?: string | number | boolean | null; // For 'between' operator
  enabled: boolean;
}

interface FilterBuilderProps {
  columns: ColumnInfo[];
  filters: FilterCondition[];
  onFiltersChange: (filters: FilterCondition[]) => void;
  className?: string;
}

const OPERATORS: Record<string, { label: string; operators: FilterOperator[] }> = {
  numeric: {
    label: 'Numeric',
    operators: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'in', 'isNull', 'isNotNull'],
  },
  text: {
    label: 'Text',
    operators: ['eq', 'neq', 'contains', 'startsWith', 'endsWith', 'in', 'isNull', 'isNotNull'],
  },
  boolean: {
    label: 'Boolean',
    operators: ['eq', 'isNull', 'isNotNull'],
  },
  date: {
    label: 'Date',
    operators: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'isNull', 'isNotNull'],
  },
};

const OPERATOR_LABELS: Record<FilterOperator, string> = {
  eq: 'equals',
  neq: 'not equals',
  gt: 'greater than',
  gte: 'greater or equal',
  lt: 'less than',
  lte: 'less or equal',
  contains: 'contains',
  startsWith: 'starts with',
  endsWith: 'ends with',
  in: 'in list',
  notIn: 'not in list',
  isNull: 'is null',
  isNotNull: 'is not null',
  between: 'between',
};

export const FilterBuilder: React.FC<FilterBuilderProps> = ({
  columns,
  filters,
  onFiltersChange,
  className,
}) => {
  const generateId = () => `filter_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const addFilter = useCallback(() => {
    const firstColumn = columns[0];
    if (!firstColumn) return;

    const newFilter: FilterCondition = {
      id: generateId(),
      column: firstColumn.name,
      operator: 'eq',
      value: '',
      enabled: true,
    };

    onFiltersChange([...filters, newFilter]);
  }, [columns, filters, onFiltersChange]);

  const updateFilter = useCallback(
    (id: string, updates: Partial<FilterCondition>) => {
      onFiltersChange(
        filters.map((f) => (f.id === id ? { ...f, ...updates } : f))
      );
    },
    [filters, onFiltersChange]
  );

  const removeFilter = useCallback(
    (id: string) => {
      onFiltersChange(filters.filter((f) => f.id !== id));
    },
    [filters, onFiltersChange]
  );

  const toggleFilter = useCallback(
    (id: string) => {
      onFiltersChange(
        filters.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f))
      );
    },
    [filters, onFiltersChange]
  );

  const clearAllFilters = useCallback(() => {
    onFiltersChange([]);
  }, [onFiltersChange]);

  const getColumnType = (columnName: string): string => {
    const col = columns.find((c) => c.name === columnName);
    if (!col) return 'text';

    const type = col.type.toLowerCase();
    if (type.includes('int') || type.includes('float') || type.includes('decimal')) {
      return 'numeric';
    }
    if (type.includes('bool')) {
      return 'boolean';
    }
    if (type.includes('date') || type.includes('timestamp')) {
      return 'date';
    }
    return 'text';
  };

  const getOperatorsForColumn = (columnName: string): FilterOperator[] => {
    const type = getColumnType(columnName);
    return OPERATORS[type]?.operators || OPERATORS.text.operators;
  };

  return (
    <div className={clsx('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Filters</h3>
        <div className="flex items-center gap-2">
          {filters.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              Clear All
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={addFilter}>
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
            Add Filter
          </Button>
        </div>
      </div>

      {/* Filter List */}
      {filters.length === 0 ? (
        <div className="p-4 border-2 border-dashed border-border rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            No filters applied. Click "Add Filter" to filter your data.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filters.map((filter, index) => (
            <FilterRow
              key={filter.id}
              filter={filter}
              columns={columns}
              operators={getOperatorsForColumn(filter.column)}
              columnType={getColumnType(filter.column)}
              isFirst={index === 0}
              onUpdate={(updates) => updateFilter(filter.id, updates)}
              onRemove={() => removeFilter(filter.id)}
              onToggle={() => toggleFilter(filter.id)}
            />
          ))}
        </div>
      )}

      {/* Active Filter Summary */}
      {filters.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {filters.filter((f) => f.enabled).length} of {filters.length} filter
          {filters.length !== 1 ? 's' : ''} active
        </div>
      )}
    </div>
  );
};

// Individual filter row component
interface FilterRowProps {
  filter: FilterCondition;
  columns: ColumnInfo[];
  operators: FilterOperator[];
  columnType: string;
  isFirst: boolean;
  onUpdate: (updates: Partial<FilterCondition>) => void;
  onRemove: () => void;
  onToggle: () => void;
}

const FilterRow: React.FC<FilterRowProps> = ({
  filter,
  columns,
  operators,
  columnType,
  isFirst,
  onUpdate,
  onRemove,
  onToggle,
}) => {
  const needsValue = !['isNull', 'isNotNull'].includes(filter.operator);
  const needsSecondValue = filter.operator === 'between';
  const isListOperator = ['in', 'notIn'].includes(filter.operator);

  return (
    <div
      className={clsx(
        'flex items-center gap-2 p-3 rounded-lg border transition-all',
        filter.enabled
          ? 'bg-card border-border'
          : 'bg-muted/30 border-border/50 opacity-60'
      )}
    >
      {/* Enable/Disable Toggle */}
      <button
        onClick={onToggle}
        className={clsx(
          'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
          filter.enabled
            ? 'bg-primary border-primary text-primary-foreground'
            : 'border-border bg-background'
        )}
        title={filter.enabled ? 'Disable filter' : 'Enable filter'}
      >
        {filter.enabled && (
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

      {/* Logic Connector */}
      <span className="text-xs text-muted-foreground w-10">
        {isFirst ? 'Where' : 'And'}
      </span>

      {/* Column Select */}
      <select
        value={filter.column}
        onChange={(e) => onUpdate({ column: e.target.value })}
        className="flex-1 min-w-0 px-2 py-1.5 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        {columns.map((col) => (
          <option key={col.name} value={col.name}>
            {col.name}
          </option>
        ))}
      </select>

      {/* Operator Select */}
      <select
        value={filter.operator}
        onChange={(e) => onUpdate({ operator: e.target.value as FilterOperator })}
        className="w-32 px-2 py-1.5 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        {operators.map((op) => (
          <option key={op} value={op}>
            {OPERATOR_LABELS[op]}
          </option>
        ))}
      </select>

      {/* Value Input */}
      {needsValue && (
        <>
          {columnType === 'boolean' ? (
            <select
              value={String(filter.value)}
              onChange={(e) => onUpdate({ value: e.target.value === 'true' })}
              className="w-24 px-2 py-1.5 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          ) : isListOperator ? (
            <input
              type="text"
              value={filter.value}
              onChange={(e) => onUpdate({ value: e.target.value })}
              placeholder="value1, value2, ..."
              className="flex-1 min-w-0 px-2 py-1.5 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          ) : (
            <input
              type={columnType === 'numeric' ? 'number' : columnType === 'date' ? 'date' : 'text'}
              value={filter.value}
              onChange={(e) => onUpdate({ value: e.target.value })}
              placeholder="Value"
              className="flex-1 min-w-0 px-2 py-1.5 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          )}
        </>
      )}

      {/* Second Value for 'between' */}
      {needsSecondValue && (
        <>
          <span className="text-xs text-muted-foreground">and</span>
          <input
            type={columnType === 'numeric' ? 'number' : columnType === 'date' ? 'date' : 'text'}
            value={filter.value2 || ''}
            onChange={(e) => onUpdate({ value2: e.target.value })}
            placeholder="Value"
            className="flex-1 min-w-0 px-2 py-1.5 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </>
      )}

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        title="Remove filter"
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

export default FilterBuilder;

