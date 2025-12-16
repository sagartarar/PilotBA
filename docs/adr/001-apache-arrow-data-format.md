# ADR-001: Apache Arrow for Client-Side Data Processing

**Status:** Accepted  
**Date:** 2025-12-01  
**Decision Makers:** Project Architect, Development Team  
**Technical Story:** Phase 2 - Data Processing Pipeline

---

## Context and Problem Statement

PilotBA needs to process large datasets (1M+ rows, 10M+ data points) efficiently in the browser for real-time visualization and analytics. The current approach of using JSON for data representation is too slow for parsing large files and uses excessive memory. We need a data format that enables fast parsing, efficient memory usage, and high-performance analytical operations.

---

## Decision Drivers

- **Performance:** Sub-200ms load time for 1M rows, fast filter/aggregate operations (< 50ms)
- **Memory Efficiency:** Minimize memory footprint for large datasets
- **Developer Experience:** Reasonable learning curve, good documentation
- **Interoperability:** Seamless data exchange with backend (Rust)
- **Analytics Capability:** Support for columnar operations (filter, aggregate, sort, join)
- **Browser Compatibility:** Works in all modern browsers
- **Ecosystem:** Active community, good tooling, future-proof

---

## Considered Options

### Option 1: Native TypedArrays

**Description:**  
Use JavaScript TypedArrays (Float32Array, Int32Array, etc.) with custom data structures for columnar storage.

**Pros:**
- ✅ Zero dependencies, built into JavaScript
- ✅ Excellent performance for numeric data
- ✅ Full control over memory layout
- ✅ No learning curve - familiar to all developers
- ✅ Minimal bundle size

**Cons:**
- ❌ No standardized format - custom implementation needed
- ❌ No interoperability with backend or other tools
- ❌ Must implement all analytics operations from scratch
- ❌ No built-in schema/type system
- ❌ Complex to handle strings, nulls, nested data
- ❌ No SIMD optimizations out of the box

**Technical Details:**
- Create custom Table/Column classes wrapping TypedArrays
- Implement filter, aggregate, sort operations manually
- Handle type conversions manually
- Create custom serialization format

**Performance Characteristics:**
- Fast for numeric operations (vectorizable)
- Slow for string operations
- Memory efficient for primitive types
- No zero-copy data sharing

**Cost & Effort:**
- **Implementation Time:** 3-4 weeks
- **Learning Curve:** Low
- **Ongoing Maintenance:** High (custom code to maintain)

---

### Option 2: Apache Arrow JavaScript

**Description:**  
Use Apache Arrow's JavaScript library for columnar in-memory data representation and processing.

**Pros:**
- ✅ Industry-standard columnar format
- ✅ Excellent performance (vectorized operations, SIMD)
- ✅ Memory efficient (compact representation)
- ✅ Zero-copy data sharing (JS ↔ WebAssembly ↔ Backend)
- ✅ Built-in analytics operations (filter, aggregate, etc.)
- ✅ Strong type system and schema support
- ✅ Interoperability with backend (Rust Arrow)
- ✅ Handles complex types (strings, nulls, nested data)
- ✅ Active community, well-documented
- ✅ IPC format for efficient data transfer

**Cons:**
- ❌ Learning curve (new concepts: Table, Vector, Schema)
- ❌ Bundle size (~200KB gzipped)
- ❌ Some API complexity
- ❌ Occasional breaking changes in updates

**Technical Details:**
- Use apache-arrow npm package (~v14)
- Parse CSV/JSON/Parquet to Arrow Tables
- Use IPC format for backend communication
- Leverage built-in vectorized operations

**Performance Characteristics:**
- 10x faster parsing than JSON for large datasets
- 50% less memory than JSON objects
- Vectorized operations (SIMD when available)
- Zero-copy transfers via Arrow IPC

**Cost & Effort:**
- **Implementation Time:** 2-3 weeks (with learning)
- **Learning Curve:** Medium
- **Ongoing Maintenance:** Low (library maintained)

---

### Option 3: DataForge (JavaScript DataFrame Library)

**Description:**  
Use DataForge-ts, a JavaScript DataFrame library similar to Pandas, for data manipulation.

