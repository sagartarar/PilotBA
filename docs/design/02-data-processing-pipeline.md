# Data Processing Pipeline - Low-Level Design

## Overview

The Data Processing Pipeline is responsible for transforming raw data into optimized, columnar format suitable for high-performance visualization. It uses Apache Arrow for in-memory columnar data structures, enabling zero-copy data sharing between components and efficient vectorized operations.

## Why Apache Arrow?

1. **Columnar Memory Layout**: Better cache locality for analytics operations
2. **Zero-Copy**: Share data between JavaScript and WebAssembly without serialization
3. **Vectorized Operations**: SIMD-optimized operations on columns
4. **Standardized Format**: Interoperability with backend (Arrow IPC/Flight)
5. **Memory Efficiency**: Compact representation, ~10x less memory than JSON

## Performance Requirements

| Operation | Target | Dataset Size |
|-----------|--------|--------------|
| Data Load | < 100ms | 1M rows |
| Aggregation | < 50ms | 1M rows |
| Filter | < 30ms | 1M rows |
| Sort | < 80ms | 1M rows |
| Join | < 200ms | 100K × 100K rows |

## Architecture

### High-Level Data Flow

```
┌─────────────────────────────────────────────────────────┐
│              Data Sources                               │
├─────────────────────────────────────────────────────────┤
│  CSV   │  JSON   │  Parquet  │  API  │  WebSocket     │
└────┬────┴────┬────┴─────┬──────┴───┬───┴──────┬─────────┘
     │         │          │          │          │
     ▼         ▼          ▼          ▼          ▼
┌─────────────────────────────────────────────────────────┐
│               Data Loaders                              │
├─────────────────────────────────────────────────────────┤
│  - Parse & validate                                     │
│  - Convert to Arrow Tables                              │
│  - Schema inference                                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│             Arrow Table Store                           │
├─────────────────────────────────────────────────────────┤
│  - In-memory Arrow Tables                               │
│  - Indexed by dataset ID                                │
│  - Schema metadata                                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│          Transformation Engine                          │
├─────────────────────────────────────────────────────────┤
│  Operations:                                            │
│  - Filter (WHERE)                                       │
│  - Aggregate (GROUP BY)                                 │
│  - Sort (ORDER BY)                                      │
│  - Join (INNER/LEFT/RIGHT)                              │
│  - Compute (derived columns)                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Query Optimizer                            │
├─────────────────────────────────────────────────────────┤
│  - Predicate pushdown                                   │
│  - Projection pushdown                                  │
│  - Operation reordering                                 │
│  - Index utilization                                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│             Execution Engine                            │
├─────────────────────────────────────────────────────────┤
│  - Vectorized execution                                 │
│  - Parallel processing (Web Workers)                    │
│  - Streaming results                                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│            Result Materialization                       │
├─────────────────────────────────────────────────────────┤
│  - Convert to ChartData format                          │
│  - Sample if needed (for viz)                           │
│  - Cache results                                        │
└─────────────────────────────────────────────────────────┘
```

## Core Components

### 1. DataLoader

**Responsibility**: Load and parse data from various sources into Arrow Tables.

```typescript
interface DataSource {
  type: 'csv' | 'json' | 'parquet' | 'arrow' | 'api';
  data: string | ArrayBuffer | Blob | URL;
  options?: LoadOptions;
}

interface LoadOptions {
  delimiter?: string;
  hasHeader?: boolean;
  schema?: Schema;
  sampleSize?: number;
}

class DataLoader {
  async load(source: DataSource): Promise<Table>;
  inferSchema(sample: any[]): Schema;
  validateData(data: any[], schema: Schema): boolean;
}
```

**Implementation Strategy**:

1. **CSV Parsing** (Use Apache Arrow CSV parser):
```typescript
import { tableFromIPC } from 'apache-arrow';

async loadCSV(csvString: string, options: LoadOptions): Promise<Table> {
  // Use Arrow's CSV parser (WASM-accelerated)
  const table = await parseCSV(csvString, {
    delimiter: options.delimiter || ',',
    header: options.hasHeader ?? true,
  });
  
  return table;
}
```

