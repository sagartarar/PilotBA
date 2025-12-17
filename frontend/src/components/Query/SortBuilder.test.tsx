/**
 * SortBuilder Component Tests
 * 
 * @author Toaster (Senior QA)
 * @date December 17, 2025
 * 
 * Tests sort configuration, direction toggle, nulls handling,
 * priority reordering, and multi-column sorting.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '../../test/utils/test-utils';
import { SortBuilder, SortConfig } from './SortBuilder';
import { ColumnInfo } from '../../store/dataStore';

// Helper to create mock columns
function createMockColumns(): ColumnInfo[] {
  return [
    { name: 'id', type: 'Int32', nullable: false },
    { name: 'name', type: 'Utf8', nullable: true },
    { name: 'price', type: 'Float64', nullable: true },
    { name: 'quantity', type: 'Int64', nullable: false },
    { name: 'category', type: 'Utf8', nullable: true },
    { name: 'created_at', type: 'Timestamp<MILLISECOND>', nullable: true },
  ];
}

// Helper to create mock sort
function createMockSort(overrides: Partial<SortConfig> = {}): SortConfig {
  return {
    id: `sort_${Date.now()}`,
    column: 'id',
    direction: 'asc',
    nullsFirst: false,
    enabled: true,
    ...overrides,
  };
}

describe('SortBuilder', () => {
  let mockColumns: ColumnInfo[];
  let mockOnSortsChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockColumns = createMockColumns();
    mockOnSortsChange = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should render with header and Add Sort button', () => {
      render(
        <SortBuilder
          columns={mockColumns}
          sorts={[]}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      expect(screen.getByText('Sort Order')).toBeInTheDocument();
      expect(screen.getByText('Add Sort')).toBeInTheDocument();
    });

    it('should show empty state message when no sorts', () => {
      render(
        <SortBuilder
          columns={mockColumns}
          sorts={[]}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      expect(screen.getByText(/No sort order defined/)).toBeInTheDocument();
    });

    it('should not show Clear All button when no sorts', () => {
      render(
        <SortBuilder
          columns={mockColumns}
          sorts={[]}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
    });
  });

  describe('Adding Sorts', () => {
    it('should add sort when Add Sort is clicked', () => {
      render(
        <SortBuilder
          columns={mockColumns}
          sorts={[]}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      fireEvent.click(screen.getByText('Add Sort'));
      
      expect(mockOnSortsChange).toHaveBeenCalledWith([
        expect.objectContaining({
          column: 'id', // First column
          direction: 'asc',
          nullsFirst: false,
          enabled: true,
        }),
      ]);
    });

    it('should select unused column when adding new sort', () => {
      const sorts = [createMockSort({ id: 's1', column: 'id' })];

      render(
        <SortBuilder
          columns={mockColumns}
          sorts={sorts}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      fireEvent.click(screen.getByText('Add Sort'));
      
      expect(mockOnSortsChange).toHaveBeenCalledWith([
        expect.objectContaining({ column: 'id' }),
        expect.objectContaining({ column: 'name' }), // Next unused column
      ]);
    });

    it('should disable Add Sort when all columns are used', () => {
      const sorts = mockColumns.map((col, i) =>
        createMockSort({ id: `s${i}`, column: col.name })
      );

      render(
        <SortBuilder
          columns={mockColumns}
          sorts={sorts}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      const addButton = screen.getByText('Add Sort').closest('button');
      expect(addButton).toBeDisabled();
    });

    it('should not add sort when no columns available', () => {
      render(
        <SortBuilder
          columns={[]}
          sorts={[]}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      fireEvent.click(screen.getByText('Add Sort'));
      
      expect(mockOnSortsChange).not.toHaveBeenCalled();
    });
  });

  describe('Sort Display', () => {
    it('should display existing sorts', () => {
      const sorts = [
        createMockSort({ id: 's1', column: 'name', direction: 'asc' }),
      ];

      render(
        <SortBuilder
          columns={mockColumns}
          sorts={sorts}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      // Should show column select with 'name' selected
      const columnSelect = screen.getByRole('combobox');
      expect(columnSelect).toHaveValue('name');
    });

    it('should show priority numbers for each sort', () => {
      const sorts = [
        createMockSort({ id: 's1', column: 'name' }),
        createMockSort({ id: 's2', column: 'price' }),
        createMockSort({ id: 's3', column: 'id' }),
      ];

      render(
        <SortBuilder
          columns={mockColumns}
          sorts={sorts}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should display sort count summary', () => {
      const sorts = [
        createMockSort({ id: 's1', enabled: true }),
        createMockSort({ id: 's2', enabled: false }),
        createMockSort({ id: 's3', enabled: true }),
      ];

      render(
        <SortBuilder
          columns={mockColumns}
          sorts={sorts}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      expect(screen.getByText('2 of 3 sorts active')).toBeInTheDocument();
    });

    it('should show info about reordering when multiple sorts', () => {
      const sorts = [
        createMockSort({ id: 's1' }),
        createMockSort({ id: 's2' }),
      ];

      render(
        <SortBuilder
          columns={mockColumns}
          sorts={sorts}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      expect(screen.getByText(/First sort has highest priority/)).toBeInTheDocument();
    });
  });

  describe('Direction Toggle', () => {
    it('should display ASC for ascending sort', () => {
      const sorts = [createMockSort({ id: 's1', direction: 'asc' })];

      render(
        <SortBuilder
          columns={mockColumns}
          sorts={sorts}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      expect(screen.getByText('ASC')).toBeInTheDocument();
    });

    it('should display DESC for descending sort', () => {
      const sorts = [createMockSort({ id: 's1', direction: 'desc' })];

      render(
        <SortBuilder
          columns={mockColumns}
          sorts={sorts}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      expect(screen.getByText('DESC')).toBeInTheDocument();
    });

    it('should toggle direction when clicked', () => {
      const sorts = [createMockSort({ id: 's1', direction: 'asc' })];

      render(
        <SortBuilder
          columns={mockColumns}
          sorts={sorts}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      fireEvent.click(screen.getByText('ASC'));
      
      expect(mockOnSortsChange).toHaveBeenCalledWith([
        expect.objectContaining({ direction: 'desc' }),
      ]);
    });

    it('should toggle from desc to asc', () => {
      const sorts = [createMockSort({ id: 's1', direction: 'desc' })];

      render(
        <SortBuilder
          columns={mockColumns}
          sorts={sorts}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      fireEvent.click(screen.getByText('DESC'));
      
      expect(mockOnSortsChange).toHaveBeenCalledWith([
        expect.objectContaining({ direction: 'asc' }),
      ]);
    });
  });

  describe('Nulls First Toggle', () => {
    it('should display nulls last by default', () => {
      const sorts = [createMockSort({ id: 's1', nullsFirst: false })];

      render(
        <SortBuilder
          columns={mockColumns}
          sorts={sorts}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      expect(screen.getByText('Nulls ↓')).toBeInTheDocument();
    });

    it('should display nulls first when enabled', () => {
      const sorts = [createMockSort({ id: 's1', nullsFirst: true })];

      render(
        <SortBuilder
          columns={mockColumns}
          sorts={sorts}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      expect(screen.getByText('Nulls ↑')).toBeInTheDocument();
    });

    it('should toggle nullsFirst when clicked', () => {
      const sorts = [createMockSort({ id: 's1', nullsFirst: false })];

      render(
        <SortBuilder
          columns={mockColumns}
          sorts={sorts}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      fireEvent.click(screen.getByText('Nulls ↓'));
      
      expect(mockOnSortsChange).toHaveBeenCalledWith([
        expect.objectContaining({ nullsFirst: true }),
      ]);
    });
  });

  describe('Column Selection', () => {
    it('should list all columns in dropdown', () => {
      const sorts = [createMockSort({ id: 's1' })];

      render(
        <SortBuilder
          columns={mockColumns}
          sorts={sorts}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      const columnSelect = screen.getByRole('combobox');
      const options = within(columnSelect).getAllByRole('option');
      
      expect(options.map(o => o.textContent)).toContain('id');
      expect(options.map(o => o.textContent)).toContain('name');
      expect(options.map(o => o.textContent)).toContain('price');
    });

    it('should update column when changed', () => {
      const sorts = [createMockSort({ id: 's1', column: 'id' })];

      render(
        <SortBuilder
          columns={mockColumns}
          sorts={sorts}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      const columnSelect = screen.getByRole('combobox');
      fireEvent.change(columnSelect, { target: { value: 'price' } });
      
      expect(mockOnSortsChange).toHaveBeenCalledWith([
        expect.objectContaining({ column: 'price' }),
      ]);
    });
  });

  describe('Sort Toggle', () => {
    it('should toggle sort enabled state', () => {
      const sorts = [createMockSort({ id: 's1', enabled: true })];

      render(
        <SortBuilder
          columns={mockColumns}
          sorts={sorts}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      const toggleButton = screen.getByTitle('Disable');
      fireEvent.click(toggleButton);
      
      expect(mockOnSortsChange).toHaveBeenCalledWith([
        expect.objectContaining({ enabled: false }),
      ]);
    });

    it('should show disabled styling for disabled sorts', () => {
      const sorts = [createMockSort({ id: 's1', enabled: false })];

      render(
        <SortBuilder
          columns={mockColumns}
          sorts={sorts}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      const sortRow = screen.getByTitle('Enable').closest('div[class*="rounded-lg"]');
      expect(sortRow).toHaveClass('opacity-60');
    });
  });

  describe('Sort Removal', () => {
    it('should remove sort when remove button is clicked', () => {
      const sorts = [
        createMockSort({ id: 's1' }),
        createMockSort({ id: 's2' }),
      ];

      render(
        <SortBuilder
          columns={mockColumns}
          sorts={sorts}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      const removeButtons = screen.getAllByTitle('Remove');
      fireEvent.click(removeButtons[0]);
      
      expect(mockOnSortsChange).toHaveBeenCalledWith([
        expect.objectContaining({ id: 's2' }),
      ]);
    });
  });

  describe('Sort Reordering', () => {
    it('should move sort up when move up is clicked', () => {
      const sorts = [
        createMockSort({ id: 's1', column: 'name' }),
        createMockSort({ id: 's2', column: 'price' }),
      ];

      render(
        <SortBuilder
          columns={mockColumns}
          sorts={sorts}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      const moveUpButtons = screen.getAllByTitle('Move up');
      fireEvent.click(moveUpButtons[1]); // Click move up on second sort
      
      expect(mockOnSortsChange).toHaveBeenCalledWith([
        expect.objectContaining({ id: 's2', column: 'price' }),
        expect.objectContaining({ id: 's1', column: 'name' }),
      ]);
    });

    it('should move sort down when move down is clicked', () => {
      const sorts = [
        createMockSort({ id: 's1', column: 'name' }),
        createMockSort({ id: 's2', column: 'price' }),
      ];

      render(
        <SortBuilder
          columns={mockColumns}
          sorts={sorts}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      const moveDownButtons = screen.getAllByTitle('Move down');
      fireEvent.click(moveDownButtons[0]); // Click move down on first sort
      
      expect(mockOnSortsChange).toHaveBeenCalledWith([
        expect.objectContaining({ id: 's2', column: 'price' }),
        expect.objectContaining({ id: 's1', column: 'name' }),
      ]);
    });

    it('should disable move up for first sort', () => {
      const sorts = [
        createMockSort({ id: 's1' }),
        createMockSort({ id: 's2' }),
      ];

      render(
        <SortBuilder
          columns={mockColumns}
          sorts={sorts}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      const moveUpButtons = screen.getAllByTitle('Move up');
      expect(moveUpButtons[0]).toBeDisabled();
    });

    it('should disable move down for last sort', () => {
      const sorts = [
        createMockSort({ id: 's1' }),
        createMockSort({ id: 's2' }),
      ];

      render(
        <SortBuilder
          columns={mockColumns}
          sorts={sorts}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      const moveDownButtons = screen.getAllByTitle('Move down');
      expect(moveDownButtons[1]).toBeDisabled();
    });
  });

  describe('Clear All', () => {
    it('should show Clear All button when sorts exist', () => {
      const sorts = [createMockSort({ id: 's1' })];

      render(
        <SortBuilder
          columns={mockColumns}
          sorts={sorts}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('should clear all sorts when Clear All is clicked', () => {
      const sorts = [
        createMockSort({ id: 's1' }),
        createMockSort({ id: 's2' }),
      ];

      render(
        <SortBuilder
          columns={mockColumns}
          sorts={sorts}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      fireEvent.click(screen.getByText('Clear All'));
      
      expect(mockOnSortsChange).toHaveBeenCalledWith([]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty columns array', () => {
      render(
        <SortBuilder
          columns={[]}
          sorts={[]}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      expect(screen.getByText('Sort Order')).toBeInTheDocument();
    });

    it('should handle single sort (no reorder info)', () => {
      const sorts = [createMockSort({ id: 's1' })];

      render(
        <SortBuilder
          columns={mockColumns}
          sorts={sorts}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      expect(screen.queryByText(/First sort has highest priority/)).not.toBeInTheDocument();
    });

    it('should handle many sorts', () => {
      const sorts = mockColumns.map((col, i) =>
        createMockSort({ id: `s${i}`, column: col.name })
      );

      const startTime = performance.now();
      render(
        <SortBuilder
          columns={mockColumns}
          sorts={sorts}
          onSortsChange={mockOnSortsChange}
        />
      );
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(500);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible toggle buttons', () => {
      const sorts = [createMockSort({ id: 's1', enabled: true })];

      render(
        <SortBuilder
          columns={mockColumns}
          sorts={sorts}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      expect(screen.getByTitle('Disable')).toBeInTheDocument();
    });

    it('should have accessible direction buttons', () => {
      const sorts = [createMockSort({ id: 's1', direction: 'asc' })];

      render(
        <SortBuilder
          columns={mockColumns}
          sorts={sorts}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      expect(screen.getByTitle('Ascending')).toBeInTheDocument();
    });

    it('should have accessible nulls buttons', () => {
      const sorts = [createMockSort({ id: 's1', nullsFirst: false })];

      render(
        <SortBuilder
          columns={mockColumns}
          sorts={sorts}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      expect(screen.getByTitle('Nulls last')).toBeInTheDocument();
    });

    it('should have accessible move buttons', () => {
      const sorts = [
        createMockSort({ id: 's1' }),
        createMockSort({ id: 's2' }),
      ];

      render(
        <SortBuilder
          columns={mockColumns}
          sorts={sorts}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      expect(screen.getAllByTitle('Move up').length).toBe(2);
      expect(screen.getAllByTitle('Move down').length).toBe(2);
    });

    it('should have accessible remove buttons', () => {
      const sorts = [createMockSort({ id: 's1' })];

      render(
        <SortBuilder
          columns={mockColumns}
          sorts={sorts}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      expect(screen.getByTitle('Remove')).toBeInTheDocument();
    });

    it('should have accessible select elements', () => {
      const sorts = [createMockSort({ id: 's1' })];

      render(
        <SortBuilder
          columns={mockColumns}
          sorts={sorts}
          onSortsChange={mockOnSortsChange}
        />
      );
      
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(0);
    });
  });
});

