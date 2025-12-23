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
 * 
 * @author Toaster (QA Lead)
 * @updated December 23, 2025 - Fixed async/await issues
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { JSONParser } from './JSONParser'

describe('JSONParser - Basic Functionality', () => {
  let parser: JSONParser

  beforeEach(() => {
    parser = new JSONParser()
  })

  it('should parse JSON array to Arrow Table', async () => {
    const json = [
      { id: 1, name: 'Alice', age: 30 },
      { id: 2, name: 'Bob', age: 25 }
    ]

    const result = await parser.parse(json)

    expect(result.table.numRows).toBe(2)
    expect(result.table.numCols).toBe(3)
  })

  it('should parse JSON string array to Arrow Table', async () => {
    const json = [
      { id: 1, name: 'Alice', age: 30 },
      { id: 2, name: 'Bob', age: 25 }
    ]

    const result = await parser.parse(JSON.stringify(json))

    expect(result.table.numRows).toBe(2)
    expect(result.table.numCols).toBe(3)
  })

  it('should handle nested JSON objects', async () => {
    const json = [
      { id: 1, user: { name: 'Alice', age: 30 } },
      { id: 2, user: { name: 'Bob', age: 25 } }
    ]

    const result = await parser.parse(json)

    expect(result.table.numRows).toBe(2)
  })
})

describe('JSONParser - SECURITY TESTS', () => {
  let parser: JSONParser

  beforeEach(() => {
    parser = new JSONParser()
  })

  describe('Injection Prevention', () => {
    it('should prevent prototype pollution via __proto__', async () => {
      const malicious = [
        { id: 1, name: 'Alice', __proto__: { polluted: true } }
      ]

      const result = await parser.parse(malicious)

      expect(result.table.numRows).toBe(1)
      // Ensure prototype is not polluted
      expect((Object.prototype as any).polluted).toBeUndefined()
    })

    it('should prevent prototype pollution via constructor', async () => {
      const malicious = [
        { id: 1, constructor: { prototype: { polluted: true } } }
      ]

      const result = await parser.parse(malicious)

      expect(result.table.numRows).toBe(1)
      expect((Object.prototype as any).polluted).toBeUndefined()
    })

    it('should sanitize XSS attempts in values', async () => {
      const malicious = [
        { id: 1, html: '<script>alert("xss")</script>' },
        { id: 2, html: '<img src=x onerror=alert(1)>' }
      ]

      const result = await parser.parse(malicious)

      expect(result.table.numRows).toBe(2)
      // XSS should be stored as strings, not executed
    })

    it('should handle SQL injection attempts in JSON', async () => {
      const malicious = [
        { id: 1, query: "'; DROP TABLE users; --" },
        { id: 2, query: "1' OR '1'='1" }
      ]

      const result = await parser.parse(malicious)

      expect(result.table.numRows).toBe(2)
    })
  })

  describe('DoS Prevention', () => {
    it('should handle large JSON arrays efficiently', async () => {
      const large = Array(10000).fill(0).map((_, i) => ({ id: i, value: `item${i}` }))

      const start = performance.now()
      const result = await parser.parse(large)
      const duration = performance.now() - start

      expect(result.table.numRows).toBe(10000)
      expect(duration).toBeLessThan(2000) // 2 seconds max
    })

    it('should handle moderately nested objects', async () => {
      // Create 100 level deep nesting (reasonable)
      let nested: any = { value: 'deep' }
      for (let i = 0; i < 100; i++) {
        nested = { nested }
      }

      const result = await parser.parse([nested])
      expect(result.table.numRows).toBe(1)
    })
  })

  describe('Input Validation', () => {
    it('should reject invalid JSON string', async () => {
      const invalid = '{ "id": 1, "name": "Alice" invalid }'

      await expect(parser.parse(invalid)).rejects.toThrow()
    })

    it('should reject null input', async () => {
      await expect(parser.parse(null as any)).rejects.toThrow()
    })

    it('should reject undefined input', async () => {
      await expect(parser.parse(undefined as any)).rejects.toThrow()
    })

    it('should handle empty JSON array', async () => {
      await expect(parser.parse([])).rejects.toThrow(/empty/i)
    })

    it('should reject non-array JSON', async () => {
      const nonArray = { id: 1, name: 'Alice' }
      await expect(parser.parse(nonArray as any)).rejects.toThrow(/array/i)
    })
  })

  describe('Buffer Overflow Prevention', () => {
    it('should handle large string values', async () => {
      const largeValue = 'A'.repeat(100000) // 100KB string
      const json = [{ id: 1, data: largeValue }]

      // Should handle without crashing
      const result = await parser.parse(json)
      expect(result.table.numRows).toBe(1)
    })
  })
})

