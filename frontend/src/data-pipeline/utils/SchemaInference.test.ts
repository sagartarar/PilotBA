/**
 * SchemaInference Tests
 * 
 * Comprehensive tests for Schema Inference including:
 * - Type detection (number, string, boolean, date)
 * - Null value handling
 * - Mixed type handling
 * - Edge cases
 * - Security tests
 * 
 * @author Toaster (Senior QA Engineer)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Schema, Field, Int32, Float64, Utf8, Bool, Timestamp, TimeUnit } from 'apache-arrow';
import { SchemaInference, inferSchema, InferenceOptions } from './SchemaInference';

// ============================================================================
// BASIC TYPE INFERENCE TESTS
// ============================================================================

describe('SchemaInference', () => {
  describe('Integer Type Inference', () => {
    it('should infer Int32 for integer values', () => {
      const data = [
        { value: 1 },
        { value: 2 },
        { value: 3 },
      ];

      const schema = inferSchema(data);
      const field = schema.fields.find(f => f.name === 'value');

      expect(field).toBeDefined();
      expect(field?.type).toBeInstanceOf(Int32);
    });

    it('should infer Int32 for negative integers', () => {
      const data = [
        { value: -10 },
        { value: -20 },
        { value: -30 },
      ];

      const schema = inferSchema(data);
      const field = schema.fields.find(f => f.name === 'value');

      expect(field?.type).toBeInstanceOf(Int32);
    });

    it('should infer Int32 for zero values', () => {
      const data = [
        { value: 0 },
        { value: 0 },
        { value: 0 },
      ];

      const schema = inferSchema(data);
      const field = schema.fields.find(f => f.name === 'value');

      expect(field?.type).toBeInstanceOf(Int32);
    });
  });

  describe('Float Type Inference', () => {
    it('should infer Float64 for decimal values', () => {
      const data = [
        { value: 1.5 },
        { value: 2.7 },
        { value: 3.14159 },
      ];

      const schema = inferSchema(data);
      const field = schema.fields.find(f => f.name === 'value');

      expect(field?.type).toBeInstanceOf(Float64);
    });

    it('should infer Float64 for mixed int and float', () => {
      const data = [
        { value: 1 },
        { value: 2.5 },
        { value: 3 },
      ];

      const schema = inferSchema(data);
      const field = schema.fields.find(f => f.name === 'value');

      expect(field?.type).toBeInstanceOf(Float64);
    });

    it('should infer Float64 for scientific notation', () => {
      const data = [
        { value: 1e10 },
        { value: 2.5e-5 },
        { value: 3.14e2 },
      ];

      const schema = inferSchema(data);
      const field = schema.fields.find(f => f.name === 'value');

      expect(field?.type).toBeInstanceOf(Float64);
    });
  });

  describe('String Type Inference', () => {
    it('should infer Utf8 for string values', () => {
      const data = [
        { name: 'Alice' },
        { name: 'Bob' },
        { name: 'Charlie' },
      ];

      const schema = inferSchema(data);
      const field = schema.fields.find(f => f.name === 'name');

      expect(field?.type).toBeInstanceOf(Utf8);
    });

    it('should infer Utf8 for empty strings', () => {
      const data = [
        { name: '' },
        { name: '' },
        { name: '' },
      ];

      // Empty strings are treated as nulls by default
      const schema = inferSchema(data);
      const field = schema.fields.find(f => f.name === 'name');

      expect(field?.type).toBeInstanceOf(Utf8);
    });

    it('should infer Utf8 for numeric strings', () => {
      const data = [
        { value: '123' },
        { value: '456' },
        { value: '789' },
      ];

      const schema = inferSchema(data);
      const field = schema.fields.find(f => f.name === 'value');

      expect(field?.type).toBeInstanceOf(Utf8);
    });
  });

  describe('Boolean Type Inference', () => {
    it('should infer Bool for boolean values', () => {
      const data = [
        { flag: true },
        { flag: false },
        { flag: true },
      ];

      const schema = inferSchema(data);
      const field = schema.fields.find(f => f.name === 'flag');

      expect(field?.type).toBeInstanceOf(Bool);
    });

    it('should infer Bool for all true values', () => {
      const data = [
        { flag: true },
        { flag: true },
        { flag: true },
      ];

      const schema = inferSchema(data);
      const field = schema.fields.find(f => f.name === 'flag');

      expect(field?.type).toBeInstanceOf(Bool);
    });

    it('should infer Bool for all false values', () => {
      const data = [
        { flag: false },
        { flag: false },
        { flag: false },
      ];

      const schema = inferSchema(data);
      const field = schema.fields.find(f => f.name === 'flag');

      expect(field?.type).toBeInstanceOf(Bool);
    });
  });

  describe('Date Type Inference', () => {
    it('should infer Timestamp for ISO date strings', () => {
      const data = [
        { date: '2023-01-15' },
        { date: '2024-06-20' },
        { date: '2025-12-31' },
      ];

      const schema = inferSchema(data, { inferDates: true });
      const field = schema.fields.find(f => f.name === 'date');

      expect(field?.type).toBeInstanceOf(Timestamp);
    });

    it('should infer Timestamp for ISO datetime strings', () => {
      const data = [
        { date: '2023-01-15T10:30:00Z' },
        { date: '2024-06-20T14:45:30Z' },
        { date: '2025-12-31T23:59:59Z' },
      ];

      const schema = inferSchema(data, { inferDates: true });
      const field = schema.fields.find(f => f.name === 'date');

      expect(field?.type).toBeInstanceOf(Timestamp);
    });

    it('should infer Timestamp for Date objects', () => {
      const data = [
        { date: new Date('2023-01-15') },
        { date: new Date('2024-06-20') },
        { date: new Date('2025-12-31') },
      ];

      const schema = inferSchema(data);
      const field = schema.fields.find(f => f.name === 'date');

      expect(field?.type).toBeInstanceOf(Timestamp);
    });

    it('should not infer date when inferDates is false', () => {
      const data = [
        { date: '2023-01-15' },
        { date: '2024-06-20' },
        { date: '2025-12-31' },
      ];

      const schema = inferSchema(data, { inferDates: false });
      const field = schema.fields.find(f => f.name === 'date');

      expect(field?.type).toBeInstanceOf(Utf8);
    });
  });

  // ============================================================================
  // NULL HANDLING TESTS
  // ============================================================================

  describe('Null Handling', () => {
    it('should handle null values in column', () => {
      const data = [
        { value: 1 },
        { value: null },
        { value: 3 },
      ];

      const schema = inferSchema(data);
      const field = schema.fields.find(f => f.name === 'value');

      expect(field?.nullable).toBe(true);
    });

    it('should handle undefined values', () => {
      const data = [
        { value: 1 },
        { value: undefined },
        { value: 3 },
      ];

      const schema = inferSchema(data);
      const field = schema.fields.find(f => f.name === 'value');

      expect(field).toBeDefined();
    });

    it('should treat custom null values as null', () => {
      const data = [
        { value: 'NA' },
        { value: 'N/A' },
        { value: 'null' },
      ];

      const schema = inferSchema(data, {
        nullValues: ['NA', 'N/A', 'null'],
      });

      // All values are null, should default to string
      const field = schema.fields.find(f => f.name === 'value');
      expect(field?.type).toBeInstanceOf(Utf8);
    });

    it('should handle all null column', () => {
      const data = [
        { value: null },
        { value: null },
        { value: null },
      ];

      const schema = inferSchema(data);
      const field = schema.fields.find(f => f.name === 'value');

      // All nulls should default to string
      expect(field?.type).toBeInstanceOf(Utf8);
    });

    it('should handle NaN values', () => {
      const data = [
        { value: 1 },
        { value: NaN },
        { value: 3 },
      ];

      const schema = inferSchema(data);
      const field = schema.fields.find(f => f.name === 'value');

      // NaN is technically a number
      expect(field?.type).toBeInstanceOf(Int32);
    });
  });

  // ============================================================================
  // MIXED TYPE HANDLING TESTS
  // ============================================================================

  describe('Mixed Type Handling', () => {
    it('should infer Utf8 for mixed types with strictTypes', () => {
      const data = [
        { value: 1 },
        { value: 'text' },
        { value: true },
      ];

      const schema = inferSchema(data, { strictTypes: true });
      const field = schema.fields.find(f => f.name === 'value');

      expect(field?.type).toBeInstanceOf(Utf8);
    });

    it('should handle mixed number and string', () => {
      const data = [
        { value: 1 },
        { value: 2 },
        { value: 'three' },
      ];

      const schema = inferSchema(data, { strictTypes: true });
      const field = schema.fields.find(f => f.name === 'value');

      expect(field?.type).toBeInstanceOf(Utf8);
    });

    it('should handle object values as strings', () => {
      const data = [
        { value: { nested: 'object' } },
        { value: { another: 'object' } },
      ];

      const schema = inferSchema(data);
      const field = schema.fields.find(f => f.name === 'value');

      expect(field?.type).toBeInstanceOf(Utf8);
    });

    it('should handle array values as strings', () => {
      const data = [
        { value: [1, 2, 3] },
        { value: [4, 5, 6] },
      ];

      const schema = inferSchema(data);
      const field = schema.fields.find(f => f.name === 'value');

      expect(field?.type).toBeInstanceOf(Utf8);
    });
  });

  // ============================================================================
  // MULTIPLE COLUMNS TESTS
  // ============================================================================

  describe('Multiple Columns', () => {
    it('should infer schema for multiple columns', () => {
      const data = [
        { id: 1, name: 'Alice', active: true, score: 95.5 },
        { id: 2, name: 'Bob', active: false, score: 87.3 },
        { id: 3, name: 'Charlie', active: true, score: 92.1 },
      ];

      const schema = inferSchema(data);

      expect(schema.fields.length).toBe(4);
      expect(schema.fields.find(f => f.name === 'id')?.type).toBeInstanceOf(Int32);
      expect(schema.fields.find(f => f.name === 'name')?.type).toBeInstanceOf(Utf8);
      expect(schema.fields.find(f => f.name === 'active')?.type).toBeInstanceOf(Bool);
      expect(schema.fields.find(f => f.name === 'score')?.type).toBeInstanceOf(Float64);
    });

    it('should handle sparse columns (missing keys)', () => {
      const data = [
        { a: 1, b: 2 },
        { a: 3 },
        { a: 5, b: 6, c: 7 },
      ];

      const schema = inferSchema(data);

      // Should have all columns found across all rows
      expect(schema.fields.length).toBe(3);
      expect(schema.fields.map(f => f.name)).toContain('a');
      expect(schema.fields.map(f => f.name)).toContain('b');
      expect(schema.fields.map(f => f.name)).toContain('c');
    });
  });

  // ============================================================================
  // ARRAY-BASED INFERENCE TESTS
  // ============================================================================

  describe('Array-Based Inference', () => {
    it('should infer schema from arrays with headers', () => {
      const headers = ['id', 'name', 'value'];
      const data = [
        [1, 'Alice', 100],
        [2, 'Bob', 200],
        [3, 'Charlie', 300],
      ];

      const inference = new SchemaInference();
      const schema = inference.inferFromArrays(headers, data);

      expect(schema.fields.length).toBe(3);
      expect(schema.fields[0].name).toBe('id');
      expect(schema.fields[1].name).toBe('name');
      expect(schema.fields[2].name).toBe('value');
    });

    it('should throw for empty headers', () => {
      const inference = new SchemaInference();

      expect(() => {
        inference.inferFromArrays([], [[1, 2, 3]]);
      }).toThrow('Headers cannot be empty');
    });

    it('should handle mismatched array lengths', () => {
      const headers = ['a', 'b', 'c'];
      const data = [
        [1, 2],
        [3, 4, 5],
        [6],
      ];

      const inference = new SchemaInference();
      const schema = inference.inferFromArrays(headers, data);

      // Should still create schema for all headers
      expect(schema.fields.length).toBe(3);
    });
  });

  // ============================================================================
  // SAMPLING TESTS
  // ============================================================================

  describe('Sampling', () => {
    it('should respect sampleSize option', () => {
      const data = Array.from({ length: 10000 }, (_, i) => ({
        value: i < 9000 ? 1 : 'text', // First 9000 are numbers
      }));

      // With small sample, should see only integers
      const schema = inferSchema(data, { sampleSize: 100, strictTypes: true });
      const field = schema.fields.find(f => f.name === 'value');

      expect(field?.type).toBeInstanceOf(Int32);
    });

    it('should use default sample size', () => {
      const data = Array.from({ length: 5000 }, () => ({
        value: Math.random(),
      }));

      // Should complete without error
      const schema = inferSchema(data);
      expect(schema.fields.length).toBe(1);
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should throw for empty data', () => {
      expect(() => {
        inferSchema([]);
      }).toThrow('Cannot infer schema from empty data');
    });

    it('should handle single row', () => {
      const data = [{ value: 42 }];

      const schema = inferSchema(data);
      expect(schema.fields.length).toBe(1);
    });

    it('should handle single column', () => {
      const data = [
        { value: 1 },
        { value: 2 },
        { value: 3 },
      ];

      const schema = inferSchema(data);
      expect(schema.fields.length).toBe(1);
    });

    it('should handle very long column names', () => {
      const longName = 'a'.repeat(1000);
      const data = [{ [longName]: 1 }];

      const schema = inferSchema(data);
      expect(schema.fields[0].name).toBe(longName);
    });

    it('should handle special characters in column names', () => {
      const data = [
        { 'col-1': 1, 'col.2': 2, 'col 3': 3 },
      ];

      const schema = inferSchema(data);
      expect(schema.fields.map(f => f.name)).toContain('col-1');
      expect(schema.fields.map(f => f.name)).toContain('col.2');
      expect(schema.fields.map(f => f.name)).toContain('col 3');
    });

    it('should handle Unicode column names', () => {
      const data = [
        { '日本語': 1, '中文': 2, 'العربية': 3 },
      ];

      const schema = inferSchema(data);
      expect(schema.fields.length).toBe(3);
    });

    it('should handle empty objects', () => {
      const data = [{}, {}, {}];

      const schema = inferSchema(data);
      expect(schema.fields.length).toBe(0);
    });
  });

  // ============================================================================
  // SECURITY TESTS
  // ============================================================================

  describe('Security Tests', () => {
    it('should handle SQL injection in column names', () => {
      const data = [
        { "'; DROP TABLE users; --": 1 },
      ];

      // Should not execute injection, just use as column name
      const schema = inferSchema(data);
      expect(schema.fields[0].name).toBe("'; DROP TABLE users; --");
    });

    it('should handle XSS in values', () => {
      const data = [
        { value: '<script>alert("xss")</script>' },
        { value: '<img onerror="alert(1)">' },
      ];

      const schema = inferSchema(data);
      expect(schema.fields[0].type).toBeInstanceOf(Utf8);
    });

    it('should handle prototype pollution attempts', () => {
      const originalProto = Object.prototype.toString;

      const data = [
        { '__proto__': 'malicious' },
        { 'constructor': 'attack' },
      ];

      inferSchema(data);

      expect(Object.prototype.toString).toBe(originalProto);
    });

    it('should handle very large values', () => {
      const data = [
        { value: Number.MAX_VALUE },
        { value: Number.MIN_VALUE },
      ];

      const schema = inferSchema(data);
      expect(schema.fields[0].type).toBeInstanceOf(Float64);
    });

    it('should handle Infinity values', () => {
      const data = [
        { value: Infinity },
        { value: -Infinity },
      ];

      const schema = inferSchema(data);
      // Infinity is technically a number
      expect(schema.fields.length).toBe(1);
    });
  });

  // ============================================================================
  // PERFORMANCE TESTS
  // ============================================================================

  describe('Performance Tests', () => {
    it('should infer schema from 10,000 rows in < 100ms', () => {
      const data = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `item_${i}`,
        value: Math.random() * 1000,
        active: i % 2 === 0,
      }));

      const start = performance.now();
      const schema = inferSchema(data);
      const duration = performance.now() - start;

      expect(schema.fields.length).toBe(4);
      expect(duration).toBeLessThan(100);
    });

    it('should handle 100 columns efficiently', () => {
      const row: Record<string, any> = {};
      for (let i = 0; i < 100; i++) {
        row[`col_${i}`] = i;
      }

      const data = Array.from({ length: 1000 }, () => ({ ...row }));

      const start = performance.now();
      const schema = inferSchema(data);
      const duration = performance.now() - start;

      expect(schema.fields.length).toBe(100);
      expect(duration).toBeLessThan(500);
    });
  });

  // ============================================================================
  // DATE PATTERN TESTS
  // ============================================================================

  describe('Date Pattern Detection', () => {
    it('should detect MM/DD/YYYY format', () => {
      const data = [
        { date: '01/15/2023' },
        { date: '06/20/2024' },
        { date: '12/31/2025' },
      ];

      const schema = inferSchema(data, { inferDates: true });
      const field = schema.fields.find(f => f.name === 'date');

      expect(field?.type).toBeInstanceOf(Timestamp);
    });

    it('should detect YYYY/MM/DD format', () => {
      const data = [
        { date: '2023/01/15' },
        { date: '2024/06/20' },
        { date: '2025/12/31' },
      ];

      const schema = inferSchema(data, { inferDates: true });
      const field = schema.fields.find(f => f.name === 'date');

      expect(field?.type).toBeInstanceOf(Timestamp);
    });

    it('should not detect invalid date strings', () => {
      const data = [
        { date: 'not-a-date' },
        { date: '2023-99-99' },
        { date: 'hello world' },
      ];

      const schema = inferSchema(data, { inferDates: true });
      const field = schema.fields.find(f => f.name === 'date');

      expect(field?.type).toBeInstanceOf(Utf8);
    });
  });
});

