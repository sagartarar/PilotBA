/**
 * DatasetManager Component Tests
 * 
 * @author Toaster (Senior QA)
 * @date December 17, 2025
 * 
 * Tests CRUD operations, dataset listing, switching, deletion,
 * search functionality, and UI interactions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '../../test/utils/test-utils';
import { DatasetManager } from './DatasetManager';
import { useDataStore, useUIStore } from '../../store';
import { Table, tableFromArrays, Utf8, Int32, Float64 } from 'apache-arrow';

// Mock the stores
vi.mock('../../store', () => ({
  useDataStore: vi.fn(),
  useUIStore: vi.fn(),
}));

// Mock ConfirmDialog
vi.mock('../common/Modal', () => ({
  ConfirmDialog: ({ isOpen, onClose, onConfirm, title, message }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="confirm-dialog">
        <h2>{title}</h2>
        <p>{message}</p>
        <button onClick={onClose}>Cancel</button>
        <button onClick={onConfirm}>Confirm</button>
      </div>
    );
  },
}));

// Mock ColumnInspector and DataPreview
vi.mock('./ColumnInspector', () => ({
  ColumnInspector: ({ table, columns }: any) => (
    <div data-testid="column-inspector">
      Column Inspector - {columns?.length || 0} columns
    </div>
  ),
}));

vi.mock('./DataPreview', () => ({
  DataPreview: ({ table, metadata }: any) => (
    <div data-testid="data-preview">
      Data Preview - {metadata?.rowCount || 0} rows
    </div>
  ),
}));

// Helper to create mock Arrow Table
function createMockTable(rowCount: number = 100, columnCount: number = 3): Table {
  const data: Record<string, any[]> = {};
  for (let i = 0; i < columnCount; i++) {
    const colName = `col_${i}`;
    data[colName] = Array.from({ length: rowCount }, (_, j) => j * (i + 1));
  }
  return tableFromArrays(data);
}

// Helper to create mock metadata
function createMockMetadata(id: string, name: string, rowCount: number = 100) {
  return {
    id,
    name,
    rowCount,
    columnCount: 3,
    columns: [
      { name: 'col_0', type: 'Int32', nullable: false, nullCount: 0 },
      { name: 'col_1', type: 'Float64', nullable: true, nullCount: 5 },
      { name: 'col_2', type: 'Utf8', nullable: true, nullCount: 2 },
    ],
    sizeBytes: rowCount * 100,
    uploadedAt: new Date('2025-12-17T10:00:00Z'),
  };
}

describe('DatasetManager', () => {
  let mockDataStore: any;
  let mockUIStore: any;
  let mockAddNotification: ReturnType<typeof vi.fn>;
  let mockDeleteTable: ReturnType<typeof vi.fn>;
  let mockSetCurrentTable: ReturnType<typeof vi.fn>;
  let mockGetCurrentTable: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockAddNotification = vi.fn();
    mockDeleteTable = vi.fn();
    mockSetCurrentTable = vi.fn();
    mockGetCurrentTable = vi.fn();

    mockUIStore = {
      addNotification: mockAddNotification,
    };

    mockDataStore = {
      metadata: new Map(),
      currentTableId: null,
      setCurrentTable: mockSetCurrentTable,
      deleteTable: mockDeleteTable,
      getCurrentTable: mockGetCurrentTable,
    };

    (useDataStore as any).mockReturnValue(mockDataStore);
    (useUIStore as any).mockReturnValue(mockUIStore);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Empty State', () => {
    it('should render empty state when no datasets exist', () => {
      render(<DatasetManager />);
      
      expect(screen.getByText('No datasets uploaded yet')).toBeInTheDocument();
      expect(screen.getByText('0 datasets')).toBeInTheDocument();
    });

    it('should show "Select a Dataset" message when no dataset is selected', () => {
      const metadata = new Map([
        ['ds1', createMockMetadata('ds1', 'test.csv', 100)],
      ]);
      mockDataStore.metadata = metadata;
      (useDataStore as any).mockReturnValue(mockDataStore);

      render(<DatasetManager />);
      
      expect(screen.getByText('Select a Dataset')).toBeInTheDocument();
      expect(screen.getByText('Choose a dataset from the sidebar to view its details')).toBeInTheDocument();
    });
  });

  describe('Dataset Listing', () => {
    it('should display all datasets in the sidebar', () => {
      const metadata = new Map([
        ['ds1', createMockMetadata('ds1', 'sales.csv', 1000)],
        ['ds2', createMockMetadata('ds2', 'customers.csv', 500)],
        ['ds3', createMockMetadata('ds3', 'products.json', 250)],
      ]);
      mockDataStore.metadata = metadata;
      (useDataStore as any).mockReturnValue(mockDataStore);

      render(<DatasetManager />);
      
      expect(screen.getByText('sales.csv')).toBeInTheDocument();
      expect(screen.getByText('customers.csv')).toBeInTheDocument();
      expect(screen.getByText('products.json')).toBeInTheDocument();
      expect(screen.getByText('3 datasets')).toBeInTheDocument();
    });

    it('should display row and column counts for each dataset', () => {
      const metadata = new Map([
        ['ds1', createMockMetadata('ds1', 'data.csv', 1234)],
      ]);
      mockDataStore.metadata = metadata;
      (useDataStore as any).mockReturnValue(mockDataStore);

      render(<DatasetManager />);
      
      expect(screen.getByText('1,234 rows')).toBeInTheDocument();
      expect(screen.getByText('3 cols')).toBeInTheDocument();
    });
  });

  describe('Dataset Selection', () => {
    it('should call setCurrentTable when a dataset is clicked', () => {
      const metadata = new Map([
        ['ds1', createMockMetadata('ds1', 'test.csv', 100)],
      ]);
      mockDataStore.metadata = metadata;
      (useDataStore as any).mockReturnValue(mockDataStore);

      render(<DatasetManager />);
      
      fireEvent.click(screen.getByText('test.csv'));
      
      expect(mockSetCurrentTable).toHaveBeenCalledWith('ds1');
    });

    it('should highlight the selected dataset', () => {
      const mockTable = createMockTable(100, 3);
      const metadata = new Map([
        ['ds1', createMockMetadata('ds1', 'selected.csv', 100)],
        ['ds2', createMockMetadata('ds2', 'other.csv', 50)],
      ]);
      mockDataStore.metadata = metadata;
      mockDataStore.currentTableId = 'ds1';
      mockGetCurrentTable.mockReturnValue(mockTable);
      (useDataStore as any).mockReturnValue(mockDataStore);

      render(<DatasetManager />);
      
      // The selected dataset should have primary styling
      const selectedButton = screen.getByText('selected.csv').closest('button');
      expect(selectedButton).toHaveClass('bg-primary');
    });

    it('should display dataset details when selected', () => {
      const mockTable = createMockTable(100, 3);
      const metadata = new Map([
        ['ds1', createMockMetadata('ds1', 'detailed.csv', 1000)],
      ]);
      mockDataStore.metadata = metadata;
      mockDataStore.currentTableId = 'ds1';
      mockGetCurrentTable.mockReturnValue(mockTable);
      (useDataStore as any).mockReturnValue(mockDataStore);

      render(<DatasetManager />);
      
      // Should show dataset name in header
      expect(screen.getByRole('heading', { name: 'detailed.csv' })).toBeInTheDocument();
      // Should show row count
      expect(screen.getByText('1,000 rows')).toBeInTheDocument();
      // Should show column count
      expect(screen.getByText('3 columns')).toBeInTheDocument();
    });
  });

  describe('Dataset Deletion', () => {
    it('should open confirmation dialog when delete button is clicked', () => {
      const metadata = new Map([
        ['ds1', createMockMetadata('ds1', 'delete-me.csv', 100)],
      ]);
      mockDataStore.metadata = metadata;
      (useDataStore as any).mockReturnValue(mockDataStore);

      render(<DatasetManager />);
      
      // Find and click the delete button (it appears on hover, but we can still click it)
      const datasetButton = screen.getByText('delete-me.csv').closest('button');
      const deleteButton = within(datasetButton!.parentElement!).getByTitle('Delete dataset');
      fireEvent.click(deleteButton);
      
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      expect(screen.getByText('Delete Dataset')).toBeInTheDocument();
    });

    it('should delete dataset and show notification when confirmed', () => {
      const metadata = new Map([
        ['ds1', createMockMetadata('ds1', 'to-delete.csv', 100)],
      ]);
      mockDataStore.metadata = metadata;
      (useDataStore as any).mockReturnValue(mockDataStore);

      render(<DatasetManager />);
      
      // Open delete dialog
      const datasetButton = screen.getByText('to-delete.csv').closest('button');
      const deleteButton = within(datasetButton!.parentElement!).getByTitle('Delete dataset');
      fireEvent.click(deleteButton);
      
      // Confirm deletion
      fireEvent.click(screen.getByText('Confirm'));
      
      expect(mockDeleteTable).toHaveBeenCalledWith('ds1');
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'success',
        title: 'Dataset Deleted',
        message: 'to-delete.csv has been removed',
      });
    });

    it('should close dialog without deleting when cancelled', () => {
      const metadata = new Map([
        ['ds1', createMockMetadata('ds1', 'keep-me.csv', 100)],
      ]);
      mockDataStore.metadata = metadata;
      (useDataStore as any).mockReturnValue(mockDataStore);

      render(<DatasetManager />);
      
      // Open delete dialog
      const datasetButton = screen.getByText('keep-me.csv').closest('button');
      const deleteButton = within(datasetButton!.parentElement!).getByTitle('Delete dataset');
      fireEvent.click(deleteButton);
      
      // Cancel
      fireEvent.click(screen.getByText('Cancel'));
      
      expect(mockDeleteTable).not.toHaveBeenCalled();
      expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter datasets by name', () => {
      const metadata = new Map([
        ['ds1', createMockMetadata('ds1', 'sales_2024.csv', 100)],
        ['ds2', createMockMetadata('ds2', 'customers.csv', 100)],
        ['ds3', createMockMetadata('ds3', 'sales_2023.csv', 100)],
      ]);
      mockDataStore.metadata = metadata;
      (useDataStore as any).mockReturnValue(mockDataStore);

      render(<DatasetManager />);
      
      const searchInput = screen.getByPlaceholderText('Search datasets...');
      fireEvent.change(searchInput, { target: { value: 'sales' } });
      
      expect(screen.getByText('sales_2024.csv')).toBeInTheDocument();
      expect(screen.getByText('sales_2023.csv')).toBeInTheDocument();
      expect(screen.queryByText('customers.csv')).not.toBeInTheDocument();
    });

    it('should filter datasets by column name', () => {
      const metadata1 = createMockMetadata('ds1', 'data1.csv', 100);
      metadata1.columns = [{ name: 'revenue', type: 'Float64', nullable: false }];
      
      const metadata2 = createMockMetadata('ds2', 'data2.csv', 100);
      metadata2.columns = [{ name: 'customer_id', type: 'Int32', nullable: false }];
      
      const metadata = new Map([
        ['ds1', metadata1],
        ['ds2', metadata2],
      ]);
      mockDataStore.metadata = metadata;
      (useDataStore as any).mockReturnValue(mockDataStore);

      render(<DatasetManager />);
      
      const searchInput = screen.getByPlaceholderText('Search datasets...');
      fireEvent.change(searchInput, { target: { value: 'revenue' } });
      
      expect(screen.getByText('data1.csv')).toBeInTheDocument();
      expect(screen.queryByText('data2.csv')).not.toBeInTheDocument();
    });

    it('should show "No datasets match your search" when no results', () => {
      const metadata = new Map([
        ['ds1', createMockMetadata('ds1', 'test.csv', 100)],
      ]);
      mockDataStore.metadata = metadata;
      (useDataStore as any).mockReturnValue(mockDataStore);

      render(<DatasetManager />);
      
      const searchInput = screen.getByPlaceholderText('Search datasets...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
      
      expect(screen.getByText('No datasets match your search')).toBeInTheDocument();
    });

    it('should be case-insensitive', () => {
      const metadata = new Map([
        ['ds1', createMockMetadata('ds1', 'MyDataset.CSV', 100)],
      ]);
      mockDataStore.metadata = metadata;
      (useDataStore as any).mockReturnValue(mockDataStore);

      render(<DatasetManager />);
      
      const searchInput = screen.getByPlaceholderText('Search datasets...');
      fireEvent.change(searchInput, { target: { value: 'mydataset' } });
      
      expect(screen.getByText('MyDataset.CSV')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('should show Overview tab by default', () => {
      const mockTable = createMockTable(100, 3);
      const metadata = new Map([
        ['ds1', createMockMetadata('ds1', 'test.csv', 100)],
      ]);
      mockDataStore.metadata = metadata;
      mockDataStore.currentTableId = 'ds1';
      mockGetCurrentTable.mockReturnValue(mockTable);
      (useDataStore as any).mockReturnValue(mockDataStore);

      render(<DatasetManager />);
      
      // Overview tab should be active
      const overviewTab = screen.getByRole('button', { name: 'Overview' });
      expect(overviewTab).toHaveClass('bg-primary');
    });

    it('should switch to Columns tab when clicked', () => {
      const mockTable = createMockTable(100, 3);
      const metadata = new Map([
        ['ds1', createMockMetadata('ds1', 'test.csv', 100)],
      ]);
      mockDataStore.metadata = metadata;
      mockDataStore.currentTableId = 'ds1';
      mockGetCurrentTable.mockReturnValue(mockTable);
      (useDataStore as any).mockReturnValue(mockDataStore);

      render(<DatasetManager />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
      
      expect(screen.getByTestId('column-inspector')).toBeInTheDocument();
    });

    it('should switch to Preview tab when clicked', () => {
      const mockTable = createMockTable(100, 3);
      const metadata = new Map([
        ['ds1', createMockMetadata('ds1', 'test.csv', 100)],
      ]);
      mockDataStore.metadata = metadata;
      mockDataStore.currentTableId = 'ds1';
      mockGetCurrentTable.mockReturnValue(mockTable);
      (useDataStore as any).mockReturnValue(mockDataStore);

      render(<DatasetManager />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
      
      expect(screen.getByTestId('data-preview')).toBeInTheDocument();
    });
  });

  describe('Dataset Overview', () => {
    it('should display row count, column count, and completeness', () => {
      const mockTable = createMockTable(1000, 3);
      const metadata = new Map([
        ['ds1', createMockMetadata('ds1', 'stats.csv', 1000)],
      ]);
      mockDataStore.metadata = metadata;
      mockDataStore.currentTableId = 'ds1';
      mockGetCurrentTable.mockReturnValue(mockTable);
      (useDataStore as any).mockReturnValue(mockDataStore);

      render(<DatasetManager />);
      
      // Check stat cards
      expect(screen.getByText('Rows')).toBeInTheDocument();
      expect(screen.getByText('1,000')).toBeInTheDocument();
      expect(screen.getByText('Columns')).toBeInTheDocument();
      expect(screen.getByText('Completeness')).toBeInTheDocument();
      expect(screen.getByText('Null Values')).toBeInTheDocument();
    });

    it('should display column type distribution', () => {
      const mockTable = createMockTable(100, 3);
      const metadata = new Map([
        ['ds1', createMockMetadata('ds1', 'types.csv', 100)],
      ]);
      mockDataStore.metadata = metadata;
      mockDataStore.currentTableId = 'ds1';
      mockGetCurrentTable.mockReturnValue(mockTable);
      (useDataStore as any).mockReturnValue(mockDataStore);

      render(<DatasetManager />);
      
      expect(screen.getByText('Column Types')).toBeInTheDocument();
      expect(screen.getByText('Numeric')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('should list all columns with their types', () => {
      const mockTable = createMockTable(100, 3);
      const metadata = new Map([
        ['ds1', createMockMetadata('ds1', 'columns.csv', 100)],
      ]);
      mockDataStore.metadata = metadata;
      mockDataStore.currentTableId = 'ds1';
      mockGetCurrentTable.mockReturnValue(mockTable);
      (useDataStore as any).mockReturnValue(mockDataStore);

      render(<DatasetManager />);
      
      expect(screen.getByText('col_0')).toBeInTheDocument();
      expect(screen.getByText('col_1')).toBeInTheDocument();
      expect(screen.getByText('col_2')).toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    it('should show notification when export button is clicked', () => {
      const mockTable = createMockTable(100, 3);
      const metadata = new Map([
        ['ds1', createMockMetadata('ds1', 'export.csv', 100)],
      ]);
      mockDataStore.metadata = metadata;
      mockDataStore.currentTableId = 'ds1';
      mockGetCurrentTable.mockReturnValue(mockTable);
      (useDataStore as any).mockReturnValue(mockDataStore);

      render(<DatasetManager />);
      
      fireEvent.click(screen.getByText('Export'));
      
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'info',
        title: 'Export',
        message: 'Export functionality coming soon',
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle dataset with zero rows', () => {
      const mockTable = createMockTable(0, 3);
      const metadata = new Map([
        ['ds1', createMockMetadata('ds1', 'empty.csv', 0)],
      ]);
      mockDataStore.metadata = metadata;
      mockDataStore.currentTableId = 'ds1';
      mockGetCurrentTable.mockReturnValue(mockTable);
      (useDataStore as any).mockReturnValue(mockDataStore);

      render(<DatasetManager />);
      
      expect(screen.getByText('0 rows')).toBeInTheDocument();
    });

    it('should handle large dataset counts', () => {
      const metadata = new Map([
        ['ds1', createMockMetadata('ds1', 'large.csv', 10000000)],
      ]);
      mockDataStore.metadata = metadata;
      (useDataStore as any).mockReturnValue(mockDataStore);

      render(<DatasetManager />);
      
      expect(screen.getByText('10,000,000 rows')).toBeInTheDocument();
    });

    it('should handle special characters in dataset names', () => {
      const metadata = new Map([
        ['ds1', createMockMetadata('ds1', 'data (2024) - final.csv', 100)],
      ]);
      mockDataStore.metadata = metadata;
      (useDataStore as any).mockReturnValue(mockDataStore);

      render(<DatasetManager />);
      
      expect(screen.getByText('data (2024) - final.csv')).toBeInTheDocument();
    });

    it('should handle very long dataset names with truncation', () => {
      const longName = 'this_is_a_very_long_dataset_name_that_should_be_truncated_in_the_ui.csv';
      const metadata = new Map([
        ['ds1', createMockMetadata('ds1', longName, 100)],
      ]);
      mockDataStore.metadata = metadata;
      (useDataStore as any).mockReturnValue(mockDataStore);

      render(<DatasetManager />);
      
      // The name should be present (possibly truncated visually via CSS)
      expect(screen.getByText(longName)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible search input', () => {
      const metadata = new Map([
        ['ds1', createMockMetadata('ds1', 'test.csv', 100)],
      ]);
      mockDataStore.metadata = metadata;
      (useDataStore as any).mockReturnValue(mockDataStore);

      render(<DatasetManager />);
      
      const searchInput = screen.getByPlaceholderText('Search datasets...');
      expect(searchInput).toHaveAttribute('type', 'text');
    });

    it('should have accessible delete buttons with title', () => {
      const metadata = new Map([
        ['ds1', createMockMetadata('ds1', 'test.csv', 100)],
      ]);
      mockDataStore.metadata = metadata;
      (useDataStore as any).mockReturnValue(mockDataStore);

      render(<DatasetManager />);
      
      expect(screen.getByTitle('Delete dataset')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle many datasets without performance issues', () => {
      const metadata = new Map();
      for (let i = 0; i < 100; i++) {
        metadata.set(`ds${i}`, createMockMetadata(`ds${i}`, `dataset_${i}.csv`, 1000));
      }
      mockDataStore.metadata = metadata;
      (useDataStore as any).mockReturnValue(mockDataStore);

      const startTime = performance.now();
      render(<DatasetManager />);
      const endTime = performance.now();
      
      // Should render in less than 500ms
      expect(endTime - startTime).toBeLessThan(500);
      expect(screen.getByText('100 datasets')).toBeInTheDocument();
    });
  });
});

