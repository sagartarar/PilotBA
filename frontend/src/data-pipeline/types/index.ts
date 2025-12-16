import { Table, Schema, Vector } from 'apache-arrow';

// Data source types
export interface DataSource {
  type: 'csv' | 'json' | 'parquet' | 'arrow' | 'api';
  data: string | ArrayBuffer | Blob | URL | any[];
  options?: LoadOptions;
}

export interface LoadOptions {
  delimiter?: string;
  hasHeader?: boolean;
  schema?: Schema;
  sampleSize?: number;
}

// Table metadata
export interface TableMetadata {
  id: string;
  name: string;
  schema: Schema;
  rowCount: number;
  columnStats: Map<string, ColumnStats>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ColumnStats {
  min: any;
  max: any;
  nullCount: number;
  distinctCount?: number;
  mean?: number;
  stddev?: number;
}

// Transformation operations
export type TransformOperation =
  | FilterOperation
  | AggregateOperation
  | SortOperation
  | JoinOperation
  | ComputeOperation
  | LimitOperation;

export interface FilterOperation {
  type: 'filter';
  params: FilterParams;
}

export interface FilterParams {
  column: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'between' | 'contains';
  value: any;
  value2?: any; // For 'between'
}

export interface AggregateOperation {
  type: 'aggregate';
  params: AggregateParams;
}

export interface AggregateParams {
  groupBy: string[];
  aggregations: Aggregation[];
}

export interface Aggregation {
  column: string;
  function: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'stddev' | 'first' | 'last';
  alias: string;
}

export interface SortOperation {
  type: 'sort';
  params: SortParams;
}

export interface SortParams {
  column: string;
  order: 'asc' | 'desc';
}

export interface JoinOperation {
  type: 'join';
  params: JoinParams;
}

export interface JoinParams {
  rightTableId: string;
  leftOn: string;
  rightOn: string;
  joinType: 'inner' | 'left' | 'right' | 'outer';
}

export interface ComputeOperation {
  type: 'compute';
  params: ComputeParams;
}

export interface ComputeParams {
  column: string;
  expression: string | ((row: any) => any);
  alias: string;
}

export interface LimitOperation {
  type: 'limit';
  params: LimitParams;
}

export interface LimitParams {
  count: number;
  offset?: number;
}

// Query plan
export interface QueryPlan {
  operations: TransformOperation[];
  estimatedCost: number;
  estimatedRows: number;
}

// Execution context
export interface ExecutionContext {
  table: Table;
  plan: QueryPlan;
  useWebWorkers?: boolean;
  chunkSize?: number;
}

// Sampling strategies
export interface SamplingStrategy {
  type: 'random' | 'stratified' | 'systematic' | 'lttb';
  sampleSize: number;
  params?: any;
}

export interface StratifiedSamplingParams {
  column: string;
}

export interface LTTBSamplingParams {
  xColumn: string;
  yColumn: string;
}

// Export Arrow types
export type { Table, Schema, Vector };