2. **JSON Parsing** (Row-major to columnar conversion):
```typescript
async loadJSON(json: any[], schema?: Schema): Promise<Table> {
  // If no schema, infer from first N rows
  const inferredSchema = schema || this.inferSchema(json.slice(0, 1000));
  
  // Build column arrays
  const columns: Record<string, any[]> = {};
  inferredSchema.fields.forEach(field => {
    columns[field.name] = [];
  });
  
  // Convert row-major to column-major
  json.forEach(row => {
    inferredSchema.fields.forEach(field => {
      columns[field.name].push(row[field.name]);
    });
  });
  
  // Create Arrow Table from columns
  return tableFromColumns(columns, inferredSchema);
}
```

3. **Parquet Parsing** (Use parquet-wasm):
```typescript
import { readParquet } from 'parquet-wasm';

async loadParquet(buffer: ArrayBuffer): Promise<Table> {
  // Read Parquet file directly to Arrow Table
  const table = await readParquet(buffer);
  return table;
}
```

### 2. Arrow Table Store

**Responsibility**: Manage in-memory Arrow Tables with indexing for fast access.

```typescript
interface TableMetadata {
  id: string;
  name: string;
  schema: Schema;
  rowCount: number;
  columnStats: Map<string, ColumnStats>;
  createdAt: Date;
  updatedAt: Date;
}

interface ColumnStats {
  min: any;
  max: any;
  nullCount: number;
  distinctCount?: number;
}

class TableStore {
  private tables: Map<string, Table>;
  private metadata: Map<string, TableMetadata>;
  private indexes: Map<string, ColumnIndex>;
  
  register(id: string, table: Table): void;
  get(id: string): Table | undefined;
  delete(id: string): void;
  
  createIndex(tableId: string, columnName: string): void;
  getStats(tableId: string, columnName: string): ColumnStats;
  
  private computeStats(column: Vector): ColumnStats;
}
```

**Column Statistics** (for query optimization):
```typescript
computeStats(column: Vector): ColumnStats {
  let min = Infinity;
  let max = -Infinity;
  let nullCount = 0;
  const distinct = new Set();
  
  for (let i = 0; i < column.length; i++) {
    const value = column.get(i);
    
    if (value === null || value === undefined) {
      nullCount++;
      continue;
    }
    
    if (value < min) min = value;
    if (value > max) max = value;
    distinct.add(value);
  }
  
  return {
    min,
    max,
    nullCount,
    distinctCount: distinct.size,
  };
}
```

### 3. Transformation Engine

**Responsibility**: Execute data transformations using vectorized operations.

```typescript
interface TransformOperation {
  type: 'filter' | 'aggregate' | 'sort' | 'join' | 'compute';
  params: any;
}

interface FilterParams {
  column: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'between';
  value: any;
}

interface AggregateParams {
  groupBy: string[];
  aggregations: {
    column: string;
    function: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'stddev';
    alias: string;
  }[];
}

interface SortParams {
  column: string;
  order: 'asc' | 'desc';
}

class TransformationEngine {
  filter(table: Table, params: FilterParams): Table;
  aggregate(table: Table, params: AggregateParams): Table;
  sort(table: Table, params: SortParams): Table;
  join(left: Table, right: Table, on: string, type: JoinType): Table;
  compute(table: Table, column: string, expression: string): Table;
}
```

**Filter Implementation** (Vectorized):
```typescript
filter(table: Table, params: FilterParams): Table {
  const column = table.getChild(params.column);
  if (!column) throw new Error(`Column ${params.column} not found`);
  
  // Create boolean mask using vectorized comparison
  const mask = this.createMask(column, params.operator, params.value);
  
  // Filter all columns using the mask
  const filteredColumns: any[] = [];
  for (const field of table.schema.fields) {
    const col = table.getChild(field.name);
    filteredColumns.push(col!.filter(mask));
  }
  
  return new Table(table.schema, filteredColumns);
}

private createMask(column: Vector, operator: string, value: any): Uint8Array {
  const mask = new Uint8Array(column.length);
  
  // Vectorized comparison (browser SIMD if available)
  switch (operator) {
    case 'eq':
      for (let i = 0; i < column.length; i++) {
        mask[i] = column.get(i) === value ? 1 : 0;
      }
      break;
    case 'gt':
      for (let i = 0; i < column.length; i++) {
        mask[i] = column.get(i) > value ? 1 : 0;
      }
      break;
    // ... other operators
  }
  
  return mask;
}
```

