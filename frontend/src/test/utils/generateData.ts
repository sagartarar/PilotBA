/**
 * Test Data Generator
 *
 * Generates test data for performance benchmarks.
 *
 * @author Toaster (Senior QA Engineer)
 */

/**
 * Generate CSV string with specified rows and columns
 */
export function generateCSV(rows: number, columns: number): string {
  const headers = Array.from({ length: columns }, (_, i) => `col_${i}`).join(
    ","
  );
  const lines = [headers];

  for (let i = 0; i < rows; i++) {
    const row = Array.from({ length: columns }, () =>
      Math.random() * 1000
    ).join(",");
    lines.push(row);
  }

  return lines.join("\n");
}

/**
 * Generate CSV with mixed data types
 */
export function generateMixedCSV(rows: number): string {
  const headers = ["id", "name", "value", "category", "date", "active"];
  const categories = ["Electronics", "Clothing", "Food", "Books", "Sports"];
  const lines = [headers.join(",")];

  for (let i = 0; i < rows; i++) {
    const row = [
      i + 1, // id
      `Item_${i}`, // name
      (Math.random() * 1000).toFixed(2), // value
      categories[Math.floor(Math.random() * categories.length)], // category
      new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // date
      Math.random() > 0.5 ? "true" : "false", // active
    ];
    lines.push(row.join(","));
  }

  return lines.join("\n");
}

/**
 * Generate JSON array data
 */
export function generateJSON(rows: number): string {
  const data = Array.from({ length: rows }, (_, i) => ({
    id: i + 1,
    name: `Item_${i}`,
    value: Math.random() * 1000,
    category: ["A", "B", "C", "D"][Math.floor(Math.random() * 4)],
    nested: {
      x: Math.random() * 100,
      y: Math.random() * 100,
    },
  }));

  return JSON.stringify(data);
}

/**
 * Generate chart data for visualization benchmarks
 */
export interface ChartData {
  columns: string[];
  values: number[][];
  encodings: { x: string; y: string; color?: string };
}

export function generateChartData(points: number): ChartData {
  return {
    columns: ["x", "y", "value"],
    values: Array.from({ length: points }, (_, i) => [
      i,
      Math.random() * 100,
      Math.random() * 1000,
    ]),
    encodings: { x: "x", y: "y", color: "value" },
  };
}

/**
 * Generate scatter plot data
 */
export function generateScatterData(
  points: number
): Array<{ x: number; y: number; size: number }> {
  return Array.from({ length: points }, () => ({
    x: Math.random() * 1000,
    y: Math.random() * 1000,
    size: Math.random() * 10 + 1,
  }));
}

/**
 * Generate data for filter benchmarks
 */
export function generateFilterableData(rows: number): {
  id: number[];
  value: number[];
  category: string[];
  name: string[];
} {
  const categories = ["A", "B", "C", "D", "E"];

  return {
    id: Array.from({ length: rows }, (_, i) => i),
    value: Array.from({ length: rows }, () => Math.random() * 1000),
    category: Array.from(
      { length: rows },
      () => categories[Math.floor(Math.random() * categories.length)]
    ),
    name: Array.from({ length: rows }, (_, i) => `item_${i}`),
  };
}

/**
 * Generate data for aggregation benchmarks
 */
export function generateAggregatableData(rows: number): {
  id: number[];
  value: number[];
  category: string[];
  region: string[];
} {
  const categories = ["Electronics", "Clothing", "Food", "Books", "Sports"];
  const regions = ["North", "South", "East", "West", "Central"];

  return {
    id: Array.from({ length: rows }, (_, i) => i),
    value: Array.from({ length: rows }, () => Math.random() * 1000),
    category: Array.from(
      { length: rows },
      () => categories[Math.floor(Math.random() * categories.length)]
    ),
    region: Array.from(
      { length: rows },
      () => regions[Math.floor(Math.random() * regions.length)]
    ),
  };
}

