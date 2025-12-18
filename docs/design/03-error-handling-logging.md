# 📋 Design Document: Error Handling & Logging System

**Author:** Architect  
**Date:** December 17, 2025  
**Status:** DRAFT - Pending Approval  
**Version:** 1.0

---

## 1. Executive Summary

This document outlines a comprehensive error handling and logging strategy for PilotBA, covering:
- Runtime error capture and classification
- Structured logging architecture
- User-facing error messages
- Developer debugging tools
- Integration with future Admin Portal

---

## 2. Problem Statement

### Current Gaps
- No centralized error handling
- Console.log scattered throughout codebase
- No error classification or severity levels
- No user-friendly error messages
- No error persistence for debugging
- No metrics for error frequency/patterns

### User Scenarios That Need Error Handling

| Scenario | What Can Go Wrong | Impact |
|----------|-------------------|--------|
| **File Upload** | Invalid format, corrupted file, too large, encoding issues | User can't load data |
| **CSV Parsing** | Malformed rows, inconsistent columns, special characters | Partial or no data |
| **DB Connection** | Wrong credentials, network timeout, SSL issues | No data access |
| **Query Execution** | Invalid column, type mismatch, memory overflow | Query fails |
| **Chart Rendering** | WebGL not supported, shader compilation, out of memory | No visualization |
| **Data Transform** | Division by zero, null handling, type coercion | Wrong results |

---

## 3. Proposed Architecture

### 3.1 Error Classification

```
┌─────────────────────────────────────────────────────────────┐
│                    Error Severity Levels                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CRITICAL  ─────►  App crash, data loss risk               │
│     🔴              Action: Block user, show recovery UI    │
│                                                             │
│  ERROR     ─────►  Operation failed, user action needed    │
│     🟠              Action: Show error message, suggest fix │
│                                                             │
│  WARNING   ─────►  Degraded experience, auto-recovered     │
│     🟡              Action: Toast notification, log it      │
│                                                             │
│  INFO      ─────►  Notable events (file loaded, etc.)      │
│     🔵              Action: Log only, no user notification  │
│                                                             │
│  DEBUG     ─────►  Developer diagnostics                   │
│     ⚪              Action: Dev console only                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Error Categories

```typescript
enum ErrorCategory {
  // Data Ingestion
  FILE_UPLOAD = 'file_upload',
  FILE_PARSE = 'file_parse',
  DATA_VALIDATION = 'data_validation',
  
  // Data Sources
  DB_CONNECTION = 'db_connection',
  DB_QUERY = 'db_query',
  API_REQUEST = 'api_request',
  
  // Processing
  TRANSFORM = 'transform',
  AGGREGATION = 'aggregation',
  FILTER = 'filter',
  
  // Visualization
  WEBGL = 'webgl',
  CHART_RENDER = 'chart_render',
  SHADER = 'shader',
  
  // System
  MEMORY = 'memory',
  NETWORK = 'network',
  BROWSER_COMPAT = 'browser_compat',
  
  // User Input
  VALIDATION = 'validation',
  PERMISSION = 'permission',
}
```

### 3.3 Logging Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Logging Flow                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Error Occurs                                              │
│        │                                                    │
│        ▼                                                    │
│   ┌─────────────┐                                          │
│   │ ErrorService│  ◄── Centralized error handler           │
│   └──────┬──────┘                                          │
│          │                                                  │
│          ├──────────────┬──────────────┬─────────────┐     │
│          ▼              ▼              ▼             ▼     │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐  ┌─────────┐ │
│   │ Console  │   │ LogStore │   │ UI Toast │  │ Backend │ │
│   │ (Dev)    │   │ (Memory) │   │ (User)   │  │ (API)   │ │
│   └──────────┘   └──────────┘   └──────────┘  └─────────┘ │
│                        │                           │       │
│                        ▼                           ▼       │
│                  ┌──────────┐              ┌──────────┐   │
│                  │ Export   │              │ Admin    │   │
│                  │ to File  │              │ Portal   │   │
│                  └──────────┘              └──────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Detailed Design

### 4.1 Core Error Service

**File:** `frontend/src/services/ErrorService.ts`

```typescript
interface PilotBAError {
  id: string;                    // Unique error ID
  timestamp: Date;
  severity: 'critical' | 'error' | 'warning' | 'info' | 'debug';
  category: ErrorCategory;
  code: string;                  // E.g., 'FILE_TOO_LARGE', 'PARSE_FAILED'
  message: string;               // User-friendly message
  technicalDetails?: string;     // Developer details
  stack?: string;                // Stack trace
  context?: Record<string, any>; // Additional context
  userAction?: string;           // Suggested fix for user
  recoverable: boolean;          // Can user retry?
}