**Aggregate Implementation** (Using HashMap):
```typescript
aggregate(table: Table, params: AggregateParams): Table {
  // Build composite key from groupBy columns
  const groups = new Map<string, number[]>();
  
  for (let i = 0; i < table.numRows; i++) {
    const key = params.groupBy
      .map(col => table.getChild(col)!.get(i))
      .join('|');
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(i);
  }
  
  // Compute aggregations for each group
  const resultColumns: any = {};
  
  // Add group keys
  params.groupBy.forEach(col => {
    resultColumns[col] = [];
  });
  
  // Add aggregated columns
  params.aggregations.forEach(agg => {
    resultColumns[agg.alias] = [];
  });
  
  groups.forEach((indices, key) => {
    // Add group key values
    const keyParts = key.split('|');
    params.groupBy.forEach((col, i) => {
      resultColumns[col].push(keyParts[i]);
    });
    
    // Compute aggregations
    params.aggregations.forEach(agg => {
      const column = table.getChild(agg.column)!;
      const values = indices.map(i => column.get(i));
      const result = this.computeAggregation(values, agg.function);
      resultColumns[agg.alias].push(result);
    });
  });
  
  return tableFromColumns(resultColumns);
}

private computeAggregation(values: any[], func: string): any {
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
    default:
      throw new Error(`Unknown aggregation function: ${func}`);
  }
}
```

**Sort Implementation** (QuickSort with column vectors):
```typescript
sort(table: Table, params: SortParams): Table {
  const column = table.getChild(params.column);
  if (!column) throw new Error(`Column ${params.column} not found`);
  
  // Create index array
  const indices = new Uint32Array(table.numRows);
  for (let i = 0; i < table.numRows; i++) {
    indices[i] = i;
  }
  
  // Sort indices based on column values
  indices.sort((a, b) => {
    const valA = column.get(a);
    const valB = column.get(b);
    
    if (valA < valB) return params.order === 'asc' ? -1 : 1;
    if (valA > valB) return params.order === 'asc' ? 1 : -1;
    return 0;
  });
  
  // Reorder all columns
  const sortedColumns: any[] = [];
  for (const field of table.schema.fields) {
    const col = table.getChild(field.name);
    const sortedCol = this.reorderColumn(col!, indices);
    sortedColumns.push(sortedCol);
  }
  
  return new Table(table.schema, sortedColumns);
}
```

### 4. Query Optimizer

**Responsibility**: Optimize query execution plans.

```typescript
interface QueryPlan {
  operations: TransformOperation[];
  estimatedCost: number;
  estimatedRows: number;
}

class QueryOptimizer {
  optimize(operations: TransformOperation[], tableMetadata: TableMetadata): QueryPlan {
    // Clone operations for manipulation
    const optimized = [...operations];
    
    // 1. Predicate pushdown (filters early)
    optimized.sort((a, b) => {
      if (a.type === 'filter' && b.type !== 'filter') return -1;
      if (a.type !== 'filter' && b.type === 'filter') return 1;
      return 0;
    });
    
    // 2. Projection pushdown (select only needed columns)
    const neededColumns = this.identifyNeededColumns(optimized);
    
    // 3. Combine consecutive filters
    const merged = this.mergeFilters(optimized);
    
    // 4. Estimate cost
    const estimatedCost = this.estimateCost(merged, tableMetadata);
    const estimatedRows = this.estimateRows(merged, tableMetadata);
    
    return {
      operations: merged,
      estimatedCost,
      estimatedRows,
    };
  }
  
  private estimateCost(operations: TransformOperation[], metadata: TableMetadata): number {
    let cost = 0;
    let rows = metadata.rowCount;
    
    for (const op of operations) {
      switch (op.type) {
        case 'filter':
          cost += rows * 0.1; // O(n)
          rows *= 0.5; // Assume 50% selectivity
          break;
        case 'aggregate':
          cost += rows * 2; // O(n) with hash table overhead
          rows /= 10; // Assume 10% groups
          break;
        case 'sort':
          cost += rows * Math.log2(rows); // O(n log n)
          break;
        case 'join':
          cost += rows * 10; // Expensive
          break;
      }
    }
    
    return cost;
  }
}
```