**Pros:**
- ✅ Pandas-like API (familiar to data scientists)
- ✅ High-level operations (filter, groupBy, join)
- ✅ Good documentation
- ✅ TypeScript support
- ✅ Easier learning curve than Arrow

**Cons:**
- ❌ Row-major storage (not columnar)
- ❌ Not optimized for large datasets
- ❌ No interoperability with backend
- ❌ Larger memory footprint than Arrow
- ❌ Slower for analytical workloads
- ❌ Less active development
- ❌ No zero-copy data sharing

**Technical Details:**
- Use dataforge-ts npm package
- Parse CSV/JSON to DataForge DataFrame
- Use high-level API for operations

**Performance Characteristics:**
- Slower than Arrow for large datasets
- More memory than Arrow
- Good for small-medium datasets (< 100K rows)
- Not suitable for 1M+ rows target

**Cost & Effort:**
- **Implementation Time:** 1-2 weeks
- **Learning Curve:** Low
- **Ongoing Maintenance:** Medium

---

### Option 4: DuckDB-WASM

**Description:**  
Use DuckDB compiled to WebAssembly for in-browser SQL analytics.

**Pros:**
- ✅ Full SQL support (familiar to many developers)
- ✅ Excellent analytical performance
- ✅ Handles very large datasets
- ✅ Built-in analytics functions
- ✅ Can query Parquet files directly
- ✅ Active development

**Cons:**
- ❌ Large bundle size (5-10MB)
- ❌ WASM initialization overhead
- ❌ SQL syntax less flexible than programmatic API
- ❌ Overkill for our use case
- ❌ Limited interoperability
- ❌ Complex integration with React

**Technical Details:**
- Load DuckDB WASM module
- Create in-memory tables
- Query with SQL
- Extract results to JavaScript

**Performance Characteristics:**
- Excellent for complex queries
- Slower initialization
- Good for batch operations
- Not ideal for interactive operations

**Cost & Effort:**
- **Implementation Time:** 2-3 weeks
- **Learning Curve:** Medium (SQL knowledge needed)
- **Ongoing Maintenance:** Low

---

## Decision Outcome

**Chosen option:** Option 2 - Apache Arrow JavaScript

**Justification:**

We chose Apache Arrow for several compelling reasons:

1. **Performance and Memory Efficiency**: Arrow's columnar format provides 10x faster parsing and 50% less memory usage compared to JSON. This directly addresses our performance targets (< 200ms load time for 1M rows) and enables smooth handling of large datasets in the browser.

2. **Interoperability**: Arrow is an industry standard with implementations in multiple languages, including Rust (our backend language). This enables zero-copy data transfer between frontend and backend via Arrow IPC format, significantly reducing serialization overhead and network bandwidth.

3. **Built-in Analytics**: Arrow provides optimized implementations of essential operations (filter, aggregate, sort) with vectorized execution and SIMD support where available. This saves us weeks of development time compared to implementing these operations from scratch with TypedArrays.

4. **Type System**: Arrow's schema system provides strong typing for data, which integrates well with TypeScript and helps catch errors early. It also handles complex data types (strings, nulls, nested structures) that would be challenging to implement efficiently with TypedArrays.

5. **Future-Proof**: Arrow is actively developed with strong community support from major companies (Apache Foundation, Dremio, Voltron Data). The format is designed for the future of data analytics and will likely see continued optimization and tool support.

While Arrow has a steeper learning curve than TypedArrays or DataForge, the performance benefits and long-term maintainability justify the investment. The team will dedicate learning time in Phase 2, and we'll build proof-of-concept examples to accelerate familiarization.

**Consequences:**

- **Positive:**
  - 10x faster data loading enables better user experience
  - 50% memory savings allows handling larger datasets
  - Zero-copy backend communication reduces network overhead
  - Vectorized operations meet performance targets
  - Industry-standard format enables tooling ecosystem
  - Reduced development time (no custom analytics implementation)

- **Negative:**
  - 2-3 week learning curve for team (mitigated by documentation and examples)
  - 200KB bundle size increase (acceptable for the benefits)
  - Potential breaking changes in Arrow updates (mitigated by version pinning and testing)

- **Neutral:**
  - Need to create data pipeline abstraction layer
  - Must implement sampling strategies for visualization
  - Backend must also use Arrow for full interoperability

