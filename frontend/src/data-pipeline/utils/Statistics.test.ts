/**
 * Statistics Tests
 *
 * Comprehensive tests for Statistics utilities including:
 * - Basic statistics (min, max, count)
 * - Advanced statistics (mean, median, stddev, quartiles)
 * - Histogram computation
 * - Value counts
 * - Correlation
 * - Security tests
 * - Performance tests
 *
 * @author Toaster (Senior QA Engineer)
 */

import { describe, it, expect, beforeEach } from "vitest";
import { tableFromArrays, Table, vectorFromArray, Vector } from "apache-arrow";
import { Statistics, ColumnStats, TableStats } from "./Statistics";

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
 * Creates a vector from array.
 * Note: Arrow v14 requires homogeneous types. For mixed types, we convert to strings.
 */
function createVector(data: any[]): Vector {
  // Check if all values are of the same type (excluding null/undefined)
  const nonNullValues = data.filter(v => v !== null && v !== undefined);
  const types = new Set(nonNullValues.map(v => typeof v));
  
  // If mixed types, convert all to strings
  if (types.size > 1) {
    return vectorFromArray(data.map(v => v === null || v === undefined ? null : String(v)));
  }
  
  // Handle undefined by converting to null
  const cleanedData = data.map(v => v === undefined ? null : v);
  return vectorFromArray(cleanedData);
}

/**
 * Rounds to specified decimal places.
 */
function round(value: number, decimals: number): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

// ============================================================================
// BASIC COLUMN STATISTICS TESTS
// ============================================================================

