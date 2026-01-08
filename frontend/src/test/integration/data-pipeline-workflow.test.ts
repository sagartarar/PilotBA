/**
 * Data Pipeline End-to-End Workflow Tests
 * Focus: Security & Performance Integration
 * 
 * Tests complete data pipeline flows:
 * - CSV → Parse → Filter → Aggregate → Render
 * - Security at each stage
 * - Performance end-to-end (<200ms for 1M rows)
 */

import { describe, it, expect } from 'vitest'
import { CSVParser } from '../../data-pipeline/parsers/CSVParser'
import { FilterOperator } from '../../data-pipeline/operators/Filter'
import { AggregateOperator } from '../../data-pipeline/operators/Aggregate'
import { QueryOptimizer } from '../../data-pipeline/QueryOptimizer'

describe('Data Pipeline - Complete Workflows', () => {
  describe('CSV → Filter → Aggregate Workflow', () => {
    it('should process complete pipeline in <100ms for 10K rows', async () => {
      // Generate CSV data
      const csv = 'id,category,value\n' +
        Array(10000).fill(0).map((_, i) =>
          `${i},cat${i % 10},${i % 100}`
        ).join('\n')

      const start = performance.now()

      // Step 1: Parse CSV
      const parser = new CSVParser()
      const parseResult = await parser.parse(csv)

      // Step 2: Filter
      const filtered = FilterOperator.apply(parseResult.table, {
        column: 'value',
        operator: 'gt',
        value: 50
      })

      // Step 3: Aggregate
      const aggregated = AggregateOperator.apply(filtered, {
        groupBy: ['category'],
        aggregations: [
          { column: 'value', function: 'sum', alias: 'total' },
          { column: 'value', function: 'avg', alias: 'average' }
        ]
      })

      const duration = performance.now() - start

      expect(aggregated.numRows).toBe(10)
      expect(duration).toBeLessThan(100)
    })

    it('should handle malicious data at each stage', async () => {
      const maliciousCSV = `id,query,value
1,"'; DROP TABLE users; --",100
2,"<script>alert('xss')</script>",200
3,"eval('malicious()')",300`

      // Parse
      const parser = new CSVParser()
      const parseResult = await parser.parse(maliciousCSV)
      expect(parseResult.table.numRows).toBe(3)

      // Filter - should treat malicious strings as data
      const filtered = FilterOperator.apply(parseResult.table, {
        column: 'query',
        operator: 'eq',
        value: "'; DROP TABLE users; --"
      })
      expect(filtered.numRows).toBe(1)

      // Aggregate - should safely group by malicious strings
      const aggregated = AggregateOperator.apply(parseResult.table, {
        groupBy: ['query'],
        aggregations: [{ column: 'value', function: 'sum', alias: 'total' }]
      })
      expect(aggregated.numRows).toBe(3)
    })
  })

  describe('Query Optimization Integration', () => {
    it('should optimize then execute pipeline efficiently', async () => {
      const csv = 'id,age,salary\n' +
        Array(10000).fill(0).map((_, i) =>
          `${i},${20 + (i % 50)},${30000 + (i % 100) * 1000}`
        ).join('\n')

      const start = performance.now()

      // Parse
      const parser = new CSVParser()
      const parseResult = await parser.parse(csv)

      // Create query plan
      const plan = QueryOptimizer.optimize([
        { type: 'aggregate', params: { groupBy: ['age'] } },
        { type: 'filter', params: { column: 'salary', operator: 'gt', value: 50000 } }
      ], {
        rowCount: parseResult.rowCount,
        columnCount: parseResult.columnCount,
        columnStats: new Map()
      })

      // Execute optimized plan (filter should be first)
      expect(plan.operations[0].type).toBe('filter')

      const filtered = FilterOperator.apply(parseResult.table, plan.operations[0].params)
      const aggregated = AggregateOperator.apply(filtered, plan.operations[1].params)

      const duration = performance.now() - start

      expect(aggregated.numRows).toBeGreaterThan(0)
      expect(duration).toBeLessThan(100)
    })
  })

  describe('Large Dataset Workflows', () => {
    it('should process 100K row pipeline in <200ms', async () => {
      const csv = 'id,category,value\n' +
        Array(100000).fill(0).map((_, i) =>
          `${i},cat${i % 100},${i % 1000}`
        ).join('\n')

      const start = performance.now()

      const parser = new CSVParser()
      const parseResult = await parser.parse(csv)

      const filtered = FilterOperator.apply(parseResult.table, {
        column: 'value',
        operator: 'between',
        min: 200,
        max: 800
      })

      const aggregated = AggregateOperator.apply(filtered, {
        groupBy: ['category'],
        aggregations: [
          { column: 'value', function: 'sum', alias: 'total' },
          { column: 'value', function: 'count', alias: 'count' }
        ]
      })

      const duration = performance.now() - start

      expect(aggregated.numRows).toBe(100)
      expect(duration).toBeLessThan(200)
    })
  })
})