### 5. Execution Engine

**Responsibility**: Execute optimized query plans with parallelization.

```typescript
interface ExecutionContext {
  table: Table;
  plan: QueryPlan;
  useWebWorkers: boolean;
  chunkSize: number;
}

class ExecutionEngine {
  async execute(context: ExecutionContext): Promise<Table> {
    if (context.useWebWorkers && context.table.numRows > 100000) {
      return this.executeParallel(context);
    }
    
    return this.executeSerial(context);
  }
  
  private executeSerial(context: ExecutionContext): Table {
    let result = context.table;
    
    for (const operation of context.plan.operations) {
      result = this.executeOperation(result, operation);
    }
    
    return result;
  }
  
  private async executeParallel(context: ExecutionContext): Promise<Table> {
    const workerCount = navigator.hardwareConcurrency || 4;
    const chunkSize = Math.ceil(context.table.numRows / workerCount);
    
    // Split table into chunks
    const chunks: Table[] = [];
    for (let i = 0; i < context.table.numRows; i += chunkSize) {
      chunks.push(context.table.slice(i, i + chunkSize));
    }
    
    // Process chunks in parallel
    const workers = this.createWorkerPool(workerCount);
    const results = await Promise.all(
      chunks.map((chunk, i) =>
        this.processChunk(workers[i % workerCount], chunk, context.plan)
      )
    );
    
    // Combine results
    return this.combineResults(results);
  }
}
```

### 6. Data Sampler

**Responsibility**: Intelligently sample large datasets for visualization.

```typescript
interface SamplingStrategy {
  type: 'random' | 'stratified' | 'systematic' | 'lttb';
  sampleSize: number;
  params?: any;
}

class DataSampler {
  // Random sampling
  randomSample(table: Table, size: number): Table {
    const indices = this.randomIndices(table.numRows, size);
    return this.selectRows(table, indices);
  }
  
  // Stratified sampling (preserve distribution)
  stratifiedSample(table: Table, column: string, size: number): Table {
    const groups = this.groupBy(table, column);
    const samplePerGroup = Math.ceil(size / groups.size);
    
    const sampled: number[] = [];
    groups.forEach(indices => {
      const groupSample = this.randomIndices(indices.length, samplePerGroup);
      sampled.push(...groupSample.map(i => indices[i]));
    });
    
    return this.selectRows(table, sampled.slice(0, size));
  }
  
  // LTTB (Largest Triangle Three Buckets) - for time series
  lttbSample(table: Table, xColumn: string, yColumn: string, size: number): Table {
    // Downsampling algorithm that preserves visual characteristics
    // See: https://skemman.is/bitstream/1946/15343/3/SS_MSthesis.pdf
    
    const x = table.getChild(xColumn)!;
    const y = table.getChild(yColumn)!;
    
    const bucketSize = Math.floor((table.numRows - 2) / (size - 2));
    const sampled = [0]; // Always include first point
    
    let a = 0;
    for (let i = 0; i < size - 2; i++) {
      const bucketStart = (i + 1) * bucketSize + 1;
      const bucketEnd = Math.min((i + 2) * bucketSize + 1, table.numRows);
      
      // Calculate average point in next bucket
      let avgX = 0;
      let avgY = 0;
      for (let j = bucketStart; j < bucketEnd; j++) {
        avgX += x.get(j);
        avgY += y.get(j);
      }
      avgX /= (bucketEnd - bucketStart);
      avgY /= (bucketEnd - bucketStart);
      
      // Find point in current bucket with largest triangle area
      const currBucketStart = i * bucketSize + 1;
      const currBucketEnd = (i + 1) * bucketSize + 1;
      
      let maxArea = -1;
      let maxIndex = currBucketStart;
      
      for (let j = currBucketStart; j < currBucketEnd; j++) {
        const area = Math.abs(
          (x.get(a) - avgX) * (y.get(j) - y.get(a)) -
          (x.get(a) - x.get(j)) * (avgY - y.get(a))
        ) * 0.5;
        
        if (area > maxArea) {
          maxArea = area;
          maxIndex = j;
        }
      }
      
      sampled.push(maxIndex);
      a = maxIndex;
    }
    
    sampled.push(table.numRows - 1); // Always include last point
    
    return this.selectRows(table, sampled);
  }
}
```