class ErrorService {
  // Capture and process error
  capture(error: Error | PilotBAError, context?: object): void;
  
  // Get recent errors (for debug panel)
  getRecentErrors(limit?: number): PilotBAError[];
  
  // Export logs (for support)
  exportLogs(): Blob;
  
  // Clear logs
  clearLogs(): void;
  
  // Subscribe to errors (for UI notifications)
  subscribe(callback: (error: PilotBAError) => void): () => void;
}
```

### 4.2 Error Codes & Messages

**File:** `frontend/src/services/errorCodes.ts`

```typescript
const ERROR_CODES = {
  // File Upload Errors (1xxx)
  FILE_TOO_LARGE: {
    code: '1001',
    message: 'File is too large',
    userAction: 'Please upload a file smaller than {maxSize}MB',
  },
  FILE_INVALID_TYPE: {
    code: '1002',
    message: 'Unsupported file format',
    userAction: 'Please upload a CSV, JSON, or Parquet file',
  },
  FILE_CORRUPTED: {
    code: '1003',
    message: 'File appears to be corrupted',
    userAction: 'Please check the file and try again',
  },
  
  // Parse Errors (2xxx)
  CSV_MALFORMED: {
    code: '2001',
    message: 'CSV file has formatting issues',
    userAction: 'Row {row} has {expected} columns but found {actual}',
  },
  JSON_INVALID: {
    code: '2002',
    message: 'Invalid JSON format',
    userAction: 'Please check JSON syntax at line {line}',
  },
  ENCODING_ERROR: {
    code: '2003',
    message: 'File encoding not supported',
    userAction: 'Please save file as UTF-8 encoding',
  },
  
  // Database Errors (3xxx)
  DB_CONNECTION_FAILED: {
    code: '3001',
    message: 'Could not connect to database',
    userAction: 'Please check connection settings and try again',
  },
  DB_AUTH_FAILED: {
    code: '3002',
    message: 'Database authentication failed',
    userAction: 'Please verify username and password',
  },
  DB_TIMEOUT: {
    code: '3003',
    message: 'Database connection timed out',
    userAction: 'Server may be busy. Please try again.',
  },
  DB_QUERY_FAILED: {
    code: '3004',
    message: 'Query execution failed',
    userAction: 'Error: {details}',
  },
  
  // Visualization Errors (4xxx)
  WEBGL_NOT_SUPPORTED: {
    code: '4001',
    message: 'WebGL is not supported',
    userAction: 'Please use a modern browser (Chrome, Firefox, Edge)',
  },
  SHADER_COMPILE_FAILED: {
    code: '4002',
    message: 'Graphics initialization failed',
    userAction: 'Try refreshing the page or updating your browser',
  },
  OUT_OF_MEMORY: {
    code: '4003',
    message: 'Not enough memory to render',
    userAction: 'Try reducing the data size or closing other tabs',
  },
  
  // Query Errors (5xxx)
  COLUMN_NOT_FOUND: {
    code: '5001',
    message: 'Column "{column}" not found',
    userAction: 'Please select a valid column',
  },
  TYPE_MISMATCH: {
    code: '5002',
    message: 'Type mismatch in operation',
    userAction: 'Cannot compare {type1} with {type2}',
  },
  DIVISION_BY_ZERO: {
    code: '5003',
    message: 'Division by zero',
    userAction: 'Check for zero values in column "{column}"',
  },
};
```

### 4.3 Error Boundary Enhancement

**File:** `frontend/src/components/common/ErrorBoundary.tsx`

```typescript
// Enhanced error boundary with error reporting
class ErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Report to ErrorService
    ErrorService.capture({
      severity: 'critical',
      category: ErrorCategory.CHART_RENDER, // or detect from error
      message: error.message,
      stack: error.stack,
      context: {
        componentStack: errorInfo.componentStack,
      },
      recoverable: true,
    });
  }
  
  // Render fallback with error details and retry
}
```

### 4.4 Specific Error Handlers

#### File Upload Error Handler

```typescript
// frontend/src/services/handlers/fileUploadErrorHandler.ts

