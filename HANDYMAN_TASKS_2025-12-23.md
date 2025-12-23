# 🔧 Handyman Task Assignment - December 23, 2025

**Role:** Lead Developer (Handyman)  
**Assigned By:** Lead Architect  
**Sprint:** December 23, 2025 - January 6, 2026

---

## Your Priority Queue

| Priority | Task ID | Description | ETA |
|----------|---------|-------------|-----|
| P0 | HANDYMAN-008 | Fix Apache Arrow Parser Tests | 1-2 days |
| P0 | HANDYMAN-009 | Complete Backend Auth System | 2 days |
| P1 | HANDYMAN-010 | Complete Backend File API | 2 days |
| P1 | HANDYMAN-011 | Frontend-Backend Integration | 1-2 days |

**Start with HANDYMAN-008 immediately!**

---

## HANDYMAN-008: Fix Apache Arrow Parser Tests

### Context

Toaster's QA report shows 181 tests failing due to Apache Arrow v14 API changes. The Sort, Filter, and Aggregate operators have been fixed, but the parsers still use deprecated APIs.

### Problem

```typescript
// This pattern is broken in Arrow v14
import { makeVector, Table, Schema } from 'apache-arrow';
const vector = makeVector([1, 2, 3]);  // ❌ No longer works
return new Table(schema, vectors);      // ❌ Causes stack overflow
```

### Solution

```typescript
// Use tableFromArrays() instead
import { tableFromArrays, Schema, Field, Float64, Utf8 } from 'apache-arrow';

// Build data object with column names as keys
const data: Record<string, any[]> = {};
for (const column of columns) {
  data[column.name] = column.values;
}

// Create table directly from arrays
return tableFromArrays(data);
```

### Files to Fix

#### 1. `frontend/src/data-pipeline/parsers/CSVParser.ts`

Look for patterns like:
```typescript
// Find and replace:
import { makeVector } from 'apache-arrow';
// With:
import { tableFromArrays } from 'apache-arrow';

// Find any Table construction:
new Table(schema, columns)
// Replace with:
tableFromArrays(columnData)
```

#### 2. `frontend/src/data-pipeline/parsers/JSONParser.ts`

Same pattern - convert to `tableFromArrays()`.

#### 3. `frontend/src/data-pipeline/parsers/ParquetParser.ts`

Same pattern - convert to `tableFromArrays()`.

#### 4. `frontend/src/data-pipeline/parsers/ArrowParser.ts`

May need different approach since it reads native Arrow format.

### Reference Implementation

Toaster already fixed the operators. Use these as reference:
- `frontend/src/data-pipeline/operators/Filter.ts`
- `frontend/src/data-pipeline/operators/Sort.ts`

### Testing

```bash
# After each file fix, run related tests
cd frontend
npm run test:run -- --grep "CSVParser"
npm run test:run -- --grep "JSONParser"
npm run test:run -- --grep "ParquetParser"
npm run test:run -- --grep "ArrowParser"

# Run all tests to check for regressions
npm run test:run
```

### Acceptance Criteria

- [ ] `npm run test:run -- --grep Parser` shows 0 failures
- [ ] No new failures in other test suites
- [ ] TypeScript compiles without errors
- [ ] Notify Toaster when complete for validation

---

## HANDYMAN-009: Complete Backend Auth System

### Context

Basic JWT scaffolding exists. Need to complete full authentication flow.

### Current State

```rust
// backend/src/routes/auth.rs - has basic structure
// backend/src/middleware/auth.rs - has JWT validation
```

### Required Implementation

#### 1. User Model (`backend/src/models/user.rs`)

```rust
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub role: UserRole,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "user_role", rename_all = "lowercase")]
pub enum UserRole {
    Admin,
    User,
    ReadOnly,
}

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: i64,
    pub user: UserInfo,
}

#[derive(Debug, Serialize)]
pub struct UserInfo {
    pub id: Uuid,
    pub email: String,
    pub role: UserRole,
}
```

#### 2. Auth Routes (`backend/src/routes/auth.rs`)

```rust
use actix_web::{web, HttpResponse, post, get};
use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use argon2::password_hash::rand_core::OsRng;
use argon2::password_hash::SaltString;

#[post("/register")]
pub async fn register(
    db: web::Data<DbPool>,
    body: web::Json<RegisterRequest>,
) -> Result<HttpResponse, AppError> {
    // 1. Validate email format
    // 2. Check email not already registered
    // 3. Validate password strength (min 8 chars, etc.)
    // 4. Hash password with Argon2
    // 5. Insert user into database
    // 6. Generate JWT tokens
    // 7. Return AuthResponse
}

#[post("/login")]
pub async fn login(
    db: web::Data<DbPool>,
    body: web::Json<LoginRequest>,
) -> Result<HttpResponse, AppError> {
    // 1. Find user by email
    // 2. Verify password with Argon2
    // 3. Generate JWT tokens
    // 4. Return AuthResponse
}

#[post("/refresh")]
pub async fn refresh_token(
    db: web::Data<DbPool>,
    body: web::Json<RefreshRequest>,
) -> Result<HttpResponse, AppError> {
    // 1. Validate refresh token
    // 2. Check token not revoked
    // 3. Generate new access token
    // 4. Return new tokens
}

#[post("/logout")]
pub async fn logout(
    user: AuthUser,
    db: web::Data<DbPool>,
) -> Result<HttpResponse, AppError> {
    // 1. Add refresh token to blacklist
    // 2. Return success
}

#[get("/me")]
pub async fn get_current_user(
    user: AuthUser,
) -> Result<HttpResponse, AppError> {
    // Return current user info
}
```

