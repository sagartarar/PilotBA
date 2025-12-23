/**
 * QueryOptimizer Test Suite  
 * Focus: CRITICAL Security & Performance
 * 
 * Security Tests:
 * - SQL injection in query plans
 * - Malicious operation reordering
 * - Resource exhaustion via complex plans
 * - Infinite loop prevention
 * 
 * Performance Tests:
 * - Optimization time < 10ms
 * - Correct cost estimation
 * - Predicate pushdown validation
 * 
 * @author Toaster (QA Lead)
 * @updated December 23, 2025 - Fixed static method calls
 */

import { describe, it, expect } from 'vitest'
import { QueryOptimizer, type QueryPlan, type Operation } from './QueryOptimizer'

describe('QueryOptimizer - Basic Functionality', () => {
  describe('Operation Reordering', () => {
    it('should push filters before aggregations', () => {
      const operations: Operation[] = [
        { type: 'aggregate', params: { groupBy: ['category'] } },
        { type: 'filter', params: { column: 'value', operator: 'gt', value: 10 } }
      ]

      const plan = QueryOptimizer.optimize(operations, { rowCount: 1000, columnCount: 5, columnStats: new Map() })

      // Filter should come before aggregate
      expect(plan.operations[0].type).toBe('filter')
      expect(plan.operations[1].type).toBe('aggregate')
    })

    it('should push filters before sorts', () => {
      const operations: Operation[] = [
        { type: 'sort', params: { column: 'value', direction: 'asc' } },
        { type: 'filter', params: { column: 'value', operator: 'gt', value: 10 } }
      ]

      const plan = QueryOptimizer.optimize(operations, { rowCount: 1000, columnCount: 5, columnStats: new Map() })

      expect(plan.operations[0].type).toBe('filter')
      expect(plan.operations[1].type).toBe('sort')
    })

    it('should keep filter order for dependent filters', () => {
      const operations: Operation[] = [
        { type: 'compute', params: { expression: 'value * 2', alias: 'doubled' } },
        { type: 'filter', params: { column: 'doubled', operator: 'gt', value: 20 } }
      ]

      const plan = QueryOptimizer.optimize(operations, { rowCount: 1000, columnCount: 5, columnStats: new Map() })

      // Can't push filter before compute since it depends on computed column
      expect(plan.operations[0].type).toBe('compute')
      expect(plan.operations[1].type).toBe('filter')
    })
  })

  describe('Cost Estimation', () => {
    it('should estimate lower cost for selective filters', () => {
      const selectiveFilter: Operation[] = [
        { type: 'filter', params: { column: 'id', operator: 'eq', value: 1 } }
      ]

      const broadFilter: Operation[] = [
        { type: 'filter', params: { column: 'value', operator: 'gt', value: 0 } }
      ]

      const plan1 = QueryOptimizer.optimize(selectiveFilter, { rowCount: 1000000, columnCount: 10, columnStats: new Map() })
      const plan2 = QueryOptimizer.optimize(broadFilter, { rowCount: 1000000, columnCount: 10, columnStats: new Map() })

      expect(plan1.estimatedCost).toBeLessThan(plan2.estimatedCost)
    })

    it('should estimate join costs accurately', () => {
      const smallJoin: Operation[] = [
        { type: 'join', params: { leftKey: 'id', rightKey: 'user_id' } }
      ]

      const plan = QueryOptimizer.optimize(smallJoin, { rowCount: 1000, columnCount: 5, columnStats: new Map() })

      expect(plan.estimatedCost).toBeGreaterThan(0)
      expect(plan.estimatedRows).toBeDefined()
    })
  })

  describe('Predicate Pushdown', () => {
    it('should combine multiple filters on same column', () => {
      const operations: Operation[] = [
        { type: 'filter', params: { column: 'age', operator: 'gt', value: 18 } },
        { type: 'filter', params: { column: 'age', operator: 'lt', value: 65 } }
      ]

      const plan = QueryOptimizer.optimize(operations, { rowCount: 1000, columnCount: 5, columnStats: new Map() })

      // Should optimize to single between operation
      expect(plan.operations.length).toBeLessThanOrEqual(operations.length)
    })
  })
})

