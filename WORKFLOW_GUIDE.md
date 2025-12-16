# PilotBA - Workflow Guide for Development Teams

**Version:** 1.0  
**Last Updated:** December 16, 2025  
**Target Audience:** Development Agent, Testing Agent, Contributors

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Development Agent Workflow](#development-agent-workflow)
3. [Testing Agent Workflow](#testing-agent-workflow)
4. [Code Review Process](#code-review-process)
5. [Git Conventions](#git-conventions)
6. [Testing Standards](#testing-standards)
7. [Common Tasks](#common-tasks)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

```bash
# Check installations
docker --version          # Docker 24+
docker-compose --version  # 2.20+
node --version            # Node 20+
cargo --version           # Rust 1.75+
npx playwright --version  # Playwright latest
```

### Initial Setup

```bash
# 1. Clone and setup
git clone <repo-url>
cd PilotBA

# 2. Install dependencies
make install

# 3. Start infrastructure services
make docker-up

# 4. Verify services are healthy
docker-compose ps  # All services should be "healthy"

# 5. Start development servers (in separate terminals)
make dev-backend   # Terminal 1 - Backend at http://localhost:8080
make dev-frontend  # Terminal 2 - Frontend at http://localhost:3000
```

### Daily Development Routine

```bash
# Morning: Pull latest changes
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Start services if not running
make docker-up

# Run tests in watch mode while developing
# Terminal 1: Backend tests
cd backend && cargo watch -x test

# Terminal 2: Frontend tests
cd frontend && npm test  # Auto-watches

# Before committing
./scripts/run-all-tests.sh  # Run full test suite

# Commit with conventional commit format
git add .
git commit -m "feat: add scatter plot rendering"

# Push and create PR
git push origin feature/your-feature-name
```

---

## Development Agent Workflow

### Role & Responsibilities

As the **Development Agent**, you are responsible for:
- ✅ Implementing new features and functionality
- ✅ Fixing bugs and issues
- ✅ Writing unit tests for new code
- ✅ Code review participation
- ✅ Documentation updates
- ✅ Performance optimization
- ❌ Not responsible for: E2E tests, CI/CD configuration (Testing Agent handles these)

### Feature Development Workflow

#### Step 1: Understand Requirements

Before starting:
- Review the feature requirements in PROJECT_ARCHITECTURE.md
- Check if there's a design document (docs/design/)
- Clarify any ambiguities with the Project Architect
- Identify affected components

#### Step 2: Create Feature Branch

```bash
# Branch naming convention: type/description
# Types: feature, bugfix, hotfix, refactor, docs

git checkout develop
git pull origin develop
git checkout -b feature/webgl-scatter-plot
```

#### Step 3: Write Tests First (TDD Recommended)

```bash
# Backend example
cd backend
touch tests/unit/scatter_plot_tests.rs

# Write failing tests
cargo test  # Tests should fail

# Implement feature
# Tests should pass

# Frontend example
cd frontend
touch src/viz-engine/charts/ScatterPlot.test.ts

# Write failing tests
npm test  # Tests should fail

# Implement feature
# Tests should pass
```

#### Step 4: Implement Feature

**Backend Implementation Checklist:**
- [ ] Create/update models (src/models/)
- [ ] Add database migrations if needed
- [ ] Implement business logic
- [ ] Add API endpoints (src/api/)
- [ ] Write unit tests (tests/unit/)
- [ ] Write integration tests (tests/integration/)
- [ ] Update API documentation
- [ ] Run cargo fmt and cargo clippy

**Frontend Implementation Checklist:**
- [ ] Create/update components (src/components/)
- [ ] Add state management if needed
- [ ] Implement UI logic
- [ ] Add styling (Tailwind classes)
- [ ] Write unit tests (*.test.tsx)
- [ ] Write integration tests (src/test/integration/)
- [ ] Update TypeScript types
- [ ] Run npm run type-check and npm run lint

#### Step 5: Local Testing

```bash
# Run all tests
./scripts/run-all-tests.sh

# Check test coverage
# Backend
cd backend && cargo tarpaulin --out Html
open tarpaulin-report.html

# Frontend
cd frontend && npm run test:coverage
open coverage/lcov-report/index.html

# Verify coverage meets 80% threshold
```

#### Step 6: Code Quality Checks

```bash
# Backend
cd backend
cargo fmt --check    # Format check
cargo clippy -- -D warnings  # Linting
cargo test           # All tests
cargo audit          # Security check

# Frontend
cd frontend
npm run type-check   # TypeScript
npm run lint         # ESLint
npm test -- --run    # All tests
npm audit            # Security check
```

#### Step 7: Commit Changes

```bash
# Stage changes
git add .

# Commit with conventional commit format
# Format: <type>(<scope>): <description>
#
# Types: feat, fix, docs, style, refactor, test, chore
# Examples:
#   feat(viz): add scatter plot rendering
#   fix(api): resolve memory leak in data loader
#   docs(readme): update installation instructions
#   test(backend): add integration tests for auth

git commit -m "feat(viz): add scatter plot with quadtree spatial index"
```

#### Step 8: Push and Create PR

```bash
# Push to remote
git push origin feature/webgl-scatter-plot

# Create PR on GitHub
# - Title: Clear, descriptive title
# - Description: What, why, how
# - Link to any related issues
# - Add screenshots if UI changes
# - Request review from Testing Agent and Architect
```

### PR Description Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- Added scatter plot rendering with WebGL2
- Implemented quadtree spatial indexing for O(log n) queries
- Added unit tests for ScatterPlot class
- Updated documentation

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Coverage meets 80% threshold

## Performance Impact
- Renders 10M points at 62 FPS (target: 60 FPS)
- Memory usage: 450MB (target: < 500MB)

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows project style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No linting errors
- [ ] Security considerations addressed
```

### Bug Fix Workflow

#### Step 1: Reproduce Bug

```bash
# Create bug reproduction test
# This test should fail initially

# Backend example
#[test]
fn test_bug_reproduction() {
    // Reproduce the bug
    // Assert the expected behavior
}

# Frontend example
it('should handle edge case correctly', () => {
    // Reproduce the bug
    // Assert the expected behavior
});
```

#### Step 2: Fix Bug

- Minimal code changes
- Focus on root cause
- Add regression tests
- Update any affected documentation

#### Step 3: Verify Fix

```bash
# Run specific test
cargo test test_bug_reproduction
npm test -- bug_reproduction

# Run full suite
./scripts/run-all-tests.sh
```

---

## Testing Agent Workflow

### Role & Responsibilities

As the **Testing Agent**, you are responsible for:
- ✅ E2E test development and maintenance
- ✅ Test infrastructure improvements
- ✅ CI/CD pipeline maintenance
- ✅ Test coverage monitoring
- ✅ Performance testing
- ✅ Security testing
- ✅ Accessibility testing
- ✅ Test documentation
- ❌ Not responsible for: Feature implementation (Development Agent handles this)

### E2E Test Development Workflow

#### Step 1: Identify Test Scenarios

Review new features and identify:
- Critical user workflows
- Edge cases
- Cross-browser concerns
- Accessibility requirements
- Performance requirements

#### Step 2: Write E2E Tests

```typescript
// e2e/feature-name.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Navigate to page, login, etc.
    await page.goto('http://localhost:3000');
  });

  test('should perform critical workflow', async ({ page }) => {
    // Arrange
    // Act
    // Assert
  });

  test('should handle error cases', async ({ page }) => {
    // Test error handling
  });

  test('should be accessible', async ({ page }) => {
    // Accessibility checks
    await expect(page).toPassA11y();
  });
});
```

#### Step 3: Run E2E Tests

```bash
# Run all E2E tests
npx playwright test

# Run in UI mode (interactive)
npx playwright test --ui

# Run specific test file
npx playwright test e2e/scatter-plot.spec.ts

# Run in specific browser
npx playwright test --project=chromium

# Debug mode
npx playwright test --debug
```

#### Step 4: CI/CD Maintenance

Monitor and maintain:
- `.github/workflows/test.yml` - Main test workflow
- `.github/workflows/performance.yml` - Performance tests
- `.github/workflows/codeql.yml` - Security scanning

**Common CI/CD Tasks:**
- Update dependencies
- Optimize test execution time
- Fix flaky tests
- Add new test jobs
- Update cache strategies

#### Step 5: Coverage Monitoring

```bash
# Generate coverage reports
cd frontend && npm run test:coverage
cd backend && cargo tarpaulin --out Html

# Check coverage thresholds
# - Overall: 80%+
# - Critical paths: 95%+
# - New code: 80%+

# Identify untested code
# Review coverage reports, focus on:
# - Red/yellow files (low coverage)
# - Critical business logic
# - Complex algorithms
```

#### Step 6: Performance Testing

```bash
# Run performance test suite
./scripts/performance-test.sh

# Backend benchmarks
cd backend && cargo bench

# Load testing with k6
k6 run scripts/load-test.js

# Frontend performance
npm run lighthouse

# Monitor results against targets:
# - Backend p95: < 500ms
# - Frontend FCP: < 1.8s
# - Frontend LCP: < 2.5s
```

#### Step 7: Security Testing

```bash
# Run security scan suite
./scripts/security-scan.sh

# Individual scans
cargo audit              # Backend dependencies
npm audit                # Frontend dependencies
trivy image <image>      # Container scanning

# Review results:
# - Zero HIGH/CRITICAL vulnerabilities allowed
# - Document and track medium/low issues
# - Create tickets for remediation
```

### Test Maintenance Workflow

#### Dealing with Flaky Tests

```bash
# Identify flaky tests
# Look for intermittent failures in CI/CD

# Debugging steps:
1. Run test multiple times locally
   npx playwright test <test-file> --repeat-each=10

2. Identify root cause:
   - Race conditions? Add explicit waits
   - Network timing? Mock API calls
   - Resource cleanup? Add afterEach hooks

3. Fix and verify:
   npx playwright test <test-file> --repeat-each=20
   # Should pass all 20 runs

4. Update test with comments explaining the fix
```

#### Updating Tests for Changes

```bash
# When features change:
1. Review failing tests
2. Update test expectations
3. Update test data/fixtures
4. Update test documentation
5. Run full suite to verify
```

---

## Code Review Process

### For Reviewers (All Agents)

#### Review Checklist

**Functionality:**
- [ ] Code does what it's supposed to do
- [ ] Edge cases handled
- [ ] Error handling present
- [ ] No obvious bugs

**Code Quality:**
- [ ] Code is readable and maintainable
- [ ] Follows project conventions
- [ ] No code duplication
- [ ] Appropriate abstractions
- [ ] Comments where necessary

**Testing:**
- [ ] Tests cover new functionality
- [ ] Tests cover edge cases
- [ ] Coverage meets 80% threshold
- [ ] Tests are clear and maintainable

**Performance:**
- [ ] No obvious performance issues
- [ ] Efficient algorithms used
- [ ] No memory leaks
- [ ] Appropriate data structures

**Security:**
- [ ] Input validation present
- [ ] No SQL injection risks
- [ ] No XSS vulnerabilities
- [ ] Secrets not hardcoded
- [ ] Dependencies are secure

**Documentation:**
- [ ] Code comments where needed
- [ ] API documentation updated
- [ ] README updated if needed
- [ ] Architecture docs updated

#### Review Guidelines

**Be Constructive:**
- ✅ "Consider using a HashMap here for O(1) lookups instead of O(n) iteration"
- ❌ "This code is slow and bad"

**Be Specific:**
- ✅ "Line 42: This function should return an error instead of panicking"
- ❌ "Error handling is wrong"

**Ask Questions:**
- ✅ "Could you explain why you chose this approach over X?"
- ❌ "This makes no sense"

**Approve When:**
- Code meets all checklist items
- Or minor issues that can be fixed in follow-up

**Request Changes When:**
- Critical bugs present
- Security vulnerabilities
- Test coverage insufficient
- Major architectural concerns

### For PR Authors

**Responding to Feedback:**
1. Thank reviewers for their time
2. Address each comment
3. Ask for clarification if needed
4. Push fixes and respond to comments
5. Re-request review when ready

**Don't:**
- Get defensive
- Ignore feedback
- Mark conversations as resolved without addressing them
- Merge without approval

---

## Git Conventions

### Branch Naming

```
<type>/<description>

Types:
  feature/   - New features
  bugfix/    - Bug fixes
  hotfix/    - Critical production fixes
  refactor/  - Code refactoring
  docs/      - Documentation updates
  test/      - Test improvements

Examples:
  feature/webgl-scatter-plot
  bugfix/memory-leak-in-loader
  hotfix/security-jwt-validation
  refactor/arrow-pipeline-cleanup
  docs/api-documentation-update
  test/e2e-accessibility-suite
```

### Commit Messages

**Format:** `<type>(<scope>): <description>`

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting, no functional change)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes

**Scopes (optional):**
- `viz`: Visualization engine
- `data`: Data pipeline
- `api`: Backend API
- `db`: Database
- `auth`: Authentication
- `ui`: User interface

**Examples:**
```bash
feat(viz): add scatter plot rendering with instanced drawing
fix(api): resolve race condition in concurrent updates
docs(readme): update installation instructions
test(e2e): add accessibility tests for dashboard
perf(data): optimize aggregation for large datasets
chore(deps): update dependencies to latest versions
```

**Rules:**
- Use imperative mood ("add" not "added" or "adds")
- No period at the end
- Keep first line under 72 characters
- Add detailed description in body if needed

---

## Testing Standards

### Test Structure (AAA Pattern)

```typescript
test('should do something', () => {
  // Arrange - Set up test data and conditions
  const input = createTestData();
  const expected = computeExpected(input);
  
  // Act - Execute the code under test
  const actual = functionUnderTest(input);
  
  // Assert - Verify the results
  expect(actual).toEqual(expected);
});
```

### Test Naming Conventions

**Backend (Rust):**
```rust
#[test]
fn test_<function_name>_<scenario>_<expected_result>() {
    // Examples:
    // test_parse_csv_valid_input_returns_table()
    // test_filter_empty_dataset_returns_empty()
    // test_authenticate_invalid_token_returns_error()
}
```

**Frontend (TypeScript):**
```typescript
describe('ComponentName', () => {
  it('should <expected behavior>', () => {
    // Examples:
    // should render correctly with valid props
    // should handle empty data gracefully
    // should call onUpdate when data changes
  });
});
```

### Test Coverage Guidelines

**Priority Levels:**
1. **Critical (95%+ coverage required):**
   - Authentication/authorization
   - Data validation
   - Security functions
   - Financial calculations (if any)

2. **High (85%+ coverage):**
   - Business logic
   - Data transformations
   - API endpoints

3. **Medium (75%+ coverage):**
   - UI components
   - Utility functions
   - Configuration

4. **Low (60%+ coverage):**
   - Simple getters/setters
   - Trivial functions

### What to Test

**Backend:**
- ✅ Model serialization/deserialization
- ✅ API endpoint responses
- ✅ Database operations
- ✅ Authentication/authorization logic
- ✅ Input validation
- ✅ Error handling
- ✅ Business logic

**Frontend:**
- ✅ Component rendering
- ✅ User interactions
- ✅ State management
- ✅ API calls (mocked)
- ✅ Error states
- ✅ Edge cases (empty, null, large data)
- ✅ Accessibility

**E2E:**
- ✅ Critical user workflows
- ✅ Authentication flows
- ✅ Data CRUD operations
- ✅ Cross-browser compatibility
- ✅ Responsive design
- ✅ Accessibility (WCAG 2.1 AA)

### What NOT to Test

- ❌ Third-party library internals
- ❌ Trivial getters/setters (unless critical)
- ❌ Auto-generated code
- ❌ Configuration files
- ❌ Constants

---

## Common Tasks

### Add New Backend Endpoint

```bash
# 1. Define route in src/api/mod.rs or specific module
# 2. Implement handler function
# 3. Add models if needed (src/models/)
# 4. Add database queries if needed
# 5. Write unit tests
# 6. Write integration tests
# 7. Update API documentation
# 8. Test manually with curl or Postman

# Example:
cd backend
# Edit src/api/datasets.rs
# Add tests in tests/integration/dataset_api_tests.rs
cargo test
cargo run

# Test endpoint
curl http://localhost:8080/api/datasets
```

### Add New Frontend Component

```bash
# 1. Create component file (src/components/NewComponent.tsx)
# 2. Create test file (src/components/NewComponent.test.tsx)
# 3. Write tests first (TDD)
# 4. Implement component
# 5. Add Storybook story if applicable
# 6. Update parent components
# 7. Test in browser

cd frontend
touch src/components/DataTable.tsx
touch src/components/DataTable.test.tsx
npm test  # Write tests, implement, verify
npm run dev  # Test in browser
```

### Add Database Migration

```bash
# Backend uses SeaORM migrations (or similar)
cd backend

# Create migration
sea-orm-cli migrate generate create_users_table

# Edit migration file in migrations/
# Write up() and down() functions

# Run migration
sea-orm-cli migrate up

# Test migration
cargo test

# Rollback if needed
sea-orm-cli migrate down
```

### Update Dependencies

```bash
# Backend
cd backend
cargo update              # Update Cargo.lock
cargo audit               # Check for vulnerabilities
cargo test                # Verify tests pass

# Frontend
cd frontend
npm update                # Update package-lock.json
npm audit fix             # Fix vulnerabilities
npm test -- --run         # Verify tests pass

# Commit lock files
git add Cargo.lock package-lock.json
git commit -m "chore(deps): update dependencies"
```

---

## Troubleshooting

### Docker Issues

**Problem:** "Port already in use"
```bash
# Find process using port
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :9000  # MinIO

# Kill process or stop conflicting service
kill -9 <PID>

# Or use different ports in docker-compose.yml
```

**Problem:** "Container unhealthy"
```bash
# Check logs
docker-compose logs postgres
docker-compose logs redis
docker-compose logs minio

# Restart service
docker-compose restart postgres

# Nuclear option: fresh start
docker-compose down -v
docker-compose up -d
```

### Backend Issues

**Problem:** "Tests failing with database errors"
```bash
# Ensure test database is running
docker-compose ps postgres

# Check connection string in .env.test
cat backend/.env.test

# Reset test database
# Drop and recreate database
docker-compose exec postgres psql -U postgres -c "DROP DATABASE pilotba_test;"
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE pilotba_test;"

# Run migrations
cd backend && cargo run --bin migrate
```

**Problem:** "Cargo build fails"
```bash
# Clear cache and rebuild
cargo clean
cargo build

# Update toolchain
rustup update

# Check for conflicting dependencies
cargo tree
```

### Frontend Issues

**Problem:** "npm install fails"
```bash
# Clear cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Use legacy peer deps if needed
npm install --legacy-peer-deps
```

**Problem:** "Vite dev server fails to start"
```bash
# Check port availability
lsof -i :3000

# Clear Vite cache
rm -rf frontend/node_modules/.vite
npm run dev
```

**Problem:** "Tests failing with 'module not found'"
```bash
# Check import paths
# Verify file exists
# Check tsconfig.json path mappings
# Restart test process
```

### E2E Test Issues

**Problem:** "Playwright tests timing out"
```bash
# Ensure both frontend and backend are running
# Check URLs in playwright.config.ts
# Increase timeout if needed
npx playwright test --timeout=60000

# Run in debug mode
npx playwright test --debug
```

**Problem:** "Playwright browsers not installed"
```bash
npx playwright install
npx playwright install-deps
```

### Git Issues

**Problem:** "Merge conflicts"
```bash
# Update your branch with latest develop
git checkout develop
git pull origin develop
git checkout your-branch
git merge develop

# Resolve conflicts in editor
# Mark as resolved
git add .
git commit -m "chore: resolve merge conflicts"
```

**Problem:** "Accidentally committed to wrong branch"
```bash
# If not pushed yet
git reset HEAD~1  # Undo last commit, keep changes
git stash         # Stash changes
git checkout correct-branch
git stash pop     # Apply changes
git add .
git commit -m "your message"
```

---

## Quick Reference

### Most Used Commands

```bash
# Setup
make install
make docker-up
make dev-backend
make dev-frontend

# Testing
./scripts/run-all-tests.sh
cargo test
npm test
npx playwright test

# Code Quality
cargo fmt && cargo clippy
npm run lint && npm run type-check

# Docker
docker-compose up -d
docker-compose down
docker-compose logs -f
docker-compose ps

# Git
git checkout develop
git pull origin develop
git checkout -b feature/name
git add .
git commit -m "type(scope): description"
git push origin feature/name
```

### Keyboard Shortcuts (VS Code)

```
Cmd/Ctrl + P        - Quick file open
Cmd/Ctrl + Shift + P - Command palette
Cmd/Ctrl + Shift + F - Search across files
Cmd/Ctrl + B        - Toggle sidebar
Cmd/Ctrl + `        - Toggle terminal
Cmd/Ctrl + Shift + M - View problems
Cmd/Ctrl + Shift + E - Explorer
F5                  - Start debugging
Shift + F5          - Stop debugging
```

---

## Getting Help

1. **Check documentation first:**
   - PROJECT_ARCHITECTURE.md
   - docs/TESTING.md
   - tests/README.md

2. **Search for similar issues:**
   - GitHub issues
   - Stack Overflow
   - Rust/React/Playwright docs

3. **Ask the team:**
   - Project Architect for architectural decisions
   - Testing Agent for test-related questions
   - Development Agent for implementation questions

4. **Create a detailed issue:**
   - What you're trying to do
   - What you've tried
   - Error messages/logs
   - Environment details

---

**Document Owner:** Project Architect  
**Review Schedule:** Monthly  
**Last Review:** December 16, 2025  
**Next Review:** January 16, 2026

