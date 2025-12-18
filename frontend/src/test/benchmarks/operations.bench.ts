/**
 * Query Operations Performance Benchmarks
 *
 * Benchmarks for Filter, Sort, and Aggregate operations.
 *
 * Performance Targets (from PROJECT_ARCHITECTURE.md):
 * - Filter 1M rows: <50ms
 * - Aggregate 1M rows: <100ms
 *
 * @author Toaster (Senior QA Engineer)
 */
import { describe, it, expect, beforeAll } from "vitest";
import { tableFromArrays, Table } from "apache-arrow";
import { FilterOperator } from "../../data-pipeline/operators/Filter";
import { AggregateOperator } from "../../data-pipeline/operators/Aggregate";
import { SortOperator } from "../../data-pipeline/operators/Sort";
import {
  generateFilterableData,
  generateAggregatableData,
} from "../utils/generateData";

describe("Query Operations Performance", () => {
  // Test data sizes
  const SMALL_SIZE = 10_000;
  const MEDIUM_SIZE = 100_000;
  const LARGE_SIZE = 500_000; // Reduced from 1M for faster CI

  let smallTable: Table;
  let mediumTable: Table;
  let largeTable: Table;

  beforeAll(() => {
    // Generate test data once
    const smallData = generateFilterableData(SMALL_SIZE);
    const mediumData = generateFilterableData(MEDIUM_SIZE);
    const largeData = generateAggregatableData(LARGE_SIZE);

    smallTable = tableFromArrays(smallData);
    mediumTable = tableFromArrays(mediumData);
    largeTable = tableFromArrays(largeData);
  });

  describe("Filter Performance", () => {
    it(`should filter ${SMALL_SIZE.toLocaleString()} rows in <10ms`, () => {
      const start = performance.now();

      FilterOperator.apply(smallTable, {
        column: "value",
        operator: "gt",
        value: 500,
      });

      const duration = performance.now() - start;
      console.log(
        `Filter ${SMALL_SIZE.toLocaleString()} rows (numeric >): ${duration.toFixed(2)}ms`
      );
      expect(duration).toBeLessThan(10);
    });

    it(`should filter ${MEDIUM_SIZE.toLocaleString()} rows in <50ms`, () => {
      const start = performance.now();

      FilterOperator.apply(mediumTable, {
        column: "value",
        operator: "gt",
        value: 500,
      });

      const duration = performance.now() - start;
      console.log(
        `Filter ${MEDIUM_SIZE.toLocaleString()} rows (numeric >): ${duration.toFixed(2)}ms`
      );
      expect(duration).toBeLessThan(50);
    });

    it(`should filter ${LARGE_SIZE.toLocaleString()} rows in <100ms`, () => {
      const start = performance.now();

      FilterOperator.apply(largeTable, {
        column: "value",
        operator: "gt",
        value: 500,
      });

      const duration = performance.now() - start;
      console.log(
        `Filter ${LARGE_SIZE.toLocaleString()} rows (numeric >): ${duration.toFixed(2)}ms`
      );
      expect(duration).toBeLessThan(100);
    });

    it("should filter with string equality efficiently", () => {
      const start = performance.now();

      FilterOperator.apply(mediumTable, {
        column: "category",
        operator: "eq",
        value: "A",
      });

      const duration = performance.now() - start;
      console.log(
        `Filter ${MEDIUM_SIZE.toLocaleString()} rows (string eq): ${duration.toFixed(2)}ms`
      );
      expect(duration).toBeLessThan(100);
    });

    it("should filter with IN operator efficiently", () => {
      const start = performance.now();

      FilterOperator.apply(mediumTable, {
        column: "category",
        operator: "in",
        values: ["A", "B", "C"],
      });

      const duration = performance.now() - start;
      console.log(
        `Filter ${MEDIUM_SIZE.toLocaleString()} rows (IN): ${duration.toFixed(2)}ms`
      );
      expect(duration).toBeLessThan(150);
    });

    it("should filter with BETWEEN operator efficiently", () => {
      const start = performance.now();

      FilterOperator.apply(mediumTable, {
        column: "value",
        operator: "between",
        min: 200,
        max: 800,
      });

      const duration = performance.now() - start;
      console.log(
        `Filter ${MEDIUM_SIZE.toLocaleString()} rows (BETWEEN): ${duration.toFixed(2)}ms`
      );
      expect(duration).toBeLessThan(100);
    });

    it("should apply multiple filters efficiently", () => {
      const start = performance.now();

      FilterOperator.applyMultiple(mediumTable, [
        { column: "value", operator: "gt", value: 200 },
        { column: "category", operator: "eq", value: "A" },
      ]);

      const duration = performance.now() - start;
      console.log(
        `Filter ${MEDIUM_SIZE.toLocaleString()} rows (multiple): ${duration.toFixed(2)}ms`
      );
      expect(duration).toBeLessThan(200);
    });
  });

  describe("Sort Performance", () => {
    it(`should sort ${SMALL_SIZE.toLocaleString()} rows in <20ms`, () => {
      const start = performance.now();

      SortOperator.apply(smallTable, {
        column: "value",
        order: "asc",
      });

      const duration = performance.now() - start;
      console.log(
        `Sort ${SMALL_SIZE.toLocaleString()} rows: ${duration.toFixed(2)}ms`
      );
      expect(duration).toBeLessThan(20);
    });

    it(`should sort ${MEDIUM_SIZE.toLocaleString()} rows in <200ms`, () => {
      const start = performance.now();

      SortOperator.apply(mediumTable, {
        column: "value",
        order: "asc",
      });

      const duration = performance.now() - start;
      console.log(
        `Sort ${MEDIUM_SIZE.toLocaleString()} rows: ${duration.toFixed(2)}ms`
      );
      expect(duration).toBeLessThan(200);
    });

    it("should perform multi-column sort efficiently", () => {
      const start = performance.now();

      SortOperator.applyMultiple(smallTable, [
        { column: "category", order: "asc" },
        { column: "value", order: "desc" },
      ]);

      const duration = performance.now() - start;
      console.log(
        `Multi-sort ${SMALL_SIZE.toLocaleString()} rows: ${duration.toFixed(2)}ms`
      );
      expect(duration).toBeLessThan(50);
    });

    it("should perform partial sort (top-k) efficiently", () => {
      const start = performance.now();

      SortOperator.topK(mediumTable, { column: "value", order: "desc" }, 100);

      const duration = performance.now() - start;
      console.log(
        `Top-100 from ${MEDIUM_SIZE.toLocaleString()} rows: ${duration.toFixed(2)}ms`
      );
      expect(duration).toBeLessThan(100);
    });
  });

  describe("Aggregate Performance", () => {
    it(`should aggregate ${SMALL_SIZE.toLocaleString()} rows in <20ms`, () => {
      const start = performance.now();

      AggregateOperator.apply(smallTable, {
        groupBy: ["category"],
        aggregations: [{ column: "value", function: "sum", alias: "total" }],
      });

      const duration = performance.now() - start;
      console.log(
        `Aggregate ${SMALL_SIZE.toLocaleString()} rows (sum): ${duration.toFixed(2)}ms`
      );
      expect(duration).toBeLessThan(20);
    });

    it(`should aggregate ${MEDIUM_SIZE.toLocaleString()} rows in <100ms`, () => {
      const start = performance.now();

      AggregateOperator.apply(mediumTable, {
        groupBy: ["category"],
        aggregations: [{ column: "value", function: "sum", alias: "total" }],
      });

      const duration = performance.now() - start;
      console.log(
        `Aggregate ${MEDIUM_SIZE.toLocaleString()} rows (sum): ${duration.toFixed(2)}ms`
      );
      expect(duration).toBeLessThan(100);
    });

    it(`should aggregate ${LARGE_SIZE.toLocaleString()} rows in <200ms`, () => {
      const start = performance.now();

      AggregateOperator.apply(largeTable, {
        groupBy: ["category"],
        aggregations: [{ column: "value", function: "sum", alias: "total" }],
      });

      const duration = performance.now() - start;
      console.log(
        `Aggregate ${LARGE_SIZE.toLocaleString()} rows (sum): ${duration.toFixed(2)}ms`
      );
      expect(duration).toBeLessThan(200);
    });

    it("should compute multiple aggregations efficiently", () => {
      const start = performance.now();

      AggregateOperator.apply(mediumTable, {
        groupBy: ["category"],
        aggregations: [
          { column: "value", function: "sum", alias: "total" },
          { column: "value", function: "avg", alias: "average" },
          { column: "value", function: "count", alias: "count" },
          { column: "value", function: "min", alias: "minimum" },
          { column: "value", function: "max", alias: "maximum" },
        ],
      });

      const duration = performance.now() - start;
      console.log(
        `Multiple aggregations ${MEDIUM_SIZE.toLocaleString()} rows: ${duration.toFixed(2)}ms`
      );
      expect(duration).toBeLessThan(200);
    });

    it("should aggregate with multiple group-by columns efficiently", () => {
      const start = performance.now();

      AggregateOperator.apply(largeTable, {
        groupBy: ["category", "region"],
        aggregations: [{ column: "value", function: "sum", alias: "total" }],
      });

      const duration = performance.now() - start;
      console.log(
        `Multi-group aggregate ${LARGE_SIZE.toLocaleString()} rows: ${duration.toFixed(2)}ms`
      );
      expect(duration).toBeLessThan(300);
    });

    it("should compute simple aggregation without groupBy efficiently", () => {
      const start = performance.now();

      AggregateOperator.simpleAggregate(mediumTable, [
        { column: "value", function: "sum", alias: "total" },
        { column: "value", function: "avg", alias: "average" },
      ]);

      const duration = performance.now() - start;
      console.log(
        `Simple aggregate ${MEDIUM_SIZE.toLocaleString()} rows: ${duration.toFixed(2)}ms`
      );
      expect(duration).toBeLessThan(100);
    });
  });

  describe("Combined Operations Performance", () => {
    it("should filter then sort efficiently", () => {
      const start = performance.now();

      const filtered = FilterOperator.apply(mediumTable, {
        column: "value",
        operator: "gt",
        value: 500,
      });

      SortOperator.apply(filtered, {
        column: "value",
        order: "desc",
      });

      const duration = performance.now() - start;
      console.log(
        `Filter + Sort ${MEDIUM_SIZE.toLocaleString()} rows: ${duration.toFixed(2)}ms`
      );
      expect(duration).toBeLessThan(300);
    });

    it("should filter then aggregate efficiently", () => {
      const start = performance.now();

      const filtered = FilterOperator.apply(mediumTable, {
        column: "value",
        operator: "gt",
        value: 300,
      });

      AggregateOperator.apply(filtered, {
        groupBy: ["category"],
        aggregations: [{ column: "value", function: "sum", alias: "total" }],
      });

      const duration = performance.now() - start;
      console.log(
        `Filter + Aggregate ${MEDIUM_SIZE.toLocaleString()} rows: ${duration.toFixed(2)}ms`
      );
      expect(duration).toBeLessThan(200);
    });
  });
});

