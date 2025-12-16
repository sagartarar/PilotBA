import React, { useCallback, useState, useRef } from 'react';
import { clsx } from 'clsx';
import { useDataStore, useUIStore } from '../../store';
import { Button } from '../common/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';

export interface FileUploaderProps {
  onUploadComplete?: (datasetId: string) => void;
  className?: string;
  accept?: string;
  maxSize?: number; // in bytes
}

const ACCEPTED_TYPES = '.csv,.json';
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const FileUploader: React.FC<FileUploaderProps> = ({
  onUploadComplete,
  className,
  accept = ACCEPTED_TYPES,
  maxSize = MAX_FILE_SIZE,
}) => {
  const { uploadFile, isLoading, uploadProgress, error, clearError } = useDataStore();
  const { addNotification } = useUIStore();
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    const extension = file.name.toLowerCase().split('.').pop();
    const validExtensions = accept.split(',').map(ext => ext.replace('.', '').toLowerCase());
    
    if (!extension || !validExtensions.includes(extension)) {
      return `Invalid file type. Please upload ${accept} files.`;
    }
    
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
      return `File too large. Maximum size is ${maxSizeMB}MB.`;
    }
    
    return null;
  }, [accept, maxSize]);

  const handleFile = useCallback(async (file: File) => {
    clearError();
    
    const validationError = validateFile(file);
    if (validationError) {
      addNotification({
        type: 'error',
        title: 'Upload Failed',
        message: validationError,
      });
      return;
    }

    try {
      const datasetId = await uploadFile(file);
      addNotification({
        type: 'success',
        title: 'Upload Complete',
        message: `Successfully loaded ${file.name}`,
      });
      onUploadComplete?.(datasetId);
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Upload Failed',
        message: err instanceof Error ? err.message : 'Failed to upload file',
      });
    }
  }, [uploadFile, validateFile, addNotification, onUploadComplete, clearError]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
    // Reset input so same file can be uploaded again
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [handleFile]);

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className={clsx('w-full', className)}>
      <div
        className={clsx(
          'relative flex flex-col items-center justify-center w-full min-h-[240px] p-8',
          'border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer',
          'hover:border-primary/50 hover:bg-primary/5',
          isDragging && 'border-primary bg-primary/10 scale-[1.02]',
          !isDragging && !isLoading && 'border-border bg-card',
          isLoading && 'border-primary/30 bg-primary/5 cursor-wait'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!isLoading ? handleClick : undefined}
        role="button"
        tabIndex={0}
        aria-label="Upload file"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          aria-hidden="true"
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <LoadingSpinner size="lg" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Processing file...</p>
              <p className="text-xs text-muted-foreground mt-1">
                {uploadProgress}% complete
              </p>
            </div>
            {/* Progress bar */}
            <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Icon */}
            <div className={clsx(
              'mb-4 p-4 rounded-full transition-colors',
              isDragging ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
            )}>
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
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" x2="12" y1="3" y2="15" />
              </svg>
            </div>

            {/* Text */}
            <div className="text-center">
              <p className="text-base font-medium text-foreground">
                {isDragging ? 'Drop your file here' : 'Drag & drop your file here'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse
              </p>
            </div>

            {/* Supported formats */}
            <div className="mt-4 flex items-center gap-2">
              <span className="px-2 py-1 text-xs font-medium bg-muted rounded-md text-muted-foreground">
                CSV
              </span>
              <span className="px-2 py-1 text-xs font-medium bg-muted rounded-md text-muted-foreground">
                JSON
              </span>
            </div>

            {/* Size limit */}
            <p className="mt-2 text-xs text-muted-foreground">
              Max file size: {(maxSize / (1024 * 1024)).toFixed(0)}MB
            </p>
          </>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <div className="flex items-start gap-2">
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
              className="text-destructive mt-0.5"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">Upload failed</p>
              <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="text-muted-foreground hover:text-foreground -mt-1 -mr-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

