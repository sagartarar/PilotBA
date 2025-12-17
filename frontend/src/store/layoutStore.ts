import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LayoutItem {
  id: string;
  chartId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DashboardLayout {
  id: string;
  name: string;
  items: LayoutItem[];
  createdAt: Date;
  updatedAt: Date;
}

interface LayoutState {
  layouts: Map<string, DashboardLayout>;
  currentLayoutId: string | null;
  gridCols: number;
  rowHeight: number;
}

interface LayoutActions {
  // Layout CRUD
  createLayout: (name: string) => string;
  updateLayout: (id: string, updates: Partial<Omit<DashboardLayout, 'id'>>) => void;
  deleteLayout: (id: string) => void;
  duplicateLayout: (id: string) => string | null;
  setCurrentLayout: (id: string | null) => void;
  
  // Layout items
  addItem: (layoutId: string, chartId: string, position?: { x: number; y: number }) => void;
  updateItem: (layoutId: string, itemId: string, updates: Partial<LayoutItem>) => void;
  removeItem: (layoutId: string, itemId: string) => void;
  moveItem: (layoutId: string, itemId: string, x: number, y: number) => void;
  resizeItem: (layoutId: string, itemId: string, width: number, height: number) => void;
  
  // Getters
  getCurrentLayout: () => DashboardLayout | null;
  getLayout: (id: string) => DashboardLayout | null;
  
  // Grid settings
  setGridCols: (cols: number) => void;
  setRowHeight: (height: number) => void;
  
  // Persistence
  exportLayout: (id: string) => string | null;
  importLayout: (json: string) => string | null;
}

type LayoutStore = LayoutState & LayoutActions;

function generateId(): string {
  return `layout_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function generateItemId(): string {
  return `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// Find next available position in grid
function findNextPosition(items: LayoutItem[], gridCols: number): { x: number; y: number } {
  if (items.length === 0) return { x: 0, y: 0 };
  
  // Simple algorithm: find the lowest y position that has space
  const maxY = Math.max(...items.map((item) => item.y + item.height));
  
  for (let y = 0; y <= maxY; y++) {
    for (let x = 0; x <= gridCols - 2; x++) {
      // Check if this position is free
      const collision = items.some(
        (item) =>
          x < item.x + item.width &&
          x + 2 > item.x &&
          y < item.y + item.height &&
          y + 2 > item.y
      );
      if (!collision) return { x, y };
    }
  }
  
  // If no space found, add to bottom
  return { x: 0, y: maxY };
}

export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set, get) => ({
      layouts: new Map(),
      currentLayoutId: null,
      gridCols: 12,
      rowHeight: 80,

      createLayout: (name) => {
        const id = generateId();
        const layout: DashboardLayout = {
          id,
          name,
          items: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const { layouts } = get();
        const newLayouts = new Map(layouts);
        newLayouts.set(id, layout);

        set({ layouts: newLayouts, currentLayoutId: id });
        return id;
      },

      updateLayout: (id, updates) => {
        const { layouts } = get();
        const existing = layouts.get(id);
        if (!existing) return;

        const updated: DashboardLayout = {
          ...existing,
          ...updates,
          updatedAt: new Date(),
        };

        const newLayouts = new Map(layouts);
        newLayouts.set(id, updated);
        set({ layouts: newLayouts });
      },

      deleteLayout: (id) => {
        const { layouts, currentLayoutId } = get();
        const newLayouts = new Map(layouts);
        newLayouts.delete(id);

        set({
          layouts: newLayouts,
          currentLayoutId: currentLayoutId === id ? null : currentLayoutId,
        });
      },

      duplicateLayout: (id) => {
        const { layouts } = get();
        const original = layouts.get(id);
        if (!original) return null;

        const newId = generateId();
        const duplicate: DashboardLayout = {
          ...original,
          id: newId,
          name: `${original.name} (Copy)`,
          items: original.items.map((item) => ({ ...item, id: generateItemId() })),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const newLayouts = new Map(layouts);
        newLayouts.set(newId, duplicate);
        set({ layouts: newLayouts, currentLayoutId: newId });
        return newId;
      },

      setCurrentLayout: (id) => {
        set({ currentLayoutId: id });
      },

      addItem: (layoutId, chartId, position) => {
        const { layouts, gridCols } = get();
        const layout = layouts.get(layoutId);
        if (!layout) return;

        const pos = position || findNextPosition(layout.items, gridCols);
        const newItem: LayoutItem = {
          id: generateItemId(),
          chartId,
          x: pos.x,
          y: pos.y,
          width: 4, // Default: 4 columns wide
          height: 3, // Default: 3 rows tall
        };

        const updatedLayout: DashboardLayout = {
          ...layout,
          items: [...layout.items, newItem],
          updatedAt: new Date(),
        };

        const newLayouts = new Map(layouts);
        newLayouts.set(layoutId, updatedLayout);
        set({ layouts: newLayouts });
      },

      updateItem: (layoutId, itemId, updates) => {
        const { layouts } = get();
        const layout = layouts.get(layoutId);
        if (!layout) return;

        const updatedLayout: DashboardLayout = {
          ...layout,
          items: layout.items.map((item) =>
            item.id === itemId ? { ...item, ...updates } : item
          ),
          updatedAt: new Date(),
        };

        const newLayouts = new Map(layouts);
        newLayouts.set(layoutId, updatedLayout);
        set({ layouts: newLayouts });
      },

      removeItem: (layoutId, itemId) => {
        const { layouts } = get();
        const layout = layouts.get(layoutId);
        if (!layout) return;

        const updatedLayout: DashboardLayout = {
          ...layout,
          items: layout.items.filter((item) => item.id !== itemId),
          updatedAt: new Date(),
        };

        const newLayouts = new Map(layouts);
        newLayouts.set(layoutId, updatedLayout);
        set({ layouts: newLayouts });
      },

      moveItem: (layoutId, itemId, x, y) => {
        get().updateItem(layoutId, itemId, { x, y });
      },

      resizeItem: (layoutId, itemId, width, height) => {
        get().updateItem(layoutId, itemId, { width, height });
      },

      getCurrentLayout: () => {
        const { layouts, currentLayoutId } = get();
        return currentLayoutId ? layouts.get(currentLayoutId) || null : null;
      },

      getLayout: (id) => {
        return get().layouts.get(id) || null;
      },

      setGridCols: (cols) => {
        set({ gridCols: cols });
      },

      setRowHeight: (height) => {
        set({ rowHeight: height });
      },

      exportLayout: (id) => {
        const layout = get().layouts.get(id);
        if (!layout) return null;
        return JSON.stringify(layout, null, 2);
      },

      importLayout: (json) => {
        try {
          const data = JSON.parse(json);
          const id = generateId();
          const layout: DashboardLayout = {
            id,
            name: data.name || 'Imported Layout',
            items: (data.items || []).map((item: LayoutItem) => ({
              ...item,
              id: generateItemId(),
            })),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const { layouts } = get();
          const newLayouts = new Map(layouts);
          newLayouts.set(id, layout);
          set({ layouts: newLayouts, currentLayoutId: id });
          return id;
        } catch {
          return null;
        }
      },
    }),
    {
      name: 'pilotba-layouts',
      // Custom serialization for Map
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const data = JSON.parse(str);
          return {
            ...data,
            state: {
              ...data.state,
              layouts: new Map(Object.entries(data.state.layouts || {})),
            },
          };
        },
        setItem: (name, value) => {
          const data = {
            ...value,
            state: {
              ...value.state,
              layouts: Object.fromEntries(value.state.layouts),
            },
          };
          localStorage.setItem(name, JSON.stringify(data));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);

