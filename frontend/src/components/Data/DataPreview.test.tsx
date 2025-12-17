/**
 * DataPreview Component Tests
 * 
 * @author Toaster (Senior QA)
 * @date December 17, 2025
 * 
 * Tests data sampling modes (head/tail/random), sorting, pagination,
 * value formatting, and quick statistics display.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '../../test/utils/test-utils';
import { DataPreview } from './DataPreview';
import { Table, tableFromArrays } from 'apache-arrow';
import { DatasetMetadata, ColumnInfo } from '../../store/dataStore';

// Helper to create mock Arrow Table
function createMockTable(rowCount: number = 100): Table {
  return tableFromArrays({
    id: Array.from({ length: rowCount }, (_, i) => i + 1),
    name: Array.from({ length: rowCount }, (_, i) => `Item ${i + 1}`),
    price: Array.from({ length: rowCount }, (_, i) => (i + 1) * 10.5),
    active: Array.from({ length: rowCount }, (_, i) => i % 2 === 0),
    created_at: Array.from({ length: rowCount }, (_, i) => new Date(2024, 0, i + 1)),
  });
}

// Helper to create mock metadata
function createMockMetadata(rowCount: number = 100): DatasetMetadata {
  return {
    id: 'test-dataset',
    name: 'test.csv',
    rowCount,
    columnCount: 5,
    columns: [
      { name: 'id', type: 'Int32', nullable: false, nullCount: 0 },
      { name: 'name', type: 'Utf8', nullable: true, nullCount: 2 },
      { name: 'price', type: 'Float64', nullable: true, nullCount: 5 },
      { name: 'active', type: 'Bool', nullable: false, nullCount: 0 },
      { name: 'created_at', type: 'Timestamp<MILLISECOND>', nullable: true, nullCount: 3 },
    ],
    sizeBytes: rowCount * 100,
    uploadedAt: new Date('2025-12-17T10:00:00Z'),
  };
}

describe('DataPreview', () => {
  let mockTable: Table;
  let mockMetadata: DatasetMetadata;

  beforeEach(() => {
    mockTable = createMockTable(100);
    mockMetadata = createMockMetadata(100);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Sample Mode Selection', () => {
    it('should display sample mode buttons', () => {
      render(<DataPreview table={mockTable} metadata={mockMetadata} />);
      
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Last')).toBeInTheDocument();
      expect(screen.getByText('Random')).toBeInTheDocument();
    });

    it('should default to "First" (head) mode', () => {
      render(<DataPreview table={mockTable} metadata={mockMetadata} />);
      
      const firstButton = screen.getByText('First');
      expect(firstButton).toHaveClass('bg-primary');
    });

    it('should switch to "Last" (tail) mode when clicked', () => {
      render(<DataPreview table={mockTable} metadata={mockMetadata} />);
      
      fireEvent.click(screen.getByText('Last'));
      
      const lastButton = screen.getByText('Last');
      expect(lastButton).toHaveClass('bg-primary');
    });

    it('should switch to "Random" mode when clicked', () => {
      render(<DataPreview table={mockTable} metadata={mockMetadata} />);
      
      fireEvent.click(screen.getByText('Random'));
      
      const randomButton = screen.getByText('Random');
      expect(randomButton).toHaveClass('bg-primary');
    });

    it('should show Reshuffle button in random mode', () => {
      render(<DataPreview table={mockTable} metadata={mockMetadata} />);
      
      fireEvent.click(screen.getByText('Random'));
      
      expect(screen.getByText('Reshuffle')).toBeInTheDocument();
    });

    it('should not show Reshuffle button in head/tail mode', () => {
      render(<DataPreview table={mockTable} metadata={mockMetadata} />);
      
      expect(screen.queryByText('Reshuffle')).not.toBeInTheDocument();
    });
  });

  describe('Sample Size Selection', () => {
    it('should display sample size dropdown', () => {
      render(<DataPreview table={mockTable} metadata={mockMetadata} />);
      
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('should default to 100 rows', () => {
      render(<DataPreview table={mockTable} metadata={mockMetadata} />);
      
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('100');
    });

    it('should allow changing sample size', () => {
      render(<DataPreview table={mockTable} metadata={mockMetadata} />);
      
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '50' } });
      
      expect((select as HTMLSelectElement).value).toBe('50');
    });

    it('should display available sample sizes', () => {
      render(<DataPreview table={mockTable} metadata={mockMetadata} />);
      
      const select = screen.getByRole('combobox');
      const options = within(select).getAllByRole('option');
      
      expect(options.map(o => o.textContent)).toContain('10');
      expect(options.map(o => o.textContent)).toContain('25');
      expect(options.map(o => o.textContent)).toContain('50');
      expect(options.map(o => o.textContent)).toContain('100');
      expect(options.map(o => o.textContent)).toContain('250');
      expect(options.map(o => o.textContent)).toContain('500');
    });
  });

  describe('Row Count Display', () => {
    it('should display current sample count and total rows', () => {
      render(<DataPreview table={mockTable} metadata={mockMetadata} />);
      
      expect(screen.getByText(/Showing 100 of 100 rows/)).toBeInTheDocument();
    });

    it('should update display when sample size changes', () => {
      render(<DataPreview table={mockTable} metadata={mockMetadata} />);
      
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '50' } });
      
      expect(screen.getByText(/Showing 50 of 100 rows/)).toBeInTheDocument();
    });

    it('should handle large row counts with formatting', () => {
      const largeMetadata = createMockMetadata(1000000);
      largeMetadata.rowCount = 1000000;
      
      render(<DataPreview table={mockTable} metadata={largeMetadata} />);
      
      expect(screen.getByText(/1,000,000 rows/)).toBeInTheDocument();
    });
  });

  describe('Data Table Display', () => {
    it('should display column headers', () => {
      render(<DataPreview table={mockTable} metadata={mockMetadata} />);
      
      expect(screen.getByText('id')).toBeInTheDocument();
      expect(screen.getByText('name')).toBeInTheDocument();
      expect(screen.getByText('price')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByText('created_at')).toBeInTheDocument();
    });

    it('should display column types under headers', () => {
      render(<DataPreview table={mockTable} metadata={mockMetadata} />);
      
      // Types should be formatted
      expect(screen.getByText('Int')).toBeInTheDocument();
      expect(screen.getByText('String')).toBeInTheDocument();
      expect(screen.getByText('Float')).toBeInTheDocument();
      expect(screen.getByText('Bool')).toBeInTheDocument();
    });

    it('should display row index column', () => {
      render(<DataPreview table={mockTable} metadata={mockMetadata} />);
      
      expect(screen.getByText('#')).toBeInTheDocument();
    });

    it('should display row indices in first column', () => {
      render(<DataPreview table={mockTable} metadata={mockMetadata} />);
      
      // First row should have index 0 in head mode
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should sort ascending when column header is clicked', () => {
      render(<DataPreview table={mockTable} metadata={mockMetadata} />);
      
      // Click on 'id' column to sort
      fireEvent.click(screen.getByText('id'));
      
      // Sort indicator should appear
      const idHeader = screen.getByText('id').closest('th');
      expect(idHeader).toContainElement(screen.getByRole('img', { hidden: true }) || idHeader?.querySelector('svg'));
    });

    it('should toggle to descending on second click', () => {
      render(<DataPreview table={mockTable} metadata={mockMetadata} />);
      
      // Click twice to sort descending
      fireEvent.click(screen.getByText('id'));
      fireEvent.click(screen.getByText('id'));
      
      // Sort direction should change (indicated by rotated icon)
      const idHeader = screen.getByText('id').closest('th');
      const sortIcon = idHeader?.querySelector('svg');
      expect(sortIcon).toHaveClass('rotate-180');
    });

    it('should sort different column when new header is clicked', () => {
      render(<DataPreview table={mockTable} metadata={mockMetadata} />);
      
      fireEvent.click(screen.getByText('id'));
      fireEvent.click(screen.getByText('price'));
      
      // Only price should have sort indicator
      const priceHeader = screen.getByText('price').closest('th');
      const idHeader = screen.getByText('id').closest('th');
      
      expect(priceHeader?.querySelector('svg')).toBeInTheDocument();
      expect(idHeader?.querySelectorAll('svg').length).toBe(0);
    });
  });

  describe('Value Formatting', () => {
    it('should display null values with italic styling', () => {
      const tableWithNulls = tableFromArrays({
        id: [1, 2, 3],
        name: ['test', null, 'value'],
        price: [10.5, 20.5, null],
      });
      const metadataWithNulls = {
        ...mockMetadata,
        rowCount: 3,
        columns: [
          { name: 'id', type: 'Int32', nullable: false },
          { name: 'name', type: 'Utf8', nullable: true },
          { name: 'price', type: 'Float64', nullable: true },
        ],
      };

      render(<DataPreview table={tableWithNulls} metadata={metadataWithNulls} />);
      
      const nullElements = screen.getAllByText('null');
      expect(nullElements.length).toBeGreaterThan(0);
      nullElements.forEach(el => {
        expect(el).toHaveClass('italic');
      });
    });

    it('should format boolean values with color', () => {
      render(<DataPreview table={mockTable} metadata={mockMetadata} />);
      
      const trueElements = screen.getAllByText('true');
      const falseElements = screen.getAllByText('false');
      
      trueElements.forEach(el => {
        expect(el).toHaveClass('text-green-500');
      });
      falseElements.forEach(el => {
        expect(el).toHaveClass('text-red-500');
      });
    });

    it('should format numbers with monospace font', () => {
      render(<DataPreview table={mockTable} metadata={mockMetadata} />);
      
      // Price values should have font-mono class
      const priceCell = screen.getByText('10.5');
      expect(priceCell).toHaveClass('font-mono');
    });

    it('should truncate long string values', () => {
      const tableWithLongStrings = tableFromArrays({
        id: [1],
        description: ['This is a very long description that should be truncated in the preview to avoid taking up too much space in the table cell'],
      });
      const metadataWithLongStrings = {
        ...mockMetadata,
        rowCount: 1,
        columns: [
          { name: 'id', type: 'Int32', nullable: false },
          { name: 'description', type: 'Utf8', nullable: true },
        ],
      };

      render(<DataPreview table={tableWithLongStrings} metadata={metadataWithLongStrings} />);
      
      // Should show truncated text with ellipsis
      expect(screen.getByText(/This is a very long description.*\.\.\./)).toBeInTheDocument();
    });
  });

  describe('Quick Stats', () => {
    it('should display quick stats for first 4 columns', () => {
      render(<DataPreview table={mockTable} metadata={mockMetadata} />);
      
      // Should show stats cards
      expect(screen.getByText('id')).toBeInTheDocument();
      expect(screen.getByText('name')).toBeInTheDocument();
      expect(screen.getByText('price')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
    });

    it('should show min/max/avg for numeric columns', () => {
      render(<DataPreview table={mockTable} metadata={mockMetadata} />);
      
      expect(screen.getAllByText('Min').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Max').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Avg').length).toBeGreaterThan(0);
    });

    it('should show unique/non-null counts for text columns', () => {
      render(<DataPreview table={mockTable} metadata={mockMetadata} />);
      
      expect(screen.getAllByText('Unique').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Non-null').length).toBeGreaterThan(0);
    });
  });

  describe('Head Mode Behavior', () => {
    it('should show first N rows in head mode', () => {
      render(<DataPreview table={mockTable} metadata={mockMetadata} />);
      
      // In head mode with 100 rows, row 0 should be visible
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    it('should update when sample size changes', () => {
      render(<DataPreview table={mockTable} metadata={mockMetadata} />);
      
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '10' } });
      
      // Should show 10 rows
      expect(screen.getByText(/Showing 10 of 100 rows/)).toBeInTheDocument();
    });
  });

  describe('Tail Mode Behavior', () => {
    it('should show last N rows in tail mode', () => {
      render(<DataPreview table={mockTable} metadata={mockMetadata} />);
      
      fireEvent.click(screen.getByText('Last'));
      
      // In tail mode, last rows should be visible
      // With 100 rows and sample size 100, row 99 should be visible
      expect(screen.getByText('99')).toBeInTheDocument();
    });
  });

  describe('Random Mode Behavior', () => {
    it('should show random rows in random mode', () => {
      render(<DataPreview table={mockTable} metadata={mockMetadata} />);
      
      fireEvent.click(screen.getByText('Random'));
      
      // Random mode should still show the correct number of rows
      expect(screen.getByText(/Showing 100 of 100 rows/)).toBeInTheDocument();
    });

    it('should reshuffle when Reshuffle button is clicked', () => {
      render(<DataPreview table={mockTable} metadata={mockMetadata} />);
      
      fireEvent.click(screen.getByText('Random'));
      
      // Get initial row indices
      const initialRows = screen.getAllByRole('row');
      
      fireEvent.click(screen.getByText('Reshuffle'));
      
      // After reshuffle, rows should still be present
      expect(screen.getAllByRole('row').length).toBe(initialRows.length);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty table', () => {
      const emptyTable = tableFromArrays({
        id: [],
        name: [],
      });
      const emptyMetadata = {
        ...mockMetadata,
        rowCount: 0,
        columns: [
          { name: 'id', type: 'Int32', nullable: false },
          { name: 'name', type: 'Utf8', nullable: true },
        ],
      };

      render(<DataPreview table={emptyTable} metadata={emptyMetadata} />);
      
      expect(screen.getByText(/Showing 0 of 0 rows/)).toBeInTheDocument();
    });

    it('should handle single row table', () => {
      const singleRowTable = tableFromArrays({
        id: [1],
        name: ['Single'],
      });
      const singleRowMetadata = {
        ...mockMetadata,
        rowCount: 1,
        columns: [
          { name: 'id', type: 'Int32', nullable: false },
          { name: 'name', type: 'Utf8', nullable: true },
        ],
      };

      render(<DataPreview table={singleRowTable} metadata={singleRowMetadata} />);
      
      expect(screen.getByText(/Showing 1 of 1 rows/)).toBeInTheDocument();
      expect(screen.getByText('Single')).toBeInTheDocument();
    });

    it('should handle sample size larger than row count', () => {
      const smallTable = tableFromArrays({
        id: [1, 2, 3],
        name: ['A', 'B', 'C'],
      });
      const smallMetadata = {
        ...mockMetadata,
        rowCount: 3,
        columns: [
          { name: 'id', type: 'Int32', nullable: false },
          { name: 'name', type: 'Utf8', nullable: true },
        ],
      };

      render(<DataPreview table={smallTable} metadata={smallMetadata} />);
      
      // Should show all 3 rows even though default sample size is 100
      expect(screen.getByText(/Showing 3 of 3 rows/)).toBeInTheDocument();
    });

    it('should handle table with only one column', () => {
      const singleColumnTable = tableFromArrays({
        value: [1, 2, 3, 4, 5],
      });
      const singleColumnMetadata = {
        ...mockMetadata,
        rowCount: 5,
        columnCount: 1,
        columns: [
          { name: 'value', type: 'Int32', nullable: false },
        ],
      };

      render(<DataPreview table={singleColumnTable} metadata={singleColumnMetadata} />);
      
      expect(screen.getByText('value')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible table structure', () => {
      render(<DataPreview table={mockTable} metadata={mockMetadata} />);
      
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader').length).toBeGreaterThan(0);
      expect(screen.getAllByRole('row').length).toBeGreaterThan(1); // Header + data rows
    });

    it('should have accessible sample mode buttons', () => {
      render(<DataPreview table={mockTable} metadata={mockMetadata} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have accessible select for sample size', () => {
      render(<DataPreview table={mockTable} metadata={mockMetadata} />);
      
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render large datasets efficiently', () => {
      const largeTable = createMockTable(1000);
      const largeMetadata = createMockMetadata(1000);

      const startTime = performance.now();
      render(<DataPreview table={largeTable} metadata={largeMetadata} />);
      const endTime = performance.now();
      
      // Should render in less than 500ms
      expect(endTime - startTime).toBeLessThan(500);
    });

    it('should handle mode switching efficiently', () => {
      render(<DataPreview table={mockTable} metadata={mockMetadata} />);
      
      const startTime = performance.now();
      
      fireEvent.click(screen.getByText('Last'));
      fireEvent.click(screen.getByText('Random'));
      fireEvent.click(screen.getByText('First'));
      
      const endTime = performance.now();
      
      // Mode switching should be fast
      expect(endTime - startTime).toBeLessThan(200);
    });
  });
});