async function handleFileUpload(file: File): Promise<Table> {
  try {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new PilotBAError({
        code: 'FILE_TOO_LARGE',
        context: { maxSize: MAX_FILE_SIZE / 1024 / 1024 },
      });
    }
    
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new PilotBAError({
        code: 'FILE_INVALID_TYPE',
        context: { fileType: file.type },
      });
    }
    
    // Parse file
    const result = await parser.parse(file);
    
    // Log success
    ErrorService.capture({
      severity: 'info',
      category: ErrorCategory.FILE_UPLOAD,
      message: `Successfully loaded ${file.name}`,
      context: { rows: result.numRows, columns: result.numCols },
    });
    
    return result;
    
  } catch (error) {
    // Enhance error with context
    if (error instanceof PilotBAError) {
      ErrorService.capture(error);
      throw error;
    }
    
    // Wrap unknown errors
    const wrappedError = new PilotBAError({
      code: 'FILE_PARSE_UNKNOWN',
      message: 'Failed to parse file',
      technicalDetails: error.message,
      context: { fileName: file.name },
    });
    ErrorService.capture(wrappedError);
    throw wrappedError;
  }
}
```

#### Database Connection Error Handler

```typescript
// frontend/src/services/handlers/dbConnectionErrorHandler.ts

async function connectToDatabase(config: DBConfig): Promise<Connection> {
  const startTime = Date.now();
  
  try {
    const connection = await db.connect(config);
    
    // Log successful connection
    ErrorService.capture({
      severity: 'info',
      category: ErrorCategory.DB_CONNECTION,
      message: `Connected to ${config.type} database`,
      context: {
        host: config.host,
        database: config.database,
        latency: Date.now() - startTime,
      },
    });
    
    return connection;
    
  } catch (error) {
    // Classify the error
    let errorCode = 'DB_CONNECTION_FAILED';
    
    if (error.message.includes('authentication')) {
      errorCode = 'DB_AUTH_FAILED';
    } else if (error.message.includes('timeout')) {
      errorCode = 'DB_TIMEOUT';
    } else if (error.message.includes('ECONNREFUSED')) {
      errorCode = 'DB_CONNECTION_REFUSED';
    }
    
    const pilotError = new PilotBAError({
      code: errorCode,
      technicalDetails: error.message,
      context: {
        host: config.host,
        database: config.database,
        attemptDuration: Date.now() - startTime,
      },
    });
    
    ErrorService.capture(pilotError);
    throw pilotError;
  }
}
```

### 4.5 Log Storage (Client-Side)

**File:** `frontend/src/store/logStore.ts`

```typescript
interface LogStore {
  // In-memory log buffer (last 1000 entries)
  logs: PilotBAError[];
  
  // Persist critical errors to IndexedDB
  persistedErrors: PilotBAError[];
  
  // Actions
  addLog: (error: PilotBAError) => void;
  clearLogs: () => void;
  exportLogs: () => Blob;
  
  // Queries
  getByCategory: (category: ErrorCategory) => PilotBAError[];
  getBySeverity: (severity: string) => PilotBAError[];
  getTimeRange: (start: Date, end: Date) => PilotBAError[];
}
```

### 4.6 User-Facing Error UI

```typescript
// Error Toast Component
<ErrorToast 
  error={error}
  onDismiss={dismiss}
  onRetry={error.recoverable ? retry : undefined}
/>

// Error Details Modal (for "Show Details" click)
<ErrorDetailsModal
  error={error}
  onCopyToClipboard={copyErrorDetails}
  onExportLogs={exportLogs}
