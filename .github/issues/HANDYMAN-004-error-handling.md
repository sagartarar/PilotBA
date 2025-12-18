# 🔧 HANDYMAN-004: Error Handling System

**Priority:** P0 (Critical)
**Time Estimate:** 1 day
**Depends On:** None

---

## 📋 Objective

Implement centralized error handling with user-friendly messages, structured logging, and export capability.

---

## 📁 Files to Create

```
frontend/src/services/
├── ErrorService.ts
├── errorCodes.ts
└── handlers/
    ├── fileErrorHandler.ts
    ├── queryErrorHandler.ts
    └── vizErrorHandler.ts

frontend/src/store/
└── logStore.ts
```

---

## 🔧 Implementation Steps

### Step 1: Create Error Types (`errorCodes.ts`)

```typescript
export type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info' | 'debug';

export type ErrorCategory = 
  | 'file_upload' | 'file_parse' 
  | 'db_connection' | 'db_query'
  | 'transform' | 'filter' | 'aggregation'
  | 'webgl' | 'chart_render'
  | 'memory' | 'network';

export interface PilotBAError {
  id: string;
  timestamp: Date;
  severity: ErrorSeverity;
  category: ErrorCategory;
  code: string;
  message: string;
  userAction?: string;
  technicalDetails?: string;
  context?: Record<string, unknown>;
  recoverable: boolean;
}

export const ERROR_CODES = {
  // File (1xxx)
  FILE_TOO_LARGE: { code: '1001', message: 'File exceeds maximum size', userAction: 'Upload a file smaller than 100MB' },
  FILE_INVALID_TYPE: { code: '1002', message: 'Unsupported file format', userAction: 'Upload CSV, JSON, or Parquet files' },
  
  // Parse (2xxx)
  CSV_MALFORMED: { code: '2001', message: 'CSV formatting error', userAction: 'Check row {row} for missing columns' },
  JSON_INVALID: { code: '2002', message: 'Invalid JSON', userAction: 'Validate JSON syntax' },
  
  // Query (5xxx)
  COLUMN_NOT_FOUND: { code: '5001', message: 'Column not found', userAction: 'Select a valid column' },
  
  // Viz (4xxx)
  WEBGL_NOT_SUPPORTED: { code: '4001', message: 'WebGL not available', userAction: 'Use Chrome, Firefox, or Edge' },
};
```

### Step 2: Create ErrorService (`ErrorService.ts`)

```typescript
class ErrorService {
  private static instance: ErrorService;
  private subscribers: Set<(error: PilotBAError) => void> = new Set();

  static getInstance(): ErrorService {
    if (!this.instance) this.instance = new ErrorService();
    return this.instance;
  }

  capture(error: Error | PilotBAError, context?: Record<string, unknown>): PilotBAError {
    const pilotError = this.normalize(error, context);
    
    // Log to console (dev)
    if (import.meta.env.DEV) {
      console.error(`[${pilotError.severity.toUpperCase()}] ${pilotError.code}: ${pilotError.message}`, pilotError);
    }
    
    // Store in LogStore
    useLogStore.getState().addLog(pilotError);
    
    // Notify subscribers (for toast)
    if (pilotError.severity === 'error' || pilotError.severity === 'critical') {
      this.subscribers.forEach(cb => cb(pilotError));
    }
    
    return pilotError;
  }

  subscribe(callback: (error: PilotBAError) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private normalize(error: Error | PilotBAError, context?: Record<string, unknown>): PilotBAError {
    if ('code' in error && 'severity' in error) return error as PilotBAError;
    
    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      severity: 'error',
      category: 'network',
      code: 'UNKNOWN',
      message: error.message,
      technicalDetails: error.stack,
      context,
      recoverable: true,
    };
  }
}

export const errorService = ErrorService.getInstance();
```

### Step 3: Create LogStore (`logStore.ts`)

