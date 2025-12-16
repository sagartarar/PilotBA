import React from 'react';
import { useUIStore, useDataStore } from '../../store';

export const Footer: React.FC = () => {
  const { performanceMetrics } = useUIStore();
  const { metadata, currentTableId } = useDataStore();

  const currentDataset = currentTableId ? metadata.get(currentTableId) : null;

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <footer className="sticky bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex items-center justify-between h-8 px-4 text-xs text-muted-foreground">
        {/* Left: Dataset info */}
        <div className="flex items-center gap-4">
          {currentDataset ? (
            <>
              <span className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                </svg>
                {currentDataset.name}
              </span>
              <span>{formatNumber(currentDataset.rowCount)} rows</span>
              <span>{currentDataset.columnCount} cols</span>
              <span>{formatBytes(currentDataset.sizeBytes)}</span>
            </>
          ) : (
            <span>No dataset loaded</span>
          )}
        </div>

        {/* Right: Performance stats */}
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className={performanceMetrics.fps >= 55 ? 'text-success' : performanceMetrics.fps >= 30 ? 'text-yellow-500' : 'text-destructive'}>
              {performanceMetrics.fps.toFixed(0)} FPS
            </span>
          </span>
          {performanceMetrics.memoryUsed > 0 && (
            <span>{formatBytes(performanceMetrics.memoryUsed)} mem</span>
          )}
          {performanceMetrics.renderTime > 0 && (
            <span>{performanceMetrics.renderTime.toFixed(1)}ms render</span>
          )}
        </div>
      </div>
    </footer>
  );
};