describe("Statistics", () => {
  describe("Basic Column Stats", () => {
    it("should compute min and max for numeric column", () => {
      const column = createVector([5, 2, 8, 1, 9, 3]);
      const stats = Statistics.computeColumnStats(column);

      expect(stats.min).toBe(1);
      expect(stats.max).toBe(9);
    });

    it("should compute null count", () => {
      const column = createVector([1, null, 3, null, 5, null]);
      const stats = Statistics.computeColumnStats(column);

      expect(stats.nullCount).toBe(3);
    });

    it("should compute distinct count", () => {
      const column = createVector([1, 2, 2, 3, 3, 3, 4, 4, 4, 4]);
      const stats = Statistics.computeColumnStats(column, true);

      expect(stats.distinctCount).toBe(4);
    });

    it("should handle all same values", () => {
      const column = createVector([5, 5, 5, 5, 5]);
      const stats = Statistics.computeColumnStats(column, true);

      expect(stats.min).toBe(5);
      expect(stats.max).toBe(5);
      expect(stats.distinctCount).toBe(1);
    });

    it("should handle single value", () => {
      const column = createVector([42]);
      const stats = Statistics.computeColumnStats(column);

      expect(stats.min).toBe(42);
      expect(stats.max).toBe(42);
      expect(stats.nullCount).toBe(0);
    });

    it("should handle empty column", () => {
      const column = createVector([]);
      const stats = Statistics.computeColumnStats(column);

      expect(stats.min).toBeNull();
      expect(stats.max).toBeNull();
      expect(stats.nullCount).toBe(0);
    });

    it("should handle all null column", () => {
      const column = createVector([null, null, null]);
      const stats = Statistics.computeColumnStats(column);

      expect(stats.min).toBeNull();
      expect(stats.max).toBeNull();
      expect(stats.nullCount).toBe(3);
    });
  });

  // ============================================================================
  // ADVANCED STATISTICS TESTS
  // ============================================================================

  describe("Advanced Statistics", () => {
    it("should compute mean", () => {
      const column = createVector([1, 2, 3, 4, 5]);
      const stats = Statistics.computeColumnStats(column, false, true);

      expect(stats.mean).toBe(3);
    });

    it("should compute median for odd count", () => {
      const column = createVector([1, 3, 5, 7, 9]);
      const stats = Statistics.computeColumnStats(column, false, true);

      expect(stats.median).toBe(5);
    });

    it("should compute median for even count", () => {
      const column = createVector([1, 2, 3, 4]);
      const stats = Statistics.computeColumnStats(column, false, true);

      expect(stats.median).toBe(2.5);
    });

    it("should compute standard deviation", () => {
      const column = createVector([2, 4, 4, 4, 5, 5, 7, 9]);
      const stats = Statistics.computeColumnStats(column, false, true);

      // stddev = sqrt(4) = 2
      expect(round(stats.stddev!, 2)).toBe(2);
    });

    it("should compute quartiles", () => {
      const column = createVector([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const stats = Statistics.computeColumnStats(column, false, true);

      expect(stats.quartiles).toBeDefined();
      expect(stats.quartiles![0]).toBeCloseTo(2.75, 1); // Q1
      expect(stats.quartiles![1]).toBe(5.5); // Q2 (median)
      expect(stats.quartiles![2]).toBeCloseTo(7.75, 1); // Q3
    });

    it("should handle negative numbers in statistics", () => {
      const column = createVector([-10, -5, 0, 5, 10]);
      const stats = Statistics.computeColumnStats(column, false, true);

      expect(stats.min).toBe(-10);
      expect(stats.max).toBe(10);
      expect(stats.mean).toBe(0);
      expect(stats.median).toBe(0);
    });

    it("should handle floating point values", () => {
      const column = createVector([1.5, 2.5, 3.5, 4.5, 5.5]);
      const stats = Statistics.computeColumnStats(column, false, true);

      expect(stats.mean).toBe(3.5);
      expect(stats.median).toBe(3.5);
    });

    it("should not compute advanced stats for non-numeric columns", () => {
      const column = createVector(["a", "b", "c"]);
      const stats = Statistics.computeColumnStats(column, false, true);

      expect(stats.mean).toBeUndefined();
      expect(stats.median).toBeUndefined();
      expect(stats.stddev).toBeUndefined();
    });
  });

  // ============================================================================
  // TABLE STATISTICS TESTS
  // ============================================================================

  describe("Table Statistics", () => {
    it("should compute stats for all columns", () => {
      const table = createTestTable({
        id: [1, 2, 3, 4, 5],
        value: [10, 20, 30, 40, 50],
        name: ["a", "b", "c", "d", "e"],
      });

      const stats = Statistics.computeTableStats(table);

      expect(stats.rowCount).toBe(5);
      expect(stats.columnCount).toBe(3);
      expect(stats.columnStats.size).toBe(3);
    });

    it("should include stats for each column", () => {
      const table = createTestTable({
        numbers: [1, 2, 3],
        strings: ["x", "y", "z"],
      });

      const stats = Statistics.computeTableStats(table);

      expect(stats.columnStats.has("numbers")).toBe(true);
      expect(stats.columnStats.has("strings")).toBe(true);
    });

    it("should compute distinct counts when requested", () => {
      const table = createTestTable({
        value: [1, 1, 2, 2, 3],
      });

      const stats = Statistics.computeTableStats(table, true);
      const valueStats = stats.columnStats.get("value");

      expect(valueStats?.distinctCount).toBe(3);
    });

    it("should compute advanced stats when requested", () => {
      const table = createTestTable({
        value: [1, 2, 3, 4, 5],
      });

      const stats = Statistics.computeTableStats(table, false, true);
      const valueStats = stats.columnStats.get("value");

      expect(valueStats?.mean).toBe(3);
      expect(valueStats?.median).toBe(3);
    });
  });

  // ============================================================================
  // HISTOGRAM TESTS
  // ============================================================================

  describe("Histogram", () => {
    it("should compute histogram with default bins", () => {
      const column = createVector([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const histogram = Statistics.computeHistogram(column);

      expect(histogram.bins.length).toBe(11); // 10 bins + 1 edge
      expect(histogram.counts.length).toBe(10);
    });

    it("should compute histogram with custom bins", () => {
      const column = createVector([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const histogram = Statistics.computeHistogram(column, 5);

      expect(histogram.bins.length).toBe(6); // 5 bins + 1 edge
      expect(histogram.counts.length).toBe(5);
    });

    it("should distribute values correctly", () => {
      const column = createVector([1, 1, 1, 5, 5, 5, 9, 9, 9]);
      const histogram = Statistics.computeHistogram(column, 3);

      // Values should be distributed across 3 bins
      expect(histogram.counts.reduce((a, b) => a + b, 0)).toBe(9);
    });

    it("should handle single value", () => {
      const column = createVector([5, 5, 5, 5, 5]);
      const histogram = Statistics.computeHistogram(column, 5);

      // All values in same bin
      expect(histogram.counts.some((c) => c === 5)).toBe(true);
    });

    it("should handle empty column", () => {
      const column = createVector([]);
      const histogram = Statistics.computeHistogram(column);

      expect(histogram.bins.length).toBe(0);
      expect(histogram.counts.length).toBe(0);
    });

    it("should handle null values in numeric data", () => {
      const column = createVector([1, null, 2, null, 3]);
      const histogram = Statistics.computeHistogram(column);

      // Should only count non-null values
      expect(histogram.counts.reduce((a, b) => a + b, 0)).toBe(3);
    });

    it("should handle negative values", () => {
      const column = createVector([-10, -5, 0, 5, 10]);
      const histogram = Statistics.computeHistogram(column, 4);

      expect(histogram.bins[0]).toBe(-10);
      expect(histogram.bins[histogram.bins.length - 1]).toBe(10);
    });
  });

  // ============================================================================
  // VALUE COUNTS TESTS
  // ============================================================================

  describe("Value Counts", () => {
    it("should count value frequencies", () => {
      const column = createVector(["a", "b", "a", "c", "a", "b"]);
      const counts = Statistics.computeValueCounts(column);

      expect(counts.get('"a"')).toBe(3);
      expect(counts.get('"b"')).toBe(2);
      expect(counts.get('"c"')).toBe(1);
    });

    it("should return top N values", () => {
      const column = createVector(["a", "a", "a", "b", "b", "c"]);
      const counts = Statistics.computeValueCounts(column, 2);

      expect(counts.size).toBe(2);
      expect(counts.get('"a"')).toBe(3);
      expect(counts.get('"b"')).toBe(2);
    });

    it("should handle numeric values", () => {
      const column = createVector([1, 2, 1, 3, 1, 2]);
      const counts = Statistics.computeValueCounts(column);

      expect(counts.get("1")).toBe(3);
      expect(counts.get("2")).toBe(2);
      expect(counts.get("3")).toBe(1);
    });

    it("should handle null values", () => {
      const column = createVector([1, null, 1, null, 1]);
      const counts = Statistics.computeValueCounts(column);

      expect(counts.get("1")).toBe(3);
      expect(counts.get("null")).toBe(2);
    });

    it("should handle boolean values", () => {
      const column = createVector([true, false, true, true, false]);
      const counts = Statistics.computeValueCounts(column);

      expect(counts.get("true")).toBe(3);
      expect(counts.get("false")).toBe(2);
    });

    it("should handle empty column", () => {
      const column = createVector([]);
      const counts = Statistics.computeValueCounts(column);

      expect(counts.size).toBe(0);
    });
  });

  // ============================================================================
  // CORRELATION TESTS
  // ============================================================================

  describe("Correlation", () => {
    it("should compute perfect positive correlation", () => {
      const column1 = createVector([1, 2, 3, 4, 5]);
      const column2 = createVector([2, 4, 6, 8, 10]);

      const correlation = Statistics.computeCorrelation(column1, column2);

      expect(correlation).toBeCloseTo(1, 5);
    });

    it("should compute perfect negative correlation", () => {
      const column1 = createVector([1, 2, 3, 4, 5]);
      const column2 = createVector([10, 8, 6, 4, 2]);

      const correlation = Statistics.computeCorrelation(column1, column2);

      expect(correlation).toBeCloseTo(-1, 5);
    });

    it("should compute no correlation", () => {
      const column1 = createVector([1, 2, 3, 4, 5]);
      const column2 = createVector([5, 5, 5, 5, 5]); // Constant

      const correlation = Statistics.computeCorrelation(column1, column2);

      // Correlation with constant is 0 (or undefined)
      expect(correlation).toBe(0);
    });

    it("should handle partial correlation", () => {
      const column1 = createVector([1, 2, 3, 4, 5]);
      const column2 = createVector([1, 3, 2, 5, 4]);

      const correlation = Statistics.computeCorrelation(column1, column2);

      // Should be between -1 and 1
      expect(correlation).toBeGreaterThan(-1);
      expect(correlation).toBeLessThan(1);
    });

    it("should handle null values in correlation", () => {
      const column1 = createVector([1, null, 3, null, 5]);
      const column2 = createVector([2, 4, null, 8, 10]);

      const correlation = Statistics.computeCorrelation(column1, column2);

      // Should still compute for valid pairs
      expect(typeof correlation).toBe("number");
    });

    it("should handle different length columns", () => {
      const column1 = createVector([1, 2, 3, 4, 5, 6, 7]);
      const column2 = createVector([2, 4, 6]);

      const correlation = Statistics.computeCorrelation(column1, column2);

      // Should only use overlapping values
      expect(correlation).toBeCloseTo(1, 5);
    });

    it("should return 0 for insufficient data", () => {
      const column1 = createVector([1]);
      const column2 = createVector([2]);

      const correlation = Statistics.computeCorrelation(column1, column2);

      expect(correlation).toBe(0);
    });

    it("should handle empty columns", () => {
      const column1 = createVector([]);
      const column2 = createVector([]);

      const correlation = Statistics.computeCorrelation(column1, column2);

      expect(correlation).toBe(0);
    });
  });

  // ============================================================================
  // STRING COLUMN STATISTICS TESTS
  // ============================================================================

  describe("String Column Statistics", () => {
    it("should compute min/max for strings (lexicographic)", () => {
      const column = createVector(["banana", "apple", "cherry"]);
      const stats = Statistics.computeColumnStats(column);

      expect(stats.min).toBe("apple");
      expect(stats.max).toBe("cherry");
    });

    it("should compute distinct count for strings", () => {
      const column = createVector(["a", "b", "a", "c", "b", "a"]);
      const stats = Statistics.computeColumnStats(column, true);

      expect(stats.distinctCount).toBe(3);
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe("Edge Cases", () => {
    it("should handle very large numbers", () => {
      const column = createVector([Number.MAX_SAFE_INTEGER, 1, 2]);
      const stats = Statistics.computeColumnStats(column, false, true);

      expect(stats.max).toBe(Number.MAX_SAFE_INTEGER);
    });

    it("should handle very small numbers", () => {
      const column = createVector([Number.MIN_SAFE_INTEGER, 1, 2]);
      const stats = Statistics.computeColumnStats(column, false, true);

      expect(stats.min).toBe(Number.MIN_SAFE_INTEGER);
    });

    it("should handle Infinity values", () => {
      const column = createVector([Infinity, 1, 2, -Infinity]);
      const stats = Statistics.computeColumnStats(column);

      expect(stats.min).toBe(-Infinity);
      expect(stats.max).toBe(Infinity);
    });

    it("should handle NaN values", () => {
      const column = createVector([1, NaN, 3]);
      const stats = Statistics.computeColumnStats(column, false, true);

      // NaN should be handled gracefully
      expect(stats).toBeDefined();
    });

    it("should handle mixed types", () => {
      const column = createVector([1, "text", true, null, { obj: 1 }]);
      const stats = Statistics.computeColumnStats(column, true);

      expect(stats.distinctCount).toBeGreaterThan(0);
    });

    it("should handle undefined values", () => {
      const column = createVector([1, undefined, 3]);
      const stats = Statistics.computeColumnStats(column);

      expect(stats.nullCount).toBe(1);
    });
  });

  // ============================================================================
  // SECURITY TESTS
  // ============================================================================

  describe("Security Tests", () => {
    it("should handle SQL injection in string values", () => {
      const column = createVector(["'; DROP TABLE users; --", "normal"]);
      const stats = Statistics.computeColumnStats(column, true);

      expect(stats.distinctCount).toBe(2);
    });

    it("should handle XSS in string values", () => {
      const column = createVector(['<script>alert("xss")</script>', "normal"]);
      const stats = Statistics.computeColumnStats(column, true);

      expect(stats.distinctCount).toBe(2);
    });

    it("should handle prototype pollution attempts", () => {
      const originalProto = Object.prototype.toString;

      const column = createVector(["__proto__", "constructor", "normal"]);
      Statistics.computeColumnStats(column, true);

      expect(Object.prototype.toString).toBe(originalProto);
    });

    it("should handle very long strings", () => {
      const longString = "x".repeat(100000);
      const column = createVector([longString, "short"]);
      const stats = Statistics.computeColumnStats(column, true);

      expect(stats.distinctCount).toBe(2);
    });
  });

  // ============================================================================
  // PERFORMANCE TESTS
  // ============================================================================

  describe("Performance Tests", () => {
    it("should compute basic stats on 100,000 values in < 100ms", () => {
      const data = Array.from({ length: 100000 }, () => Math.random() * 1000);
      const column = createVector(data);

      const start = performance.now();
      const stats = Statistics.computeColumnStats(column);
      const duration = performance.now() - start;

      expect(stats.min).toBeDefined();
      expect(stats.max).toBeDefined();
      expect(duration).toBeLessThan(100);
    });

    it("should compute distinct count on 100,000 values in < 500ms", () => {
      const data = Array.from({ length: 100000 }, (_, i) => i % 1000);
      const column = createVector(data);

      const start = performance.now();
      const stats = Statistics.computeColumnStats(column, true);
      const duration = performance.now() - start;

      expect(stats.distinctCount).toBe(1000);
      expect(duration).toBeLessThan(500);
    });

    it("should compute advanced stats on 100,000 values in < 500ms", () => {
      const data = Array.from({ length: 100000 }, () => Math.random() * 1000);
      const column = createVector(data);

      const start = performance.now();
      const stats = Statistics.computeColumnStats(column, false, true);
      const duration = performance.now() - start;

      expect(stats.mean).toBeDefined();
      expect(stats.median).toBeDefined();
      expect(stats.stddev).toBeDefined();
      expect(duration).toBeLessThan(500);
    });

    it("should compute histogram on 100,000 values in < 200ms", () => {
      const data = Array.from({ length: 100000 }, () => Math.random() * 1000);
      const column = createVector(data);

      const start = performance.now();
      const histogram = Statistics.computeHistogram(column, 100);
      const duration = performance.now() - start;

      expect(histogram.counts.reduce((a, b) => a + b, 0)).toBe(100000);
      expect(duration).toBeLessThan(200);
    });

    it("should compute table stats efficiently", () => {
      const table = createTestTable({
        col1: Array.from({ length: 50000 }, () => Math.random()),
        col2: Array.from({ length: 50000 }, () => Math.random()),
        col3: Array.from({ length: 50000 }, (_, i) => `item_${i % 100}`),
      });

      const start = performance.now();
      const stats = Statistics.computeTableStats(table, true, true);
      const duration = performance.now() - start;

      expect(stats.columnStats.size).toBe(3);
      expect(duration).toBeLessThan(1000);
    });

    it("should compute correlation efficiently", () => {
      const data1 = Array.from({ length: 100000 }, () => Math.random() * 1000);
      const data2 = Array.from({ length: 100000 }, () => Math.random() * 1000);
      const column1 = createVector(data1);
      const column2 = createVector(data2);

      const start = performance.now();
      const correlation = Statistics.computeCorrelation(column1, column2);
      const duration = performance.now() - start;

      expect(correlation).toBeGreaterThanOrEqual(-1);
      expect(correlation).toBeLessThanOrEqual(1);
      expect(duration).toBeLessThan(500);
    });
  });

  // ============================================================================
  // ACCURACY TESTS
  // ============================================================================

  describe("Accuracy Tests", () => {
    it("should compute accurate mean for known dataset", () => {
      const column = createVector([10, 20, 30, 40, 50]);
      const stats = Statistics.computeColumnStats(column, false, true);

      expect(stats.mean).toBe(30);
    });

    it("should compute accurate stddev for known dataset", () => {
      // Dataset with known stddev
      const column = createVector([10, 20, 30, 40, 50]);
      const stats = Statistics.computeColumnStats(column, false, true);

      // Population stddev should be sqrt(200) ≈ 14.14
      expect(round(stats.stddev!, 2)).toBeCloseTo(14.14, 1);
    });

    it("should compute accurate quartiles for known dataset", () => {
      const column = createVector([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      const stats = Statistics.computeColumnStats(column, false, true);

      expect(stats.quartiles![1]).toBe(6.5); // Median
    });
  });
});
