# [TOASTER] Phase 4-5: Component Unit Tests

**Assigned to:** Toaster (Senior QA)  
**Date:** December 17, 2025  
**Priority:** High  
**Estimated Time:** 4 hours  
**Labels:** `toaster`, `testing`, `frontend`, `priority:high`

---

## Objective
Create comprehensive unit tests for the new Phase 4-5 components built by Handyman.

---

## Tasks

### T1: DatasetManager Tests
**File:** `frontend/src/components/Data/DatasetManager.test.tsx`

**Test Cases:**
- [ ] Renders empty state when no datasets
- [ ] Renders list of datasets with metadata
- [ ] Clicking dataset sets it as active
- [ ] Delete button shows confirmation modal
- [ ] Confirming delete removes dataset
- [ ] Canceling delete keeps dataset
- [ ] Search filters datasets by name
- [ ] Search is case-insensitive

**Edge Cases:**
- [ ] Large number of datasets (100+)
- [ ] Dataset with very long name
- [ ] Dataset with special characters in name
- [ ] Rapid switching between datasets

---

### T2: ColumnInspector Tests
**File:** `frontend/src/components/Data/ColumnInspector.test.tsx`

**Test Cases:**
- [ ] Renders all columns from schema
- [ ] Shows correct data type icons
- [ ] Numeric columns show min/max/mean/median
- [ ] String columns show distinct count
- [ ] Shows null count and percentage
- [ ] Expandable sections toggle correctly
- [ ] Handles columns with all nulls
- [ ] Handles columns with no nulls

**Edge Cases:**
- [ ] Table with 100+ columns
- [ ] Column with mixed types (should show inferred type)
- [ ] Empty table (0 rows)

---

### T3: DataPreview Tests
**File:** `frontend/src/components/Data/DataPreview.test.tsx`

**Test Cases:**
- [ ] Shows first N rows by default
- [ ] Toggle to last N rows works
- [ ] Random sample shows different rows each time
- [ ] Row count selector works (10, 25, 50, 100)
- [ ] Statistics panel shows correct values
- [ ] Column headers show type indicators

**Edge Cases:**
- [ ] Table with fewer rows than requested
- [ ] Empty table
- [ ] Table with only 1 row

---

### T4: QueryBuilder Tests
**File:** `frontend/src/components/Query/QueryBuilder.test.tsx`

**Test Cases:**
- [ ] Renders empty state with "Add Filter" button
- [ ] Adding filter creates new FilterBuilder row
- [ ] Removing filter removes the row
- [ ] Apply button triggers filter callback
- [ ] Reset button clears all filters
- [ ] Row count updates as filters change
- [ ] AND/OR toggle works

**Security Tests:**
- [ ] SQL injection in value input is sanitized
- [ ] XSS in value input is escaped
- [ ] Prototype pollution via filter values prevented

---

### T5: FilterBuilder Tests
**File:** `frontend/src/components/Query/FilterBuilder.test.tsx`

**Test Cases:**
- [ ] Column dropdown shows all columns
- [ ] Selecting column updates operator options
- [ ] Numeric column shows numeric operators
- [ ] String column shows string operators
- [ ] Date column shows date operators
- [ ] Value input type matches column type
- [ ] Remove button calls onRemove callback

---

## Technical Notes

### Test Setup
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DatasetManager } from './DatasetManager';

// Mock the store
vi.mock('@/store/dataStore', () => ({
  useDataStore: () => ({
    tables: mockTables,
    currentTableId: 'table-1',
    setCurrentTable: vi.fn(),
    deleteTable: vi.fn(),
  }),
}));
```

### Test Data
```typescript
const mockTables = new Map([
  ['table-1', {
    id: 'table-1',
    name: 'sales_data.csv',
    numRows: 10000,
    numCols: 15,
    size: 1024000,
    uploadedAt: new Date('2025-12-17'),
  }],
  ['table-2', {
    id: 'table-2',
    name: 'customers.json',
    numRows: 5000,
    numCols: 8,
    size: 512000,
    uploadedAt: new Date('2025-12-16'),
  }],
]);
```

### Coverage Requirements
- **Line Coverage:** 80%+
- **Branch Coverage:** 75%+
- **Function Coverage:** 90%+

---

## Definition of Done
- [ ] All 5 test files created
- [ ] All test cases passing
- [ ] Coverage meets requirements
- [ ] No flaky tests
- [ ] Tests follow AAA pattern
- [ ] Security tests included

---

## References
- Testing Guide: `WORKFLOW_GUIDE.md` (Testing Standards section)
- Existing Tests: `frontend/src/data-pipeline/operators/*.test.ts`
- Test Setup: `frontend/src/test/setup.ts`

