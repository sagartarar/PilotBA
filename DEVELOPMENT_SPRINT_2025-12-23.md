# 🏗️ Development Sprint Plan - December 23, 2025

**Document Owner:** Lead Architect  
**Sprint Duration:** December 23, 2025 - January 6, 2026 (2 weeks)  
**Goal:** Fix remaining test failures, complete backend API, prepare for production

---

## 📊 Sprint Summary

### Current State (as of December 23, 2025)

| Component | Status | Health |
|-----------|--------|--------|
| **Frontend Core** | 83% complete | 🟢 Good |
| **WebGL Viz Engine** | Implemented | 🟢 Good |
| **Data Pipeline** | Implemented, tests failing | 🟡 Needs Fix |
| **Query Builder** | Complete | 🟢 Good |
| **Error Handling** | Complete | 🟢 Good |
| **Security Utils** | Complete | 🟢 Good |
| **Backend API** | Basic scaffolding | 🟡 In Progress |
| **Test Suite** | 82.3% passing | 🟡 Needs Fix |

### Sprint Goals

1. **P0:** Fix all 181 failing tests (Apache Arrow API compatibility)
2. **P0:** Complete backend API endpoints (auth, files, queries)
3. **P1:** Achieve 90%+ test pass rate
4. **P1:** Set up production deployment infrastructure
5. **P2:** Enhance E2E test coverage

---

## 🔧 HANDYMAN Tasks (Lead Developer)

### HANDYMAN-008: Fix Apache Arrow Parser Tests [P0]

**Priority:** Critical  
**Estimated Time:** 1-2 days  
**Blocked By:** None

**Problem:**
181 tests fail due to Apache Arrow API changes in version 14.x:
- `makeVector()` no longer accepts plain arrays
- `new Table(schema, vectors)` causes stack overflow

**Files to Update:**
```
frontend/src/data-pipeline/parsers/
├── CSVParser.ts       # Update to use tableFromArrays()
├── JSONParser.ts      # Update to use tableFromArrays()
├── ParquetParser.ts   # Update to use tableFromArrays()
├── ArrowParser.ts     # Update to use tableFromArrays()
└── BaseParser.ts      # Ensure correct Arrow imports
```

