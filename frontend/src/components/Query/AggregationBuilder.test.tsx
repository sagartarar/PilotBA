/**
 * AggregationBuilder Component Tests
 * 
 * @author Toaster (Senior QA)
 * @date December 17, 2025
 * 
 * Tests aggregation configuration, function selection, group by,
 * alias naming, and type-specific function availability.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '../../test/utils/test-utils';
import { AggregationBuilder, AggregationConfig, AggregateFunction } from './AggregationBuilder';
import { ColumnInfo } from '../../store/dataStore';

// Helper to create mock columns
function createMockColumns(): ColumnInfo[] {
  return [
    { name: 'id', type: 'Int32', nullable: false },
    { name: 'name', type: 'Utf8', nullable: true },
    { name: 'price', type: 'Float64', nullable: true },
    { name: 'quantity', type: 'Int64', nullable: false },
    { name: 'category', type: 'Utf8', nullable: true },
    { name: 'discount', type: 'Decimal128(10,2)', nullable: true },
    { name: 'active', type: 'Bool', nullable: false },
  ];
}

// Helper to create mock aggregation
function createMockAggregation(overrides: Partial<AggregationConfig> = {}): AggregationConfig {
  return {
    id: `agg_${Date.now()}`,
    column: 'id',
    function: 'count',
    enabled: true,
    ...overrides,
  };
}

describe('AggregationBuilder', () => {
  let mockColumns: ColumnInfo[];
  let mockOnAggregationsChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockColumns = createMockColumns();
    mockOnAggregationsChange = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should render with header and Add button', () => {
      render(
        <AggregationBuilder
          columns={mockColumns}
          aggregations={[]}
          onAggregationsChange={mockOnAggregationsChange}
        />
      );
      
      expect(screen.getByText('Aggregations')).toBeInTheDocument();
      expect(screen.getByText('Add')).toBeInTheDocument();
    });

    it('should show empty state message when no aggregations', () => {
      render(
        <AggregationBuilder
          columns={mockColumns}
          aggregations={[]}
          onAggregationsChange={mockOnAggregationsChange}
        />
      );
      
      expect(screen.getByText(/No aggregations configured/)).toBeInTheDocument();
    });

    it('should not show Clear All button when no aggregations', () => {
      render(
        <AggregationBuilder
          columns={mockColumns}
          aggregations={[]}
          onAggregationsChange={mockOnAggregationsChange}
        />
      );
      
      expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
    });
  });

  describe('Adding Aggregations', () => {
    it('should add aggregation when Add is clicked', () => {
      render(
        <AggregationBuilder
          columns={mockColumns}
          aggregations={[]}
          onAggregationsChange={mockOnAggregationsChange}
        />
      );
      
      fireEvent.click(screen.getByText('Add'));
      
      expect(mockOnAggregationsChange).toHaveBeenCalledWith([
        expect.objectContaining({
          column: 'id', // First column
          function: 'count',
          enabled: true,
        }),
      ]);
    });

    it('should not add aggregation when no columns available', () => {
      render(
        <AggregationBuilder
          columns={[]}
          aggregations={[]}
          onAggregationsChange={mockOnAggregationsChange}
        />
      );
      
      fireEvent.click(screen.getByText('Add'));
      
      expect(mockOnAggregationsChange).not.toHaveBeenCalled();
    });
  });

  describe('Quick Add Buttons', () => {
    it('should display quick add buttons for numeric columns', () => {
      render(
        <AggregationBuilder
          columns={mockColumns}
          aggregations={[]}
          onAggregationsChange={mockOnAggregationsChange}
        />
      );
      
      expect(screen.getByText('Quick Add')).toBeInTheDocument();
      expect(screen.getByText('SUM')).toBeInTheDocument();
      expect(screen.getByText('AVG')).toBeInTheDocument();
      expect(screen.getByText('COUNT')).toBeInTheDocument();
      expect(screen.getByText('MIN')).toBeInTheDocument();
      expect(screen.getByText('MAX')).toBeInTheDocument();
    });

    it('should add aggregation when quick add button is clicked', () => {
      render(
        <AggregationBuilder
          columns={mockColumns}
          aggregations={[]}
          onAggregationsChange={mockOnAggregationsChange}
        />
      );
      
      fireEvent.click(screen.getByText('SUM'));
      
      expect(mockOnAggregationsChange).toHaveBeenCalledWith([
        expect.objectContaining({
          function: 'sum',
          enabled: true,
        }),
      ]);
    });

    it('should not show quick add when no numeric columns', () => {
      const textOnlyColumns: ColumnInfo[] = [
        { name: 'name', type: 'Utf8', nullable: true },
        { name: 'category', type: 'Utf8', nullable: true },
      ];

      render(
        <AggregationBuilder
          columns={textOnlyColumns}
          aggregations={[]}
          onAggregationsChange={mockOnAggregationsChange}
        />
      );
      
      expect(screen.queryByText('Quick Add')).not.toBeInTheDocument();
    });
  });

  describe('Aggregation Display', () => {
    it('should display existing aggregations', () => {
      const aggregations = [
        createMockAggregation({ id: 'a1', column: 'price', function: 'sum' }),
      ];

      render(
        <AggregationBuilder
          columns={mockColumns}
          aggregations={aggregations}
          onAggregationsChange={mockOnAggregationsChange}
        />
      );
      
      // Should show function and column selects
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(0);
    });

    it('should separate Group By and Aggregate Functions', () => {
      const aggregations = [
        createMockAggregation({ id: 'a1', column: 'category', function: 'groupBy' }),
        createMockAggregation({ id: 'a2', column: 'price', function: 'sum' }),
      ];

      render(
        <AggregationBuilder
          columns={mockColumns}
          aggregations={aggregations}
          onAggregationsChange={mockOnAggregationsChange}
        />
      );
      
      expect(screen.getByText('Group By')).toBeInTheDocument();
      expect(screen.getByText('Aggregate Functions')).toBeInTheDocument();
    });

    it('should display summary of active aggregations', () => {
      const aggregations = [
        createMockAggregation({ id: 'a1', column: 'category', function: 'groupBy', enabled: true }),
        createMockAggregation({ id: 'a2', column: 'price', function: 'sum', enabled: true }),
        createMockAggregation({ id: 'a3', column: 'quantity', function: 'avg', enabled: false }),
      ];

      render(
        <AggregationBuilder
          columns={mockColumns}
          aggregations={aggregations}
          onAggregationsChange={mockOnAggregationsChange}
        />
      );
      
      expect(screen.getByText(/1 group by/)).toBeInTheDocument();
      expect(screen.getByText(/1 aggregate function/)).toBeInTheDocument();
    });
  });

  describe('Function Selection', () => {
    it('should show all functions for numeric columns', () => {
      const aggregations = [
        createMockAggregation({ id: 'a1', column: 'price', function: 'sum' }),
      ];

      render(
        <AggregationBuilder
          columns={mockColumns}
          aggregations={aggregations}
          onAggregationsChange={mockOnAggregationsChange}
        />
      );
      
      const functionSelect = screen.getAllByRole('combobox')[0];
      const options = within(functionSelect).getAllByRole('option');
      const optionValues = options.map(o => o.textContent);
      
      expect(optionValues).toContain('Sum');
      expect(optionValues).toContain('Average');
      expect(optionValues).toContain('Std Dev');
      expect(optionValues).toContain('Variance');
    });

    it('should show limited functions for non-numeric columns', () => {
      const aggregations = [
        createMockAggregation({ id: 'a1', column: 'name', function: 'count' }),
      ];

      render(
        <AggregationBuilder
          columns={mockColumns}
          aggregations={aggregations}
          onAggregationsChange={mockOnAggregationsChange}
        />
      );
      
      const functionSelect = screen.getAllByRole('combobox')[0];
      const options = within(functionSelect).getAllByRole('option');
      const optionValues = options.map(o => o.textContent);
      
      expect(optionValues).toContain('Count');
      expect(optionValues).toContain('Min');
      expect(optionValues).toContain('Max');
      expect(optionValues).toContain('First');
      expect(optionValues).toContain('Last');
      expect(optionValues).toContain('Group By');
      // Should not have numeric-only functions
      expect(optionValues).not.toContain('Sum');
      expect(optionValues).not.toContain('Average');
    });

    it('should update function when changed', () => {
      const aggregations = [
        createMockAggregation({ id: 'a1', column: 'price', function: 'sum' }),
      ];

      render(
        <AggregationBuilder
          columns={mockColumns}
          aggregations={aggregations}
          onAggregationsChange={mockOnAggregationsChange}
        />
      );
      
      const functionSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(functionSelect, { target: { value: 'avg' } });
      
      expect(mockOnAggregationsChange).toHaveBeenCalledWith([
        expect.objectContaining({ function: 'avg' }),
      ]);
    });
  });

  describe('Column Selection', () => {
    it('should list all columns in dropdown', () => {
      const aggregations = [
        createMockAggregation({ id: 'a1' }),
      ];

      render(
        <AggregationBuilder
          columns={mockColumns}
          aggregations={aggregations}
          onAggregationsChange={mockOnAggregationsChange}
        />
      );
      
      const columnSelect = screen.getAllByRole('combobox')[1];
      const options = within(columnSelect).getAllByRole('option');
      
      expect(options.map(o => o.textContent)).toContain('id');
      expect(options.map(o => o.textContent)).toContain('name');
      expect(options.map(o => o.textContent)).toContain('price');
    });

    it('should update column when changed', () => {
      const aggregations = [
        createMockAggregation({ id: 'a1', column: 'id' }),
      ];

      render(
        <AggregationBuilder
          columns={mockColumns}
          aggregations={aggregations}
          onAggregationsChange={mockOnAggregationsChange}
        />
      );
      
      const columnSelect = screen.getAllByRole('combobox')[1];
      fireEvent.change(columnSelect, { target: { value: 'price' } });
      
      expect(mockOnAggregationsChange).toHaveBeenCalledWith([
        expect.objectContaining({ column: 'price' }),
      ]);
    });
  });

  describe('Alias Input', () => {
    it('should show alias input for aggregate functions', () => {
      const aggregations = [
        createMockAggregation({ id: 'a1', column: 'price', function: 'sum' }),
      ];

      render(
        <AggregationBuilder
          columns={mockColumns}
          aggregations={aggregations}
          onAggregationsChange={mockOnAggregationsChange}
        />
      );
      
      expect(screen.getByPlaceholderText('Alias')).toBeInTheDocument();
    });

    it('should not show alias input for groupBy', () => {
      const aggregations = [
        createMockAggregation({ id: 'a1', column: 'category', function: 'groupBy' }),
      ];

      render(
        <AggregationBuilder
          columns={mockColumns}
          aggregations={aggregations}
          onAggregationsChange={mockOnAggregationsChange}
        />
      );
      
      expect(screen.queryByPlaceholderText('Alias')).not.toBeInTheDocument();
    });

    it('should update alias when changed', () => {
      const aggregations = [
        createMockAggregation({ id: 'a1', column: 'price', function: 'sum' }),
      ];

      render(
        <AggregationBuilder
          columns={mockColumns}
          aggregations={aggregations}
          onAggregationsChange={mockOnAggregationsChange}
        />
      );
      
      const aliasInput = screen.getByPlaceholderText('Alias');
      fireEvent.change(aliasInput, { target: { value: 'total_price' } });
      
      expect(mockOnAggregationsChange).toHaveBeenCalledWith([
        expect.objectContaining({ alias: 'total_price' }),
      ]);
    });
  });

  describe('Aggregation Toggle', () => {
    it('should toggle aggregation enabled state', () => {
      const aggregations = [
        createMockAggregation({ id: 'a1', enabled: true }),
      ];

      render(
        <AggregationBuilder
          columns={mockColumns}
          aggregations={aggregations}
          onAggregationsChange={mockOnAggregationsChange}
        />
      );
      
      const toggleButton = screen.getByTitle('Disable');
      fireEvent.click(toggleButton);
      
      expect(mockOnAggregationsChange).toHaveBeenCalledWith([
        expect.objectContaining({ enabled: false }),
      ]);
    });

    it('should show disabled styling for disabled aggregations', () => {
      const aggregations = [
        createMockAggregation({ id: 'a1', enabled: false }),
      ];

      render(
        <AggregationBuilder
          columns={mockColumns}
          aggregations={aggregations}
          onAggregationsChange={mockOnAggregationsChange}
        />
      );
      
      const aggRow = screen.getByTitle('Enable').closest('div[class*="rounded-lg"]');
      expect(aggRow).toHaveClass('opacity-60');
    });
  });

  describe('Aggregation Removal', () => {
    it('should remove aggregation when remove button is clicked', () => {
      const aggregations = [
        createMockAggregation({ id: 'a1' }),
        createMockAggregation({ id: 'a2' }),
      ];

      render(
        <AggregationBuilder
          columns={mockColumns}
          aggregations={aggregations}
          onAggregationsChange={mockOnAggregationsChange}
        />
      );
      
      const removeButtons = screen.getAllByTitle('Remove');
      fireEvent.click(removeButtons[0]);
      
      expect(mockOnAggregationsChange).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'a2' }),
      ]);
    });
  });

  describe('Clear All', () => {
    it('should show Clear All button when aggregations exist', () => {
      const aggregations = [createMockAggregation({ id: 'a1' })];

      render(
        <AggregationBuilder
          columns={mockColumns}
          aggregations={aggregations}
          onAggregationsChange={mockOnAggregationsChange}
        />
      );
      
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('should clear all aggregations when Clear All is clicked', () => {
      const aggregations = [
        createMockAggregation({ id: 'a1' }),
        createMockAggregation({ id: 'a2' }),
      ];

      render(
        <AggregationBuilder
          columns={mockColumns}
          aggregations={aggregations}
          onAggregationsChange={mockOnAggregationsChange}
        />
      );
      
      fireEvent.click(screen.getByText('Clear All'));
      
      expect(mockOnAggregationsChange).toHaveBeenCalledWith([]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty columns array', () => {
      render(
        <AggregationBuilder
          columns={[]}
          aggregations={[]}
          onAggregationsChange={mockOnAggregationsChange}
        />
      );
      
      expect(screen.getByText('Aggregations')).toBeInTheDocument();
    });

    it('should handle many aggregations', () => {
      const aggregations = Array.from({ length: 10 }, (_, i) =>
        createMockAggregation({ id: `a${i}`, column: mockColumns[i % mockColumns.length].name })
      );

      const startTime = performance.now();
      render(
        <AggregationBuilder
          columns={mockColumns}
          aggregations={aggregations}
          onAggregationsChange={mockOnAggregationsChange}
        />
      );
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(500);
    });

    it('should handle aggregation with unknown column', () => {
      const aggregations = [
        createMockAggregation({ id: 'a1', column: 'unknown_column' }),
      ];

      render(
        <AggregationBuilder
          columns={mockColumns}
          aggregations={aggregations}
          onAggregationsChange={mockOnAggregationsChange}
        />
      );
      
      // Should still render without errors
      expect(screen.getByText('Aggregations')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible toggle buttons', () => {
      const aggregations = [createMockAggregation({ id: 'a1', enabled: true })];

      render(
        <AggregationBuilder
          columns={mockColumns}
          aggregations={aggregations}
          onAggregationsChange={mockOnAggregationsChange}
        />
      );
      
      expect(screen.getByTitle('Disable')).toBeInTheDocument();
    });

    it('should have accessible remove buttons', () => {
      const aggregations = [createMockAggregation({ id: 'a1' })];

      render(
        <AggregationBuilder
          columns={mockColumns}
          aggregations={aggregations}
          onAggregationsChange={mockOnAggregationsChange}
        />
      );
      
      expect(screen.getByTitle('Remove')).toBeInTheDocument();
    });

    it('should have accessible select elements', () => {
      const aggregations = [createMockAggregation({ id: 'a1' })];

      render(
        <AggregationBuilder
          columns={mockColumns}
          aggregations={aggregations}
          onAggregationsChange={mockOnAggregationsChange}
        />
      );
      
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(0);
    });
  });
});

