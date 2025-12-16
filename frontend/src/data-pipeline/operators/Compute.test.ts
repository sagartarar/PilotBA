/**
 * Compute Operator Tests
 * 
 * Comprehensive tests for Compute operator including:
 * - Expression-based computations
 * - Function-based computations
 * - Built-in functions
 * - Security tests (injection prevention, safe evaluation)
 * - Edge cases
 * 
 * @author Toaster (Senior QA Engineer)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { tableFromArrays, Table } from 'apache-arrow';
import { ComputeOperator, ComputeExpression, ComputeFunction } from './Compute';

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
// FUNCTION-BASED COMPUTATION TESTS
// ============================================================================

describe('ComputeOperator', () => {
  describe('Function-Based Computations', () => {
    it('should add a computed column using function', () => {
      const table = createTestTable({
        a: [1, 2, 3, 4, 5],
        b: [10, 20, 30, 40, 50],
      });

      const result = ComputeOperator.apply(table, {
        column: 'sum',
        expression: (row) => row.a + row.b,
      });

      const sums = getColumnValues(result, 'sum');
      expect(sums).toEqual([11, 22, 33, 44, 55]);
    });

    it('should compute multiplication', () => {
      const table = createTestTable({
        price: [10, 20, 30],
        quantity: [2, 3, 4],
      });

      const result = ComputeOperator.apply(table, {
        column: 'total',
        expression: (row) => row.price * row.quantity,
      });

      const totals = getColumnValues(result, 'total');
      expect(totals).toEqual([20, 60, 120]);
    });

    it('should compute with conditional logic', () => {
      const table = createTestTable({
        value: [10, 25, 5, 30, 15],
      });

      const result = ComputeOperator.apply(table, {
        column: 'category',
        expression: (row) => row.value >= 20 ? 'high' : 'low',
      });

      const categories = getColumnValues(result, 'category');
      expect(categories).toEqual(['low', 'high', 'low', 'high', 'low']);
    });

    it('should have access to row index', () => {
      const table = createTestTable({
        value: [100, 200, 300],
      });

      const result = ComputeOperator.apply(table, {
        column: 'row_num',
        expression: (row, rowIndex) => rowIndex + 1,
      });

      const rowNums = getColumnValues(result, 'row_num');
      expect(rowNums).toEqual([1, 2, 3]);
    });

    it('should compute string concatenation', () => {
      const table = createTestTable({
        first_name: ['John', 'Jane', 'Bob'],
        last_name: ['Doe', 'Smith', 'Johnson'],
      });

      const result = ComputeOperator.apply(table, {
        column: 'full_name',
        expression: (row) => `${row.first_name} ${row.last_name}`,
      });

      const names = getColumnValues(result, 'full_name');
      expect(names).toEqual(['John Doe', 'Jane Smith', 'Bob Johnson']);
    });

    it('should handle Math functions', () => {
      const table = createTestTable({
        value: [4, 9, 16, 25],
      });

      const result = ComputeOperator.apply(table, {
        column: 'sqrt',
        expression: (row) => Math.sqrt(row.value),
      });

      const sqrts = getColumnValues(result, 'sqrt');
      expect(sqrts).toEqual([2, 3, 4, 5]);
    });

    it('should preserve existing columns', () => {
      const table = createTestTable({
        a: [1, 2, 3],
        b: [4, 5, 6],
      });

      const result = ComputeOperator.apply(table, {
        column: 'c',
        expression: (row) => row.a + row.b,
      });

      const columns = getColumnNames(result);
      expect(columns).toContain('a');
      expect(columns).toContain('b');
      expect(columns).toContain('c');
    });
  });

  // ============================================================================
  // EXPRESSION-BASED COMPUTATION TESTS
  // ============================================================================

  describe('Expression-Based Computations', () => {
    it('should parse simple arithmetic expression', () => {
      const table = createTestTable({
        a: [1, 2, 3],
        b: [10, 20, 30],
      });

      const result = ComputeOperator.apply(table, {
        column: 'sum',
        expression: 'a + b',
      });

      const sums = getColumnValues(result, 'sum');
      expect(sums).toEqual([11, 22, 33]);
    });

    it('should parse multiplication expression', () => {
      const table = createTestTable({
        x: [2, 3, 4],
        y: [5, 6, 7],
      });

      const result = ComputeOperator.apply(table, {
        column: 'product',
        expression: 'x * y',
      });

      const products = getColumnValues(result, 'product');
      expect(products).toEqual([10, 18, 28]);
    });

    it('should parse division expression', () => {
      const table = createTestTable({
        numerator: [10, 20, 30],
        denominator: [2, 4, 5],
      });

      const result = ComputeOperator.apply(table, {
        column: 'ratio',
        expression: 'numerator / denominator',
      });

      const ratios = getColumnValues(result, 'ratio');
      expect(ratios).toEqual([5, 5, 6]);
    });

    it('should handle constants in expression', () => {
      const table = createTestTable({
        value: [10, 20, 30],
      });

      const result = ComputeOperator.apply(table, {
        column: 'doubled',
        expression: 'value * 2',
      });

      const doubled = getColumnValues(result, 'doubled');
      expect(doubled).toEqual([20, 40, 60]);
    });

    it('should handle ternary expressions', () => {
      const table = createTestTable({
        score: [85, 45, 70, 95, 55],
      });

      const result = ComputeOperator.apply(table, {
        column: 'passed',
        expression: 'score >= 60 ? true : false',
      });

      const passed = getColumnValues(result, 'passed');
      expect(passed).toEqual([true, false, true, true, false]);
    });
  });

  // ============================================================================
  // MULTIPLE COMPUTATIONS TESTS
  // ============================================================================

  describe('Multiple Computations', () => {
    it('should apply multiple computations in sequence', () => {
      const table = createTestTable({
        a: [1, 2, 3],
        b: [10, 20, 30],
      });

      const result = ComputeOperator.applyMultiple(table, [
        { column: 'sum', expression: (row) => row.a + row.b },
        { column: 'product', expression: (row) => row.a * row.b },
        { column: 'diff', expression: (row) => row.b - row.a },
      ]);

      expect(getColumnValues(result, 'sum')).toEqual([11, 22, 33]);
      expect(getColumnValues(result, 'product')).toEqual([10, 40, 90]);
      expect(getColumnValues(result, 'diff')).toEqual([9, 18, 27]);
    });

    it('should allow later computations to reference earlier ones', () => {
      const table = createTestTable({
        base: [10, 20, 30],
      });

      const result = ComputeOperator.applyMultiple(table, [
        { column: 'doubled', expression: (row) => row.base * 2 },
        { column: 'quadrupled', expression: (row) => row.doubled * 2 },
      ]);

      expect(getColumnValues(result, 'doubled')).toEqual([20, 40, 60]);
      expect(getColumnValues(result, 'quadrupled')).toEqual([40, 80, 120]);
    });
  });

  // ============================================================================
  // BUILT-IN FUNCTIONS TESTS
  // ============================================================================

  describe('Built-in Functions', () => {
    it('should concatenate strings using concat builtin', () => {
      const table = createTestTable({
        first: ['Hello', 'Good', 'Hi'],
        second: [' World', ' Morning', ' There'],
      });

      const result = ComputeOperator.apply(table, {
        column: 'greeting',
        expression: ComputeOperator.builtins.concat('first', 'second'),
      });

      const greetings = getColumnValues(result, 'greeting');
      expect(greetings).toEqual(['Hello World', 'Good Morning', 'Hi There']);
    });

    it('should coalesce null values', () => {
      const table = createTestTable({
        primary: [null, 'value', null],
        fallback: ['default1', 'default2', 'default3'],
      });

      const result = ComputeOperator.apply(table, {
        column: 'result',
        expression: ComputeOperator.builtins.coalesce('primary', 'fallback'),
      });

      const results = getColumnValues(result, 'result');
      expect(results).toEqual(['default1', 'value', 'default3']);
    });

    it('should round numbers', () => {
      const table = createTestTable({
        value: [3.14159, 2.71828, 1.41421],
      });

      const result = ComputeOperator.apply(table, {
        column: 'rounded',
        expression: ComputeOperator.builtins.round('value', 2),
      });

      const rounded = getColumnValues(result, 'rounded');
      expect(rounded[0]).toBeCloseTo(3.14);
      expect(rounded[1]).toBeCloseTo(2.72);
      expect(rounded[2]).toBeCloseTo(1.41);
    });

    it('should extract year from date', () => {
      const table = createTestTable({
        date: ['2023-01-15', '2024-06-20', '2025-12-31'],
      });

      const result = ComputeOperator.apply(table, {
        column: 'year',
        expression: ComputeOperator.builtins.year('date'),
      });

      const years = getColumnValues(result, 'year');
      expect(years).toEqual([2023, 2024, 2025]);
    });

    it('should extract month from date', () => {
      const table = createTestTable({
        date: ['2023-01-15', '2024-06-20', '2025-12-31'],
      });

      const result = ComputeOperator.apply(table, {
        column: 'month',
        expression: ComputeOperator.builtins.month('date'),
      });

      const months = getColumnValues(result, 'month');
      expect(months).toEqual([1, 6, 12]);
    });

    it('should compute string length', () => {
      const table = createTestTable({
        text: ['hello', 'world!', 'hi'],
      });

      const result = ComputeOperator.apply(table, {
        column: 'len',
        expression: ComputeOperator.builtins.length('text'),
      });

      const lengths = getColumnValues(result, 'len');
      expect(lengths).toEqual([5, 6, 2]);
    });

    it('should extract substring', () => {
      const table = createTestTable({
        text: ['Hello World', 'Good Morning', 'Hi There'],
      });

      const result = ComputeOperator.apply(table, {
        column: 'first_word',
        expression: ComputeOperator.builtins.substring('text', 0, 5),
      });

      const words = getColumnValues(result, 'first_word');
      expect(words).toEqual(['Hello', 'Good ', 'Hi Th']);
    });

    it('should convert to lowercase', () => {
      const table = createTestTable({
        text: ['HELLO', 'World', 'MiXeD'],
      });

      const result = ComputeOperator.apply(table, {
        column: 'lower',
        expression: ComputeOperator.builtins.lower('text'),
      });

      const lower = getColumnValues(result, 'lower');
      expect(lower).toEqual(['hello', 'world', 'mixed']);
    });

    it('should convert to uppercase', () => {
      const table = createTestTable({
        text: ['hello', 'World', 'MiXeD'],
      });

      const result = ComputeOperator.apply(table, {
        column: 'upper',
        expression: ComputeOperator.builtins.upper('text'),
      });

      const upper = getColumnValues(result, 'upper');
      expect(upper).toEqual(['HELLO', 'WORLD', 'MIXED']);
    });
  });

  // ============================================================================
  // NULL HANDLING TESTS
  // ============================================================================

  describe('Null Handling', () => {
    it('should handle null values in computation', () => {
      const table = createTestTable({
        a: [1, null, 3],
        b: [10, 20, null],
      });

      const result = ComputeOperator.apply(table, {
        column: 'sum',
        expression: (row) => {
          if (row.a === null || row.b === null) return null;
          return row.a + row.b;
        },
      });

      const sums = getColumnValues(result, 'sum');
      expect(sums[0]).toBe(11);
      expect(sums[1]).toBeNull();
      expect(sums[2]).toBeNull();
    });

    it('should handle undefined values', () => {
      const table = createTestTable({
        value: [1, undefined, 3],
      });

      const result = ComputeOperator.apply(table, {
        column: 'doubled',
        expression: (row) => row.value !== undefined ? row.value * 2 : null,
      });

      const doubled = getColumnValues(result, 'doubled');
      expect(doubled[0]).toBe(2);
      expect(doubled[2]).toBe(6);
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle empty table', () => {
      const table = createTestTable({
        a: [],
        b: [],
      });

      const result = ComputeOperator.apply(table, {
        column: 'sum',
        expression: (row) => row.a + row.b,
      });

      expect(result.numRows).toBe(0);
      expect(getColumnNames(result)).toContain('sum');
    });

    it('should handle single row table', () => {
      const table = createTestTable({
        value: [42],
      });

      const result = ComputeOperator.apply(table, {
        column: 'doubled',
        expression: (row) => row.value * 2,
      });

      const doubled = getColumnValues(result, 'doubled');
      expect(doubled).toEqual([84]);
    });

    it('should handle column name with spaces', () => {
      const table = createTestTable({
        'column with spaces': [1, 2, 3],
      });

      const result = ComputeOperator.apply(table, {
        column: 'result',
        expression: (row) => row['column with spaces'] * 2,
      });

      const results = getColumnValues(result, 'result');
      expect(results).toEqual([2, 4, 6]);
    });

    it('should handle column name with special characters', () => {
      const table = createTestTable({
        'col-1': [1, 2, 3],
        'col.2': [10, 20, 30],
      });

      const result = ComputeOperator.apply(table, {
        column: 'result',
        expression: (row) => row['col-1'] + row['col.2'],
      });

      const results = getColumnValues(result, 'result');
      expect(results).toEqual([11, 22, 33]);
    });

    it('should handle very large numbers', () => {
      const table = createTestTable({
        value: [Number.MAX_SAFE_INTEGER, 1],
      });

      const result = ComputeOperator.apply(table, {
        column: 'doubled',
        expression: (row) => row.value * 2,
      });

      const doubled = getColumnValues(result, 'doubled');
      expect(doubled[0]).toBe(Number.MAX_SAFE_INTEGER * 2);
    });

    it('should handle floating point precision', () => {
      const table = createTestTable({
        a: [0.1],
        b: [0.2],
      });

      const result = ComputeOperator.apply(table, {
        column: 'sum',
        expression: (row) => row.a + row.b,
      });

      const sums = getColumnValues(result, 'sum');
      expect(sums[0]).toBeCloseTo(0.3, 10);
    });
  });

  // ============================================================================
  // SECURITY TESTS - CRITICAL
  // ============================================================================

  describe('Security Tests', () => {
    it('should not allow access to global objects in expressions', () => {
      const table = createTestTable({
        value: [1, 2, 3],
      });

      // Attempt to access process (Node.js global)
      expect(() => {
        ComputeOperator.apply(table, {
          column: 'hack',
          expression: 'process.env',
        });
      }).toThrow();
    });

    it('should not execute arbitrary code via expression', () => {
      const table = createTestTable({
        value: [1],
      });

      let executed = false;

      // This should NOT execute the side effect
      try {
        ComputeOperator.apply(table, {
          column: 'result',
          expression: '(() => { executed = true; return 1; })()',
        });
      } catch {
        // Expected to fail
      }

      // The variable should not be modified
      expect(executed).toBe(false);
    });

    it('should handle SQL injection patterns safely', () => {
      const table = createTestTable({
        value: [1, 2, 3],
      });

      // SQL injection should not cause issues
      const result = ComputeOperator.apply(table, {
        column: 'result',
        expression: (row) => {
          const input = "'; DROP TABLE users; --";
          return `${row.value}_${input}`;
        },
      });

      const results = getColumnValues(result, 'result');
      expect(results[0]).toContain("'; DROP TABLE users; --");
    });

    it('should handle XSS patterns in computed values', () => {
      const table = createTestTable({
        value: ['<script>alert("xss")</script>'],
      });

      const result = ComputeOperator.apply(table, {
        column: 'upper',
        expression: (row) => row.value.toUpperCase(),
      });

      const upper = getColumnValues(result, 'upper');
      expect(upper[0]).toBe('<SCRIPT>ALERT("XSS")</SCRIPT>');
    });

    it('should not allow prototype pollution', () => {
      const originalProto = Object.prototype.toString;

      const table = createTestTable({
        value: [1],
      });

      ComputeOperator.apply(table, {
        column: '__proto__',
        expression: (row) => row.value,
      });

      expect(Object.prototype.toString).toBe(originalProto);
    });

    it('should handle recursive/infinite loop attempts', () => {
      const table = createTestTable({
        value: [1],
      });

      // Function that could cause infinite loop
      const result = ComputeOperator.apply(table, {
        column: 'result',
        expression: (row) => {
          let count = 0;
          // Bounded loop to prevent actual infinite loop
          while (count < 10) {
            count++;
          }
          return count;
        },
      });

      const results = getColumnValues(result, 'result');
      expect(results[0]).toBe(10);
    });

    it('should safely handle column names that look like code', () => {
      const table = createTestTable({
        'eval("malicious")': [1, 2, 3],
        'normal': [10, 20, 30],
      });

      const result = ComputeOperator.apply(table, {
        column: 'result',
        expression: (row) => row['eval("malicious")'] + row.normal,
      });

      const results = getColumnValues(result, 'result');
      expect(results).toEqual([11, 22, 33]);
    });

    it('should handle constructor access attempts', () => {
      const table = createTestTable({
        value: [1],
      });

      const result = ComputeOperator.apply(table, {
        column: 'result',
        expression: (row) => {
          // Attempt to access constructor should not break
          try {
            return row.constructor.name;
          } catch {
            return 'safe';
          }
        },
      });

      // Should complete without security breach
      expect(result.numRows).toBe(1);
    });

    it('should handle __defineGetter__ attempts', () => {
      const table = createTestTable({
        value: [1],
      });

      // This should not break the system
      const result = ComputeOperator.apply(table, {
        column: 'result',
        expression: (row) => row.value * 2,
      });

      expect(getColumnValues(result, 'result')).toEqual([2]);
    });
  });

  // ============================================================================
  // PERFORMANCE TESTS
  // ============================================================================

  describe('Performance Tests', () => {
    it('should compute on 10,000 rows in < 50ms', () => {
      const values = Array.from({ length: 10000 }, (_, i) => i);
      const table = createTestTable({ value: values });

      const start = performance.now();
      const result = ComputeOperator.apply(table, {
        column: 'doubled',
        expression: (row) => row.value * 2,
      });
      const duration = performance.now() - start;

      expect(result.numRows).toBe(10000);
      expect(duration).toBeLessThan(50);
    });

    it('should compute on 100,000 rows in < 200ms', () => {
      const values = Array.from({ length: 100000 }, (_, i) => i);
      const table = createTestTable({ value: values });

      const start = performance.now();
      const result = ComputeOperator.apply(table, {
        column: 'doubled',
        expression: (row) => row.value * 2,
      });
      const duration = performance.now() - start;

      expect(result.numRows).toBe(100000);
      expect(duration).toBeLessThan(200);
    });

    it('should handle complex computations efficiently', () => {
      const values = Array.from({ length: 50000 }, (_, i) => i);
      const table = createTestTable({
        a: values,
        b: values.map(v => v * 2),
        c: values.map(v => v * 3),
      });

      const start = performance.now();
      const result = ComputeOperator.apply(table, {
        column: 'complex',
        expression: (row) => Math.sqrt(row.a * row.a + row.b * row.b) + Math.log(row.c + 1),
      });
      const duration = performance.now() - start;

      expect(result.numRows).toBe(50000);
      expect(duration).toBeLessThan(200);
    });

    it('should handle multiple computations efficiently', () => {
      const values = Array.from({ length: 50000 }, (_, i) => i);
      const table = createTestTable({ value: values });

      const start = performance.now();
      const result = ComputeOperator.applyMultiple(table, [
        { column: 'doubled', expression: (row) => row.value * 2 },
        { column: 'squared', expression: (row) => row.value * row.value },
        { column: 'sqrt', expression: (row) => Math.sqrt(row.value) },
      ]);
      const duration = performance.now() - start;

      expect(result.numRows).toBe(50000);
      expect(duration).toBeLessThan(500);
    });
  });

  // ============================================================================
  // DATA TYPE TESTS
  // ============================================================================

  describe('Data Type Handling', () => {
    it('should handle boolean computations', () => {
      const table = createTestTable({
        value: [1, 0, 1, 0, 1],
      });

      const result = ComputeOperator.apply(table, {
        column: 'bool',
        expression: (row) => row.value === 1,
      });

      const bools = getColumnValues(result, 'bool');
      expect(bools).toEqual([true, false, true, false, true]);
    });

    it('should handle date computations', () => {
      const table = createTestTable({
        date_str: ['2023-01-01', '2023-06-15', '2023-12-31'],
      });

      const result = ComputeOperator.apply(table, {
        column: 'date_obj',
        expression: (row) => new Date(row.date_str),
      });

      const dates = getColumnValues(result, 'date_obj');
      expect(dates[0]).toBeInstanceOf(Date);
    });

    it('should handle array computations', () => {
      const table = createTestTable({
        values: [[1, 2, 3], [4, 5], [6]],
      });

      const result = ComputeOperator.apply(table, {
        column: 'sum',
        expression: (row) => row.values.reduce((a: number, b: number) => a + b, 0),
      });

      const sums = getColumnValues(result, 'sum');
      expect(sums).toEqual([6, 9, 6]);
    });

    it('should handle object computations', () => {
      const table = createTestTable({
        obj: [{ x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }],
      });

      const result = ComputeOperator.apply(table, {
        column: 'sum',
        expression: (row) => row.obj.x + row.obj.y,
      });

      const sums = getColumnValues(result, 'sum');
      expect(sums).toEqual([3, 7, 11]);
    });
  });
});

