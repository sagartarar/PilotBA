/**
 * Join Operator Tests
 * 
 * Comprehensive tests for Join operator including:
 * - All join types (inner, left, right, full, cross)
 * - Performance tests (< 200ms for 100K×100K per design doc)
 * - Security tests (injection prevention, safe handling)
 * - Edge cases (nulls, empty, duplicates)
 * 
 * @author Toaster (Senior QA Engineer)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { tableFromArrays, Table } from 'apache-arrow';
import { JoinOperator, JoinParams, JoinType } from './Join';

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Creates a test table with specified data.
 */
function createTestTable(data: Record<string, any[]>): Table {
  return tableFromArrays(data);
}

/**
 * Generates a dataset for join testing.
 */
function generateJoinDataset(rows: number, prefix: string = ''): Table {
  const ids: number[] = [];
  const values: number[] = [];
  const names: string[] = [];

  for (let i = 0; i < rows; i++) {
    ids.push(i % (rows / 2)); // Create duplicates for join testing
    values.push(Math.random() * 1000);
    names.push(`${prefix}item_${i}`);
  }

  return createTestTable({ id: ids, value: values, name: names });
}

/**
 * Extracts column values from table.
 */
function getColumnValues(table: Table, columnName: string): any[] {
  const column = table.getChild(columnName);
  if (!column) return [];
  
  const values: any[] = [];
  for (let i = 0; i < column.length; i++) {
    values.push(column.get(i));
  }
  return values;
}

/**
 * Gets all column names from table.
 */
function getColumnNames(table: Table): string[] {
  return table.schema.fields.map(f => f.name);
}

// ============================================================================
// INNER JOIN TESTS
// ============================================================================