**Solution Pattern (from Toaster's fixes):**
```typescript
// BEFORE (broken in Arrow 14.x)
import { makeVector, Table, Schema } from 'apache-arrow';
const vector = makeVector([1, 2, 3]);
return new Table(schema, vectors);

// AFTER (working)
import { tableFromArrays } from 'apache-arrow';
const data: Record<string, any[]> = {
  column1: [1, 2, 3],
  column2: ['a', 'b', 'c'],
};
return tableFromArrays(data);
```

**Acceptance Criteria:**
- [ ] All CSV parser tests pass
- [ ] All JSON parser tests pass
- [ ] All Parquet parser tests pass
- [ ] All Arrow parser tests pass
- [ ] `npm run test:run` shows 0 failures for parser tests
- [ ] No regressions in existing passing tests

**Handoff to Toaster:** Notify when complete for test validation

---

### HANDYMAN-009: Complete Backend Auth System [P0]

**Priority:** Critical  
**Estimated Time:** 2 days  
**Blocked By:** None

**Current State:** Basic JWT implementation exists

**Required Endpoints:**
```
POST   /api/auth/register    # User registration
POST   /api/auth/login       # JWT login (exists)
POST   /api/auth/logout      # Token invalidation
POST   /api/auth/refresh     # Token refresh
GET    /api/auth/me          # Current user info
```

**Implementation Location:** `backend/src/routes/auth.rs`

**Security Requirements:**
- Password hashing with Argon2
- JWT tokens expire in 1 hour
- Refresh tokens expire in 7 days
- Rate limiting on login (5 attempts per minute)
- Input validation on all fields

**Database Models Needed:**
```rust
// backend/src/models/user.rs
struct User {
    id: Uuid,
    email: String,
    password_hash: String,
    role: UserRole,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

enum UserRole {
    Admin,
    User,
    ReadOnly,
}
```

**Acceptance Criteria:**
- [ ] Registration endpoint works
- [ ] Login returns valid JWT
- [ ] Logout invalidates token
- [ ] Refresh token works
- [ ] Protected routes require valid JWT
- [ ] All endpoints have integration tests
- [ ] 80%+ code coverage

---

### HANDYMAN-010: Complete Backend File API [P1]

**Priority:** High  
**Estimated Time:** 2 days  
**Blocked By:** HANDYMAN-009 (auth)

**Required Endpoints:**
```
POST   /api/files           # Upload file (auth required)
GET    /api/files           # List user's files (auth required)
GET    /api/files/:id       # Download file (auth required)
DELETE /api/files/:id       # Delete file (auth required)
GET    /api/files/:id/meta  # Get file metadata (auth required)
```

**Implementation Location:** `backend/src/routes/files.rs`

**Features:**
- File size limit: 100MB
- Allowed types: CSV, JSON, Parquet, Arrow IPC
- Store files in MinIO
- Store metadata in PostgreSQL
- Return Arrow IPC format for downloads

**Acceptance Criteria:**
- [ ] Can upload CSV up to 100MB
- [ ] Can list all user files
- [ ] Can download file in Arrow format
- [ ] Can delete files
- [ ] Files are stored in MinIO
- [ ] Metadata stored in PostgreSQL
- [ ] All endpoints tested

---

### HANDYMAN-011: Frontend-Backend Integration [P1]

**Priority:** High  
**Estimated Time:** 1-2 days  
**Blocked By:** HANDYMAN-009, HANDYMAN-010

**Tasks:**
1. Create API client service in frontend
2. Add auth context/provider
3. Connect file upload to backend
4. Replace mock data with real API calls
5. Handle loading/error states

**Files to Create/Update:**
```
frontend/src/services/
├── api/
│   ├── client.ts        # Axios instance with auth interceptor
│   ├── authApi.ts       # Auth API calls
│   └── filesApi.ts      # Files API calls
├── AuthContext.tsx      # Auth state provider
└── useAuth.ts           # Auth hook
```

**Acceptance Criteria:**
- [ ] Login/logout works end-to-end
- [ ] File upload goes to backend
- [ ] File list loads from backend
- [ ] Errors display properly
- [ ] Loading states work

---

## 🍞 TOASTER Tasks (Senior QA Engineer)

### TOASTER-008: Validate Parser Test Fixes [P0]

**Priority:** Critical  
**Estimated Time:** 0.5 days  
**Blocked By:** HANDYMAN-008

**Tasks:**
1. Run full test suite after Handyman's parser fixes
2. Verify all 181 failing tests now pass
3. Check for any new regressions
4. Update test snapshots if needed
5. Document any remaining issues

**Commands to Run:**
```bash
cd frontend
npm run test:run          # All tests
npm run test:coverage     # Coverage report
npm run test:run -- --reporter=json > test-results.json
```

**Acceptance Criteria:**
- [ ] 100% of parser tests pass
- [ ] Overall test pass rate > 95%
- [ ] No new test failures introduced
- [ ] Coverage report generated

---

### TOASTER-009: Backend API Tests [P0]

**Priority:** Critical  
**Estimated Time:** 1-2 days  
**Blocked By:** HANDYMAN-009

**Tasks:**
1. Write integration tests for auth endpoints
2. Write integration tests for file endpoints
3. Test error handling and edge cases
4. Test rate limiting
5. Test authorization (role-based access)

**Test Scenarios:**
```rust
// backend/tests/integration/auth_tests.rs
- test_register_success
- test_register_duplicate_email
- test_register_invalid_email
- test_register_weak_password
- test_login_success
- test_login_wrong_password
- test_login_nonexistent_user
- test_refresh_token_success
- test_refresh_token_expired
- test_protected_route_without_token
- test_protected_route_with_invalid_token
- test_logout_invalidates_token
```

**Acceptance Criteria:**
- [ ] 20+ backend integration tests
- [ ] 80%+ backend code coverage
- [ ] All tests pass in CI
- [ ] Test report generated

---

### TOASTER-010: E2E Full Flow Tests [P1]

**Priority:** High  
**Estimated Time:** 1-2 days  
**Blocked By:** HANDYMAN-011

**Tasks:**
1. Test complete user journey (register → login → upload → visualize → logout)
2. Test error scenarios
3. Cross-browser testing (Chrome, Firefox, Safari)
4. Mobile viewport testing
5. Accessibility validation

**E2E Scenarios to Create:**
```typescript
// frontend/e2e/user-journey.spec.ts
- test('Complete user registration flow')
- test('Complete login flow')
- test('Upload CSV and create chart')
- test('Apply filters and see results')
- test('Export filtered data')
- test('Logout clears session')

// frontend/e2e/error-handling.spec.ts
- test('Shows error for invalid file type')
- test('Shows error for file too large')
- test('Shows error for invalid login')
- test('Handles network errors gracefully')
- test('Handles session expiration')
```

**Acceptance Criteria:**
- [ ] 10+ new E2E tests
- [ ] All critical paths covered
- [ ] Tests run in CI
- [ ] Screenshots on failure
- [ ] Video recording enabled

---

### TOASTER-011: Performance & Security Validation [P1]

**Priority:** High  
**Estimated Time:** 1 day  
**Blocked By:** HANDYMAN-011

**Tasks:**
1. Load testing with k6 (1000 concurrent users target)
2. Memory leak testing (10 consecutive file loads)
3. Security scan with OWASP ZAP or similar
4. Lighthouse audit (target >80 all metrics)
5. Accessibility audit (WCAG 2.1 AA)

**Metrics to Capture:**
```
| Metric                  | Target      |
|-------------------------|-------------|
| API Response (p95)      | < 500ms     |
| Time to Interactive     | < 3 seconds |
| Lighthouse Performance  | > 80        |
| Lighthouse Accessibility| > 90        |
| Memory after 10 loads   | < 500MB     |
| Concurrent users        | 1000        |
```

**Acceptance Criteria:**
- [ ] All performance targets met
- [ ] No memory leaks detected
- [ ] No critical security issues
- [ ] Lighthouse report generated
- [ ] Load test results documented

---

## 📅 Sprint Schedule

### Week 1 (Dec 23-29)

| Day | Handyman | Toaster |
|-----|----------|---------|
| Mon | HANDYMAN-008 (Parser fixes) | Review existing test coverage |
| Tue | HANDYMAN-008 (Continue) | TOASTER-008 (Validate parser fixes) |
| Wed | HANDYMAN-009 (Auth backend) | TOASTER-009 (Backend tests) |
| Thu | HANDYMAN-009 (Continue) | TOASTER-009 (Continue) |
| Fri | HANDYMAN-010 (File API) | Review & bug triage |

### Week 2 (Dec 30 - Jan 5)

| Day | Handyman | Toaster |
|-----|----------|---------|
| Mon | HANDYMAN-010 (Continue) | TOASTER-009 (Continue) |
| Tue | HANDYMAN-011 (Integration) | TOASTER-010 (E2E tests) |
| Wed | HANDYMAN-011 (Continue) | TOASTER-010 (Continue) |
| Thu | Bug fixes, polish | TOASTER-011 (Performance) |
| Fri | Code freeze, review | Final QA report |

---

## 🎯 Definition of Done

### For All Tasks

- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] Code reviewed by Architect
- [ ] Documentation updated
- [ ] No security issues (MCP Semgrep scan passes)
- [ ] Conventional commits used

