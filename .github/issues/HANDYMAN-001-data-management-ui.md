# [HANDYMAN] Phase 4: Data Management UI Components

**Assigned to:** Handyman (Lead Developer)  
**Date:** December 17, 2025  
**Priority:** High  
**Estimated Time:** 4 hours  
**Labels:** `handyman`, `feature`, `frontend`, `priority:high`

---

## Objective
Implement the Data Management UI components for Phase 4 of the Frontend MVP.

---

## Tasks

### H1: DatasetManager Component
**File:** `frontend/src/components/Data/DatasetManager.tsx`

**Requirements:**
- [ ] List all uploaded datasets with metadata (name, rows, columns, size, upload time)
- [ ] Switch between datasets (set as active)
- [ ] Delete datasets with confirmation modal
- [ ] Search/filter datasets by name
- [ ] Show empty state when no datasets

**Acceptance Criteria:**
- User can see all uploaded files in a list
- Clicking a dataset makes it active
- Delete removes dataset from store
- Search filters the list in real-time

---

### H2: ColumnInspector Component
**File:** `frontend/src/components/Data/ColumnInspector.tsx`

**Requirements:**
- [ ] List all columns with data types (string, number, date, boolean)
- [ ] Show column statistics:
  - Numeric: min, max, mean, median, std dev
  - String: distinct count, most common values
  - All: null count, null percentage
- [ ] Column type icons
- [ ] Expandable details for each column

**Acceptance Criteria:**
- All columns displayed with correct types
- Statistics calculated and displayed
- Expandable sections work correctly

---

### H3: DataPreview Component
**File:** `frontend/src/components/Data/DataPreview.tsx`

**Requirements:**
- [ ] Show first N rows (configurable, default 10)
- [ ] Show last N rows option
- [ ] Random sample option
- [ ] Quick statistics summary panel
- [ ] Column type indicators in header

**Acceptance Criteria:**
- Preview shows correct data
- Toggle between first/last/random works
- Statistics panel displays correctly

---

## Technical Notes

### Integration Points
- Use `useDataStore()` from `frontend/src/store/dataStore.ts`
- Use existing `DataTable` component for rendering
- Reference `Statistics.ts` from data-pipeline for calculations

### Styling
- Follow existing Tailwind CSS patterns
- Support light/dark themes
- Responsive design (mobile-friendly)

### State Management
```typescript
// Access current table
const { tables, currentTableId, getCurrentTable } = useDataStore();

// Get table metadata
const table = getCurrentTable();
const schema = table?.schema;
const numRows = table?.numRows;
```

---

## Definition of Done
- [ ] All 3 components implemented
- [ ] TypeScript compiles without errors
- [ ] Components render in browser
- [ ] Basic functionality works
- [ ] Code committed with descriptive message
- [ ] Handoff notes for Toaster

---

## References
- Frontend Plan: `docs/DAILY_STANDUP_2025-12-17.md`
- Design Doc: `docs/design/02-data-processing-pipeline.md`
- Existing Components: `frontend/src/components/Data/DataTable.tsx`