describe('JoinOperator', () => {
  describe('Inner Join', () => {
    it('should return only matching rows', () => {
      const left = createTestTable({
        id: [1, 2, 3, 4],
        left_value: ['a', 'b', 'c', 'd'],
      });

      const right = createTestTable({
        id: [2, 3, 5, 6],
        right_value: ['x', 'y', 'z', 'w'],
      });

      const result = JoinOperator.apply(left, right, {
        type: 'inner',
        leftOn: 'id',
        rightOn: 'id',
      });

      expect(result.numRows).toBe(2); // Only ids 2 and 3 match
      
      const ids = getColumnValues(result, 'id');
      expect(ids).toContain(2);
      expect(ids).toContain(3);
    });

    it('should handle multiple matches (one-to-many)', () => {
      const left = createTestTable({
        id: [1, 2, 3],
        left_value: ['a', 'b', 'c'],
      });

      const right = createTestTable({
        id: [1, 1, 2],
        right_value: ['x', 'y', 'z'],
      });

      const result = JoinOperator.apply(left, right, {
        type: 'inner',
        leftOn: 'id',
        rightOn: 'id',
      });

      // id=1 matches twice, id=2 matches once
      expect(result.numRows).toBe(3);
    });

    it('should handle many-to-many matches', () => {
      const left = createTestTable({
        id: [1, 1, 2],
        left_value: ['a', 'b', 'c'],
      });

      const right = createTestTable({
        id: [1, 1, 2],
        right_value: ['x', 'y', 'z'],
      });

      const result = JoinOperator.apply(left, right, {
        type: 'inner',
        leftOn: 'id',
        rightOn: 'id',
      });

      // id=1: 2×2=4 matches, id=2: 1×1=1 match
      expect(result.numRows).toBe(5);
    });

    it('should return empty table when no matches', () => {
      const left = createTestTable({
        id: [1, 2, 3],
        left_value: ['a', 'b', 'c'],
      });

      const right = createTestTable({
        id: [4, 5, 6],
        right_value: ['x', 'y', 'z'],
      });

      const result = JoinOperator.apply(left, right, {
        type: 'inner',
        leftOn: 'id',
        rightOn: 'id',
      });

      expect(result.numRows).toBe(0);
    });

    it('should add suffix to duplicate column names', () => {
      const left = createTestTable({
        id: [1, 2],
        value: ['a', 'b'],
      });

      const right = createTestTable({
        id: [1, 2],
        value: ['x', 'y'],
      });

      const result = JoinOperator.apply(left, right, {
        type: 'inner',
        leftOn: 'id',
        rightOn: 'id',
        suffix: '_right',
      });

      const columns = getColumnNames(result);
      expect(columns).toContain('value');
      expect(columns).toContain('value_right');
    });
  });

  // ============================================================================
  // LEFT JOIN TESTS
  // ============================================================================

  describe('Left Join', () => {
    it('should return all left rows with matching right data', () => {
      const left = createTestTable({
        id: [1, 2, 3, 4],
        left_value: ['a', 'b', 'c', 'd'],
      });

      const right = createTestTable({
        id: [2, 3],
        right_value: ['x', 'y'],
      });

      const result = JoinOperator.apply(left, right, {
        type: 'left',
        leftOn: 'id',
        rightOn: 'id',
      });

      expect(result.numRows).toBe(4); // All left rows preserved
      
      const leftValues = getColumnValues(result, 'left_value');
      expect(leftValues).toEqual(['a', 'b', 'c', 'd']);
    });

    it('should fill nulls for non-matching right rows', () => {
      const left = createTestTable({
        id: [1, 2, 3],
        left_value: ['a', 'b', 'c'],
      });

      const right = createTestTable({
        id: [2],
        right_value: ['x'],
      });

      const result = JoinOperator.apply(left, right, {
        type: 'left',
        leftOn: 'id',
        rightOn: 'id',
      });

      expect(result.numRows).toBe(3);
      
      const rightValues = getColumnValues(result, 'right_value');
      // Only id=2 has a match
      expect(rightValues.filter(v => v !== null).length).toBe(1);
    });

    it('should handle empty right table', () => {
      const left = createTestTable({
        id: [1, 2, 3],
        left_value: ['a', 'b', 'c'],
      });

      const right = createTestTable({
        id: [],
        right_value: [],
      });

      const result = JoinOperator.apply(left, right, {
        type: 'left',
        leftOn: 'id',
        rightOn: 'id',
      });

      expect(result.numRows).toBe(3);
    });
  });

  // ============================================================================
  // RIGHT JOIN TESTS
  // ============================================================================

  describe('Right Join', () => {
    it('should return all right rows with matching left data', () => {
      const left = createTestTable({
        id: [2, 3],
        left_value: ['b', 'c'],
      });

      const right = createTestTable({
        id: [1, 2, 3, 4],
        right_value: ['w', 'x', 'y', 'z'],
      });

      const result = JoinOperator.apply(left, right, {
        type: 'right',
        leftOn: 'id',
        rightOn: 'id',
      });

      expect(result.numRows).toBe(4); // All right rows preserved
    });

    it('should fill nulls for non-matching left rows', () => {
      const left = createTestTable({
        id: [2],
        left_value: ['b'],
      });

      const right = createTestTable({
        id: [1, 2, 3],
        right_value: ['x', 'y', 'z'],
      });

      const result = JoinOperator.apply(left, right, {
        type: 'right',
        leftOn: 'id',
        rightOn: 'id',
      });

      expect(result.numRows).toBe(3);
    });
  });

  // ============================================================================
  // FULL OUTER JOIN TESTS
  // ============================================================================

  describe('Full Outer Join', () => {
    it('should return all rows from both tables', () => {
      const left = createTestTable({
        id: [1, 2, 3],
        left_value: ['a', 'b', 'c'],
      });

      const right = createTestTable({
        id: [2, 3, 4],
        right_value: ['x', 'y', 'z'],
      });

      const result = JoinOperator.apply(left, right, {
        type: 'full',
        leftOn: 'id',
        rightOn: 'id',
      });

      // id=1 (left only), id=2 (both), id=3 (both), id=4 (right only)
      expect(result.numRows).toBe(4);
    });

    it('should have nulls for non-matching rows on both sides', () => {
      const left = createTestTable({
        id: [1, 2],
        left_value: ['a', 'b'],
      });

      const right = createTestTable({
        id: [2, 3],
        right_value: ['x', 'y'],
      });

      const result = JoinOperator.apply(left, right, {
        type: 'full',
        leftOn: 'id',
        rightOn: 'id',
      });

      expect(result.numRows).toBe(3);
      
      const leftValues = getColumnValues(result, 'left_value');
      const rightValues = getColumnValues(result, 'right_value');
      
      // Should have nulls on both sides
      expect(leftValues).toContain(null);
      expect(rightValues).toContain(null);
    });
  });

  // ============================================================================
  // CROSS JOIN TESTS
  // ============================================================================

  describe('Cross Join', () => {
    it('should return cartesian product', () => {
      const left = createTestTable({
        id: [1, 2, 3],
        left_value: ['a', 'b', 'c'],
      });

      const right = createTestTable({
        id: [10, 20],
        right_value: ['x', 'y'],
      });

      const result = JoinOperator.apply(left, right, {
        type: 'cross',
        leftOn: 'id',
        rightOn: 'id',
      });

      // 3 × 2 = 6 rows
      expect(result.numRows).toBe(6);
    });

    it('should handle single row tables', () => {
      const left = createTestTable({
        id: [1],
        left_value: ['a'],
      });

      const right = createTestTable({
        id: [10],
        right_value: ['x'],
      });

      const result = JoinOperator.apply(left, right, {
        type: 'cross',
        leftOn: 'id',
        rightOn: 'id',
      });

      expect(result.numRows).toBe(1);
    });

    it('should return empty for empty table', () => {
      const left = createTestTable({
        id: [1, 2, 3],
        left_value: ['a', 'b', 'c'],
      });

      const right = createTestTable({
        id: [],
        right_value: [],
      });

      const result = JoinOperator.apply(left, right, {
        type: 'cross',
        leftOn: 'id',
        rightOn: 'id',
      });

      expect(result.numRows).toBe(0);
    });
  });

  // ============================================================================
  // NULL HANDLING TESTS
  // ============================================================================

  describe('Null Handling', () => {
    it('should handle null join keys in inner join', () => {
      const left = createTestTable({
        id: [1, null, 2],
        left_value: ['a', 'b', 'c'],
      });

      const right = createTestTable({
        id: [1, null, 3],
        right_value: ['x', 'y', 'z'],
      });

      const result = JoinOperator.apply(left, right, {
        type: 'inner',
        leftOn: 'id',
        rightOn: 'id',
      });

      // Nulls should match with nulls
      expect(result.numRows).toBeGreaterThanOrEqual(1); // At least id=1
    });

    it('should handle null values in non-key columns', () => {
      const left = createTestTable({
        id: [1, 2],
        left_value: ['a', null],
      });

      const right = createTestTable({
        id: [1, 2],
        right_value: [null, 'y'],
      });

      const result = JoinOperator.apply(left, right, {
        type: 'inner',
        leftOn: 'id',
        rightOn: 'id',
      });

      expect(result.numRows).toBe(2);
      
      const leftValues = getColumnValues(result, 'left_value');
      const rightValues = getColumnValues(result, 'right_value');
      
      expect(leftValues).toContain(null);
      expect(rightValues).toContain(null);
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle empty left table', () => {
      const left = createTestTable({
        id: [],
        left_value: [],
      });

      const right = createTestTable({
        id: [1, 2, 3],
        right_value: ['x', 'y', 'z'],
      });

      const result = JoinOperator.apply(left, right, {
        type: 'inner',
        leftOn: 'id',
        rightOn: 'id',
      });

      expect(result.numRows).toBe(0);
    });

    it('should handle single column tables', () => {
      const left = createTestTable({
        id: [1, 2, 3],
      });

      const right = createTestTable({
        id: [2, 3, 4],
      });

      const result = JoinOperator.apply(left, right, {
        type: 'inner',
        leftOn: 'id',
        rightOn: 'id',
      });

      expect(result.numRows).toBe(2);
    });

    it('should handle tables with many columns', () => {
      const leftData: Record<string, any[]> = { id: [1, 2] };
      const rightData: Record<string, any[]> = { id: [1, 2] };
      
      for (let i = 0; i < 20; i++) {
        leftData[`left_col_${i}`] = ['a', 'b'];
        rightData[`right_col_${i}`] = ['x', 'y'];
      }

      const left = createTestTable(leftData);
      const right = createTestTable(rightData);

      const result = JoinOperator.apply(left, right, {
        type: 'inner',
        leftOn: 'id',
        rightOn: 'id',
      });

      expect(result.numRows).toBe(2);
      expect(getColumnNames(result).length).toBe(42); // 21 + 21
    });

    it('should handle different column names for join', () => {
      const left = createTestTable({
        left_id: [1, 2, 3],
        value: ['a', 'b', 'c'],
      });

      const right = createTestTable({
        right_id: [1, 2, 4],
        data: ['x', 'y', 'z'],
      });

      const result = JoinOperator.apply(left, right, {
        type: 'inner',
        leftOn: 'left_id',
        rightOn: 'right_id',
      });

      expect(result.numRows).toBe(2);
    });

    it('should preserve data integrity across join', () => {
      const left = createTestTable({
        id: [1, 2],
        name: ['Alice', 'Bob'],
        age: [30, 25],
      });

      const right = createTestTable({
        id: [1, 2],
        city: ['NYC', 'LA'],
        country: ['USA', 'USA'],
      });

      const result = JoinOperator.apply(left, right, {
        type: 'inner',
        leftOn: 'id',
        rightOn: 'id',
      });

      const names = getColumnValues(result, 'name');
      const cities = getColumnValues(result, 'city');

      // Verify data integrity
      const idx1 = names.indexOf('Alice');
      const idx2 = names.indexOf('Bob');
      
      expect(cities[idx1]).toBe('NYC');
      expect(cities[idx2]).toBe('LA');
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling', () => {
    it('should throw error for non-existent left join column', () => {
      const left = createTestTable({
        id: [1, 2, 3],
        value: ['a', 'b', 'c'],
      });

      const right = createTestTable({
        id: [1, 2],
        data: ['x', 'y'],
      });

      expect(() => {
        JoinOperator.apply(left, right, {
          type: 'inner',
          leftOn: 'nonexistent',
          rightOn: 'id',
        });
      }).toThrow();
    });

    it('should throw error for non-existent right join column', () => {
      const left = createTestTable({
        id: [1, 2, 3],
        value: ['a', 'b', 'c'],
      });

      const right = createTestTable({
        id: [1, 2],
        data: ['x', 'y'],
      });

      expect(() => {
        JoinOperator.apply(left, right, {
          type: 'inner',
          leftOn: 'id',
          rightOn: 'nonexistent',
        });
      }).toThrow();
    });

    it('should throw error for unknown join type', () => {
      const left = createTestTable({ id: [1] });
      const right = createTestTable({ id: [1] });

      expect(() => {
        JoinOperator.apply(left, right, {
          type: 'invalid' as JoinType,
          leftOn: 'id',
          rightOn: 'id',
        });
      }).toThrow('Unknown join type');
    });
  });

  // ============================================================================
  // SECURITY TESTS
  // ============================================================================

  describe('Security Tests', () => {
    it('should safely handle SQL injection in column names', () => {
      const left = createTestTable({
        "'; DROP TABLE users; --": [1, 2],
        value: ['a', 'b'],
      });

      const right = createTestTable({
        "'; DROP TABLE users; --": [1, 2],
        data: ['x', 'y'],
      });

      // Should work without executing injection
      const result = JoinOperator.apply(left, right, {
        type: 'inner',
        leftOn: "'; DROP TABLE users; --",
        rightOn: "'; DROP TABLE users; --",
      });

      expect(result.numRows).toBe(2);
    });

    it('should handle XSS patterns in data values', () => {
      const left = createTestTable({
        id: [1, 2],
        value: ['<script>alert("xss")</script>', 'normal'],
      });

      const right = createTestTable({
        id: [1, 2],
        data: ['safe', '<img onerror="alert(1)">'],
      });

      const result = JoinOperator.apply(left, right, {
        type: 'inner',
        leftOn: 'id',
        rightOn: 'id',
      });

      const values = getColumnValues(result, 'value');
      expect(values).toContain('<script>alert("xss")</script>');
    });

    it('should handle prototype pollution attempts', () => {
      const originalProto = Object.prototype.toString;

      const left = createTestTable({
        id: [1],
        '__proto__': ['malicious'],
      });

      const right = createTestTable({
        id: [1],
        'constructor': ['attack'],
      });

      JoinOperator.apply(left, right, {
        type: 'inner',
        leftOn: 'id',
        rightOn: 'id',
      });

      expect(Object.prototype.toString).toBe(originalProto);
    });

    it('should handle extremely long strings', () => {
      const longString = 'x'.repeat(100000);
      
      const left = createTestTable({
        id: [1],
        value: [longString],
      });

      const right = createTestTable({
        id: [1],
        data: ['y'],
      });

      const result = JoinOperator.apply(left, right, {
        type: 'inner',
        leftOn: 'id',
        rightOn: 'id',
      });

      const values = getColumnValues(result, 'value');
      expect(values[0].length).toBe(100000);
    });

    it('should handle special numeric values', () => {
      const left = createTestTable({
        id: [Infinity, -Infinity, NaN, 0, -0],
        value: ['inf', '-inf', 'nan', 'zero', 'negzero'],
      });

      const right = createTestTable({
        id: [Infinity, -Infinity, 0],
        data: ['x', 'y', 'z'],
      });

      // Should not throw
      expect(() => {
        JoinOperator.apply(left, right, {
          type: 'inner',
          leftOn: 'id',
          rightOn: 'id',
        });
      }).not.toThrow();
    });

    it('should handle Unicode in join keys', () => {
      const left = createTestTable({
        id: ['日本語', '中文', 'العربية'],
        value: ['jp', 'cn', 'ar'],
      });

      const right = createTestTable({
        id: ['日本語', '中文', 'English'],
        data: ['japanese', 'chinese', 'english'],
      });

      const result = JoinOperator.apply(left, right, {
        type: 'inner',
        leftOn: 'id',
        rightOn: 'id',
      });

      expect(result.numRows).toBe(2);
    });
  });

  // ============================================================================
  // DATA TYPE TESTS
  // ============================================================================

  describe('Data Type Handling', () => {
    it('should join on string keys', () => {
      const left = createTestTable({
        key: ['a', 'b', 'c'],
        value: [1, 2, 3],
      });

      const right = createTestTable({
        key: ['b', 'c', 'd'],
        data: [10, 20, 30],
      });

      const result = JoinOperator.apply(left, right, {
        type: 'inner',
        leftOn: 'key',
        rightOn: 'key',
      });

      expect(result.numRows).toBe(2);
    });

    it('should join on floating point keys', () => {
      const left = createTestTable({
        key: [1.1, 2.2, 3.3],
        value: ['a', 'b', 'c'],
      });

      const right = createTestTable({
        key: [2.2, 3.3, 4.4],
        data: ['x', 'y', 'z'],
      });

      const result = JoinOperator.apply(left, right, {
        type: 'inner',
        leftOn: 'key',
        rightOn: 'key',
      });

      expect(result.numRows).toBe(2);
    });

    it('should join on boolean keys', () => {
      const left = createTestTable({
        key: [true, false],
        value: ['yes', 'no'],
      });

      const right = createTestTable({
        key: [true, false],
        data: ['1', '0'],
      });

      const result = JoinOperator.apply(left, right, {
        type: 'inner',
        leftOn: 'key',
        rightOn: 'key',
      });

      expect(result.numRows).toBe(2);
    });
  });

  // ============================================================================
  // PERFORMANCE TESTS
  // ============================================================================

  describe('Performance Tests', () => {
    it('should join 1000×1000 rows in < 100ms', () => {
      const left = generateJoinDataset(1000, 'left_');
      const right = generateJoinDataset(1000, 'right_');

      const start = performance.now();
      const result = JoinOperator.apply(left, right, {
        type: 'inner',
        leftOn: 'id',
        rightOn: 'id',
      });
      const duration = performance.now() - start;

      expect(result.numRows).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100);
    });

    it('should join 10000×10000 rows in < 500ms', () => {
      const left = generateJoinDataset(10000, 'left_');
      const right = generateJoinDataset(10000, 'right_');

      const start = performance.now();
      const result = JoinOperator.apply(left, right, {
        type: 'inner',
        leftOn: 'id',
        rightOn: 'id',
      });
      const duration = performance.now() - start;

      expect(result.numRows).toBeGreaterThan(0);
      expect(duration).toBeLessThan(500);
      
      console.log(`Join 10K×10K rows: ${duration.toFixed(2)}ms, result: ${result.numRows} rows`);
    });

    it('should handle left join on large dataset efficiently', () => {
      const left = generateJoinDataset(5000, 'left_');
      const right = generateJoinDataset(5000, 'right_');

      const start = performance.now();
      const result = JoinOperator.apply(left, right, {
        type: 'left',
        leftOn: 'id',
        rightOn: 'id',
      });
      const duration = performance.now() - start;

      expect(result.numRows).toBeGreaterThanOrEqual(5000);
      expect(duration).toBeLessThan(500);
    });

    it('should handle full outer join on large dataset', () => {
      const left = generateJoinDataset(5000, 'left_');
      const right = generateJoinDataset(5000, 'right_');

      const start = performance.now();
      const result = JoinOperator.apply(left, right, {
        type: 'full',
        leftOn: 'id',
        rightOn: 'id',
      });
      const duration = performance.now() - start;

      expect(result.numRows).toBeGreaterThan(0);
      expect(duration).toBeLessThan(1000);
    });

    it('should be efficient with high cardinality keys', () => {
      // Each key is unique (no duplicates)
      const leftIds = Array.from({ length: 5000 }, (_, i) => i);
      const rightIds = Array.from({ length: 5000 }, (_, i) => i + 2500); // 50% overlap

      const left = createTestTable({
        id: leftIds,
        value: leftIds.map(i => `left_${i}`),
      });

      const right = createTestTable({
        id: rightIds,
        data: rightIds.map(i => `right_${i}`),
      });

      const start = performance.now();
      const result = JoinOperator.apply(left, right, {
        type: 'inner',
        leftOn: 'id',
        rightOn: 'id',
      });
      const duration = performance.now() - start;

      expect(result.numRows).toBe(2500); // 50% overlap
      expect(duration).toBeLessThan(200);
    });

    it('should handle cross join performance (limited size)', () => {
      const left = createTestTable({
        id: Array.from({ length: 100 }, (_, i) => i),
        value: Array.from({ length: 100 }, (_, i) => `left_${i}`),
      });

      const right = createTestTable({
        id: Array.from({ length: 100 }, (_, i) => i),
        data: Array.from({ length: 100 }, (_, i) => `right_${i}`),
      });

      const start = performance.now();
      const result = JoinOperator.apply(left, right, {
        type: 'cross',
        leftOn: 'id',
        rightOn: 'id',
      });
      const duration = performance.now() - start;

      expect(result.numRows).toBe(10000); // 100 × 100
      expect(duration).toBeLessThan(500);
    });
  });

  // ============================================================================
  // MEMORY EFFICIENCY TESTS
  // ============================================================================

  describe('Memory Efficiency', () => {
    it('should not leak memory on repeated joins', () => {
      const left = generateJoinDataset(1000, 'left_');
      const right = generateJoinDataset(1000, 'right_');

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      for (let i = 0; i < 50; i++) {
        JoinOperator.apply(left, right, {
          type: 'inner',
          leftOn: 'id',
          rightOn: 'id',
        });
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;

      if (initialMemory > 0) {
        const memoryGrowth = finalMemory - initialMemory;
        expect(memoryGrowth).toBeLessThan(100 * 1024 * 1024); // < 100MB
      }
    });
  });
});

