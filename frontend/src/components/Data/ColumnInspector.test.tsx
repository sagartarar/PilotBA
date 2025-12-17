/**
 * ColumnInspector Component Tests
 * 
 * @author Toaster (Senior QA)
 * @date December 17, 2025
 * 
 * Tests column statistics display, type detection, histogram/value counts,
 * search functionality, and data visualization.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '../../test/utils/test-utils';
import { ColumnInspector } from './ColumnInspector';
import { Table, tableFromArrays } from 'apache-arrow';
import { ColumnInfo } from '../../store/dataStore';

// Mock Statistics module
vi.mock('../../data-pipeline/utils/Statistics', () => ({
  Statistics: {
    computeColumnStats: vi.fn().mockReturnValue({
      min: 0,
      max: 100,
      nullCount: 5,
      distinctCount: 50,
      mean: 45.5,
      median: 42,
      stddev: 15.3,
      quartiles: [25, 50, 75],
    }),
    computeHistogram: vi.fn().mockReturnValue({
      bins: [0, 20, 40, 60, 80, 100],
      counts: [10, 25, 30, 20, 15],
    }),
    computeValueCounts: vi.fn().mockReturnValue(
      new Map([
        [JSON.stringify('value1'), 30],
        [JSON.stringify('value2'), 25],
        [JSON.stringify('value3'), 20],
        [JSON.stringify(null), 10],
      ])
    ),
  },
}));

// Helper to create mock Arrow Table
function createMockTable(data: Record<string, any[]>): Table {
  return tableFromArrays(data);
}

// Helper to create mock column info
function createMockColumns(): ColumnInfo[] {
  return [
    { name: 'id', type: 'Int32', nullable: false, nullCount: 0, distinctCount: 100 },
    { name: 'name', type: 'Utf8', nullable: true, nullCount: 2, distinctCount: 95 },
    { name: 'price', type: 'Float64', nullable: true, nullCount: 5, distinctCount: 80 },
    { name: 'active', type: 'Bool', nullable: false, nullCount: 0, distinctCount: 2 },
    { name: 'created_at', type: 'Timestamp<MILLISECOND>', nullable: true, nullCount: 3, distinctCount: 98 },
  ];
}

describe('ColumnInspector', () => {
  let mockTable: Table;
  let mockColumns: ColumnInfo[];

  beforeEach(() => {
    mockTable = createMockTable({
      id: Array.from({ length: 100 }, (_, i) => i + 1),
      name: Array.from({ length: 100 }, (_, i) => `Item ${i}`),
      price: Array.from({ length: 100 }, (_, i) => Math.random() * 100),
      active: Array.from({ length: 100 }, (_, i) => i % 2 === 0),
      created_at: Array.from({ length: 100 }, () => Date.now()),
    });
    mockColumns = createMockColumns();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Column List', () => {
    it('should display all columns in the sidebar', () => {
      render(<ColumnInspector table={mockTable} columns={mockColumns} />);
      
      expect(screen.getByText('id')).toBeInTheDocument();
      expect(screen.getByText('name')).toBeInTheDocument();
      expect(screen.getByText('price')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByText('created_at')).toBeInTheDocument();
    });

    it('should display column types in the list', () => {
      render(<ColumnInspector table={mockTable} columns={mockColumns} />);
      
      // Types should be formatted (e.g., Int32 → Integer)
      expect(screen.getByText('Integer')).toBeInTheDocument();
      expect(screen.getByText('String')).toBeInTheDocument();
      expect(screen.getByText('Float')).toBeInTheDocument();
    });

    it('should select first column by default', () => {
      render(<ColumnInspector table={mockTable} columns={mockColumns} />);
      
      // First column (id) should be selected and show details
      expect(screen.getByRole('heading', { name: 'id' })).toBeInTheDocument();
    });

    it('should switch column when clicked', () => {
      render(<ColumnInspector table={mockTable} columns={mockColumns} />);
      
      fireEvent.click(screen.getByText('price'));
      
      expect(screen.getByRole('heading', { name: 'price' })).toBeInTheDocument();
    });
  });

  describe('Column Search', () => {
    it('should filter columns by name', () => {
      render(<ColumnInspector table={mockTable} columns={mockColumns} />);
      
      const searchInput = screen.getByPlaceholderText('Search columns...');
      fireEvent.change(searchInput, { target: { value: 'price' } });
      
      expect(screen.getByText('price')).toBeInTheDocument();
      // Other columns should be filtered out from the list
      const columnList = screen.getByRole('button', { name: /price/i }).parentElement;
      expect(within(columnList!).queryByText('id')).not.toBeInTheDocument();
    });

    it('should be case-insensitive', () => {
      render(<ColumnInspector table={mockTable} columns={mockColumns} />);
      
      const searchInput = screen.getByPlaceholderText('Search columns...');
      fireEvent.change(searchInput, { target: { value: 'NAME' } });
      
      expect(screen.getByText('name')).toBeInTheDocument();
    });

    it('should show all columns when search is cleared', () => {
      render(<ColumnInspector table={mockTable} columns={mockColumns} />);
      
      const searchInput = screen.getByPlaceholderText('Search columns...');
      fireEvent.change(searchInput, { target: { value: 'price' } });
      fireEvent.change(searchInput, { target: { value: '' } });
      
      expect(screen.getByText('id')).toBeInTheDocument();
      expect(screen.getByText('name')).toBeInTheDocument();
      expect(screen.getByText('price')).toBeInTheDocument();
    });
  });

  describe('Column Details', () => {
    it('should display column name and type', () => {
      render(<ColumnInspector table={mockTable} columns={mockColumns} />);
      
      expect(screen.getByRole('heading', { name: 'id' })).toBeInTheDocument();
      // Type badge should be present
      expect(screen.getByText('Integer')).toBeInTheDocument();
    });

    it('should show nullable badge for nullable columns', () => {
      render(<ColumnInspector table={mockTable} columns={mockColumns} />);
      
      // Select a nullable column
      fireEvent.click(screen.getByText('name'));
      
      expect(screen.getByText('Nullable')).toBeInTheDocument();
    });

    it('should display basic statistics', () => {
      render(<ColumnInspector table={mockTable} columns={mockColumns} />);
      
      expect(screen.getByText('Total Values')).toBeInTheDocument();
      expect(screen.getByText('Non-Null')).toBeInTheDocument();
      expect(screen.getByText('Null Count')).toBeInTheDocument();
      expect(screen.getByText('Distinct')).toBeInTheDocument();
    });
  });

  describe('Numeric Statistics', () => {
    it('should display numeric statistics for numeric columns', () => {
      render(<ColumnInspector table={mockTable} columns={mockColumns} />);
      
      // Select numeric column
      fireEvent.click(screen.getByText('price'));
      
      expect(screen.getByText('Numeric Statistics')).toBeInTheDocument();
      expect(screen.getByText('Min')).toBeInTheDocument();
      expect(screen.getByText('Max')).toBeInTheDocument();
      expect(screen.getByText('Mean')).toBeInTheDocument();
      expect(screen.getByText('Median')).toBeInTheDocument();
      expect(screen.getByText('Std Dev')).toBeInTheDocument();
    });

    it('should display quartiles when available', () => {
      render(<ColumnInspector table={mockTable} columns={mockColumns} />);
      
      fireEvent.click(screen.getByText('price'));
      
      expect(screen.getByText('Q1 (25%)')).toBeInTheDocument();
      expect(screen.getByText('Q2 (50%)')).toBeInTheDocument();
      expect(screen.getByText('Q3 (75%)')).toBeInTheDocument();
    });
  });

  describe('Distribution Charts', () => {
    it('should display histogram for numeric columns', () => {
      render(<ColumnInspector table={mockTable} columns={mockColumns} />);
      
      fireEvent.click(screen.getByText('price'));
      
      expect(screen.getByText('Distribution')).toBeInTheDocument();
    });

    it('should display value counts for categorical columns', () => {
      render(<ColumnInspector table={mockTable} columns={mockColumns} />);
      
      fireEvent.click(screen.getByText('name'));
      
      expect(screen.getByText('Top Values')).toBeInTheDocument();
    });
  });

  describe('Sample Values', () => {
    it('should display sample values section', () => {
      render(<ColumnInspector table={mockTable} columns={mockColumns} />);
      
      expect(screen.getByText('Sample Values')).toBeInTheDocument();
    });

    it('should show row indices with sample values', () => {
      render(<ColumnInspector table={mockTable} columns={mockColumns} />);
      
      // Should show "Row X" labels
      expect(screen.getByText('Row 0')).toBeInTheDocument();
    });
  });

  describe('Type Formatting', () => {
    it('should format Int types as Integer', () => {
      render(<ColumnInspector table={mockTable} columns={mockColumns} />);
      
      expect(screen.getByText('Integer')).toBeInTheDocument();
    });

    it('should format Utf8 as String', () => {
      render(<ColumnInspector table={mockTable} columns={mockColumns} />);
      
      expect(screen.getByText('String')).toBeInTheDocument();
    });

    it('should format Float64 as Float', () => {
      render(<ColumnInspector table={mockTable} columns={mockColumns} />);
      
      expect(screen.getByText('Float')).toBeInTheDocument();
    });

    it('should format Bool as Boolean', () => {
      render(<ColumnInspector table={mockTable} columns={mockColumns} />);
      
      expect(screen.getByText('Boolean')).toBeInTheDocument();
    });
  });

  describe('Type Colors', () => {
    it('should apply blue color for numeric types', () => {
      render(<ColumnInspector table={mockTable} columns={mockColumns} />);
      
      // Select numeric column and check type badge has blue styling
      fireEvent.click(screen.getByText('price'));
      const typeBadge = screen.getByText('Float');
      expect(typeBadge).toHaveClass('text-blue-500');
    });

    it('should apply green color for string types', () => {
      render(<ColumnInspector table={mockTable} columns={mockColumns} />);
      
      fireEvent.click(screen.getByText('name'));
      const typeBadge = screen.getByText('String');
      expect(typeBadge).toHaveClass('text-green-500');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty columns array', () => {
      render(<ColumnInspector table={mockTable} columns={[]} />);
      
      expect(screen.getByText('Select a column to view details')).toBeInTheDocument();
    });

    it('should handle columns with all null values', () => {
      const columnsWithNulls: ColumnInfo[] = [
        { name: 'all_nulls', type: 'Utf8', nullable: true, nullCount: 100, distinctCount: 0 },
      ];
      
      render(<ColumnInspector table={mockTable} columns={columnsWithNulls} />);
      
      expect(screen.getByText('all_nulls')).toBeInTheDocument();
    });

    it('should handle very long column names', () => {
      const longNameColumns: ColumnInfo[] = [
        { name: 'this_is_a_very_long_column_name_that_might_overflow', type: 'Int32', nullable: false },
      ];
      
      render(<ColumnInspector table={mockTable} columns={longNameColumns} />);
      
      expect(screen.getByText('this_is_a_very_long_column_name_that_might_overflow')).toBeInTheDocument();
    });

    it('should handle special characters in column names', () => {
      const specialColumns: ColumnInfo[] = [
        { name: 'column-with-dashes', type: 'Int32', nullable: false },
        { name: 'column.with.dots', type: 'Utf8', nullable: true },
        { name: 'column_with_underscores', type: 'Float64', nullable: false },
      ];
      
      render(<ColumnInspector table={mockTable} columns={specialColumns} />);
      
      expect(screen.getByText('column-with-dashes')).toBeInTheDocument();
      expect(screen.getByText('column.with.dots')).toBeInTheDocument();
      expect(screen.getByText('column_with_underscores')).toBeInTheDocument();
    });
  });

  describe('Number Formatting', () => {
    it('should format large numbers with commas', () => {
      const { Statistics } = vi.mocked(await import('../../data-pipeline/utils/Statistics'));
      Statistics.computeColumnStats.mockReturnValue({
        min: 0,
        max: 1000000,
        nullCount: 0,
        distinctCount: 1000000,
        mean: 500000,
        median: 500000,
        stddev: 100000,
        quartiles: [250000, 500000, 750000],
      });

      render(<ColumnInspector table={mockTable} columns={mockColumns} />);
      
      fireEvent.click(screen.getByText('price'));
      
      // Numbers should be formatted with commas
      expect(screen.getByText('1,000,000')).toBeInTheDocument();
    });

    it('should format decimal numbers appropriately', () => {
      const { Statistics } = vi.mocked(await import('../../data-pipeline/utils/Statistics'));
      Statistics.computeColumnStats.mockReturnValue({
        min: 0.123456,
        max: 99.876543,
        nullCount: 0,
        distinctCount: 50,
        mean: 45.123456,
        median: 42.654321,
        stddev: 15.111111,
        quartiles: [25.25, 50.50, 75.75],
      });

      render(<ColumnInspector table={mockTable} columns={mockColumns} />);
      
      fireEvent.click(screen.getByText('price'));
      
      // Decimals should be truncated to 2 places
      expect(screen.getByText('45.12')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible search input', () => {
      render(<ColumnInspector table={mockTable} columns={mockColumns} />);
      
      const searchInput = screen.getByPlaceholderText('Search columns...');
      expect(searchInput).toHaveAttribute('type', 'text');
    });

    it('should have clickable column buttons', () => {
      render(<ColumnInspector table={mockTable} columns={mockColumns} />);
      
      const columnButtons = screen.getAllByRole('button');
      expect(columnButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should handle many columns efficiently', () => {
      const manyColumns: ColumnInfo[] = Array.from({ length: 50 }, (_, i) => ({
        name: `column_${i}`,
        type: i % 3 === 0 ? 'Int32' : i % 3 === 1 ? 'Utf8' : 'Float64',
        nullable: i % 2 === 0,
        nullCount: i,
        distinctCount: 100 - i,
      }));

      const startTime = performance.now();
      render(<ColumnInspector table={mockTable} columns={manyColumns} />);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(500);
      expect(screen.getByText('column_0')).toBeInTheDocument();
      expect(screen.getByText('column_49')).toBeInTheDocument();
    });
  });
});