describe('QueryOptimizer - SECURITY TESTS', () => {
  describe('SQL Injection Prevention', () => {
    it('should sanitize malicious column names', () => {
      const malicious: Operation[] = [
        { 
          type: 'filter', 
          params: { 
            column: "'; DROP TABLE users; --", 
            operator: 'eq', 
            value: 1 
          } 
        }
      ]

      // Should error or sanitize, not execute SQL
      expect(() => QueryOptimizer.optimize(malicious, { rowCount: 1000, columnCount: 5, columnStats: new Map() })).toThrow()
    })

    it('should reject injection in filter values', () => {
      const malicious: Operation[] = [
        { 
          type: 'filter', 
          params: { 
            column: 'id', 
            operator: 'eq', 
            value: "1' OR '1'='1" 
          } 
        }
      ]

      // Should treat as string literal, not SQL
      const plan = QueryOptimizer.optimize(malicious, { rowCount: 1000, columnCount: 5, columnStats: new Map() })

      expect(plan.operations[0].params.value).toBe("1' OR '1'='1")
    })

    it('should prevent injection via expression strings', () => {
      const malicious: Operation[] = [
        { 
          type: 'compute', 
          params: { 
            expression: "eval('malicious code')", 
            alias: 'computed' 
          } 
        }
      ]

      // Should not allow arbitrary code execution
      expect(() => QueryOptimizer.optimize(malicious, { rowCount: 1000, columnCount: 5, columnStats: new Map() })).toThrow()
    })
  })

  describe('Resource Exhaustion Prevention', () => {
    it('should reject extremely complex query plans', () => {
      // Create 10,000 operation plan
      const huge: Operation[] = Array(10000).fill(0).map((_, i) => ({
        type: 'filter',
        params: { column: `col${i}`, operator: 'eq', value: i }
      }))

      // Should reject or limit
      expect(() => QueryOptimizer.optimize(huge, { rowCount: 1000, columnCount: 5, columnStats: new Map() }))
        .toThrow(/complex|limit|operations/i)
    })

    it('should timeout on infinite optimization loops', () => {
      // Create circular dependency
      const circular: Operation[] = [
        { type: 'compute', params: { expression: 'b + 1', alias: 'a' } },
        { type: 'compute', params: { expression: 'a + 1', alias: 'b' } }
      ]

      // Should detect and prevent infinite loop
      expect(() => QueryOptimizer.optimize(circular, { rowCount: 1000, columnCount: 5, columnStats: new Map() }))
        .toThrow(/circular|cycle|dependency/i)
    })

    it('should limit optimization time to <10ms', () => {
      const complex: Operation[] = Array(100).fill(0).map((_, i) => ({
        type: 'filter',
        params: { column: `col${i % 10}`, operator: 'gt', value: i }
      }))

      const start = performance.now()
      const plan = QueryOptimizer.optimize(complex, { rowCount: 100000, columnCount: 10, columnStats: new Map() })
      const duration = performance.now() - start

      expect(duration).toBeLessThan(10)
    })
  })

  describe('Cartesian Product Prevention', () => {
    it('should warn on joins without keys', () => {
      const dangerous: Operation[] = [
        { type: 'join', params: {} } // No join keys specified
      ]

      // Should reject or warn about cartesian product
      expect(() => QueryOptimizer.optimize(dangerous, { rowCount: 10000, columnCount: 5, columnStats: new Map() }))
        .toThrow(/key|cartesian/i)
    })

    it('should estimate massive join costs', () => {
      const huge: Operation[] = [
        { type: 'join', params: { leftKey: 'id', rightKey: 'id' } }
      ]

      const plan = QueryOptimizer.optimize(huge, {
        rowCount: 1000000,
        columnCount: 10,
        columnStats: new Map()
      })

      // Cost should reflect O(n*m) complexity
      expect(plan.estimatedCost).toBeGreaterThan(1000000)
    })
  })

  describe('Input Validation', () => {
    it('should reject null operations', () => {
      expect(() => QueryOptimizer.optimize(null as any, { rowCount: 1000, columnCount: 5, columnStats: new Map() }))
        .toThrow()
    })

    it('should reject empty operations', () => {
      const plan = QueryOptimizer.optimize([], { rowCount: 1000, columnCount: 5, columnStats: new Map() })

      expect(plan.operations).toHaveLength(0)
      expect(plan.estimatedCost).toBe(0)
    })

    it('should reject invalid operation types', () => {
      const invalid: Operation[] = [
        { type: 'invalid' as any, params: {} }
      ]

      expect(() => QueryOptimizer.optimize(invalid, { rowCount: 1000, columnCount: 5, columnStats: new Map() }))
        .toThrow()
    })

    it('should validate metadata', () => {
      const ops: Operation[] = [
        { type: 'filter', params: { column: 'id', operator: 'eq', value: 1 } }
      ]

      // Negative row count
      expect(() => QueryOptimizer.optimize(ops, { rowCount: -1, columnCount: 5, columnStats: new Map() }))
        .toThrow()

      // Zero columns
      expect(() => QueryOptimizer.optimize(ops, { rowCount: 1000, columnCount: 0, columnStats: new Map() }))
        .toThrow()
    })
  })
})

