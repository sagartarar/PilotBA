# 🔧 Handyman Tasks - January 8, 2026

**Sprint:** January 8-22, 2026  
**Phase:** Production Readiness & User Management  
**Priority Focus:** Complete MVP → User Management → SSO Preparation

---

## 📊 Current Status Summary

### ✅ Completed Work (Previous Sprints)

| Task | Status |
|------|--------|
| Apache Arrow Parser Fixes | ✅ Complete |
| Backend Auth System | ✅ Complete |
| Backend File API | ✅ Complete |
| Error Handling System | ✅ Complete |
| API Client with Token Refresh | ✅ Complete |
| AuthContext & useAuth Hook | ✅ Complete |
| Files API Client | ✅ Complete |

### 🎯 This Sprint Focus

1. **P0:** Connect Frontend File Upload to Backend API
2. **P0:** Create Login/Register UI Components
3. **P1:** Protected Routes & Navigation
4. **P1:** User Dashboard Integration
5. **P2:** Database Migrations & Schema Updates

---

## 📋 Task Details

---

### HANDYMAN-012: Connect Frontend Upload to Backend API

**Priority:** P0  
**Estimated Time:** 1 day  
**Dependencies:** None (APIs already exist)

**Problem:**
The frontend currently processes files client-side only. We need to also upload files to the backend so they persist across sessions and are available to authenticated users.

**Files to Update:**

1. `frontend/src/components/Upload/FileUploader.tsx` (or equivalent)
2. `frontend/src/store/dataStore.ts` (if using Zustand)
3. Create `frontend/src/hooks/useFileUpload.ts`

**Implementation:**

```typescript
// frontend/src/hooks/useFileUpload.ts

import { useState, useCallback } from 'react';
import { uploadFile, UploadProgress, FileMetadata } from '@/services/api/filesApi';
import { useAuth } from '@/context/AuthContext';
import { errorService } from '@/services/ErrorService';

interface UseFileUploadOptions {
  onSuccess?: (metadata: FileMetadata) => void;
  onError?: (error: Error) => void;
}

export function useFileUpload(options?: UseFileUploadOptions) {
  const { isAuthenticated } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File): Promise<FileMetadata | null> => {
    // If not authenticated, just process locally (existing behavior)
    if (!isAuthenticated) {
      return null;
    }

    setIsUploading(true);
    setError(null);
    setProgress({ loaded: 0, total: file.size, percentage: 0 });

    try {
      const metadata = await uploadFile(file, setProgress);
      options?.onSuccess?.(metadata);
      return metadata;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      errorService.capture(err as Error, { fileName: file.name, fileSize: file.size });
      options?.onError?.(err as Error);
      return null;
    } finally {
      setIsUploading(false);
      setProgress(null);
    }
  }, [isAuthenticated, options]);

  const reset = useCallback(() => {
    setError(null);
    setProgress(null);
  }, []);

  return {
    upload,
    isUploading,
    progress,
    error,
    reset,
    isAuthenticated,
  };
}
```

**Integration Pattern:**
```typescript
// In FileUploader component
const { upload, isUploading, progress, isAuthenticated } = useFileUpload({
  onSuccess: (metadata) => {
    console.log('File saved to server:', metadata.id);
  },
});

const handleFile = async (file: File) => {
  // 1. Process locally with Arrow (existing logic)
  const table = await parseFile(file);
  setData(table);

  // 2. Also upload to backend if authenticated
  if (isAuthenticated) {
    await upload(file);
  }
};
```

**Acceptance Criteria:**
- [ ] Authenticated users: files upload to backend AND process locally
- [ ] Unauthenticated users: files process locally only (no change)
- [ ] Upload progress shown during upload
- [ ] Errors are captured by ErrorService
- [ ] File metadata stored in dataStore after successful upload

---

### HANDYMAN-013: Login & Register UI Components

**Priority:** P0  
**Estimated Time:** 1.5 days  
**Dependencies:** AuthContext (✅ exists)

**Files to Create:**

```
frontend/src/pages/
├── LoginPage.tsx
├── RegisterPage.tsx
└── index.ts

frontend/src/components/Auth/
├── LoginForm.tsx
├── RegisterForm.tsx
├── AuthLayout.tsx
├── PasswordInput.tsx
└── index.ts
```

**Design Requirements:**
- Modern, clean aesthetic (follow existing Tailwind patterns)
- Dark/Light mode support
- Form validation with clear error messages
- Loading states during API calls
- "Remember me" option (optional)

**Implementation - LoginPage.tsx:**

```typescript
// frontend/src/pages/LoginPage.tsx

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AuthLayout } from '@/components/Auth/AuthLayout';
import { LoginForm } from '@/components/Auth/LoginForm';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError } = useAuth();
  
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = async (email: string, password: string) => {
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch {
      // Error is handled by AuthContext
    }
  };

  return (
    <AuthLayout 
      title="Welcome back"
      subtitle="Sign in to your PilotBA account"
    >
      <LoginForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        error={error}
        onErrorDismiss={clearError}
      />
      
      <p className="mt-6 text-center text-sm text-gray-500">
        Don't have an account?{' '}
        <Link to="/register" className="text-blue-600 hover:text-blue-500">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
```

**Implementation - LoginForm.tsx:**