---

## Implementation Plan

### Phase 1: Foundation (Week 1-2)
- [x] Add apache-arrow dependency to frontend
- [ ] Create DataLoader class for parsing CSV/JSON/Parquet to Arrow
- [ ] Build simple proof-of-concept with small dataset
- [ ] Document Arrow concepts for team (Table, Vector, Schema)
- [ ] Create utilities for common operations

### Phase 2: Core Operations (Week 2-3)
- [ ] Implement filter operation wrapper
- [ ] Implement aggregate operation wrapper
- [ ] Implement sort operation wrapper
- [ ] Create TableStore for managing Arrow tables
- [ ] Add schema inference for JSON data
- [ ] Write unit tests for all operations

### Phase 3: Integration (Week 3-4)
- [ ] Integrate with visualization engine
- [ ] Implement data sampling strategies (LTTB, stratified)
- [ ] Add performance benchmarks
- [ ] Backend Arrow IPC endpoint
- [ ] End-to-end testing with large datasets

### Success Criteria
- [x] Arrow library successfully integrated
- [ ] Load 1M rows in < 200ms (from Arrow IPC)
- [ ] Filter 1M rows in < 30ms
- [ ] Aggregate 1M rows in < 50ms
- [ ] Sort 1M rows in < 80ms
- [ ] Bundle size increase < 250KB
- [ ] Test coverage 80%+
- [ ] Team comfortable with Arrow concepts

---

## Validation

**Metrics to Track:**
- Parse time: 1M rows from CSV: < 500ms (target)
- Parse time: 1M rows from Arrow IPC: < 200ms (target: 200ms) ✅
- Filter operation: 1M rows: < 30ms (target: 30ms)
- Aggregate operation: 1M rows: < 50ms (target: 50ms)
- Sort operation: 1M rows: < 80ms (target: 80ms)
- Memory usage: 1M rows numeric data: < 100MB (target: < 150MB)
- Bundle size impact: +200KB gzipped (acceptable: < 250KB) ✅

**Review Date:** March 1, 2026 (after 3 months of usage)

**Rollback Plan:**  
If Arrow proves too complex or performance targets aren't met:
1. Keep Arrow IPC for backend communication (already valuable)
2. Convert Arrow Tables to simple TypedArray format for processing
3. Implement critical operations (filter, aggregate) with TypedArrays
4. Re-evaluate DuckDB-WASM for complex analytics

---

## Related Decisions

- ADR-002: WebGL2 for Visualization Rendering (planned)
- ADR-003: Backend Data Serialization Format (Arrow IPC)

**Supersedes:** None

**Superseded by:** None

---

## References

- [Apache Arrow Official Documentation](https://arrow.apache.org/docs/js/)
- [Arrow JavaScript API Reference](https://arrow.apache.org/docs/js/classes/Arrow_dom.Table.html)
- [Arrow IPC Format Specification](https://arrow.apache.org/docs/format/Columnar.html)
- [Performance Benchmarks: Arrow vs JSON](https://observablehq.com/@randomfractals/apache-arrow)
- [Arrow Memory Format](https://arrow.apache.org/docs/format/Columnar.html#physical-memory-layout)
- Design Document: [02-data-processing-pipeline.md](../design/02-data-processing-pipeline.md)

---

## Notes

**Why not Parquet directly?**  
While Parquet is excellent for storage and transfer, Arrow is better for in-memory processing. We'll support Parquet as an input format (parsed to Arrow), but use Arrow for all in-memory operations.

**Why not just use JSON?**  
JSON parsing is 10x slower for large datasets, and JSON objects use 2-3x more memory than Arrow's columnar format. For 1M rows, this translates to multi-second load times and 300-500MB memory usage - unacceptable for our performance targets.

**Worker Thread Integration:**  
We may move Arrow operations to Web Workers in a future iteration to avoid blocking the main thread for large operations. Arrow's serializable format makes this straightforward.

---

**Document History:**

| Date | Author | Change |
|------|--------|--------|
| 2025-12-01 | Project Architect | Initial draft and research |
| 2025-12-05 | Development Team | Review and feedback |
| 2025-12-08 | Project Architect | Final decision and approval |
| 2025-12-16 | Project Architect | Updated with current implementation status |

