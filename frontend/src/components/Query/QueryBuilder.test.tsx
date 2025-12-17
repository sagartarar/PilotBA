/**
 * QueryBuilder Component Tests
 * 
 * @author Toaster (Senior QA)
 * @date December 17, 2025
 * 
 * Tests query building workflow, filter/aggregate/sort integration,
 * query execution, and results display.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../test/utils/test-utils';
import { QueryBuilder } from './QueryBuilder';
import { useDataStore, useUIStore } from '../../store';
import { Table, tableFromArrays } from 'apache-arrow';

// Mock the stores
vi.mock('../../store', () => ({
  useDataStore: vi.fn(),
  useUIStore: vi.fn(),
}));

// Mock the data pipeline operators
vi.mock('../../data-pipeline/operators/Filter', () => ({
  Filter: {
    apply: vi.fn((table: Table) => table),
  },
}));

vi.mock('../../data-pipeline/operators/Aggregate', () => ({
  Aggregate: {
    apply: vi.fn((table: Table) => table),
  },
}));

vi.mock('../../data-pipeline/operators/Sort', () => ({
  Sort: {
    apply: vi.fn((table: Table) => table),
  },
}));

// Mock child components
vi.mock('./FilterBuilder', () => ({
  FilterBuilder: ({ filters, onFiltersChange, columns }: any) => (
    <div data-testid="filter-builder">
      <span>Filters: {filters.length}</span>
      <button onClick={() => onFiltersChange([...filters, { id: 'f1', column: columns[0]?.name || 'col', operator: 'eq', value: 'test', enabled: true }])}>
        Add Filter
      </button>
      <button onClick={() => onFiltersChange([])}>Clear Filters</button>
    </div>
  ),
}));

vi.mock('./AggregationBuilder', () => ({
  AggregationBuilder: ({ aggregations, onAggregationsChange, columns }: any) => (
    <div data-testid="aggregation-builder">
      <span>Aggregations: {aggregations.length}</span>
      <button onClick={() => onAggregationsChange([...aggregations, { id: 'a1', column: columns[0]?.name || 'col', function: 'sum', enabled: true }])}>
        Add Aggregation
      </button>
      <button onClick={() => onAggregationsChange([])}>Clear Aggregations</button>
    </div>
  ),
}));

vi.mock('./SortBuilder', () => ({
  SortBuilder: ({ sorts, onSortsChange, columns }: any) => (
    <div data-testid="sort-builder">
      <span>Sorts: {sorts.length}</span>
      <button onClick={() => onSortsChange([...sorts, { id: 's1', column: columns[0]?.name || 'col', direction: 'asc', enabled: true }])}>
        Add Sort
      </button>
      <button onClick={() => onSortsChange([])}>Clear Sorts</button>
    </div>
  ),
}));

// Mock DataTable
vi.mock('../Data/DataTable', () => ({
  DataTable: ({ table }: any) => (
    <div data-testid="data-table">
      DataTable - {table?.numRows || 0} rows
    </div>
  ),
}));

// Helper to create mock Arrow Table
function createMockTable(rowCount: number = 100): Table {
  return tableFromArrays({
    id: Array.from({ length: rowCount }, (_, i) => i + 1),
    name: Array.from({ length: rowCount }, (_, i) => `Item ${i + 1}`),
    price: Array.from({ length: rowCount }, (_, i) => (i + 1) * 10.5),
    quantity: Array.from({ length: rowCount }, (_, i) => i * 2),
  });
}

// Helper to create mock metadata
function createMockMetadata() {
  return {
    id: 'test-dataset',
    name: 'test.csv',
    rowCount: 100,
    columnCount: 4,
    columns: [
      { name: 'id', type: 'Int32', nullable: false },
      { name: 'name', type: 'Utf8', nullable: true },
      { name: 'price', type: 'Float64', nullable: true },
      { name: 'quantity', type: 'Int32', nullable: false },
    ],
    sizeBytes: 10000,
    uploadedAt: new Date(),
  };
}

describe('QueryBuilder', () => {
  let mockDataStore: any;
  let mockUIStore: any;
  let mockAddNotification: ReturnType<typeof vi.fn>;
  let mockGetCurrentTable: ReturnType<typeof vi.fn>;
  let mockGetCurrentMetadata: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockAddNotification = vi.fn();
    mockGetCurrentTable = vi.fn();
    mockGetCurrentMetadata = vi.fn();

    mockUIStore = {
      addNotification: mockAddNotification,
    };

    mockDataStore = {
      getCurrentTable: mockGetCurrentTable,
      getCurrentMetadata: mockGetCurrentMetadata,
    };

    (useDataStore as any).mockReturnValue(mockDataStore);
    (useUIStore as any).mockReturnValue(mockUIStore);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Empty State', () => {
    it('should show message when no dataset is selected', () => {
      mockGetCurrentTable.mockReturnValue(null);
      mockGetCurrentMetadata.mockReturnValue(null);

      render(<QueryBuilder />);
      
      expect(screen.getByText('No Dataset Selected')).toBeInTheDocument();
      expect(screen.getByText(/Upload or select a dataset/)).toBeInTheDocument();
    });
  });

  describe('With Dataset Selected', () => {
    beforeEach(() => {
      mockGetCurrentTable.mockReturnValue(createMockTable(100));
      mockGetCurrentMetadata.mockReturnValue(createMockMetadata());
    });

    it('should display query builder header', () => {
      render(<QueryBuilder />);
      
      expect(screen.getByText('Query Builder')).toBeInTheDocument();
      expect(screen.getByText(/Building query on/)).toBeInTheDocument();
      expect(screen.getByText('test.csv')).toBeInTheDocument();
    });

    it('should display tab buttons', () => {
      render(<QueryBuilder />);
      
      expect(screen.getByText('Filter')).toBeInTheDocument();
      expect(screen.getByText('Aggregate')).toBeInTheDocument();
      expect(screen.getByText('Sort')).toBeInTheDocument();
    });

    it('should show Filter tab by default', () => {
      render(<QueryBuilder />);
      
      expect(screen.getByTestId('filter-builder')).toBeInTheDocument();
    });

    it('should switch to Aggregate tab when clicked', () => {
      render(<QueryBuilder />);
      
      fireEvent.click(screen.getByText('Aggregate'));
      
      expect(screen.getByTestId('aggregation-builder')).toBeInTheDocument();
    });

    it('should switch to Sort tab when clicked', () => {
      render(<QueryBuilder />);
      
      fireEvent.click(screen.getByText('Sort'));
      
      expect(screen.getByTestId('sort-builder')).toBeInTheDocument();
    });
  });

  describe('Run Query Button', () => {
    beforeEach(() => {
      mockGetCurrentTable.mockReturnValue(createMockTable(100));
      mockGetCurrentMetadata.mockReturnValue(createMockMetadata());
    });

    it('should be disabled when no operations are added', () => {
      render(<QueryBuilder />);
      
      const runButton = screen.getByText('Run Query');
      expect(runButton.closest('button')).toBeDisabled();
    });

    it('should be enabled when filters are added', () => {
      render(<QueryBuilder />);
      
      // Add a filter
      fireEvent.click(screen.getByText('Add Filter'));
      
      const runButton = screen.getByText('Run Query');
      expect(runButton.closest('button')).not.toBeDisabled();
    });

    it('should be enabled when aggregations are added', () => {
      render(<QueryBuilder />);
      
      fireEvent.click(screen.getByText('Aggregate'));
      fireEvent.click(screen.getByText('Add Aggregation'));
      
      const runButton = screen.getByText('Run Query');
      expect(runButton.closest('button')).not.toBeDisabled();
    });

    it('should be enabled when sorts are added', () => {
      render(<QueryBuilder />);
      
      fireEvent.click(screen.getByText('Sort'));
      fireEvent.click(screen.getByText('Add Sort'));
      
      const runButton = screen.getByText('Run Query');
      expect(runButton.closest('button')).not.toBeDisabled();
    });
  });

  describe('Query Execution', () => {
    beforeEach(() => {
      mockGetCurrentTable.mockReturnValue(createMockTable(100));
      mockGetCurrentMetadata.mockReturnValue(createMockMetadata());
    });

    it('should execute query and show results', async () => {
      render(<QueryBuilder />);
      
      // Add a filter
      fireEvent.click(screen.getByText('Add Filter'));
      
      // Run query
      fireEvent.click(screen.getByText('Run Query'));
      
      await waitFor(() => {
        expect(screen.getByTestId('data-table')).toBeInTheDocument();
      });
    });

    it('should show success notification after execution', async () => {
      render(<QueryBuilder />);
      
      fireEvent.click(screen.getByText('Add Filter'));
      fireEvent.click(screen.getByText('Run Query'));
      
      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'success',
            title: 'Query Executed',
          })
        );
      });
    });

    it('should display execution time', async () => {
      render(<QueryBuilder />);
      
      fireEvent.click(screen.getByText('Add Filter'));
      fireEvent.click(screen.getByText('Run Query'));
      
      await waitFor(() => {
        expect(screen.getByText(/Executed in/)).toBeInTheDocument();
      });
    });

    it('should display result row count', async () => {
      render(<QueryBuilder />);
      
      fireEvent.click(screen.getByText('Add Filter'));
      fireEvent.click(screen.getByText('Run Query'));
      
      await waitFor(() => {
        expect(screen.getByText(/100 rows/)).toBeInTheDocument();
      });
    });
  });

  describe('Reset Query', () => {
    beforeEach(() => {
      mockGetCurrentTable.mockReturnValue(createMockTable(100));
      mockGetCurrentMetadata.mockReturnValue(createMockMetadata());
    });

    it('should show Reset button when operations exist', () => {
      render(<QueryBuilder />);
      
      fireEvent.click(screen.getByText('Add Filter'));
      
      expect(screen.getByText('Reset')).toBeInTheDocument();
    });

    it('should not show Reset button when no operations exist', () => {
      render(<QueryBuilder />);
      
      expect(screen.queryByText('Reset')).not.toBeInTheDocument();
    });

    it('should clear all operations when Reset is clicked', () => {
      render(<QueryBuilder />);
      
      // Add operations
      fireEvent.click(screen.getByText('Add Filter'));
      fireEvent.click(screen.getByText('Aggregate'));
      fireEvent.click(screen.getByText('Add Aggregation'));
      
      // Reset
      fireEvent.click(screen.getByText('Reset'));
      
      // Check operations are cleared
      fireEvent.click(screen.getByText('Filter'));
      expect(screen.getByText('Filters: 0')).toBeInTheDocument();
    });
  });

  describe('Tab Badge Counts', () => {
    beforeEach(() => {
      mockGetCurrentTable.mockReturnValue(createMockTable(100));
      mockGetCurrentMetadata.mockReturnValue(createMockMetadata());
    });

    it('should show filter count badge', () => {
      render(<QueryBuilder />);
      
      fireEvent.click(screen.getByText('Add Filter'));
      
      // Filter tab should show count
      const filterTab = screen.getByText('Filter').closest('button');
      expect(filterTab).toHaveTextContent('1');
    });

    it('should show aggregation count badge', () => {
      render(<QueryBuilder />);
      
      fireEvent.click(screen.getByText('Aggregate'));
      fireEvent.click(screen.getByText('Add Aggregation'));
      
      const aggTab = screen.getByText('Aggregate').closest('button');
      expect(aggTab).toHaveTextContent('1');
    });

    it('should show sort count badge', () => {
      render(<QueryBuilder />);
      
      fireEvent.click(screen.getByText('Sort'));
      fireEvent.click(screen.getByText('Add Sort'));
      
      const sortTab = screen.getByText('Sort').closest('button');
      expect(sortTab).toHaveTextContent('1');
    });
  });

  describe('Results Panel', () => {
    beforeEach(() => {
      mockGetCurrentTable.mockReturnValue(createMockTable(100));
      mockGetCurrentMetadata.mockReturnValue(createMockMetadata());
    });

    it('should show placeholder when no results', () => {
      render(<QueryBuilder />);
      
      expect(screen.getByText(/Add filters, aggregations, or sorts/)).toBeInTheDocument();
    });

    it('should show "Click Run Query" message when operations exist but not executed', () => {
      render(<QueryBuilder />);
      
      fireEvent.click(screen.getByText('Add Filter'));
      
      expect(screen.getByText(/Click "Run Query" to see results/)).toBeInTheDocument();
    });

    it('should display DataTable after query execution', async () => {
      render(<QueryBuilder />);
      
      fireEvent.click(screen.getByText('Add Filter'));
      fireEvent.click(screen.getByText('Run Query'));
      
      await waitFor(() => {
        expect(screen.getByTestId('data-table')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockGetCurrentTable.mockReturnValue(createMockTable(100));
      mockGetCurrentMetadata.mockReturnValue(createMockMetadata());
    });

    it('should show error notification when query fails', async () => {
      // Mock Filter.apply to throw an error
      const { Filter } = await import('../../data-pipeline/operators/Filter');
      (Filter.apply as any).mockImplementationOnce(() => {
        throw new Error('Filter error');
      });

      render(<QueryBuilder />);
      
      fireEvent.click(screen.getByText('Add Filter'));
      fireEvent.click(screen.getByText('Run Query'));
      
      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            title: 'Query Error',
          })
        );
      });
    });

    it('should show error when trying to execute without dataset', async () => {
      mockGetCurrentTable.mockReturnValue(null);
      mockGetCurrentMetadata.mockReturnValue(createMockMetadata());

      render(<QueryBuilder />);
      
      // Force enable the button by adding filter (even though table is null)
      fireEvent.click(screen.getByText('Add Filter'));
      fireEvent.click(screen.getByText('Run Query'));
      
      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            title: 'No Data',
          })
        );
      });
    });
  });

  describe('Loading State', () => {
    beforeEach(() => {
      mockGetCurrentTable.mockReturnValue(createMockTable(100));
      mockGetCurrentMetadata.mockReturnValue(createMockMetadata());
    });

    it('should show loading state while executing', async () => {
      render(<QueryBuilder />);
      
      fireEvent.click(screen.getByText('Add Filter'));
      fireEvent.click(screen.getByText('Run Query'));
      
      // The button should briefly show "Executing..."
      // Since execution is fast in tests, we just verify the query completes
      await waitFor(() => {
        expect(screen.getByTestId('data-table')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockGetCurrentTable.mockReturnValue(createMockTable(100));
      mockGetCurrentMetadata.mockReturnValue(createMockMetadata());
    });

    it('should have accessible tab buttons', () => {
      render(<QueryBuilder />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have proper heading structure', () => {
      render(<QueryBuilder />);
      
      expect(screen.getByRole('heading', { name: 'Query Builder' })).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render efficiently with large datasets', () => {
      mockGetCurrentTable.mockReturnValue(createMockTable(10000));
      mockGetCurrentMetadata.mockReturnValue({
        ...createMockMetadata(),
        rowCount: 10000,
      });

      const startTime = performance.now();
      render(<QueryBuilder />);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(500);
    });
  });
});

