import React, { useState, useCallback } from 'react';
import { Table } from 'apache-arrow';
import { clsx } from 'clsx';
import { useDataStore, useUIStore } from '../../store';
import { FilterBuilder, FilterCondition } from './FilterBuilder';
import { AggregationBuilder, AggregationConfig } from './AggregationBuilder';
import { SortBuilder, SortConfig } from './SortBuilder';
import { Button } from '../common/Button';
import { DataTable } from '../Data/DataTable';
import { FilterOperator, FilterParams } from '../../data-pipeline/operators/Filter';
import { AggregateOperator, AggregateParams, AggregateFunction } from '../../data-pipeline/operators/Aggregate';
import { SortOperator, SortParams } from '../../data-pipeline/operators/Sort';

type QueryTab = 'filter' | 'aggregate' | 'sort';

export const QueryBuilder: React.FC = () => {
  const { getCurrentTable, getCurrentMetadata } = useDataStore();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<QueryTab>('filter');
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [aggregations, setAggregations] = useState<AggregationConfig[]>([]);
  const [sorts, setSorts] = useState<SortConfig[]>([]);
  const [resultTable, setResultTable] = useState<Table | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  const currentTable = getCurrentTable();
  const currentMetadata = getCurrentMetadata();

  // Convert UI filter conditions to data pipeline filter operations
  const convertFilters = useCallback((table: Table, filterConditions: FilterCondition[]): Table => {
    let result = table;
    const enabledFilters = filterConditions.filter((f) => f.enabled);

    for (const filter of enabledFilters) {
      const column = result.getChild(filter.column);
      if (!column) continue;

      // Map UI operator to FilterOperatorType
      let operatorType: FilterParams['operator'] = 'eq';
      let value: FilterParams['value'] = filter.value;
      let values: FilterParams['values'];
      let min: FilterParams['min'];
      let max: FilterParams['max'];
      let pattern: FilterParams['pattern'];

      switch (filter.operator) {
        case 'eq':
          operatorType = 'eq';
          break;
        case 'neq':
          operatorType = 'ne';
          break;
        case 'gt':
          operatorType = 'gt';
          break;
        case 'gte':
          operatorType = 'gte';
          break;
        case 'lt':
          operatorType = 'lt';
          break;
        case 'lte':
          operatorType = 'lte';
          break;
        case 'contains':
          operatorType = 'like';
          pattern = `%${filter.value}%`;
          break;
        case 'startsWith':
          operatorType = 'like';
          pattern = `${filter.value}%`;
          break;
        case 'endsWith':
          operatorType = 'like';
          pattern = `%${filter.value}`;
          break;
        case 'in':
          operatorType = 'in';
          values = String(filter.value).split(',').map((v) => v.trim());
          break;
        case 'isNull':
          operatorType = 'isNull';
          break;
        case 'isNotNull':
          operatorType = 'notNull';
          break;
        case 'between':
          operatorType = 'between';
          min = filter.value;
          max = filter.value2;
          break;
        default:
          continue;
      }

      const params: FilterParams = {
        column: filter.column,
        operator: operatorType,
        value,
        values,
        min,
        max,
        pattern,
      };

      result = FilterOperator.apply(result, params);
    }

    return result;
  }, []);

  // Convert UI aggregations to data pipeline aggregations
  const convertAggregations = useCallback((table: Table, aggConfigs: AggregationConfig[]): Table => {
    if (aggConfigs.length === 0) return table;

    const enabledAggs = aggConfigs.filter((a) => a.enabled);
    if (enabledAggs.length === 0) return table;

    // Separate group by columns and aggregation functions
    const groupByColumns = enabledAggs
      .filter((a) => a.function === 'groupBy')
      .map((a) => a.column);

    const aggregateFunctions = enabledAggs
      .filter((a) => a.function !== 'groupBy')
      .map((a) => ({
        column: a.column,
        function: a.function as AggregateFunction,
        alias: a.alias || `${a.function}_${a.column}`,
      }));

    if (aggregateFunctions.length === 0) return table;

    const params: AggregateParams = {
      groupBy: groupByColumns,
      aggregations: aggregateFunctions,
    };

    return AggregateOperator.apply(table, params);
  }, []);

  // Convert UI sorts to data pipeline sorts
  const convertSorts = useCallback((table: Table, sortConfigs: SortConfig[]): Table => {
    let result = table;
    const enabledSorts = sortConfigs.filter((s) => s.enabled);
    
    // Apply sorts in order (first sort has highest priority)
    for (const sortConfig of enabledSorts) {
      const params: SortParams = {
        column: sortConfig.column,
        order: sortConfig.direction,
      };
      result = SortOperator.apply(result, params);
    }

    return result;
  }, []);

  // Execute the query
  const executeQuery = useCallback(async () => {
    if (!currentTable) {
      addNotification({
        type: 'error',
        title: 'No Data',
        message: 'Please select a dataset first',
      });
      return;
    }

    setIsExecuting(true);
    const startTime = performance.now();

    try {
      let result = currentTable;

      // Apply filters
      if (filters.length > 0) {
        result = convertFilters(result, filters);
      }

      // Apply aggregations
      if (aggregations.length > 0) {
        result = convertAggregations(result, aggregations);
      }

      // Apply sorts
      if (sorts.length > 0) {
        result = convertSorts(result, sorts);
      }

      const endTime = performance.now();
      setExecutionTime(endTime - startTime);
      setResultTable(result);

      addNotification({
        type: 'success',
        title: 'Query Executed',
        message: `Returned ${result.numRows.toLocaleString()} rows in ${(endTime - startTime).toFixed(1)}ms`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Query execution failed';
      addNotification({
        type: 'error',
        title: 'Query Error',
        message,
      });
      setResultTable(null);
    } finally {
      setIsExecuting(false);
    }
  }, [currentTable, filters, aggregations, sorts, convertFilters, convertAggregations, convertSorts, addNotification]);

  // Reset query
  const resetQuery = useCallback(() => {
    setFilters([]);
    setAggregations([]);
    setSorts([]);
    setResultTable(null);
    setExecutionTime(null);
  }, []);

  // Count active operations
  const activeFilters = filters.filter((f) => f.enabled).length;
  const activeAggregations = aggregations.filter((a) => a.enabled).length;
  const activeSorts = sorts.filter((s) => s.enabled).length;
  const hasOperations = activeFilters > 0 || activeAggregations > 0 || activeSorts > 0;

  if (!currentMetadata) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto text-muted-foreground/50 mb-4"
          >
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          <h3 className="text-lg font-medium text-foreground mb-1">No Dataset Selected</h3>
          <p className="text-sm text-muted-foreground">
            Upload or select a dataset to start building queries
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Query Builder</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Building query on <span className="font-medium">{currentMetadata.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasOperations && (
              <Button variant="ghost" onClick={resetQuery}>
                Reset
              </Button>
            )}
            <Button onClick={executeQuery} disabled={isExecuting || !hasOperations}>
              {isExecuting ? (
                <>
                  <svg
                    className="animate-spin mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Executing...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Run Query
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1">
          <TabButton
            active={activeTab === 'filter'}
            onClick={() => setActiveTab('filter')}
            count={activeFilters}
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
              className="mr-1.5"
            >
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Filter
          </TabButton>
          <TabButton
            active={activeTab === 'aggregate'}
            onClick={() => setActiveTab('aggregate')}
            count={activeAggregations}
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
              className="mr-1.5"
            >
              <path d="M3 3v18h18" />
              <path d="M18 17V9" />
              <path d="M13 17V5" />
              <path d="M8 17v-3" />
            </svg>
            Aggregate
          </TabButton>
          <TabButton
            active={activeTab === 'sort'}
            onClick={() => setActiveTab('sort')}
            count={activeSorts}
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
              className="mr-1.5"
            >
              <path d="m3 16 4 4 4-4" />
              <path d="M7 20V4" />
              <path d="m21 8-4-4-4 4" />
              <path d="M17 4v16" />
            </svg>
            Sort
          </TabButton>
        </div>
      </div>

      {/* Query Builder Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Builder Panel */}
        <div className="w-96 border-r border-border bg-card overflow-y-auto p-4">
          {activeTab === 'filter' && (
            <FilterBuilder
              columns={currentMetadata.columns}
              filters={filters}
              onFiltersChange={setFilters}
            />
          )}
          {activeTab === 'aggregate' && (
            <AggregationBuilder
              columns={currentMetadata.columns}
              aggregations={aggregations}
              onAggregationsChange={setAggregations}
            />
          )}
          {activeTab === 'sort' && (
            <SortBuilder
              columns={currentMetadata.columns}
              sorts={sorts}
              onSortsChange={setSorts}
            />
          )}
        </div>

        {/* Results Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Results Header */}
          <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-foreground">Results</span>
              {resultTable && (
                <span className="text-sm text-muted-foreground">
                  {resultTable.numRows.toLocaleString()} rows × {resultTable.numCols} columns
                </span>
              )}
            </div>
            {executionTime !== null && (
              <span className="text-xs text-muted-foreground">
                Executed in {executionTime.toFixed(1)}ms
              </span>
            )}
          </div>

          {/* Results Table */}
          <div className="flex-1 overflow-hidden">
            {resultTable ? (
              <DataTable table={resultTable} />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mx-auto mb-3 opacity-50"
                  >
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="M3 9h18" />
                    <path d="M9 21V9" />
                  </svg>
                  <p className="text-sm">
                    {hasOperations
                      ? 'Click "Run Query" to see results'
                      : 'Add filters, aggregations, or sorts to build your query'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Tab button component
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, count, children }) => (
  <button
    onClick={onClick}
    className={clsx(
      'flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors',
      active
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
    )}
  >
    {children}
    {count > 0 && (
      <span
        className={clsx(
          'ml-2 px-1.5 py-0.5 text-xs rounded-full',
          active ? 'bg-primary-foreground/20' : 'bg-primary/20 text-primary'
        )}
      >
        {count}
      </span>
    )}
  </button>
);

// Helper function to parse values based on column type
function parseValue(value: any, column: any): any {
  if (value === null || value === undefined || value === '') return null;

  const strValue = String(value);

  // Try to detect type from the column
  // For now, just do basic type coercion
  const numValue = Number(strValue);
  if (!isNaN(numValue) && strValue.trim() !== '') {
    return numValue;
  }

  return strValue;
}

export default QueryBuilder;

