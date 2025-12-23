/**
 * Files API
 * 
 * Handles file upload, listing, download, and deletion.
 */

import apiClient from './client';

// ============================================================================
// TYPES
// ============================================================================

export interface FileMetadata {
  id: string;
  name: string;
  original_name: string;
  size: number;
  content_type: string;
  row_count: number | null;
  column_count: number | null;
  created_at: string;
}

export interface FilesListResponse {
  files: FileMetadata[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ListFilesParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Upload a file
 */
export async function uploadFile(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<FileMetadata> {
  const response = await apiClient.post<FileMetadata>(
    '/files',
    file,
    {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(file.name)}"`,
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
          });
        }
      },
    }
  );

  return response.data;
}

/**
 * List files with pagination and optional search
 */
export async function listFiles(params?: ListFilesParams): Promise<FilesListResponse> {
  const response = await apiClient.get<FilesListResponse>('/files', { params });
  return response.data;
}

/**
 * Get file metadata by ID
 */
export async function getFileMetadata(fileId: string): Promise<FileMetadata> {
  const response = await apiClient.get<FileMetadata>(`/files/${fileId}/metadata`);
  return response.data;
}

/**
 * Download file by ID
 */
export async function downloadFile(fileId: string): Promise<Blob> {
  const response = await apiClient.get(`/files/${fileId}`, {
    responseType: 'blob',
  });
  return response.data;
}

/**
 * Download file and trigger browser download
 */
export async function downloadFileToClient(fileId: string, fileName?: string): Promise<void> {
  const metadata = await getFileMetadata(fileId);
  const blob = await downloadFile(fileId);
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName || metadata.original_name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Delete file by ID
 */
export async function deleteFile(fileId: string): Promise<void> {
  await apiClient.delete(`/files/${fileId}`);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/**
 * Get file type icon name based on content type
 */
export function getFileTypeIcon(contentType: string): string {
  if (contentType.includes('csv')) return 'table';
  if (contentType.includes('json')) return 'code';
  if (contentType.includes('parquet')) return 'database';
  if (contentType.includes('arrow')) return 'arrow-right';
  return 'file';
}

export default {
  uploadFile,
  listFiles,
  getFileMetadata,
  downloadFile,
  downloadFileToClient,
  deleteFile,
  formatFileSize,
  getFileTypeIcon,
};

