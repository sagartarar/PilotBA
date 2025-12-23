/**
 * Authentication API
 * 
 * Handles user registration, login, logout, and profile operations.
 */

import apiClient, { setTokens, clearTokens } from './client';

// ============================================================================
// TYPES
// ============================================================================

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: UserInfo;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
}

export type UserRole = 'admin' | 'user' | 'readonly';

export interface RefreshRequest {
  refresh_token: string;
}

export interface ApiError {
  error: string;
  message: string;
  status: number;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Register a new user account
 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/register', data);
  
  // Store tokens
  setTokens(response.data.access_token, response.data.refresh_token);
  
  return response.data;
}

/**
 * Login with email and password
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/login', data);
  
  // Store tokens
  setTokens(response.data.access_token, response.data.refresh_token);
  
  return response.data;
}

/**
 * Logout current user
 */
export async function logout(): Promise<void> {
  const refreshToken = localStorage.getItem('refresh_token');
  
  try {
    if (refreshToken) {
      await apiClient.post('/auth/logout', { refresh_token: refreshToken });
    }
  } finally {
    // Always clear tokens, even if API call fails
    clearTokens();
  }
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<UserInfo> {
  const response = await apiClient.get<UserInfo>('/auth/me');
  return response.data;
}

/**
 * Refresh access token
 */
export async function refreshToken(refreshTokenValue: string): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/refresh', {
    refresh_token: refreshTokenValue,
  });
  
  // Store new tokens
  setTokens(response.data.access_token, response.data.refresh_token);
  
  return response.data;
}

/**
 * Check if an error is an API error response
 */
export function isApiError(error: unknown): error is { response: { data: ApiError } } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response: unknown }).response === 'object' &&
    (error as { response: unknown }).response !== null &&
    'data' in (error as { response: { data: unknown } }).response
  );
}

/**
 * Extract error message from API error
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.response.data.message || 'An unknown error occurred';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
}

export default {
  register,
  login,
  logout,
  getCurrentUser,
  refreshToken,
};