## Memory Management

### Buffer Pooling

```typescript
class BufferPool {
  private pools: Map<number, ArrayBuffer[]> = new Map();
  
  acquire(size: number): ArrayBuffer {
    const pool = this.pools.get(size) || [];
    
    if (pool.length > 0) {
      return pool.pop()!;
    }
    
    return new ArrayBuffer(size);
  }
  
  release(buffer: ArrayBuffer): void {
    const size = buffer.byteLength;
    const pool = this.pools.get(size) || [];
    
    // Limit pool size to prevent memory bloat
    if (pool.length < 10) {
      pool.push(buffer);
      this.pools.set(size, pool);
    }
  }
  
  clear(): void {
    this.pools.clear();
  }
}
```

## File Structure

```
frontend/src/data-pipeline/
├── index.ts                    # Main exports
├── DataLoader.ts              # Data loading
├── TableStore.ts              # Table management
├── TransformationEngine.ts    # Data transformations
├── QueryOptimizer.ts          # Query optimization
├── ExecutionEngine.ts         # Query execution
├── DataSampler.ts             # Sampling strategies
├── parsers/
│   ├── CSVParser.ts
│   ├── JSONParser.ts
│   ├── ParquetParser.ts
│   └── ArrowParser.ts
├── operators/
│   ├── Filter.ts
│   ├── Aggregate.ts
│   ├── Sort.ts
│   ├── Join.ts
│   └── Compute.ts
├── utils/
│   ├── BufferPool.ts
│   ├── SchemaInference.ts
│   └── Statistics.ts
└── types/
    └── index.ts
```

## Performance Optimizations

### 1. Lazy Evaluation
```typescript
// Don't materialize intermediate results
const query = table
  .filter(col('age').gt(18))
  .select(['name', 'age'])
  .sort('age', 'desc')
  .limit(100);

// Only execute when needed
const result = query.collect(); // <- Execution happens here
```

### 2. Column Pruning
```typescript
// Only read columns needed for query
const query = table.select(['name', 'age']); // Don't load other columns
```

### 3. Predicate Pushdown
```typescript
// Push filters as early as possible
// Bad:  load -> compute -> filter
// Good: load -> filter -> compute
```

### 4. Vectorization
```typescript
// Use SIMD operations when available
const result = column.map(x => x * 2); // Vectorized
```

## Testing Strategy

### Unit Tests
- Individual operator correctness
- Schema inference accuracy
- Sampling algorithm verification

### Integration Tests
- End-to-end query execution
- Multi-operation pipelines
- Data type handling

### Performance Tests
```typescript
describe('Performance', () => {
  it('should filter 1M rows in < 30ms', () => {
    const table = generateTable(1_000_000);
    const start = performance.now();
    
    const result = engine.filter(table, {
      column: 'age',
      operator: 'gt',
      value: 18,
    });
    
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(30);
  });
});
```

## Next Steps

After design approval, implementation will proceed:

1. DataLoader with CSV/JSON/Parquet support
2. TableStore with statistics
3. Basic operators (filter, aggregate, sort)
4. Query optimizer
5. Execution engine
6. Sampling strategies
7. Performance optimization & profiling

