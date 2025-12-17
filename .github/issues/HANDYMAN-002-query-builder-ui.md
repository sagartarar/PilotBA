# [HANDYMAN] Phase 4: Query Builder UI Components

**Assigned to:** Handyman (Lead Developer)  
**Date:** December 17, 2025  
**Priority:** High  
**Estimated Time:** 4 hours  
**Labels:** `handyman`, `feature`, `frontend`, `priority:high`

---

## Objective
Implement the Query Builder UI for visual data filtering and transformation.

---

## Tasks

### H4: QueryBuilder Component
**File:** `frontend/src/components/Query/QueryBuilder.tsx`

**Requirements:**
- [ ] Visual query builder interface
- [ ] Add/remove filter conditions
- [ ] Support operators: equals, not equals, greater than, less than, contains, starts with, ends with
- [ ] AND/OR logic between conditions
- [ ] Column selector dropdown (from current dataset)
- [ ] Value input with type-appropriate controls
- [ ] Apply/Reset buttons
- [ ] Real-time preview of filtered row count

**Acceptance Criteria:**
- User can build queries without writing SQL
- Filters apply correctly to data
- Row count updates as filters change
- Reset clears all filters

---

### H5: FilterBuilder Component
**File:** `frontend/src/components/Query/FilterBuilder.tsx`

**Requirements:**
- [ ] Single filter condition row component
- [ ] Column selector (dropdown)
- [ ] Operator selector (dropdown)
- [ ] Value input (text, number, date based on column type)
- [ ] Remove button
- [ ] Drag handle for reordering (optional)

**Acceptance Criteria:**
- Each filter row is self-contained
- Column selection updates operator options
- Value input matches column type
- Remove button works

---

### H6: Dashboard Drag-and-Drop Enhancement
**File:** `frontend/src/components/Dashboard/Dashboard.tsx` (update existing)

**Requirements:**
- [ ] Drag-and-drop chart positioning
- [ ] Resize handles on charts
- [ ] Grid-based layout (snap to grid)
- [ ] Save layout to localStorage
- [ ] Load layout on mount
- [ ] Reset layout button

**Acceptance Criteria:**
- Charts can be dragged to new positions
- Charts can be resized
- Layout persists across page refreshes
- Reset restores default layout

---

## Technical Notes

### Integration with Data Pipeline
```typescript
import { useDataPipeline } from '@/hooks/useDataPipeline';

const { transformData } = useDataPipeline();

// Apply filters
const filteredTable = transformData([
  { type: 'filter', column: 'age', operator: 'gt', value: 25 },
  { type: 'filter', column: 'status', operator: 'eq', value: 'active' }
]);
```

### Filter Operators
```typescript
type FilterOperator = 
  | 'eq'      // equals
  | 'neq'     // not equals
  | 'gt'      // greater than
  | 'gte'     // greater than or equal
  | 'lt'      // less than
  | 'lte'     // less than or equal
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'isNull'
  | 'isNotNull';
```

### Drag-and-Drop Library
Consider using `react-grid-layout` or `@dnd-kit/core`:
```bash
npm install react-grid-layout
# or
npm install @dnd-kit/core @dnd-kit/sortable
```

---

## Definition of Done
- [ ] QueryBuilder allows visual filter creation
- [ ] FilterBuilder handles individual conditions
- [ ] Dashboard supports drag-and-drop
- [ ] Layout persists in localStorage
- [ ] TypeScript compiles without errors
- [ ] Code committed with descriptive message

---

## References
- Data Pipeline: `frontend/src/data-pipeline/operators/Filter.ts`
- Transformation Engine: `frontend/src/data-pipeline/TransformationEngine.ts`
- Existing Dashboard: `frontend/src/components/Dashboard/Dashboard.tsx`