#### 3. Database Migration

Create migration file:
```sql
-- backend/migrations/001_create_users.sql
CREATE TYPE user_role AS ENUM ('admin', 'user', 'readonly');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- Refresh token blacklist
CREATE TABLE revoked_tokens (
    token_hash VARCHAR(64) PRIMARY KEY,
    expires_at TIMESTAMPTZ NOT NULL
);

-- Clean up expired tokens periodically
CREATE INDEX idx_revoked_tokens_expires ON revoked_tokens(expires_at);
```

### Security Requirements

- [ ] Argon2 for password hashing (NOT bcrypt, MD5, SHA)
- [ ] Access tokens expire in 1 hour
- [ ] Refresh tokens expire in 7 days
- [ ] Passwords must be 8+ chars with mix of types
- [ ] Email validation with proper regex
- [ ] Rate limiting on login endpoint

### Testing

```bash
cd backend
cargo test -- --test-threads=1
cargo clippy -- -D warnings
```

---

## HANDYMAN-010: Complete Backend File API

### Required Endpoints

```rust
// backend/src/routes/files.rs

#[post("/")]
pub async fn upload_file(...) -> Result<HttpResponse, AppError> {
    // 1. Validate file type (csv, json, parquet, arrow)
    // 2. Validate file size (<= 100MB)
    // 3. Upload to MinIO
    // 4. Parse file headers for metadata
    // 5. Store metadata in PostgreSQL
    // 6. Return file info
}

#[get("/")]
pub async fn list_files(user: AuthUser, ...) -> Result<HttpResponse, AppError> {
    // Return paginated list of user's files
}

#[get("/{id}")]
pub async fn get_file(user: AuthUser, path: web::Path<Uuid>, ...) -> Result<HttpResponse, AppError> {
    // 1. Verify user owns file
    // 2. Stream file from MinIO
    // 3. Return as Arrow IPC format
}

#[delete("/{id}")]
pub async fn delete_file(user: AuthUser, path: web::Path<Uuid>, ...) -> Result<HttpResponse, AppError> {
    // 1. Verify user owns file
    // 2. Delete from MinIO
    // 3. Delete metadata from PostgreSQL
}
```

### Database Migration

```sql
-- backend/migrations/002_create_files.sql
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    row_count INTEGER,
    column_count INTEGER,
    minio_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_files_user ON files(user_id);
```

---

## HANDYMAN-011: Frontend-Backend Integration

### 1. Create API Client

```typescript
// frontend/src/services/api/client.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          localStorage.setItem('access_token', response.data.access_token);
          // Retry original request
          return apiClient.request(error.config);
        } catch {
          // Refresh failed, logout
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
```

### 2. Create Auth API

```typescript
// frontend/src/services/api/authApi.ts
import { apiClient } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: UserInfo;
}

export const authApi = {
  login: (data: LoginRequest) => 
    apiClient.post<AuthResponse>('/auth/login', data),
  
  register: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/auth/register', data),
  
  logout: () =>
    apiClient.post('/auth/logout'),
  
  getCurrentUser: () =>
    apiClient.get<UserInfo>('/auth/me'),
};
```

### 3. Create Auth Context

```typescript
// frontend/src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, UserInfo } from '../services/api/authApi';

interface AuthContextType {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const token = localStorage.getItem('access_token');
    if (token) {
      authApi.getCurrentUser()
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('refresh_token', response.data.refresh_token);
    setUser(response.data.user);
  };

  const logout = async () => {
    await authApi.logout();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

## General Guidelines

### Code Quality

1. **Always run before committing:**
   ```bash
   # Backend
   cargo fmt
   cargo clippy -- -D warnings
   cargo test
   
   # Frontend
   npm run type-check
   npm run lint
   npm run test:run
   ```

2. **Commit Convention:**
   ```
   feat(parser): fix Arrow v14 API compatibility
   feat(auth): implement user registration
   fix(api): handle file upload errors
   ```

3. **PR Requirements:**
   - Link to issue: "Fixes HANDYMAN-008"
   - Include test coverage
   - Update documentation
   - Request review from Architect

### Communication

- Update your issue daily with progress
- Tag `@toaster` when feature is ready for testing
- Tag `@architect` if blocked or need decision
- Ask questions in issue comments

---

**Good luck! Start with HANDYMAN-008 right now!** 🔧

**Questions?** Comment on the issue or tag @architect


