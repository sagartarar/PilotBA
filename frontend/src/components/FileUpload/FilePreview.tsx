import React from 'react';
import { clsx } from 'clsx';
import { DatasetMetadata } from '../../store';
import { Button } from '../common/Button';

export interface FilePreviewProps {
  metadata: DatasetMetadata;
  onDelete?: () => void;
  onSelect?: () => void;
  isSelected?: boolean;
  className?: string;
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  metadata,
  onDelete,
  onSelect,
  isSelected = false,
  className,
}) => {
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

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getFileIcon = () => {
    const ext = metadata.name.split('.').pop()?.toLowerCase();
    if (ext === 'csv') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="8" y1="13" x2="16" y2="13"/>
          <line x1="8" y1="17" x2="16" y2="17"/>
          <line x1="8" y1="9" x2="10" y2="9"/>
        </svg>
      );
    }
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
        <polyline points="14 2 14 8 20 8"/>
        <path d="M8 16s1.5-2 4-2 4 2 4 2"/>
        <line x1="9" y1="11" x2="9.01" y2="11"/>
        <line x1="15" y1="11" x2="15.01" y2="11"/>
      </svg>
    );
  };

  return (
    <div
      className={clsx(
        'group relative p-4 rounded-lg border transition-all duration-200 cursor-pointer',
        isSelected
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
          : 'border-border bg-card hover:border-primary/30 hover:bg-accent/50',
        className
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.();
        }
      }}
    >
      <div className="flex items-start gap-3">
        {/* File icon */}
        <div className={clsx(
          'p-2 rounded-lg',
          isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
        )}>
          {getFileIcon()}
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground truncate" title={metadata.name}>
            {metadata.name}
          </h4>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
            <span>{formatNumber(metadata.rowCount)} rows</span>
            <span>{metadata.columnCount} columns</span>
            <span>{formatBytes(metadata.sizeBytes)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Uploaded {formatDate(metadata.uploadedAt)}
          </p>
        </div>

        {/* Delete button */}
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Delete dataset"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </Button>
        )}
      </div>

      {/* Column preview */}
      {metadata.columns.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-xs font-medium text-muted-foreground mb-2">Columns</p>
          <div className="flex flex-wrap gap-1">
            {metadata.columns.slice(0, 5).map((col) => (
              <span
                key={col.name}
                className="px-2 py-0.5 text-xs bg-muted rounded-md text-muted-foreground"
                title={`${col.name} (${col.type})`}
              >
                {col.name}
              </span>
            ))}
            {metadata.columns.length > 5 && (
              <span className="px-2 py-0.5 text-xs bg-muted rounded-md text-muted-foreground">
                +{metadata.columns.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      )}
    </div>
  );
};

