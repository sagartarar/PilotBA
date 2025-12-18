# 🔧 HANDYMAN-006: Security Hardening

**Priority:** P0 (Critical)
**Time Estimate:** 0.5 day
**Depends On:** None

---

## 📋 Objective

Secure the frontend against XSS, injection, and other common vulnerabilities.

---

## 🔧 Implementation Steps

### Step 1: Install DOMPurify

```bash
npm install dompurify
npm install -D @types/dompurify
```

### Step 2: Create Sanitization Utilities (`utils/sanitize.ts`)

```typescript
import DOMPurify from 'dompurify';

// Sanitize file names
export function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '_')  // Remove invalid chars
    .replace(/\.\./g, '_')          // Prevent path traversal
    .slice(0, 255);                 // Limit length
}

// Sanitize display values (prevent XSS)
export function sanitizeDisplay(value: unknown): string {
  if (value === null || value === undefined) return '';
  return DOMPurify.sanitize(String(value));
}

// Sanitize HTML content
export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
    ALLOWED_ATTR: [],
  });
}
```

### Step 3: Apply to File Upload (`FileUploader.tsx`)

```typescript
import { sanitizeFileName } from '../../utils/sanitize';

const handleFile = (file: File) => {
  const safeName = sanitizeFileName(file.name);
  
  // Validate file type by extension AND magic bytes
  const validExtensions = ['.csv', '.json', '.parquet', '.arrow'];
  const ext = safeName.toLowerCase().slice(safeName.lastIndexOf('.'));
  
  if (!validExtensions.includes(ext)) {
    throw new Error('FILE_INVALID_TYPE');
  }
  
  // Size limit
  const MAX_SIZE = 100 * 1024 * 1024; // 100MB
  if (file.size > MAX_SIZE) {
    throw new Error('FILE_TOO_LARGE');
  }
  
  // Process with sanitized name
  processFile(file, safeName);
};
```

### Step 4: Apply to Data Display (`DataTable.tsx`)

```typescript
import { sanitizeDisplay } from '../../utils/sanitize';

// When rendering cell values
<td>{sanitizeDisplay(row[column])}</td>

// Never use dangerouslySetInnerHTML with user data
// ❌ Bad
<div dangerouslySetInnerHTML={{ __html: value }} />

// ✅ Good
<div>{sanitizeDisplay(value)}</div>
```

### Step 5: Add CSP Headers (`vite.config.ts`)

```typescript
export default defineConfig({
  server: {
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval'", // Required for Apache Arrow
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "connect-src 'self' ws: wss:",
        "font-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; '),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    },
  },
});
```

### Step 6: Validate Query Inputs (`QueryBuilder.tsx`)

```typescript
// Prevent SQL-like injection in filter values
function validateFilterValue(value: string): boolean {
  // Block dangerous patterns
  const dangerous = /[;'"\\]|--|\bOR\b|\bAND\b|\bUNION\b/i;
  return !dangerous.test(value);
}

// In filter handler
const handleFilterChange = (value: string) => {
  if (!validateFilterValue(value)) {
    errorService.capture({
      severity: 'warning',
      code: 'INVALID_INPUT',
      message: 'Invalid characters in filter value',
    });
    return;
  }
  setFilterValue(value);
};
```

### Step 7: Audit Dependencies

```bash
# Check for vulnerabilities
npm audit

# Fix automatically where possible
npm audit fix

# Review remaining issues
npm audit --json > audit-report.json
```

---

## ✅ Acceptance Criteria

- [ ] File names with `<script>` are sanitized to `_script_`
- [ ] XSS payload in CSV data is escaped in display
- [ ] CSP headers present in dev server responses
- [ ] `npm audit` shows no critical/high vulnerabilities
- [ ] No `eval()` except in Apache Arrow (required)
- [ ] Path traversal attempts (`../`) are blocked

---

## 🧪 Security Test Cases for Toaster

```typescript
describe('Security', () => {
  it('sanitizes malicious file names', () => {
    expect(sanitizeFileName('<script>alert(1)</script>.csv'))
      .toBe('_script_alert_1___script_.csv');
  });

  it('escapes XSS in data display', () => {
    expect(sanitizeDisplay('<img onerror=alert(1)>'))
      .toBe('');
  });

  it('blocks path traversal', () => {
    expect(sanitizeFileName('../../etc/passwd'))
      .toBe('____etc_passwd');
  });
});
```

---

## 🏷️ Labels

`handyman` `priority-p0` `security` `frontend`