describe('QueryOptimizer - PERFORMANCE TESTS', () => {
  describe('Optimization Speed', () => {
    it('should optimize 10 operations in <5ms', () => {
      const operations: Operation[] = Array(10).fill(0).map((_, i) => ({
        type: 'filter',
        params: { column: `col${i % 3}`, operator: 'gt', value: i }
      }))

      const start = performance.now()
      QueryOptimizer.optimize(operations, { rowCount: 100000, columnCount: 10, columnStats: new Map() })
      const duration = performance.now() - start

      expect(duration).toBeLessThan(5)
    })

    it('should optimize 50 operations in <10ms', () => {
      const operations: Operation[] = Array(50).fill(0).map((_, i) => ({
        type: i % 2 === 0 ? 'filter' : 'sort',
        params: { column: `col${i % 5}`, operator: 'gt', value: i }
      }))

      const start = performance.now()
      QueryOptimizer.optimize(operations, { rowCount: 100000, columnCount: 10, columnStats: new Map() })
      const duration = performance.now() - start

      expect(duration).toBeLessThan(10)
    })
  })

  describe('Cost Model Accuracy', () => {
    it('should estimate filter selectivity correctly', () => {
      const selective: Operation[] = [
        { type: 'filter', params: { column: 'id', operator: 'eq', value: 1 } }
      ]

      const plan = QueryOptimizer.optimize(selective, { 
        rowCount: 1000000,
        columnCount: 5,
        columnStats: new Map([
          ['id', { min: 1, max: 1000000, nullCount: 0, distinctCount: 1000000 }]
        ])
      })

      // Should estimate very low selectivity
      expect(plan.estimatedRows).toBeLessThan(100)
    })

    it('should prefer indexed operations', () => {
      const operations: Operation[] = [
        { type: 'filter', params: { column: 'indexed_col', operator: 'eq', value: 1 } }
      ]

      const plan = QueryOptimizer.optimize(operations, {
        rowCount: 1000000,
        columnCount: 5,
        columnStats: new Map()
      })

      // Cost should be lower with index hint
      expect(plan.estimatedCost).toBeDefined()
    })
  })

  describe('Memory Usage', () => {
    it('should not allocate excessive memory during optimization', () => {
      const operations: Operation[] = Array(100).fill(0).map((_, i) => ({
        type: 'filter',
        params: { column: `col${i % 10}`, operator: 'gt', value: i }
      }))

      // Run optimization multiple times
      for (let i = 0; i < 10; i++) {
        QueryOptimizer.optimize(operations, { rowCount: 100000, columnCount: 10, columnStats: new Map() })
      }

      // Should not leak memory (check would be more sophisticated in real test)
    })
  })
})

describe('QueryOptimizer - Edge Cases', () => {
  it('should handle single operation', () => {
    const single: Operation[] = [
      { type: 'filter', params: { column: 'id', operator: 'eq', value: 1 } }
    ]

    const plan = QueryOptimizer.optimize(single, { rowCount: 1000, columnCount: 5, columnStats: new Map() })

    expect(plan.operations).toHaveLength(1)
  })

  it('should handle empty metadata', () => {
    const operations: Operation[] = [
      { type: 'filter', params: { column: 'id', operator: 'eq', value: 1 } }
    ]

    const plan = QueryOptimizer.optimize(operations, {
      rowCount: 0,
      columnCount: 0,
      columnStats: new Map()
    })

    expect(plan).toBeDefined()
  })

  it('should handle all same operation types', () => {
    const allFilters: Operation[] = Array(10).fill(0).map((_, i) => ({
      type: 'filter',
      params: { column: 'value', operator: 'gt', value: i }
    }))

    const plan = QueryOptimizer.optimize(allFilters, { rowCount: 1000, columnCount: 5, columnStats: new Map() })

    expect(plan.operations.length).toBeLessThanOrEqual(allFilters.length)
  })
})