```typescript
interface LogState {
  logs: PilotBAError[];
  addLog: (error: PilotBAError) => void;
  clearLogs: () => void;
  exportLogs: () => string;
}

export const useLogStore = create<LogState>((set, get) => ({
  logs: [],
  
  addLog: (error) => set((state) => ({
    logs: [error, ...state.logs].slice(0, 1000) // Keep last 1000
  })),
  
  clearLogs: () => set({ logs: [] }),
  
  exportLogs: () => JSON.stringify({
    exportDate: new Date().toISOString(),
    appVersion: '0.1.0',
    logs: get().logs,
  }, null, 2),
}));
```

### Step 4: Create File Error Handler (`fileErrorHandler.ts`)

```typescript
export async function handleFileUpload(file: File): Promise<Table> {
  // Validate size
  if (file.size > 100 * 1024 * 1024) {
    throw errorService.capture({
      id: crypto.randomUUID(),
      timestamp: new Date(),
      severity: 'error',
      category: 'file_upload',
      code: 'FILE_TOO_LARGE',
      message: ERROR_CODES.FILE_TOO_LARGE.message,
      userAction: ERROR_CODES.FILE_TOO_LARGE.userAction,
      context: { fileName: file.name, fileSize: file.size },
      recoverable: true,
    });
  }
  
  // Validate type
  const validTypes = ['text/csv', 'application/json', 'application/octet-stream'];
  if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|json|parquet|arrow)$/i)) {
    throw errorService.capture({
      id: crypto.randomUUID(),
      timestamp: new Date(),
      severity: 'error',
      category: 'file_upload',
      code: 'FILE_INVALID_TYPE',
      message: ERROR_CODES.FILE_INVALID_TYPE.message,
      userAction: ERROR_CODES.FILE_INVALID_TYPE.userAction,
      context: { fileName: file.name, fileType: file.type },
      recoverable: true,
    });
  }
  
  try {
    const result = await parseFile(file);
    
    // Log success
    errorService.capture({
      id: crypto.randomUUID(),
      timestamp: new Date(),
      severity: 'info',
      category: 'file_upload',
      code: 'FILE_LOADED',
      message: `Loaded ${file.name}`,
      context: { rows: result.numRows, columns: result.numCols },
      recoverable: true,
    });
    
    return result;
  } catch (err) {
    throw errorService.capture(err as Error, { fileName: file.name });
  }
}
```

### Step 5: Update FileUploader Component

```typescript
// In FileUploader.tsx - wrap upload in error handler
const handleUpload = async (file: File) => {
  try {
    setLoading(true);
    const table = await handleFileUpload(file);
    onSuccess(table);
  } catch (error) {
    // Error already captured by handler
    // Just update UI state
    setError((error as PilotBAError).message);
  } finally {
    setLoading(false);
  }
};
```

### Step 6: Add Error Toast Hook

```typescript
// hooks/useErrorToast.ts
export function useErrorToast() {
  const { addNotification } = useUIStore();
  
  useEffect(() => {
    return errorService.subscribe((error) => {
      addNotification({
        type: error.severity === 'critical' ? 'error' : 'warning',
        title: error.message,
        message: error.userAction || 'Please try again',
      });
    });
  }, []);
}

// Use in App.tsx
function App() {
  useErrorToast();
  // ...
}
```

---

## ✅ Acceptance Criteria

- [ ] `ErrorService.capture()` logs all errors with timestamp and context
- [ ] File upload shows user-friendly error for invalid files
- [ ] Error toast appears for ERROR/CRITICAL severity
- [ ] `useLogStore.exportLogs()` returns valid JSON
- [ ] No unhandled promise rejections in console
- [ ] ErrorBoundary catches React render errors

---

## 🧪 Test Cases for Toaster

```typescript
describe('ErrorService', () => {
  it('captures error with correct format');
  it('notifies subscribers for error severity');
  it('does not notify for info severity');
  it('limits log store to 1000 entries');
});

describe('FileErrorHandler', () => {
  it('rejects files > 100MB');
  it('rejects invalid file types');
  it('logs success for valid files');
});
```

---

## 🏷️ Labels

`handyman` `priority-p0` `error-handling` `frontend`