/>
```

---

## 5. Integration Points

### 5.1 With Future Admin Portal

```typescript
// Send errors to backend for Admin Portal
if (error.severity === 'critical' || error.severity === 'error') {
  await api.post('/errors', {
    ...error,
    sessionId: getSessionId(),
    userId: getUserId(),
    browserInfo: getBrowserInfo(),
  });
}
```

### 5.2 With Performance Monitor

```typescript
// Track error rates in performance metrics
performanceStore.trackMetric('error_rate', {
  category: error.category,
  severity: error.severity,
  timestamp: error.timestamp,
});
```

---

## 6. Implementation Plan

### Phase 1: Core Infrastructure (Week 1)
| Task | Owner | Priority |
|------|-------|----------|
| Create ErrorService class | Handyman | High |
| Define error codes & messages | Handyman | High |
| Create PilotBAError class | Handyman | High |
| Create LogStore (Zustand) | Handyman | High |

### Phase 2: Error Handlers (Week 1-2)
| Task | Owner | Priority |
|------|-------|----------|
| File upload error handler | Handyman | High |
| CSV/JSON parse error handlers | Handyman | High |
| WebGL error handler | Handyman | Medium |
| Query execution error handler | Handyman | Medium |

### Phase 3: UI Components (Week 2)
| Task | Owner | Priority |
|------|-------|----------|
| Error toast notifications | Handyman | High |
| Error details modal | Handyman | Medium |
| Debug panel (dev mode) | Handyman | Low |

### Phase 4: Testing (Week 2)
| Task | Owner | Priority |
|------|-------|----------|
| Unit tests for ErrorService | Toaster | High |
| Integration tests for handlers | Toaster | High |
| E2E tests for error scenarios | Toaster | Medium |

---

## 7. Success Metrics

| Metric | Target |
|--------|--------|
| All errors have user-friendly messages | 100% |
| All errors are logged with context | 100% |
| Error recovery rate (user can continue) | >80% |
| Mean time to identify error cause | <30 seconds |
| Log export works for support | Yes |

---

## 8. Open Questions for Approval

1. **Log Retention:** How long should we keep logs in IndexedDB? (Proposed: 7 days)

2. **Error Telemetry:** Should we send anonymous error telemetry to improve the product? (Opt-in)

3. **Admin Portal Priority:** Should we implement backend error reporting now or wait for Phase 8?

4. **Error Codes Format:** Is the proposed 4-digit code system (1xxx, 2xxx, etc.) acceptable?

5. **User Notification:** Should all warnings show toast notifications, or only errors/critical?

---

## 9. Appendix

### A. Example Error Flow

```
User uploads malformed CSV
        │
        ▼
FileUploader.handleUpload()
        │
        ▼
CSVParser.parse() throws Error
        │
        ▼
fileUploadErrorHandler catches
        │
        ├──► Creates PilotBAError with code 'CSV_MALFORMED'
        │
        ├──► Calls ErrorService.capture()
        │         │
        │         ├──► Logs to console (dev)
        │         ├──► Stores in LogStore
        │         └──► Shows toast to user
        │
        └──► Throws error to caller
                │
                ▼
        FileUploader shows error state
        User sees: "CSV file has formatting issues. 
                   Row 47 has 5 columns but found 3."
        [Retry] [Show Details]
```

### B. Log Export Format

```json
{
  "exportDate": "2025-12-17T10:30:00Z",
  "appVersion": "0.1.0",
  "browserInfo": {
    "name": "Chrome",
    "version": "120.0"
  },
  "logs": [
    {
      "id": "err_abc123",
      "timestamp": "2025-12-17T10:25:00Z",
      "severity": "error",
      "category": "file_parse",
      "code": "CSV_MALFORMED",
      "message": "CSV file has formatting issues",
      "context": {
        "fileName": "data.csv",
        "row": 47,
        "expected": 5,
        "actual": 3
      }
    }
  ]
}
```

---

**Document Status:** DRAFT - Awaiting Approval

**Next Steps After Approval:**
1. Create GitHub issues for Handyman
2. Create test specifications for Toaster
3. Add to project roadmap

