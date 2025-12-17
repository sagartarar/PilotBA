import React, { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import { useDataStore, useUIStore } from '../../store';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/Modal';
import { ColumnInspector } from './ColumnInspector';
import { DataPreview } from './DataPreview';

type ViewTab = 'overview' | 'columns' | 'preview';

export const DatasetManager: React.FC = () => {
  const { metadata, currentTableId, setCurrentTable, deleteTable, getCurrentTable } = useDataStore();
  const { addNotification } = useUIStore();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const datasets = useMemo(() => {
    const all = Array.from(metadata.values());
    if (!searchQuery.trim()) return all;
    const query = searchQuery.toLowerCase();
    return all.filter(
      (d) =>
        d.name.toLowerCase().includes(query) ||
        d.columns.some((c) => c.name.toLowerCase().includes(query))
    );
  }, [metadata, searchQuery]);

  const currentMetadata = currentTableId ? metadata.get(currentTableId) : null;
  const currentTable = getCurrentTable();

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      const name = metadata.get(deleteId)?.name || 'Dataset';
      deleteTable(deleteId);
      addNotification({
        type: 'success',
        title: 'Dataset Deleted',
        message: `${name} has been removed`,
      });
      setDeleteId(null);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="h-full flex">
      {/* Dataset List Sidebar */}
      <div className="w-72 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground mb-3">Datasets</h2>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search datasets..."
              className="w-full px-3 py-2 pl-9 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {datasets.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              {searchQuery ? 'No datasets match your search' : 'No datasets uploaded yet'}
            </div>
          ) : (
            datasets.map((dataset) => (
              <button
                key={dataset.id}
                onClick={() => setCurrentTable(dataset.id)}
                className={clsx(
                  'w-full p-3 rounded-lg text-left transition-all group',
                  currentTableId === dataset.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
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
                        className="flex-shrink-0"
                      >
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span className="font-medium truncate text-sm">{dataset.name}</span>
                    </div>
                    <div
                      className={clsx(
                        'text-xs mt-1 flex items-center gap-2',
                        currentTableId === dataset.id
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      )}
                    >
                      <span>{dataset.rowCount.toLocaleString()} rows</span>
                      <span>•</span>
                      <span>{dataset.columnCount} cols</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(dataset.id);
                    }}
                    className={clsx(
                      'p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity',
                      currentTableId === dataset.id
                        ? 'hover:bg-primary-foreground/20'
                        : 'hover:bg-destructive/20 text-destructive'
                    )}
                    title="Delete dataset"
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
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="p-3 border-t border-border text-xs text-muted-foreground">
          {datasets.length} dataset{datasets.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {currentMetadata && currentTable ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-border bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold text-foreground">
                    {currentMetadata.name}
                  </h1>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span>{currentMetadata.rowCount.toLocaleString()} rows</span>
                    <span>{currentMetadata.columnCount} columns</span>
                    <span>{formatBytes(currentMetadata.sizeBytes)}</span>
                    <span>Uploaded {formatDate(currentMetadata.uploadedAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Export functionality placeholder
                      addNotification({
                        type: 'info',
                        title: 'Export',
                        message: 'Export functionality coming soon',
                      });
                    }}
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
                      className="mr-1.5"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" x2="12" y1="15" y2="3" />
                    </svg>
                    Export
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 mt-4">
                {(['overview', 'columns', 'preview'] as ViewTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={clsx(
                      'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                      activeTab === tab
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    )}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto p-4">
              {activeTab === 'overview' && (
                <DatasetOverview metadata={currentMetadata} />
              )}
              {activeTab === 'columns' && (
                <ColumnInspector
                  table={currentTable}
                  columns={currentMetadata.columns}
                />
              )}
              {activeTab === 'preview' && (
                <DataPreview table={currentTable} metadata={currentMetadata} />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto text-muted-foreground/50 mb-4"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" x2="8" y1="13" y2="13" />
                <line x1="16" x2="8" y1="17" y2="17" />
                <line x1="10" x2="8" y1="9" y2="9" />
              </svg>
              <h3 className="text-lg font-medium text-foreground mb-1">
                Select a Dataset
              </h3>
              <p className="text-sm text-muted-foreground">
                Choose a dataset from the sidebar to view its details
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Dataset"
        message="Are you sure you want to delete this dataset? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
};

// Overview component showing dataset summary
interface DatasetOverviewProps {
  metadata: import('../../store/dataStore').DatasetMetadata;
}

const DatasetOverview: React.FC<DatasetOverviewProps> = ({ metadata }) => {
  const numericColumns = metadata.columns.filter((c) =>
    ['Int8', 'Int16', 'Int32', 'Int64', 'Float32', 'Float64', 'Decimal'].some((t) =>
      c.type.includes(t)
    )
  );
  const textColumns = metadata.columns.filter((c) =>
    c.type.includes('Utf8') || c.type.includes('String')
  );
  const dateColumns = metadata.columns.filter((c) =>
    c.type.includes('Date') || c.type.includes('Timestamp')
  );
  const otherColumns = metadata.columns.filter(
    (c) =>
      !numericColumns.includes(c) &&
      !textColumns.includes(c) &&
      !dateColumns.includes(c)
  );

  const totalNulls = metadata.columns.reduce((sum, c) => sum + (c.nullCount || 0), 0);
  const totalCells = metadata.rowCount * metadata.columnCount;
  const completeness = totalCells > 0 ? ((totalCells - totalNulls) / totalCells) * 100 : 100;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Rows"
          value={metadata.rowCount.toLocaleString()}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="M7 16h8" />
              <path d="M7 11h12" />
              <path d="M7 6h3" />
            </svg>
          }
        />
        <StatCard
          label="Columns"
          value={metadata.columnCount.toString()}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <line x1="12" x2="12" y1="3" y2="21" />
            </svg>
          }
        />
        <StatCard
          label="Completeness"
          value={`${completeness.toFixed(1)}%`}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          variant={completeness >= 95 ? 'success' : completeness >= 80 ? 'warning' : 'error'}
        />
        <StatCard
          label="Null Values"
          value={totalNulls.toLocaleString()}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" x2="19.07" y1="4.93" y2="19.07" />
            </svg>
          }
        />
      </div>

      {/* Column Type Distribution */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="font-semibold text-foreground mb-4">Column Types</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <TypeBadge type="Numeric" count={numericColumns.length} color="blue" />
          <TypeBadge type="Text" count={textColumns.length} color="green" />
          <TypeBadge type="Date/Time" count={dateColumns.length} color="purple" />
          <TypeBadge type="Other" count={otherColumns.length} color="gray" />
        </div>
      </div>

      {/* Column List */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="font-semibold text-foreground mb-4">Columns</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {metadata.columns.map((col) => (
            <div
              key={col.name}
              className="flex items-center justify-between p-2 rounded-md bg-muted/50"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-medium text-foreground truncate">
                  {col.name}
                </span>
              </div>
              <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded">
                {col.type.replace(/</g, '').replace(/>/g, '').split(',')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Stat card component
interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, variant = 'default' }) => {
  const variantStyles = {
    default: 'text-primary',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500',
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <span className={clsx('opacity-60', variantStyles[variant])}>{icon}</span>
      </div>
      <div className="mt-2">
        <div className={clsx('text-2xl font-bold', variantStyles[variant])}>{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </div>
  );
};

// Type badge component
interface TypeBadgeProps {
  type: string;
  count: number;
  color: 'blue' | 'green' | 'purple' | 'gray';
}

const TypeBadge: React.FC<TypeBadgeProps> = ({ type, count, color }) => {
  const colorStyles = {
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    green: 'bg-green-500/10 text-green-500 border-green-500/20',
    purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    gray: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  };

  return (
    <div className={clsx('p-3 rounded-lg border', colorStyles[color])}>
      <div className="text-2xl font-bold">{count}</div>
      <div className="text-sm opacity-80">{type}</div>
    </div>
  );
};

