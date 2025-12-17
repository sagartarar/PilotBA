import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { useLayoutStore, useChartStore, useDataStore, useUIStore } from '../../store';
import { ChartContainer } from '../Chart/ChartContainer';
import { useDataPipeline } from '../../hooks/useDataPipeline';
import { Button } from '../common/Button';
import type { LayoutItem } from '../../store/layoutStore';
import type { ChartData } from '../../viz-engine/types';

interface DashboardGridProps {
  layoutId: string;
  editable?: boolean;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({ layoutId, editable = true }) => {
  const { getLayout, updateItem, removeItem, gridCols, rowHeight } = useLayoutStore();
  const { charts } = useChartStore();
  const { tables } = useDataStore();
  const { addNotification } = useUIStore();
  const { tableToChartData } = useDataPipeline();

  const layout = getLayout(layoutId);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Calculate cell width based on container width
  const cellWidth = containerWidth / gridCols;

  // Observe container width
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Calculate grid height based on items
  const gridHeight = useMemo(() => {
    if (!layout || layout.items.length === 0) return 400;
    const maxY = Math.max(...layout.items.map((item) => item.y + item.height));
    return Math.max(maxY * rowHeight + 100, 400);
  }, [layout, rowHeight]);

  // Handle drag start
  const handleDragStart = useCallback(
    (e: React.MouseEvent, itemId: string) => {
      if (!editable) return;
      e.preventDefault();

      const item = layout?.items.find((i) => i.id === itemId);
      if (!item) return;

      const rect = (e.target as HTMLElement).closest('.grid-item')?.getBoundingClientRect();
      if (!rect) return;

      setDraggingId(itemId);
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [editable, layout]
  );

  // Handle drag move
  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      if (!draggingId || !containerRef.current || !layout) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.floor((e.clientX - containerRect.left - dragOffset.x) / cellWidth));
      const y = Math.max(0, Math.floor((e.clientY - containerRect.top - dragOffset.y) / rowHeight));

      const item = layout.items.find((i) => i.id === draggingId);
      if (!item) return;

      // Clamp to grid bounds
      const clampedX = Math.min(x, gridCols - item.width);
      const clampedY = Math.max(0, y);

      if (item.x !== clampedX || item.y !== clampedY) {
        updateItem(layoutId, draggingId, { x: clampedX, y: clampedY });
      }
    },
    [draggingId, layout, layoutId, cellWidth, rowHeight, gridCols, dragOffset, updateItem]
  );

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
  }, []);

  // Handle resize start
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, itemId: string) => {
      if (!editable) return;
      e.preventDefault();
      e.stopPropagation();
      setResizingId(itemId);
    },
    [editable]
  );

  // Handle resize move
  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!resizingId || !containerRef.current || !layout) return;

      const item = layout.items.find((i) => i.id === resizingId);
      if (!item) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const itemLeft = item.x * cellWidth;
      const itemTop = item.y * rowHeight;

      const newWidth = Math.max(2, Math.round((e.clientX - containerRect.left - itemLeft) / cellWidth));
      const newHeight = Math.max(2, Math.round((e.clientY - containerRect.top - itemTop) / rowHeight));

      // Clamp to grid bounds
      const clampedWidth = Math.min(newWidth, gridCols - item.x);

      if (item.width !== clampedWidth || item.height !== newHeight) {
        updateItem(layoutId, resizingId, { width: clampedWidth, height: newHeight });
      }
    },
    [resizingId, layout, layoutId, cellWidth, rowHeight, gridCols, updateItem]
  );

  // Handle resize end
  const handleResizeEnd = useCallback(() => {
    setResizingId(null);
  }, []);

  // Add global mouse listeners for drag/resize
  useEffect(() => {
    if (draggingId) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [draggingId, handleDragMove, handleDragEnd]);

  useEffect(() => {
    if (resizingId) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [resizingId, handleResizeMove, handleResizeEnd]);

  // Get chart data for an item
  const getChartData = useCallback(
    (item: LayoutItem): ChartData | null => {
      const chart = charts.get(item.chartId);
      if (!chart) return null;

      const table = tables.get(chart.datasetId);
      if (!table) return null;

      try {
        return tableToChartData(table, chart.encoding);
      } catch {
        return null;
      }
    },
    [charts, tables, tableToChartData]
  );

  if (!layout) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Layout not found
      </div>
    );
  }

  if (layout.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-lg">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground/50 mb-3"
        >
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
        <p className="text-sm text-muted-foreground">
          No charts in this layout. Add charts from the chart panel.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative bg-muted/20 rounded-lg overflow-hidden"
      style={{ height: gridHeight }}
    >
      {/* Grid background */}
      {editable && (
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, var(--border) 1px, transparent 1px),
              linear-gradient(to bottom, var(--border) 1px, transparent 1px)
            `,
            backgroundSize: `${cellWidth}px ${rowHeight}px`,
          }}
        />
      )}

      {/* Grid items */}
      {layout.items.map((item) => {
        const chart = charts.get(item.chartId);
        const chartData = getChartData(item);
        const isDragging = draggingId === item.id;
        const isResizing = resizingId === item.id;

        return (
          <div
            key={item.id}
            className={clsx(
              'grid-item absolute transition-shadow rounded-lg overflow-hidden bg-card border',
              isDragging && 'z-50 shadow-2xl cursor-grabbing',
              isResizing && 'z-50 shadow-xl',
              editable && !isDragging && 'cursor-grab',
              'border-border'
            )}
            style={{
              left: item.x * cellWidth,
              top: item.y * rowHeight,
              width: item.width * cellWidth - 8,
              height: item.height * rowHeight - 8,
              margin: 4,
              transition: isDragging || isResizing ? 'none' : 'all 0.2s ease',
            }}
          >
            {/* Header */}
            <div
              className={clsx(
                'flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50',
                editable && 'cursor-grab'
              )}
              onMouseDown={(e) => handleDragStart(e, item.id)}
            >
              <span className="text-sm font-medium text-foreground truncate">
                {chart?.title || 'Untitled Chart'}
              </span>
              {editable && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      removeItem(layoutId, item.id);
                      addNotification({
                        type: 'success',
                        title: 'Removed',
                        message: 'Chart removed from layout',
                      });
                    }}
                    className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                    title="Remove from layout"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Chart content */}
            <div className="flex-1 h-[calc(100%-40px)]">
              {chart && chartData ? (
                <ChartContainer config={chart} data={chartData} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  {!chart ? 'Chart not found' : 'No data available'}
                </div>
              )}
            </div>

            {/* Resize handle */}
            {editable && (
              <div
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize group"
                onMouseDown={(e) => handleResizeStart(e, item.id)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="absolute bottom-1 right-1 text-muted-foreground group-hover:text-foreground transition-colors"
                >
                  <path d="M21 21 12 12" />
                  <path d="M21 12 12 21" />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Layout Manager component
export const LayoutManager: React.FC = () => {
  const {
    layouts,
    currentLayoutId,
    createLayout,
    deleteLayout,
    duplicateLayout,
    setCurrentLayout,
    exportLayout,
    importLayout,
  } = useLayoutStore();
  const { addNotification } = useUIStore();
  const [newLayoutName, setNewLayoutName] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState('');

  const layoutList = Array.from(layouts.values());

  const handleCreate = () => {
    if (!newLayoutName.trim()) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Please enter a layout name',
      });
      return;
    }
    createLayout(newLayoutName.trim());
    setNewLayoutName('');
    addNotification({
      type: 'success',
      title: 'Created',
      message: 'New layout created',
    });
  };

  const handleExport = (id: string) => {
    const json = exportLayout(id);
    if (json) {
      navigator.clipboard.writeText(json);
      addNotification({
        type: 'success',
        title: 'Exported',
        message: 'Layout copied to clipboard',
      });
    }
  };

  const handleImport = () => {
    const id = importLayout(importJson);
    if (id) {
      setShowImport(false);
      setImportJson('');
      addNotification({
        type: 'success',
        title: 'Imported',
        message: 'Layout imported successfully',
      });
    } else {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Invalid layout JSON',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Layouts</h3>
        <Button variant="ghost" size="sm" onClick={() => setShowImport(!showImport)}>
          Import
        </Button>
      </div>

      {/* Import section */}
      {showImport && (
        <div className="p-3 border border-border rounded-lg space-y-2">
          <textarea
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            placeholder="Paste layout JSON here..."
            className="w-full h-24 px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-mono"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowImport(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleImport}>
              Import
            </Button>
          </div>
        </div>
      )}

      {/* Create new layout */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newLayoutName}
          onChange={(e) => setNewLayoutName(e.target.value)}
          placeholder="New layout name..."
          className="flex-1 px-3 py-1.5 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
        <Button size="sm" onClick={handleCreate}>
          Create
        </Button>
      </div>

      {/* Layout list */}
      <div className="space-y-1">
        {layoutList.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No layouts yet. Create one to get started.
          </p>
        ) : (
          layoutList.map((layout) => (
            <div
              key={layout.id}
              className={clsx(
                'flex items-center justify-between p-2 rounded-lg transition-colors',
                currentLayoutId === layout.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              )}
            >
              <button
                onClick={() => setCurrentLayout(layout.id)}
                className="flex-1 text-left text-sm font-medium truncate"
              >
                {layout.name}
                <span
                  className={clsx(
                    'text-xs ml-2',
                    currentLayoutId === layout.id
                      ? 'text-primary-foreground/70'
                      : 'text-muted-foreground'
                  )}
                >
                  ({layout.items.length} charts)
                </span>
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleExport(layout.id)}
                  className="p-1 rounded hover:bg-black/10"
                  title="Export"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" x2="12" y1="15" y2="3" />
                  </svg>
                </button>
                <button
                  onClick={() => duplicateLayout(layout.id)}
                  className="p-1 rounded hover:bg-black/10"
                  title="Duplicate"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    deleteLayout(layout.id);
                    addNotification({
                      type: 'success',
                      title: 'Deleted',
                      message: 'Layout deleted',
                    });
                  }}
                  className="p-1 rounded hover:bg-destructive/20 hover:text-destructive"
                  title="Delete"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DashboardGrid;

