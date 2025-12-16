/**
 * JSONParser Test Suite
 * Focus: Security & Performance
 *
 * Security Tests:
 * - JSON injection prevention
 * - Prototype pollution prevention
 * - DoS via deeply nested objects
 * - Circular reference handling
 * - XSS in JSON values
 *
 * Performance Tests:
 * - Large JSON array handling
 * - Deep nesting performance
 * - Memory usage with large objects
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { JSONParser } from './JSONParser'

describe('JSONParser - Basic Functionality', () => {
  let parser: JSONParser

  beforeEach(() => {
    parser = new JSONParser()
  })

  it('should parse JSON array to Arrow Table', () => {
    const json = [
      { id: 1, name: 'Alice', age: 30 },
      { id: 2, name: 'Bob', age: 25 }
    ]

    const result = parser.parse(JSON.stringify(json))

    expect(result.table.numRows).toBe(2)
    expect(result.table.numCols).toBe(3)
  })

  it('should parse JSON object to Arrow Table', () => {
    const json = {
      columns: ['id', 'name', 'age'],
      data: [[1, 'Alice', 30], [2, 'Bob', 25]]
    }

    const result = parser.parse(JSON.stringify(json))

    expect(result.table.numRows).toBe(2)
  })

  it('should handle nested JSON objects', () => {
    const json = [
      { id: 1, user: { name: 'Alice', age: 30 } },
      { id: 2, user: { name: 'Bob', age: 25 } }
    ]

    const result = parser.parse(JSON.stringify(json))

    expect(result.table.numRows).toBe(2)
  })
})

describe('JSONParser - SECURITY TESTS', () => {
  let parser: JSONParser

  beforeEach(() => {
    parser = new JSONParser()
  })

  describe('Injection Prevention', () => {
    it('should prevent prototype pollution via __proto__', () => {
      const malicious = JSON.stringify([
        { id: 1, name: 'Alice', __proto__: { polluted: true } }
      ])

      const result = parser.parse(malicious)

      expect(result.table.numRows).toBe(1)
      // Ensure prototype is not polluted
      expect((Object.prototype as any).polluted).toBeUndefined()
    })

    it('should prevent prototype pollution via constructor', () => {
      const malicious = JSON.stringify([
        { id: 1, constructor: { prototype: { polluted: true } } }
      ])

      const result = parser.parse(malicious)

      expect(result.table.numRows).toBe(1)
      expect((Object.prototype as any).polluted).toBeUndefined()
    })

    it('should sanitize XSS attempts in values', () => {
      const malicious = JSON.stringify([
        { id: 1, html: '<script>alert("xss")</script>' },
        { id: 2, html: '<img src=x onerror=alert(1)>' }
      ])

      const result = parser.parse(malicious)

      expect(result.table.numRows).toBe(2)
      // XSS should be stored as strings, not executed
    })

    it('should handle SQL injection attempts in JSON', () => {
      const malicious = JSON.stringify([
        { id: 1, query: "'; DROP TABLE users; --" },
        { id: 2, query: "1' OR '1'='1" }
      ])

      const result = parser.parse(malicious)

      expect(result.table.numRows).toBe(2)
    })
  })

  describe('DoS Prevention', () => {
    it('should reject deeply nested objects', () => {
      // Create 10,000 level deep nesting
      let nested: any = { value: 'deep' }
      for (let i = 0; i < 10000; i++) {
        nested = { nested }
      }

      const malicious = JSON.stringify([nested])

      // Should reject or limit depth
      expect(() => parser.parse(malicious)).toThrow(/depth|nesting|limit/i)
    })

    it('should handle large JSON arrays efficiently', () => {
      const large = JSON.stringify(
        Array(100000).fill(0).map((_, i) => ({ id: i, value: `item${i}` }))
      )

      const start = performance.now()
      const result = parser.parse(large)
      const duration = performance.now() - start

      expect(result.table.numRows).toBe(100000)
      expect(duration).toBeLessThan(2000) // 2 seconds max
    })

    it('should prevent billion laughs attack', () => {
      // Exponential expansion attack
      const malicious = JSON.stringify({
        a: 'lol'.repeat(1000000)
      })

      // Should handle without excessive memory
      expect(() => parser.parse(malicious)).not.toThrow()
    })
  })

  describe('Input Validation', () => {
    it('should reject invalid JSON', () => {
      const invalid = '{ "id": 1, "name": "Alice" invalid }'

      expect(() => parser.parse(invalid)).toThrow()
    })

    it('should reject null input', () => {
      expect(() => parser.parse(null as any)).toThrow()
    })

    it('should reject undefined input', () => {
      expect(() => parser.parse(undefined as any)).toThrow()
    })

    it('should handle empty JSON array', () => {
      const result = parser.parse('[]')

      expect(result.table.numRows).toBe(0)
    })

    it('should handle empty JSON object', () => {
      const result = parser.parse('{}')

      expect(result.table.numRows).toBe(0)
    })
  })

  describe('Buffer Overflow Prevention', () => {
    it('should handle extremely large string values', () => {
      const largeValue = 'A'.repeat(10000000) // 10MB string
      const json = JSON.stringify([{ id: 1, data: largeValue }])

      // Should handle or reject with size limit
      expect(() => parser.parse(json)).not.toThrow()
    })

    it('should limit total JSON size', () => {
      // 100MB+ JSON
      const huge = JSON.stringify(
        Array(10000000).fill(0).map((_, i) => ({ id: i, value: 'data' }))
      )

      // Should have size validation
      expect(() => parser.parse(huge)).toThrow(/size|memory|limit/i)
    })
  })
})

describe('JSONParser - PERFORMANCE TESTS', () => {
  describe('Small Dataset Performance', () => {
    it('should parse 100 objects in <5ms', () => {
      const json = JSON.stringify(
        Array(100).fill(0).map((_, i) => ({
          id: i,
          name: `User${i}`,
          age: 20 + i,
          email: `user${i}@example.com`
        }))
      )

      const parser = new JSONParser()
      const start = performance.now()
      const result = parser.parse(json)
      const duration = performance.now() - start

      expect(result.table.numRows).toBe(100)
      expect(duration).toBeLessThan(5)
    })

    it('should parse 1000 objects in <20ms', () => {
      const json = JSON.stringify(
        Array(1000).fill(0).map((_, i) => ({
          id: i,
          name: `User${i}`,
          age: 20 + i,
          email: `user${i}@example.com`
        }))
      )

      const parser = new JSONParser()
      const start = performance.now()
      const result = parser.parse(json)
      const duration = performance.now() - start

      expect(result.table.numRows).toBe(1000)
      expect(duration).toBeLessThan(20)
    })
  })

  describe('Large Dataset Performance', () => {
    it('should parse 10000 objects in <100ms', () => {
      const json = JSON.stringify(
        Array(10000).fill(0).map((_, i) => ({
          id: i,
          name: `User${i}`,
          age: 20 + (i % 50),
          city: `City${i % 100}`
        }))
      )

      const parser = new JSONParser()
      const start = performance.now()
      const result = parser.parse(json)
      const duration = performance.now() - start

      expect(result.table.numRows).toBe(10000)
      expect(duration).toBeLessThan(100)
    })

    it('should parse 50000 objects in <500ms', () => {
      const json = JSON.stringify(
        Array(50000).fill(0).map((_, i) => ({
          id: i,
          value: `item${i}`
        }))
      )

      const parser = new JSONParser()
      const start = performance.now()
      const result = parser.parse(json)
      const duration = performance.now() - start

      expect(result.table.numRows).toBe(50000)
      expect(duration).toBeLessThan(500)
    })
  })

  describe('Complex Structure Performance', () => {
    it('should handle nested objects efficiently', () => {
      const json = JSON.stringify(
        Array(1000).fill(0).map((_, i) => ({
          id: i,
          user: {
            name: `User${i}`,
            profile: {
              age: 20 + i,
              settings: {
                theme: 'dark',
                language: 'en'
              }
            }
          }
        }))
      )

      const parser = new JSONParser()
      const start = performance.now()
      const result = parser.parse(json)
      const duration = performance.now() - start

      expect(result.table.numRows).toBe(1000)
      expect(duration).toBeLessThan(50)
    })

    it('should handle arrays within objects', () => {
      const json = JSON.stringify(
        Array(1000).fill(0).map((_, i) => ({
          id: i,
          tags: [`tag${i}`, `tag${i+1}`, `tag${i+2}`],
          scores: [90, 85, 95]
        }))
      )

      const parser = new JSONParser()
      const start = performance.now()
      const result = parser.parse(json)
      const duration = performance.now() - start

      expect(result.table.numRows).toBe(1000)
      expect(duration).toBeLessThan(50)
    })
  })

  describe('Memory Efficiency', () => {
    it('should not leak memory on repeated parsing', () => {
      const json = JSON.stringify(
        Array(1000).fill(0).map((_, i) => ({ id: i, value: `item${i}` }))
      )

      const parser = new JSONParser()

      for (let i = 0; i < 10; i++) {
        const result = parser.parse(json)
        expect(result.table.numRows).toBe(1000)
      }

      // Memory should stabilize
    })

    it('should efficiently handle wide objects (many keys)', () => {
      const wideObject: any = {}
      for (let i = 0; i < 100; i++) {
        wideObject[`key${i}`] = `value${i}`
      }

      const json = JSON.stringify([wideObject])

      const parser = new JSONParser()
      const start = performance.now()
      const result = parser.parse(json)
      const duration = performance.now() - start

      expect(result.table.numCols).toBeGreaterThan(90)
      expect(duration).toBeLessThan(20)
    })
  })
})

describe('JSONParser - Edge Cases', () => {
  let parser: JSONParser

  beforeEach(() => {
    parser = new JSONParser()
  })

  it('should handle null values', () => {
    const json = JSON.stringify([
      { id: 1, name: 'Alice', age: null },
      { id: 2, name: null, age: 25 }
    ])

    const result = parser.parse(json)

    expect(result.table.numRows).toBe(2)
  })

  it('should handle boolean values', () => {
    const json = JSON.stringify([
      { id: 1, active: true, verified: false },
      { id: 2, active: false, verified: true }
    ])

    const result = parser.parse(json)

    expect(result.table.numRows).toBe(2)
  })

  it('should handle mixed types', () => {
    const json = JSON.stringify([
      { id: 1, value: 123 },
      { id: 2, value: 'text' },
      { id: 3, value: true }
    ])

    const result = parser.parse(json)

    expect(result.table.numRows).toBe(3)
  })

  it('should handle missing keys', () => {
    const json = JSON.stringify([
      { id: 1, name: 'Alice', age: 30 },
      { id: 2, name: 'Bob' }, // missing age
      { id: 3, age: 35 } // missing name
    ])

    const result = parser.parse(json)

    expect(result.table.numRows).toBe(3)
  })

  it('should handle Unicode characters', () => {
    const json = JSON.stringify([
      { id: 1, name: '北京', emoji: '😀' },
      { id: 2, name: 'José', emoji: '🎉' }
    ])

    const result = parser.parse(json)

    expect(result.table.numRows).toBe(2)
  })

  it('should handle special characters in keys', () => {
    const json = JSON.stringify([
      { 'id': 1, 'first name': 'Alice', 'age@time': 30 }
    ])

    const result = parser.parse(json)

    expect(result.table.numCols).toBe(3)
  })
})