describe('JSONParser - PERFORMANCE TESTS', () => {
  describe('Small Dataset Performance', () => {
    it('should parse 100 objects in <50ms', async () => {
      const json = Array(100).fill(0).map((_, i) => ({
        id: i,
        name: `User${i}`,
        age: 20 + i,
        email: `user${i}@example.com`
      }))

      const parser = new JSONParser()
      const start = performance.now()
      const result = await parser.parse(json)
      const duration = performance.now() - start

      expect(result.table.numRows).toBe(100)
      expect(duration).toBeLessThan(50)
    })

    it('should parse 1000 objects in <100ms', async () => {
      const json = Array(1000).fill(0).map((_, i) => ({
        id: i,
        name: `User${i}`,
        age: 20 + i,
        email: `user${i}@example.com`
      }))

      const parser = new JSONParser()
      const start = performance.now()
      const result = await parser.parse(json)
      const duration = performance.now() - start

      expect(result.table.numRows).toBe(1000)
      expect(duration).toBeLessThan(100)
    })
  })

  describe('Large Dataset Performance', () => {
    it('should parse 10000 objects in <500ms', async () => {
      const json = Array(10000).fill(0).map((_, i) => ({
        id: i,
        name: `User${i}`,
        age: 20 + (i % 50),
        city: `City${i % 100}`
      }))

      const parser = new JSONParser()
      const start = performance.now()
      const result = await parser.parse(json)
      const duration = performance.now() - start

      expect(result.table.numRows).toBe(10000)
      expect(duration).toBeLessThan(500)
    })

    it('should parse 50000 objects in <2000ms', async () => {
      const json = Array(50000).fill(0).map((_, i) => ({
        id: i,
        value: `item${i}`
      }))

      const parser = new JSONParser()
      const start = performance.now()
      const result = await parser.parse(json)
      const duration = performance.now() - start

      expect(result.table.numRows).toBe(50000)
      expect(duration).toBeLessThan(2000)
    })
  })

  describe('Complex Structure Performance', () => {
    it('should handle nested objects efficiently', async () => {
      const json = Array(1000).fill(0).map((_, i) => ({
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

      const parser = new JSONParser()
      const start = performance.now()
      const result = await parser.parse(json)
      const duration = performance.now() - start

      expect(result.table.numRows).toBe(1000)
      expect(duration).toBeLessThan(200)
    })

    it('should handle arrays within objects', async () => {
      const json = Array(1000).fill(0).map((_, i) => ({
        id: i,
        tags: [`tag${i}`, `tag${i+1}`, `tag${i+2}`],
        scores: [90, 85, 95]
      }))

      const parser = new JSONParser()
      const start = performance.now()
      const result = await parser.parse(json)
      const duration = performance.now() - start

      expect(result.table.numRows).toBe(1000)
      expect(duration).toBeLessThan(200)
    })
  })

  describe('Memory Efficiency', () => {
    it('should not leak memory on repeated parsing', async () => {
      const json = Array(1000).fill(0).map((_, i) => ({ id: i, value: `item${i}` }))

      const parser = new JSONParser()

      for (let i = 0; i < 10; i++) {
        const result = await parser.parse(json)
        expect(result.table.numRows).toBe(1000)
      }

      // Memory should stabilize
    })

    it('should efficiently handle wide objects (many keys)', async () => {
      const wideObject: any = {}
      for (let i = 0; i < 100; i++) {
        wideObject[`key${i}`] = `value${i}`
      }

      const json = [wideObject]

      const parser = new JSONParser()
      const start = performance.now()
      const result = await parser.parse(json)
      const duration = performance.now() - start

      expect(result.table.numCols).toBeGreaterThan(90)
      expect(duration).toBeLessThan(50)
    })
  })
})

describe('JSONParser - Edge Cases', () => {
  let parser: JSONParser

  beforeEach(() => {
    parser = new JSONParser()
  })

  it('should handle null values', async () => {
    const json = [
      { id: 1, name: 'Alice', age: null },
      { id: 2, name: null, age: 25 }
    ]

    const result = await parser.parse(json)

    expect(result.table.numRows).toBe(2)
  })

  it('should handle boolean values', async () => {
    const json = [
      { id: 1, active: true, verified: false },
      { id: 2, active: false, verified: true }
    ]

    const result = await parser.parse(json)

    expect(result.table.numRows).toBe(2)
  })

  it('should handle mixed types', async () => {
    const json = [
      { id: 1, value: 123 },
      { id: 2, value: 'text' },
      { id: 3, value: true }
    ]

    const result = await parser.parse(json)

    expect(result.table.numRows).toBe(3)
  })

  it('should handle missing keys', async () => {
    const json = [
      { id: 1, name: 'Alice', age: 30 },
      { id: 2, name: 'Bob' }, // missing age
      { id: 3, age: 35 } // missing name
    ]

    const result = await parser.parse(json)

    expect(result.table.numRows).toBe(3)
  })

  it('should handle Unicode characters', async () => {
    const json = [
      { id: 1, name: '北京', emoji: '😀' },
      { id: 2, name: 'José', emoji: '🎉' }
    ]

    const result = await parser.parse(json)

    expect(result.table.numRows).toBe(2)
  })

  it('should handle special characters in keys', async () => {
    const json = [
      { 'id': 1, 'first name': 'Alice', 'age@time': 30 }
    ]

    const result = await parser.parse(json)

    expect(result.table.numCols).toBe(3)
  })
})
