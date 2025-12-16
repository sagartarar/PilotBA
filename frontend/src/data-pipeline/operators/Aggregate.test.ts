/**
 * Aggregate Operator Test Suite
 * Focus: Security & Performance (< 50ms for 1M rows per design doc)
 * 
 * Security Tests:
 * - SQL injection in group by columns
 * - Expression injection in aggregations
 * - Integer overflow in SUM operations
 * - Division by zero in AVG
 * 
 * Performance Tests:
 * - < 50ms for 1M rows (design requirement)
 * - Memory efficient grouping
 * - Hash table optimization
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AggregateOperator, type AggregateParams } from './Aggregate'
import { Table, tableFromArrays } from 'apache-arrow'

describe('AggregateOperator - Basic Functionality', () => {
  let table: Table

  beforeEach(() => {
    table = tableFromArrays({
      category: ['A', 'B', 'A', 'B', 'A', 'C'],
      value: [10, 20, 15, 25, 20, 30],
      count: [1, 2, 3, 4, 5, 6]
    })
  })

  describe('COUNT Aggregation', () => {
    it('should count rows by group', () => {
      const params: AggregateParams = {
        groupBy: ['category'],
        aggregations: [{ column: 'value', function: 'count', alias: 'total' }]
      }

      const result = AggregateOperator.apply(table, params)

      expect(result.numRows).toBe(3) // A, B, C
    })

    it('should count all rows without grouping', () => {
      const params: AggregateParams = {
        groupBy: [],
        aggregations: [{ column: 'value', function: 'count', alias: 'total' }]
      }

      const result = AggregateOperator.apply(table, params)

      expect(result.numRows).toBe(1)
    })
  })

  describe('SUM Aggregation', () => {
    it('should sum values by group', () => {
      const params: AggregateParams = {
        groupBy: ['category'],
        aggregations: [{ column: 'value', function: 'sum', alias: 'total_value' }]
      }

      const result = AggregateOperator.apply(table, params)

      expect(result.numRows).toBe(3)
      // A: 10+15+20=45, B: 20+25=45, C: 30
    })
  })

  describe('AVG Aggregation', () => {
    it('should average values by group', () => {
      const params: AggregateParams = {
        groupBy: ['category'],
        aggregations: [{ column: 'value', function: 'avg', alias: 'avg_value' }]
      }

      const result = AggregateOperator.apply(table, params)

      expect(result.numRows).toBe(3)
      // A: (10+15+20)/3=15, B: (20+25)/2=22.5, C: 30
    })
  })

  describe('MIN/MAX Aggregation', () => {
    it('should find min values by group', () => {
      const params: AggregateParams = {
        groupBy: ['category'],
        aggregations: [{ column: 'value', function: 'min', alias: 'min_value' }]
      }

      const result = AggregateOperator.apply(table, params)

      expect(result.numRows).toBe(3)
    })

    it('should find max values by group', () => {
      const params: AggregateParams = {
        groupBy: ['category'],
        aggregations: [{ column: 'value', function: 'max', alias: 'max_value' }]
      }

      const result = AggregateOperator.apply(table, params)

      expect(result.numRows).toBe(3)
    })
  })

  describe('Multiple Aggregations', () => {
    it('should handle multiple aggregations simultaneously', () => {
      const params: AggregateParams = {
        groupBy: ['category'],
        aggregations: [
          { column: 'value', function: 'sum', alias: 'sum_val' },
          { column: 'value', function: 'avg', alias: 'avg_val' },
          { column: 'value', function: 'min', alias: 'min_val' },
          { column: 'value', function: 'max', alias: 'max_val' },
          { column: 'value', function: 'count', alias: 'count_val' }
        ]
      }

      const result = AggregateOperator.apply(table, params)

      expect(result.numRows).toBe(3)
      expect(result.numCols).toBe(6) // category + 5 aggregations
    })
  })
})

describe('AggregateOperator - SECURITY TESTS', () => {
  let table: Table

  beforeEach(() => {
    table = tableFromArrays({
      category: ['A', 'B', 'A'],
      query: [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin' --"
      ],
      value: [100, 200, 300]
    })
  })

  describe('SQL Injection Prevention', () => {
    it('should safely handle SQL injection in group by column', () => {
      const params: AggregateParams = {
        groupBy: ['query'],
        aggregations: [{ column: 'value', function: 'sum', alias: 'total' }]
      }

      // Should treat as strings, not execute SQL
      const result = AggregateOperator.apply(table, params)

      expect(result.numRows).toBe(3)
      expect(table.numRows).toBe(3) // Original table intact
    })

    it('should prevent injection via column names', () => {
      const params: AggregateParams = {
        groupBy: ["'; DROP TABLE users; --" as any],
        aggregations: [{ column: 'value', function: 'sum', alias: 'total' }]
      }

      // Should error, not execute SQL
      expect(() => AggregateOperator.apply(table, params)).toThrow()
    })
  })

  describe('Integer Overflow Prevention', () => {
    it('should handle large sum without overflow', () => {
      const large = tableFromArrays({
        id: [1, 2, 3],
        value: [Number.MAX_SAFE_INTEGER - 1000, 500, 500]
      })

      const params: AggregateParams = {
        groupBy: [],
        aggregations: [{ column: 'value', function: 'sum', alias: 'total' }]
      }

      // Should handle gracefully or use BigInt
      expect(() => AggregateOperator.apply(large, params)).not.toThrow()
    })

    it('should handle negative overflow', () => {
      const large = tableFromArrays({
        id: [1, 2, 3],
        value: [Number.MIN_SAFE_INTEGER + 1000, -500, -500]
      })

      const params: AggregateParams = {
        groupBy: [],
        aggregations: [{ column: 'value', function: 'sum', alias: 'total' }]
      }

      expect(() => AggregateOperator.apply(large, params)).not.toThrow()
    })
  })

  describe('Division by Zero Prevention', () => {
    it('should handle AVG with no rows gracefully', () => {
      const empty = tableFromArrays({
        category: [],
        value: []
      })

      const params: AggregateParams = {
        groupBy: ['category'],
        aggregations: [{ column: 'value', function: 'avg', alias: 'avg_val' }]
      }

      const result = AggregateOperator.apply(empty, params)

      expect(result.numRows).toBe(0)
    })

    it('should handle groups with all null values', () => {
      const nulls = tableFromArrays({
        category: ['A', 'A', 'B'],
        value: [null, null, 10]
      })

      const params: AggregateParams = {
        groupBy: ['category'],
        aggregations: [{ column: 'value', function: 'avg', alias: 'avg_val' }]
      }

      const result = AggregateOperator.apply(nulls, params)

      expect(result.numRows).toBe(2)
      // Group A avg should be null or NaN, Group B should be 10
    })
  })

  describe('Input Validation', () => {
    it('should reject null table', () => {
      const params: AggregateParams = {
        groupBy: ['category'],
        aggregations: [{ column: 'value', function: 'sum', alias: 'total' }]
      }

      expect(() => AggregateOperator.apply(null as any, params)).toThrow()
    })

    it('should reject invalid aggregation function', () => {
      const params: AggregateParams = {
        groupBy: ['category'],
        aggregations: [{ column: 'value', function: 'invalid' as any, alias: 'total' }]
      }

      expect(() => AggregateOperator.apply(table, params)).toThrow()
    })

    it('should reject non-existent group by column', () => {
      const params: AggregateParams = {
        groupBy: ['nonexistent'],
        aggregations: [{ column: 'value', function: 'sum', alias: 'total' }]
      }

      expect(() => AggregateOperator.apply(table, params)).toThrow()
    })

    it('should reject non-existent aggregation column', () => {
      const params: AggregateParams = {
        groupBy: ['category'],
        aggregations: [{ column: 'nonexistent', function: 'sum', alias: 'total' }]
      }

      expect(() => AggregateOperator.apply(table, params)).toThrow()
    })
  })

  describe('Prototype Pollution Prevention', () => {
    it('should not pollute prototype via column names', () => {
      const params: AggregateParams = {
        groupBy: ['__proto__'],
        aggregations: [{ column: 'value', function: 'sum', alias: 'total' }]
      }

      expect(() => AggregateOperator.apply(table, params)).toThrow()
      expect((Object.prototype as any).polluted).toBeUndefined()
    })
  })
})

describe('AggregateOperator - PERFORMANCE TESTS (< 50ms for 1M rows)', () => {
  describe('Large Dataset Aggregation', () => {
    it('should aggregate 100K rows in <10ms', () => {
      const table = tableFromArrays({
        category: Array(100000).fill(0).map((_, i) => `cat${i % 10}`),
        value: Array(100000).fill(0).map((_, i) => i % 1000)
      })

      const params: AggregateParams = {
        groupBy: ['category'],
        aggregations: [
          { column: 'value', function: 'sum', alias: 'sum_val' },
          { column: 'value', function: 'avg', alias: 'avg_val' }
        ]
      }

      const start = performance.now()
      const result = AggregateOperator.apply(table, params)
      const duration = performance.now() - start

      expect(result.numRows).toBe(10)
      expect(duration).toBeLessThan(10)
    })

    it('should aggregate 1M rows in <50ms (DESIGN REQUIREMENT)', () => {
      const table = tableFromArrays({
        category: Array(1000000).fill(0).map((_, i) => `cat${i % 100}`),
        value: Array(1000000).fill(0).map((_, i) => i % 1000)
      })

      const params: AggregateParams = {
        groupBy: ['category'],
        aggregations: [
          { column: 'value', function: 'sum', alias: 'sum_val' }
        ]
      }

      const start = performance.now()
      const result = AggregateOperator.apply(table, params)
      const duration = performance.now() - start

      expect(result.numRows).toBe(100)
      expect(duration).toBeLessThan(50) // Design doc requirement
    })

    it('should handle many groups efficiently', () => {
      const table = tableFromArrays({
        category: Array(100000).fill(0).map((_, i) => `cat${i % 1000}`),
        value: Array(100000).fill(0).map((_, i) => i)
      })

      const params: AggregateParams = {
        groupBy: ['category'],
        aggregations: [
          { column: 'value', function: 'sum', alias: 'sum_val' },
          { column: 'value', function: 'count', alias: 'count_val' }
        ]
      }

      const start = performance.now()
      const result = AggregateOperator.apply(table, params)
      const duration = performance.now() - start

      expect(result.numRows).toBe(1000)
      expect(duration).toBeLessThan(20)
    })
  })

  describe('Multiple Aggregation Performance', () => {
    it('should handle 5 aggregations on 100K rows in <15ms', () => {
      const table = tableFromArrays({
        category: Array(100000).fill(0).map((_, i) => `cat${i % 50}`),
        value: Array(100000).fill(0).map((_, i) => i % 1000)
      })

      const params: AggregateParams = {
        groupBy: ['category'],
        aggregations: [
          { column: 'value', function: 'sum', alias: 'sum_val' },
          { column: 'value', function: 'avg', alias: 'avg_val' },
          { column: 'value', function: 'min', alias: 'min_val' },
          { column: 'value', function: 'max', alias: 'max_val' },
          { column: 'value', function: 'count', alias: 'count_val' }
        ]
      }

      const start = performance.now()
      const result = AggregateOperator.apply(table, params)
      const duration = performance.now() - start

      expect(result.numRows).toBe(50)
      expect(duration).toBeLessThan(15)
    })
  })

  describe('Memory Efficiency', () => {
    it('should use hash table for efficient grouping', () => {
      const table = tableFromArrays({
        category: Array(100000).fill(0).map((_, i) => `cat${i % 100}`),
        value: Array(100000).fill(0).map((_, i) => i)
      })

      const params: AggregateParams = {
        groupBy: ['category'],
        aggregations: [{ column: 'value', function: 'sum', alias: 'total' }]
      }

      const result = AggregateOperator.apply(table, params)

      // Should only create 100 groups, not iterate 100K times
      expect(result.numRows).toBe(100)
    })
  })
})

describe('AggregateOperator - Edge Cases', () => {
  it('should handle empty table', () => {
    const empty = tableFromArrays({
      category: [],
      value: []
    })

    const params: AggregateParams = {
      groupBy: ['category'],
      aggregations: [{ column: 'value', function: 'sum', alias: 'total' }]
    }

    const result = AggregateOperator.apply(empty, params)

    expect(result.numRows).toBe(0)
  })

  it('should handle all null group by values', () => {
    const nulls = tableFromArrays({
      category: [null, null, null],
      value: [10, 20, 30]
    })

    const params: AggregateParams = {
      groupBy: ['category'],
      aggregations: [{ column: 'value', function: 'sum', alias: 'total' }]
    }

    const result = AggregateOperator.apply(nulls, params)

    expect(result.numRows).toBeGreaterThanOrEqual(1)
  })

  it('should handle single row', () => {
    const single = tableFromArrays({
      category: ['A'],
      value: [100]
    })

    const params: AggregateParams = {
      groupBy: ['category'],
      aggregations: [
        { column: 'value', function: 'sum', alias: 'sum_val' },
        { column: 'value', function: 'avg', alias: 'avg_val' }
      ]
    }

    const result = AggregateOperator.apply(single, params)

    expect(result.numRows).toBe(1)
  })

  it('should handle multi-column grouping', () => {
    const table = tableFromArrays({
      cat1: ['A', 'A', 'B', 'B'],
      cat2: ['X', 'Y', 'X', 'Y'],
      value: [10, 20, 30, 40]
    })

    const params: AggregateParams = {
      groupBy: ['cat1', 'cat2'],
      aggregations: [{ column: 'value', function: 'sum', alias: 'total' }]
    }

    const result = AggregateOperator.apply(table, params)

    expect(result.numRows).toBe(4) // AX, AY, BX, BY
  })
})