### For Backend Tasks

- [ ] `cargo fmt` passes
- [ ] `cargo clippy` passes with no warnings
- [ ] `cargo test` all pass
- [ ] `cargo audit` no critical vulnerabilities

### For Frontend Tasks

- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] `npm run test:run` all pass
- [ ] `npm run build` succeeds

---

## 🚨 Escalation Process

### Blockers

If blocked for more than 4 hours:
1. Comment on the issue with `@architect - blocked`
2. Describe what's blocking
3. List what you've tried
4. Architect will respond within same day

### Architecture Decisions

If you need an architecture decision:
1. Create issue with `architecture` label
2. Propose options with pros/cons
3. Tag `@architect`
4. Wait for decision before proceeding

---

## 📝 Daily Updates

### Format

Each day, update your assigned issue with:
```markdown
**Progress Update - [Date]**

✅ Completed:
- [what you finished]

🚧 In Progress:
- [what you're working on]

📋 Next:
- [what's coming]

🚫 Blockers:
- [any blockers, or "None"]
```

---

## 🏆 Success Criteria

### Sprint Success

| Metric | Target |
|--------|--------|
| Test Pass Rate | > 95% |
| Backend API Complete | 100% |
| Integration Working | Yes |
| E2E Coverage | 20+ tests |
| Performance Targets | All met |
| Security Issues | 0 critical |

---

**Document Owner:** Lead Architect  
**Created:** December 23, 2025  
**Last Updated:** December 23, 2025  
**Next Review:** December 30, 2025