describe('Security - End-to-End Attack Scenarios', () => {
  describe('Injection Attack Chain', () => {
    it('should prevent SQL injection through entire pipeline', async () => {
      const attackCSV = `id,username,role
1,admin,"admin'; DROP TABLE sessions; --"
2,user,"' OR '1'='1"
3,guest,"1' UNION SELECT * FROM passwords--"`

      const parser = new CSVParser()
      const result = await parser.parse(attackCSV)
      const table = result.table

      // Filter with injection attempt
      const filtered = FilterOperator.apply(table, {
        column: 'role',
        operator: 'eq',
        value: "admin'; DROP TABLE sessions; --"
      })
      expect(filtered.numRows).toBe(1)

      // Aggregate with injection in group by
      const aggregated = AggregateOperator.apply(table, {
        groupBy: ['role'],
        aggregations: [{ column: 'id', function: 'count', alias: 'count' }]
      })
      expect(aggregated.numRows).toBe(3)

      // Original table should be intact
      expect(table.numRows).toBe(3)
    })

    it('should prevent XSS through data pipeline', async () => {
      const xssCSV = `id,comment
1,"<script>alert('xss')</script>"
2,"<img src=x onerror=alert(1)>"
3,"javascript:alert(document.cookie)"`

      const parser = new CSVParser()
      const result = await parser.parse(xssCSV)
      const table = result.table

      // Data should be stored as strings, not executed
      expect(table.numRows).toBe(3)

      const filtered = FilterOperator.apply(table, {
        column: 'comment',
        operator: 'like',
        pattern: '%script%'
      })
      expect(filtered.numRows).toBe(1)
    })
  })

  describe('Resource Exhaustion Prevention', () => {
    it('should reject extremely large CSV files', async () => {
      // 100MB+ CSV
      const hugeLine = 'A'.repeat(10000000)
      const hugeCSV = `id,data\n1,${hugeLine}`

      const parser = new CSVParser()

      await expect(parser.parse(hugeCSV)).rejects.toThrow(/size|memory|limit/i)
    })

    it('should timeout on complex operations', async () => {
      const csv = 'id,value\n' +
        Array(10000).fill(0).map((_, i) => `${i},${i}`).join('\n')

      const parser = new CSVParser()
      const result = await parser.parse(csv)
      const table = result.table

      // Create extremely complex query plan
      const complexOps = Array(1000).fill(0).map((_, i) => ({
        type: 'filter',
        params: { column: 'value', operator: 'gt', value: i }
      }))

      expect(() => QueryOptimizer.optimize(complexOps, {
        rowCount: 10000,
        columnCount: 2,
        columnStats: new Map()
      })).toThrow(/complex|limit/i)
    })
  })
})

describe('Performance - End-to-End Benchmarks', () => {
  it('should meet design requirement: <200ms for 1M row load', async () => {
    // Design doc: < 200ms initial data load for 1M rows
    const csv = 'id,value\n' +
      Array(1000000).fill(0).map((_, i) => `${i},${i % 1000}`).join('\n')

    const start = performance.now()
    const parser = new CSVParser()
    const result = await parser.parse(csv)
    const duration = performance.now() - start

    expect(result.table.numRows).toBe(1000000)
    expect(duration).toBeLessThan(200) // Design requirement
  })

  it('should process 1M rows with filter in <250ms total', async () => {
    const csv = 'id,value\n' +
      Array(1000000).fill(0).map((_, i) => `${i},${i % 1000}`).join('\n')

    const start = performance.now()

    const parser = new CSVParser()
    const parseResult = await parser.parse(csv)

    const filtered = FilterOperator.apply(parseResult.table, {
      column: 'value',
      operator: 'gt',
      value: 500
    })

    const duration = performance.now() - start

    expect(filtered.numRows).toBeGreaterThan(0)
    expect(duration).toBeLessThan(250)
  })
})

describe('Error Handling - Pipeline Resilience', () => {
  it('should handle empty data gracefully at each stage', async () => {
    const emptyCSV = 'id,value\n1,100' // Need at least one row for valid parse

    const parser = new CSVParser()
    const result = await parser.parse(emptyCSV)
    expect(result.table.numRows).toBe(1)

    // Filter to empty result
    const filtered = FilterOperator.apply(result.table, {
      column: 'value',
      operator: 'gt',
      value: 999999
    })
    expect(filtered.numRows).toBe(0)

    // Aggregate on empty table
    const aggregated = AggregateOperator.apply(filtered, {
      groupBy: ['id'],
      aggregations: [{ column: 'value', function: 'sum', alias: 'total' }]
    })
    expect(aggregated.numRows).toBe(0)
  })

  it('should handle malformed CSV gracefully', async () => {
    const malformed = 'id,name\n1,Alice,ExtraColumn\n2,Bob'

    const parser = new CSVParser()
    const result = await parser.parse(malformed)

    // Should handle malformed data - extra columns ignored, missing treated as null
    expect(result.table).toBeDefined()
  })
})

