import React, { useMemo, useState } from 'react';
import { useDataStore, useUIStore, useChartStore } from '../../store';
import { FileUploader, FilePreview } from '../FileUpload';
import { DataTable } from '../Data/DataTable';
import { ChartContainer } from '../Chart/ChartContainer';
import { ChartConfigPanel, QuickChartCreator } from '../Chart/ChartConfig';
import { Button } from '../common/Button';
import { ConfirmDialog, Modal } from '../common/Modal';
import { useDataPipeline } from '../../hooks/useDataPipeline';
import { ChartData } from '../../viz-engine/types';

type ViewMode = 'data' | 'chart';

export const Dashboard: React.FC = () => {
  const { 
    metadata, 
    currentTableId, 
    setCurrentTable, 
    deleteTable,
    getCurrentTable,
    getCurrentMetadata,
  } = useDataStore();
  const { addNotification } = useUIStore();
  const { charts, addChart, updateChart, removeChart, activeChartId, setActiveChart } = useChartStore();
  const { tableToChartData } = useDataPipeline();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('data');
  const [showChartConfig, setShowChartConfig] = useState(false);

  const datasets = Array.from(metadata.values());
  const currentTable = getCurrentTable();
  const currentMetadata = getCurrentMetadata();
  const chartList = Array.from(charts.values());
  const activeChart = activeChartId ? charts.get(activeChartId) : null;

  // Convert current table to chart data format
  const chartData = useMemo<ChartData | null>(() => {
    if (!currentTable || !activeChart) return null;
    
    try {
      return tableToChartData(currentTable, activeChart.encoding);
    } catch {
      return null;
    }
  }, [currentTable, activeChart, tableToChartData]);

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

  const handleCreateChart = (config: Parameters<typeof addChart>[0]) => {
    const chartId = addChart(config);
    setActiveChart(chartId);
    setViewMode('chart');
    addNotification({
      type: 'success',
      title: 'Chart Created',
      message: `${config.title} has been created`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Welcome section when no data */}
      {datasets.length === 0 ? (
        <div className="max-w-2xl mx-auto py-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome to PilotBA
            </h1>
            <p className="text-muted-foreground">
              Lightning-fast business intelligence. Upload your data to get started.
            </p>
          </div>
          <FileUploader />
          
          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
            <FeatureCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              }
              title="Blazing Fast"
              description="WebGL-powered visualizations render millions of points at 60 FPS"
            />
            <FeatureCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
                </svg>
              }
              title="Rich Visualizations"
              description="Bar charts, line graphs, scatter plots, and heatmaps"
            />
            <FeatureCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
              }
              title="Apache Arrow"
              description="Efficient columnar data format for fast processing"
            />
          </div>
        </div>
      ) : (
        <>
          {/* Header with actions */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {datasets.length} dataset{datasets.length !== 1 ? 's' : ''} • {chartList.length} chart{chartList.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <UploadButton />
              {currentTableId && currentMetadata && (
                <Button
                  variant="outline"
                  onClick={() => setShowChartConfig(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
                  </svg>
                  Create Chart
                </Button>
              )}
            </div>
          </div>

          {/* Dataset cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {datasets.map((dataset) => (
              <FilePreview
                key={dataset.id}
                metadata={dataset}
                isSelected={currentTableId === dataset.id}
                onSelect={() => setCurrentTable(dataset.id)}
                onDelete={() => handleDelete(dataset.id)}
              />
            ))}
          </div>

          {/* View mode toggle */}
          {currentTable && currentMetadata && (
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <button
                onClick={() => setViewMode('data')}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  viewMode === 'data'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Data Table
              </button>
              <button
                onClick={() => setViewMode('chart')}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  viewMode === 'chart'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Charts ({chartList.length})
              </button>
            </div>
          )}

          {/* Data table view */}
          {viewMode === 'data' && currentTable && currentMetadata && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  {currentMetadata.name}
                </h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{currentMetadata.rowCount.toLocaleString()} rows</span>
                  <span>•</span>
                  <span>{currentMetadata.columnCount} columns</span>
                </div>
              </div>
              <div className="h-[500px] border border-border rounded-lg overflow-hidden">
                <DataTable table={currentTable} />
              </div>
            </div>
          )}

          {/* Charts view */}
          {viewMode === 'chart' && currentTable && currentMetadata && (
            <div>
              {chartList.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-border rounded-lg text-center">
                  <p className="text-muted-foreground mb-4">No charts yet. Create your first visualization!</p>
                  <QuickChartCreator
                    datasetId={currentTableId!}
                    columns={currentMetadata.columns}
                    onCreateChart={handleCreateChart}
                    className="max-w-md mx-auto"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Chart list */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground mb-2">Charts</h3>
                    {chartList.map((chart) => (
                      <button
                        key={chart.id}
                        onClick={() => setActiveChart(chart.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                          activeChartId === chart.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-accent'
                        }`}
                      >
                        <span className="truncate">{chart.title}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeChart(chart.id);
                          }}
                          className="p-1 rounded hover:bg-destructive/20"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setShowChartConfig(true)}
                    >
                      + Add Chart
                    </Button>
                  </div>

                  {/* Active chart */}
                  <div className="lg:col-span-2">
                    {activeChart && chartData ? (
                      <div className="h-[500px] border border-border rounded-lg overflow-hidden">
                        <ChartContainer
                          config={activeChart}
                          data={chartData}
                        />
                      </div>
                    ) : (
                      <div className="h-[500px] flex items-center justify-center border-2 border-dashed border-border rounded-lg">
                        <p className="text-muted-foreground">Select a chart to view</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Dataset"
        message="Are you sure you want to delete this dataset? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />

      {/* Chart creation modal */}
      {currentMetadata && (
        <Modal
          isOpen={showChartConfig}
          onClose={() => setShowChartConfig(false)}
          title="Create Chart"
          size="lg"
        >
          <QuickChartCreator
            datasetId={currentTableId!}
            columns={currentMetadata.columns}
            onCreateChart={(config) => {
              handleCreateChart(config);
              setShowChartConfig(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
};

// Feature card component
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="p-4 rounded-lg border border-border bg-card">
    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
      {icon}
    </div>
    <h3 className="font-semibold text-foreground mb-1">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

// Upload button with modal
const UploadButton: React.FC = () => {
  const [showUploader, setShowUploader] = React.useState(false);

  return (
    <>
      <Button onClick={() => setShowUploader(true)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" x2="12" y1="3" y2="15"/>
        </svg>
        Upload Data
      </Button>

      {showUploader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowUploader(false)}
          />
          <div className="relative z-50 w-full max-w-lg mx-4 p-6 bg-card rounded-lg shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Upload Dataset</h2>
              <button
                onClick={() => setShowUploader(false)}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <FileUploader onUploadComplete={() => setShowUploader(false)} />
          </div>
        </div>
      )}
    </>
  );
};


export default Dashboard;
