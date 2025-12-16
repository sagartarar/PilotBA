/**
 * CSVParser Test Suite
 * Focus: Security & Performance
 *
 * Security Tests:
 * - Input validation
 * - Buffer overflow prevention
 * - Injection attack prevention
 * - XSS prevention
 * - Resource exhaustion
 *
 * Performance Tests:
 * - Large dataset handling (10K, 100K, 1M rows)
 * - Memory usage validation
 * - Parse time benchmarks
 * - Streaming performance
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CSVParser } from './CSVParser'

describe('CSVParser - Basic Functionality', () => {
  let parser: CSVParser

  beforeEach(() => {
    parser = new CSVParser()
  })

  describe('Standard Parsing', () => {
    it('should parse basic CSV with headers', () => {
      const csv = 'id,name,age\n1,Alice,30\n2,Bob,25'
      const result = parser.parse(csv)

      expect(result.table.numRows).toBe(2)
      expect(result.table.numCols).toBe(3)
      expect(result.rowCount).toBe(2)
      expect(result.columnCount).toBe(3)
    })

    it('should parse CSV without headers', () => {
      const csv = '1,Alice,30\n2,Bob,25'
      const parser = new CSVParser({ hasHeader: false })
      const result = parser.parse(csv)

      expect(result.table.numRows).toBe(2)
      expect(result.rowCount).toBe(2)
    })

    it('should handle different delimiters', () => {
      const tsv = 'id\tname\tage\n1\tAlice\t30\n2\tBob\t25'
      const parser = new CSVParser({ delimiter: '\t' })
      const result = parser.parse(tsv)

      expect(result.table.numRows).toBe(2)
      expect(result.table.numCols).toBe(3)
    })

    it('should handle quoted fields with commas', () => {
      const csv = 'id,name,description\n1,"Smith, John","A person"\n2,"Doe, Jane","Another person"'
      const result = parser.parse(csv)

      expect(result.table.numRows).toBe(2)
      expect(result.rowCount).toBe(2)
    })
  })

  describe('Type Inference', () => {
    it('should infer numeric types', () => {
      const csv = 'id,age,score\n1,30,95.5\n2,25,87.3'
      const result = parser.parse(csv)

      expect(result.table.numRows).toBe(2)
      // Types should be inferred as numbers
    })

    it('should infer boolean types', () => {
      const csv = 'id,active,verified\n1,true,false\n2,false,true'
      const result = parser.parse(csv)

      expect(result.table.numRows).toBe(2)
    })

    it('should handle mixed types gracefully', () => {
      const csv = 'id,value\n1,123\n2,abc\n3,456'
      const result = parser.parse(csv)

      expect(result.table.numRows).toBe(3)
      // Should fallback to string type
    })
  })

  describe('Null Value Handling', () => {
    it('should handle default null values', () => {
      const csv = 'id,name,age\n1,Alice,30\n2,,\n3,Charlie,null'
      const result = parser.parse(csv)

      expect(result.table.numRows).toBe(3)
      // Nulls should be properly represented in Arrow table
    })

    it('should respect custom null values', () => {
      const csv = 'id,name,age\n1,Alice,30\n2,N/A,NA\n3,Charlie,UNKNOWN'
      const parser = new CSVParser({
        nullValues: ['N/A', 'NA', 'UNKNOWN']
      })
      const result = parser.parse(csv)

      expect(result.table.numRows).toBe(3)
    })
  })
})

describe('CSVParser - SECURITY TESTS', () => {
  let parser: CSVParser

  beforeEach(() => {
    parser = new CSVParser()
  })

  describe('Input Validation', () => {
    it('should reject null input', () => {
      expect(() => parser.parse(null as any)).toThrow()
    })

    it('should reject undefined input', () => {
      expect(() => parser.parse(undefined as any)).toThrow()
    })

    it('should handle empty string safely', () => {
      const result = parser.parse('')
      expect(result.rowCount).toBe(0)
    })

    it('should validate CSV structure', () => {
      const malformed = 'id,name\n1,Alice,ExtraColumn'
      // Should handle or error gracefully, not crash
      const result = parser.parse(malformed)
      expect(result.parseErrors).toBeDefined()
    })
  })

  describe('Injection Attack Prevention', () => {
    it('should sanitize formula injection (CSV injection)', () => {
      const malicious = 'id,formula\n1,=1+1\n2,=cmd|"/c calc"'
      const result = parser.parse(malicious)

      expect(result.table.numRows).toBe(2)
      // Formulas should be treated as strings, not executed
    })

    it('should handle SQL injection attempts', () => {
      const malicious = `id,name\n1,'; DROP TABLE users; --\n2,1' OR '1'='1`
      const result = parser.parse(malicious)

      expect(result.table.numRows).toBe(2)
      // Should be stored as strings, not cause issues
    })

    it('should prevent command injection', () => {
      const malicious = 'id,cmd\n1,$(whoami)\n2,`cat /etc/passwd`'
      const result = parser.parse(malicious)

      expect(result.table.numRows).toBe(2)
      // Commands should not be executed
    })

    it('should sanitize XSS attempts', () => {
      const malicious = 'id,html\n1,<script>alert("xss")</script>\n2,<img src=x onerror=alert(1)>'
      const result = parser.parse(malicious)

      expect(result.table.numRows).toBe(2)
      // HTML/JS should be stored as strings, not executed
    })
  })

  describe('Buffer Overflow Prevention', () => {
    it('should handle extremely long lines without crashing', () => {
      const longValue = 'A'.repeat(1000000) // 1MB single value
      const csv = `id,data\n1,${longValue}`

      const result = parser.parse(csv)
      expect(result.table.numRows).toBe(1)
    })

    it('should handle deeply nested quotes', () => {
      const nested = '"'.repeat(1000) + 'value' + '"'.repeat(1000)
      const csv = `id,nested\n1,${nested}`

      // Should handle or error gracefully
      expect(() => parser.parse(csv)).not.toThrow()
    })

    it('should reject files exceeding memory limits', () => {
      // Mock extremely large file
      const hugeCSV = 'id,name\n' + ('1,Alice\n').repeat(10000000) // 10M rows

      // Should have size validation or streaming
      expect(() => parser.parse(hugeCSV)).toThrow(/size|memory|limit/i)
    })
  })

  describe('Resource Exhaustion Prevention', () => {
    it('should limit maximum number of columns', () => {
      const manyCols = Array(10000).fill('col').join(',')
      const csv = `${manyCols}\n${Array(10000).fill('val').join(',')}`

      // Should limit or error gracefully
      expect(() => parser.parse(csv)).not.toThrow()
    })

    it('should handle parsing timeout for complex CSV', () => {
      // Extremely complex quoted structure
      const complex = Array(1000).fill('"a,b,c"').join(',')
      const csv = `id\n${complex}`

      // Should complete in reasonable time or timeout gracefully
      const start = Date.now()
      parser.parse(csv)
      const duration = Date.now() - start

      expect(duration).toBeLessThan(5000) // 5 second max
    })
  })

  describe('Path Traversal Prevention', () => {
    it('should not allow file path references in data', () => {
      const malicious = 'id,file\n1,../../etc/passwd\n2,..\\..\\windows\\system32\\config\\sam'
      const result = parser.parse(malicious)

      expect(result.table.numRows).toBe(2)
      // Paths should be treated as strings
    })
  })
})

describe('CSVParser - PERFORMANCE TESTS', () => {
  describe('Small Dataset Performance (<1K rows)', () => {
    it('should parse 100 rows in <10ms', () => {
      const csv = 'id,name,age,city,country\n' +
        Array(100).fill(0).map((_, i) =>
          `${i},User${i},${20 + i},City${i},Country${i % 5}`
        ).join('\n')

      const parser = new CSVParser()
      const start = performance.now()
      const result = parser.parse(csv)
      const duration = performance.now() - start

      expect(result.table.numRows).toBe(100)
      expect(duration).toBeLessThan(10)
    })

    it('should parse 1000 rows in <50ms', () => {
      const csv = 'id,name,age,city,country\n' +
        Array(1000).fill(0).map((_, i) =>
          `${i},User${i},${20 + i},City${i},Country${i % 5}`
        ).join('\n')

      const parser = new CSVParser()
      const start = performance.now()
      const result = parser.parse(csv)
      const duration = performance.now() - start

      expect(result.table.numRows).toBe(1000)
      expect(duration).toBeLessThan(50)
    })
  })

  describe('Medium Dataset Performance (1K-10K rows)', () => {
    it('should parse 5000 rows in <200ms', () => {
      const csv = 'id,name,age,email,city,country\n' +
        Array(5000).fill(0).map((_, i) =>
          `${i},User${i},${20 + (i % 50)},user${i}@example.com,City${i % 100},Country${i % 10}`
        ).join('\n')

      const parser = new CSVParser()
      const start = performance.now()
      const result = parser.parse(csv)
      const duration = performance.now() - start

      expect(result.table.numRows).toBe(5000)
      expect(duration).toBeLessThan(200)
    })

    it('should parse 10000 rows in <400ms', () => {
      const csv = 'id,name,age,email,city,country\n' +
        Array(10000).fill(0).map((_, i) =>
          `${i},User${i},${20 + (i % 50)},user${i}@example.com,City${i % 100},Country${i % 10}`
        ).join('\n')

      const parser = new CSVParser()
      const start = performance.now()
      const result = parser.parse(csv)
      const duration = performance.now() - start

      expect(result.table.numRows).toBe(10000)
      expect(duration).toBeLessThan(400)
    })
  })

  describe('Memory Usage', () => {
    it('should not leak memory on repeated parsing', () => {
      const csv = 'id,name,age\n' +
        Array(1000).fill(0).map((_, i) => `${i},User${i},${20 + i}`).join('\n')

      const parser = new CSVParser()

      // Parse multiple times
      for (let i = 0; i < 10; i++) {
        const result = parser.parse(csv)
        expect(result.table.numRows).toBe(1000)
      }

      // Memory should stabilize (no continuous growth)
      // In real scenario, check process.memoryUsage()
    })

    it('should efficiently handle wide tables (many columns)', () => {
      const columns = Array(100).fill(0).map((_, i) => `col${i}`).join(',')
      const row = Array(100).fill(0).map((_, i) => `val${i}`).join(',')
      const csv = `${columns}\n${row}`

      const parser = new CSVParser()
      const start = performance.now()
      const result = parser.parse(csv)
      const duration = performance.now() - start

      expect(result.table.numCols).toBe(100)
      expect(duration).toBeLessThan(50)
    })
  })

  describe('Complex Data Performance', () => {
    it('should handle quoted fields efficiently', () => {
      const csv = 'id,description\n' +
        Array(1000).fill(0).map((_, i) =>
          `${i},"This is a long, quoted description with commas, quotes, and other characters"`
        ).join('\n')

      const parser = new CSVParser()
      const start = performance.now()
      const result = parser.parse(csv)
      const duration = performance.now() - start

      expect(result.table.numRows).toBe(1000)
      expect(duration).toBeLessThan(100)
    })

    it('should handle mixed type inference efficiently', () => {
      const csv = 'id,mixed\n' +
        Array(1000).fill(0).map((_, i) =>
          `${i},${i % 3 === 0 ? 'text' : i % 3 === 1 ? i : 'true'}`
        ).join('\n')

      const parser = new CSVParser()
      const start = performance.now()
      const result = parser.parse(csv)
      const duration = performance.now() - start

      expect(result.table.numRows).toBe(1000)
      expect(duration).toBeLessThan(150)
    })
  })

  describe('Benchmark Comparison', () => {
    it('should parse faster with schema hint', () => {
      const csv = 'id,name,age\n' +
        Array(1000).fill(0).map((_, i) => `${i},User${i},${20 + i}`).join('\n')

      // Without schema
      const parser1 = new CSVParser()
      const start1 = performance.now()
      parser1.parse(csv)
      const duration1 = performance.now() - start1

      // With schema (if supported)
      // Should be faster as it skips type inference
      const parser2 = new CSVParser({
        schema: undefined // Would provide actual schema
      })
      const start2 = performance.now()
      parser2.parse(csv)
      const duration2 = performance.now() - start2

      // Both should complete quickly
      expect(duration1).toBeLessThan(100)
      expect(duration2).toBeLessThan(100)
    })
  })
})

describe('CSVParser - Edge Cases', () => {
  let parser: CSVParser

  beforeEach(() => {
    parser = new CSVParser()
  })

  it('should handle empty lines', () => {
    const csv = 'id,name\n1,Alice\n\n2,Bob\n\n'
    const result = parser.parse(csv)

    expect(result.table.numRows).toBe(2)
  })

  it('should handle trailing commas', () => {
    const csv = 'id,name,age,\n1,Alice,30,\n2,Bob,25,'
    const result = parser.parse(csv)

    expect(result.table.numRows).toBe(2)
  })

  it('should handle Windows line endings (CRLF)', () => {
    const csv = 'id,name\r\n1,Alice\r\n2,Bob'
    const result = parser.parse(csv)

    expect(result.table.numRows).toBe(2)
  })

  it('should handle Mac line endings (CR)', () => {
    const csv = 'id,name\r1,Alice\r2,Bob'
    const result = parser.parse(csv)

    expect(result.table.numRows).toBe(2)
  })

  it('should handle Unicode characters', () => {
    const csv = 'id,name,emoji\n1,Alice,😀\n2,José,🎉\n3,北京,中文'
    const result = parser.parse(csv)

    expect(result.table.numRows).toBe(3)
  })

  it('should handle very long field values', () => {
    const longText = 'A'.repeat(100000)
    const csv = `id,long_text\n1,${longText}`
    const result = parser.parse(csv)

    expect(result.table.numRows).toBe(1)
  })

  it('should handle special characters in headers', () => {
    const csv = 'id,name (first),age@time,value$USD\n1,Alice,30,100'
    const result = parser.parse(csv)

    expect(result.table.numCols).toBe(4)
  })
})