```typescript
// frontend/src/components/Auth/LoginForm.tsx

import { useState } from 'react';
import { PasswordInput } from './PasswordInput';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  onErrorDismiss: () => void;
}

export function LoginForm({ onSubmit, isLoading, error, onErrorDismiss }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              type="button"
              onClick={onErrorDismiss}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <PasswordInput
        value={password}
        onChange={setPassword}
        label="Password"
        autoComplete="current-password"
      />

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isLoading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}
```

**Acceptance Criteria:**
- [ ] Login page with email/password form
- [ ] Register page with name/email/password/confirm password
- [ ] Password validation (8+ chars, uppercase, lowercase, number)
- [ ] Form validation with inline errors
- [ ] Loading states during submission
- [ ] Redirect to intended page after login
- [ ] Link between login and register pages
- [ ] Works in both dark and light mode

---

### HANDYMAN-014: Protected Routes & Navigation

**Priority:** P1  
**Estimated Time:** 0.5 days  
**Dependencies:** HANDYMAN-013

**Files to Create/Update:**

```
frontend/src/components/Auth/
├── ProtectedRoute.tsx
├── PublicOnlyRoute.tsx   # Redirect if already logged in
└── index.ts

frontend/src/App.tsx      # Update routing
```

**Implementation - ProtectedRoute.tsx:**

```typescript
// frontend/src/components/Auth/ProtectedRoute.tsx

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
```

**App.tsx Routing Update:**

```typescript
// frontend/src/App.tsx (relevant routing section)

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute';
import { PublicOnlyRoute } from '@/components/Auth/PublicOnlyRoute';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { Dashboard } from '@/dashboard/Dashboard';
// ... other imports

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          } />
          <Route path="/register" element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          } />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/workspace" element={
            <ProtectedRoute>
              <Workspace />
            </ProtectedRoute>
          } />
          
          {/* Admin routes */}
          <Route path="/admin/*" element={
            <ProtectedRoute requireAdmin>
              <AdminPanel />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

**Acceptance Criteria:**
- [ ] Protected routes redirect to login if not authenticated
- [ ] After login, redirect back to originally requested page
- [ ] Public routes (login/register) redirect to home if already authenticated
- [ ] Admin routes require admin role
- [ ] Loading spinner shown while checking auth state

---

### HANDYMAN-015: User Profile & Navigation Header

**Priority:** P1  
**Estimated Time:** 0.5 days  
**Dependencies:** HANDYMAN-013, HANDYMAN-014

**Files to Create/Update:**

```
frontend/src/components/Layout/
├── Header.tsx
├── UserMenu.tsx
└── index.ts
```

**Implementation - UserMenu.tsx:**

```typescript
// frontend/src/components/Layout/UserMenu.tsx

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-sm hover:bg-gray-200"
      >
        <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span className="hidden sm:block">{user.name}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <div className="px-4 py-2 border-b">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <button
              onClick={() => { /* TODO: Profile page */ }}
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
            >
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] User avatar/name in header when authenticated
- [ ] Dropdown menu with profile and logout options
- [ ] Logout clears tokens and redirects to login
- [ ] Menu closes when clicking outside

---

### HANDYMAN-016: Database Schema for User Management (Phase 3 Prep)

**Priority:** P2  
**Estimated Time:** 1 day  
**Dependencies:** None

**Files to Create:**

```
backend/migrations/
├── 002_user_management.sql
├── 003_teams_workspaces.sql
└── 004_rbac.sql

infrastructure/postgres/
└── schema.sql (updated)
```

**Migration 002 - User Management:**

```sql
-- backend/migrations/002_user_management.sql

-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS display_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS mfa_secret VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Add status constraint
ALTER TABLE users 
ADD CONSTRAINT valid_status CHECK (status IN ('active', 'suspended', 'pending'));

-- Create password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE (token_hash)
);

-- Create email verification tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE (token_hash)
);

-- Create user sessions table (for multi-session tracking)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_verify_user ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
```

**Acceptance Criteria:**
- [ ] Migrations created and tested
- [ ] Schema supports email verification flow
- [ ] Schema supports password reset flow
- [ ] Schema supports MFA (future)
- [ ] Indexes on frequently queried columns

---

## 📅 Sprint Schedule

| Day | Tasks | Deliverables |
|-----|-------|--------------|
| **Day 1** | HANDYMAN-012 | File upload integration |
| **Day 2-3** | HANDYMAN-013 | Login/Register UI |
| **Day 4** | HANDYMAN-014 + HANDYMAN-015 | Routes + Header |
| **Day 5** | HANDYMAN-016 | DB migrations |
| **Day 6-7** | Bug fixes, Toaster integration | PR review |

---

## 🔗 Dependencies & Coordination

### With Toaster
- After HANDYMAN-012: Toaster should test file upload flow
- After HANDYMAN-013: Toaster should test login/register forms
- After HANDYMAN-014: Toaster should test protected routes

### PR Checklist
For each task, submit PR with:
- [ ] Code changes
- [ ] Unit tests
- [ ] TypeScript types
- [ ] No lint errors
- [ ] Screenshots for UI changes

---

## 📝 Notes

### Code Quality Standards
- Use TypeScript strict mode
- Follow existing patterns in codebase
- Add JSDoc comments for public functions
- Use Tailwind CSS (no inline styles)
- Handle all error states

### Testing Requirements
- Unit tests for hooks and utilities
- Integration tests for API calls
- E2E tests (Toaster will create)

---

**Last Updated:** January 8, 2026  
**Document Owner:** Lead Architect


