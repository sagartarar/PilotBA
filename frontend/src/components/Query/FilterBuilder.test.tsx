/**
 * FilterBuilder Component Tests
 * 
 * @author Toaster (Senior QA)
 * @date December 17, 2025
 * 
 * Tests filter creation, operator selection, value input,
 * filter toggling, and type-specific behavior.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '../../test/utils/test-utils';
import { FilterBuilder, FilterCondition, FilterOperator } from './FilterBuilder';
import { ColumnInfo } from '../../store/dataStore';

// Helper to create mock columns
function createMockColumns(): ColumnInfo[] {
  return [
    { name: 'id', type: 'Int32', nullable: false },
    { name: 'name', type: 'Utf8', nullable: true },
    { name: 'price', type: 'Float64', nullable: true },
    { name: 'active', type: 'Bool', nullable: false },
    { name: 'created_at', type: 'Timestamp<MILLISECOND>', nullable: true },
    { name: 'category', type: 'Utf8', nullable: true },
    { name: 'quantity', type: 'Int64', nullable: false },
    { name: 'discount', type: 'Decimal128(10,2)', nullable: true },
  ];
}

// Helper to create mock filter
function createMockFilter(overrides: Partial<FilterCondition> = {}): FilterCondition {
  return {
    id: `filter_${Date.now()}`,
    column: 'id',
    operator: 'eq',
    value: '',
    enabled: true,
    ...overrides,
  };
}

describe('FilterBuilder', () => {
  let mockColumns: ColumnInfo[];
  let mockOnFiltersChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockColumns = createMockColumns();
    mockOnFiltersChange = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should render with header and Add Filter button', () => {
      render(
        <FilterBuilder
          columns={mockColumns}
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      expect(screen.getByText('Filters')).toBeInTheDocument();
      expect(screen.getByText('Add Filter')).toBeInTheDocument();
    });

    it('should show empty state message when no filters', () => {
      render(
        <FilterBuilder
          columns={mockColumns}
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      expect(screen.getByText(/No filters applied/)).toBeInTheDocument();
    });

    it('should not show Clear All button when no filters', () => {
      render(
        <FilterBuilder
          columns={mockColumns}
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
    });
  });

  describe('Adding Filters', () => {
    it('should add filter when Add Filter is clicked', () => {
      render(
        <FilterBuilder
          columns={mockColumns}
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      fireEvent.click(screen.getByText('Add Filter'));
      
      expect(mockOnFiltersChange).toHaveBeenCalledWith([
        expect.objectContaining({
          column: 'id', // First column
          operator: 'eq',
          enabled: true,
        }),
      ]);
    });

    it('should not add filter when no columns available', () => {
      render(
        <FilterBuilder
          columns={[]}
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      fireEvent.click(screen.getByText('Add Filter'));
      
      expect(mockOnFiltersChange).not.toHaveBeenCalled();
    });
  });

  describe('Filter Display', () => {
    it('should display existing filters', () => {
      const filters = [
        createMockFilter({ id: 'f1', column: 'name', operator: 'contains', value: 'test' }),
      ];

      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      // Should show column select with 'name' selected
      const columnSelect = screen.getAllByRole('combobox')[0];
      expect(columnSelect).toHaveValue('name');
    });

    it('should show "Where" for first filter', () => {
      const filters = [createMockFilter({ id: 'f1' })];

      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      expect(screen.getByText('Where')).toBeInTheDocument();
    });

    it('should show "And" for subsequent filters', () => {
      const filters = [
        createMockFilter({ id: 'f1' }),
        createMockFilter({ id: 'f2' }),
      ];

      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      expect(screen.getByText('Where')).toBeInTheDocument();
      expect(screen.getByText('And')).toBeInTheDocument();
    });

    it('should display filter count summary', () => {
      const filters = [
        createMockFilter({ id: 'f1', enabled: true }),
        createMockFilter({ id: 'f2', enabled: false }),
        createMockFilter({ id: 'f3', enabled: true }),
      ];

      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      expect(screen.getByText('2 of 3 filters active')).toBeInTheDocument();
    });
  });

  describe('Column Selection', () => {
    it('should list all columns in dropdown', () => {
      const filters = [createMockFilter({ id: 'f1' })];

      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      const columnSelect = screen.getAllByRole('combobox')[0];
      const options = within(columnSelect).getAllByRole('option');
      
      expect(options.map(o => o.textContent)).toContain('id');
      expect(options.map(o => o.textContent)).toContain('name');
      expect(options.map(o => o.textContent)).toContain('price');
      expect(options.map(o => o.textContent)).toContain('active');
    });

    it('should update filter when column changes', () => {
      const filters = [createMockFilter({ id: 'f1', column: 'id' })];

      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      const columnSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(columnSelect, { target: { value: 'name' } });
      
      expect(mockOnFiltersChange).toHaveBeenCalledWith([
        expect.objectContaining({ column: 'name' }),
      ]);
    });
  });

  describe('Operator Selection', () => {
    it('should show numeric operators for numeric columns', () => {
      const filters = [createMockFilter({ id: 'f1', column: 'id' })];

      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      const operatorSelect = screen.getAllByRole('combobox')[1];
      const options = within(operatorSelect).getAllByRole('option');
      const optionValues = options.map(o => o.textContent);
      
      expect(optionValues).toContain('equals');
      expect(optionValues).toContain('greater than');
      expect(optionValues).toContain('less than');
      expect(optionValues).toContain('between');
    });

    it('should show text operators for text columns', () => {
      const filters = [createMockFilter({ id: 'f1', column: 'name' })];

      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      const operatorSelect = screen.getAllByRole('combobox')[1];
      const options = within(operatorSelect).getAllByRole('option');
      const optionValues = options.map(o => o.textContent);
      
      expect(optionValues).toContain('contains');
      expect(optionValues).toContain('starts with');
      expect(optionValues).toContain('ends with');
    });

    it('should show boolean operators for boolean columns', () => {
      const filters = [createMockFilter({ id: 'f1', column: 'active' })];

      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      const operatorSelect = screen.getAllByRole('combobox')[1];
      const options = within(operatorSelect).getAllByRole('option');
      const optionValues = options.map(o => o.textContent);
      
      expect(optionValues).toContain('equals');
      expect(optionValues).toContain('is null');
      expect(optionValues).toContain('is not null');
      // Should not have text-specific operators
      expect(optionValues).not.toContain('contains');
    });

    it('should show date operators for date columns', () => {
      const filters = [createMockFilter({ id: 'f1', column: 'created_at' })];

      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      const operatorSelect = screen.getAllByRole('combobox')[1];
      const options = within(operatorSelect).getAllByRole('option');
      const optionValues = options.map(o => o.textContent);
      
      expect(optionValues).toContain('equals');
      expect(optionValues).toContain('greater than');
      expect(optionValues).toContain('between');
    });

    it('should update filter when operator changes', () => {
      const filters = [createMockFilter({ id: 'f1', column: 'id', operator: 'eq' })];

      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      const operatorSelect = screen.getAllByRole('combobox')[1];
      fireEvent.change(operatorSelect, { target: { value: 'gt' } });
      
      expect(mockOnFiltersChange).toHaveBeenCalledWith([
        expect.objectContaining({ operator: 'gt' }),
      ]);
    });
  });

  describe('Value Input', () => {
    it('should show text input for text operators', () => {
      const filters = [createMockFilter({ id: 'f1', column: 'name', operator: 'contains' })];

      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      expect(screen.getByPlaceholderText('Value')).toBeInTheDocument();
    });

    it('should show number input for numeric columns', () => {
      const filters = [createMockFilter({ id: 'f1', column: 'price', operator: 'gt' })];

      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      const input = screen.getByPlaceholderText('Value');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('should show date input for date columns', () => {
      const filters = [createMockFilter({ id: 'f1', column: 'created_at', operator: 'gt' })];

      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      const input = screen.getByPlaceholderText('Value');
      expect(input).toHaveAttribute('type', 'date');
    });

    it('should show boolean select for boolean columns', () => {
      const filters = [createMockFilter({ id: 'f1', column: 'active', operator: 'eq' })];

      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      // Should have a select with True/False options
      const selects = screen.getAllByRole('combobox');
      const booleanSelect = selects[selects.length - 1]; // Last select should be value select
      const options = within(booleanSelect).getAllByRole('option');
      
      expect(options.map(o => o.textContent)).toContain('True');
      expect(options.map(o => o.textContent)).toContain('False');
    });

    it('should not show value input for isNull operator', () => {
      const filters = [createMockFilter({ id: 'f1', column: 'name', operator: 'isNull' })];

      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      expect(screen.queryByPlaceholderText('Value')).not.toBeInTheDocument();
    });

    it('should not show value input for isNotNull operator', () => {
      const filters = [createMockFilter({ id: 'f1', column: 'name', operator: 'isNotNull' })];

      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      expect(screen.queryByPlaceholderText('Value')).not.toBeInTheDocument();
    });

    it('should show two inputs for between operator', () => {
      const filters = [createMockFilter({ id: 'f1', column: 'price', operator: 'between' })];

      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      const inputs = screen.getAllByPlaceholderText('Value');
      expect(inputs.length).toBe(2);
      expect(screen.getByText('and')).toBeInTheDocument();
    });

    it('should show list placeholder for in operator', () => {
      const filters = [createMockFilter({ id: 'f1', column: 'name', operator: 'in' })];

      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      expect(screen.getByPlaceholderText('value1, value2, ...')).toBeInTheDocument();
    });

    it('should update filter value on input change', () => {
      const filters = [createMockFilter({ id: 'f1', column: 'name', operator: 'contains' })];

      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      const input = screen.getByPlaceholderText('Value');
      fireEvent.change(input, { target: { value: 'test' } });
      
      expect(mockOnFiltersChange).toHaveBeenCalledWith([
        expect.objectContaining({ value: 'test' }),
      ]);
    });
  });

  describe('Filter Toggle', () => {
    it('should toggle filter enabled state', () => {
      const filters = [createMockFilter({ id: 'f1', enabled: true })];

      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      const toggleButton = screen.getByTitle('Disable filter');
      fireEvent.click(toggleButton);
      
      expect(mockOnFiltersChange).toHaveBeenCalledWith([
        expect.objectContaining({ enabled: false }),
      ]);
    });

    it('should show disabled styling for disabled filters', () => {
      const filters = [createMockFilter({ id: 'f1', enabled: false })];

      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      const filterRow = screen.getByTitle('Enable filter').closest('div[class*="rounded-lg"]');
      expect(filterRow).toHaveClass('opacity-60');
    });
  });

  describe('Filter Removal', () => {
    it('should remove filter when remove button is clicked', () => {
      const filters = [
        createMockFilter({ id: 'f1' }),
        createMockFilter({ id: 'f2' }),
      ];

      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      const removeButtons = screen.getAllByTitle('Remove filter');
      fireEvent.click(removeButtons[0]);
      
      expect(mockOnFiltersChange).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'f2' }),
      ]);
    });
  });

  describe('Clear All', () => {
    it('should show Clear All button when filters exist', () => {
      const filters = [createMockFilter({ id: 'f1' })];

      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('should clear all filters when Clear All is clicked', () => {
      const filters = [
        createMockFilter({ id: 'f1' }),
        createMockFilter({ id: 'f2' }),
      ];

      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      fireEvent.click(screen.getByText('Clear All'));
      
      expect(mockOnFiltersChange).toHaveBeenCalledWith([]);
    });
  });

  describe('Column Type Detection', () => {
    it('should detect Int types as numeric', () => {
      const filters = [createMockFilter({ id: 'f1', column: 'id' })];

      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      // Should have numeric operators
      const operatorSelect = screen.getAllByRole('combobox')[1];
      const options = within(operatorSelect).getAllByRole('option');
      expect(options.map(o => o.textContent)).toContain('greater than');
    });

    it('should detect Float types as numeric', () => {
      const filters = [createMockFilter({ id: 'f1', column: 'price' })];

      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      const operatorSelect = screen.getAllByRole('combobox')[1];
      const options = within(operatorSelect).getAllByRole('option');
      expect(options.map(o => o.textContent)).toContain('between');
    });

    it('should detect Decimal types as numeric', () => {
      const filters = [createMockFilter({ id: 'f1', column: 'discount' })];

      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      const operatorSelect = screen.getAllByRole('combobox')[1];
      const options = within(operatorSelect).getAllByRole('option');
      expect(options.map(o => o.textContent)).toContain('greater or equal');
    });

    it('should detect Utf8/String types as text', () => {
      const filters = [createMockFilter({ id: 'f1', column: 'name' })];

      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      const operatorSelect = screen.getAllByRole('combobox')[1];
      const options = within(operatorSelect).getAllByRole('option');
      expect(options.map(o => o.textContent)).toContain('contains');
    });

    it('should detect Bool types as boolean', () => {
      const filters = [createMockFilter({ id: 'f1', column: 'active' })];

      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      const operatorSelect = screen.getAllByRole('combobox')[1];
      const options = within(operatorSelect).getAllByRole('option');
      // Boolean should have limited operators
      expect(options.length).toBeLessThan(6);
    });

    it('should detect Timestamp types as date', () => {
      const filters = [createMockFilter({ id: 'f1', column: 'created_at' })];

      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      const input = screen.getByPlaceholderText('Value');
      expect(input).toHaveAttribute('type', 'date');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty columns array', () => {
      render(
        <FilterBuilder
          columns={[]}
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      // Should still render without errors
      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('should handle filter with unknown column', () => {
      const filters = [createMockFilter({ id: 'f1', column: 'unknown_column' })];

      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      // Should default to text operators
      const operatorSelect = screen.getAllByRole('combobox')[1];
      const options = within(operatorSelect).getAllByRole('option');
      expect(options.map(o => o.textContent)).toContain('contains');
    });

    it('should handle many filters', () => {
      const filters = Array.from({ length: 20 }, (_, i) => 
        createMockFilter({ id: `f${i}`, column: mockColumns[i % mockColumns.length].name })
      );

      const startTime = performance.now();
      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(500);
      expect(screen.getByText(/20 filters/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible toggle buttons', () => {
      const filters = [createMockFilter({ id: 'f1', enabled: true })];

      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      expect(screen.getByTitle('Disable filter')).toBeInTheDocument();
    });

    it('should have accessible remove buttons', () => {
      const filters = [createMockFilter({ id: 'f1' })];

      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      expect(screen.getByTitle('Remove filter')).toBeInTheDocument();
    });

    it('should have accessible select elements', () => {
      const filters = [createMockFilter({ id: 'f1' })];

      render(
        <FilterBuilder
          columns={mockColumns}
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(0);
    });
  });
});

