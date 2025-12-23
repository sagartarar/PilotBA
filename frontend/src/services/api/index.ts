/**
 * API Services - Public exports
 */

export { default as apiClient, isAuthenticated, getAccessToken, setTokens, clearTokens } from './client';

export {
  register,
  login,
  logout,
  getCurrentUser,
  refreshToken,
  isApiError,
  getErrorMessage,
  type RegisterRequest,
  type LoginRequest,
  type AuthResponse,
  type UserInfo,
  type UserRole,
  type ApiError,
} from './authApi';

export {
  uploadFile,
  listFiles,
  getFileMetadata,
  downloadFile,
  downloadFileToClient,
  deleteFile,
  formatFileSize,
  getFileTypeIcon,
  type FileMetadata,
  type FilesListResponse,
  type ListFilesParams,
  type UploadProgress,
} from './filesApi';

