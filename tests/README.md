# Test Infrastructure for PilotBA

## Quick Start

```bash
# Run all tests
./scripts/run-all-tests.sh

# Backend tests only
cd backend && cargo test

# Frontend tests only
cd frontend && npm test

# E2E tests
npx playwright test
```

## Directory Structure

```
PilotBA/
├── backend/
│   ├── tests/
│   │   ├── common/           # Shared test utilities
│   │   │   ├── mod.rs        # Test helpers
│   │   │   └── fixtures.rs   # Test data generators
│   │   ├── integration/      # Integration tests
│   │   │   ├── api_tests.rs
│   │   │   └── mod.rs
│   │   └── unit/             # Unit tests
│   │       ├── models_tests.rs
│   │       └── mod.rs
│   └── benches/              # Performance benchmarks
│       └── query_benchmarks.rs
│
├── frontend/
│   └── src/
│       ├── test/
│       │   ├── setup.ts      # Test configuration
│       │   ├── mocks/        # MSW handlers
│       │   │   ├── handlers.ts
│       │   │   ├── server.ts
│       │   │   └── mockData.ts
│       │   ├── utils/        # Test utilities
│       │   │   └── test-utils.tsx
│       │   └── integration/  # Integration tests
│       │       └── api.test.ts
│       ├── **/*.test.tsx     # Component tests
│       └── **/*.spec.ts      # Unit tests
│
├── e2e/                      # End-to-end tests
│   ├── example.spec.ts
│   ├── api-health.spec.ts
│   └── accessibility.spec.ts
│
├── scripts/                  # Test automation scripts
│   ├── run-all-tests.sh
│   ├── performance-test.sh
│   └── security-scan.sh
│
└── docs/                     # Testing documentation
    ├── TESTING.md
    └── TESTING_STRATEGY.md
```

## Test Types

### Unit Tests

**Purpose**: Test individual functions/components in isolation

**When to write**:
- New function/component created
- Bug fix implemented
- Edge case discovered

**Example locations**:
- Backend: `backend/tests/unit/` or inline with `#[cfg(test)]`
- Frontend: `src/**/*.test.tsx`

### Integration Tests

**Purpose**: Test interactions between components

**When to write**:
- API endpoint created
- Database operation added
- Service integration implemented

**Example locations**:
- Backend: `backend/tests/integration/`
- Frontend: `src/test/integration/`

### E2E Tests

**Purpose**: Test complete user workflows

**When to write**:
- New user feature added
- Critical path modified
- Cross-browser issue found

**Location**: `e2e/`

## Running Tests

### Quick Commands

```bash
# Everything
npm run test:all                    # or ./scripts/run-all-tests.sh

# Backend
cargo test                          # All tests
cargo test --lib                    # Unit tests only
cargo test --test integration       # Integration tests only
cargo test test_name                # Specific test
cargo test -- --nocapture           # Show output

# Frontend
npm test                            # All tests (watch mode)
npm test -- --run                   # Run once
npm run test:coverage               # With coverage
npm test -- Button                  # Tests matching "Button"
npm run test:ui                     # Interactive UI

# E2E
npx playwright test                 # All browsers
npx playwright test --project=chromium  # Chrome only
npx playwright test --ui            # Interactive mode
npx playwright test --debug         # Debug mode
npx playwright show-report          # View last report

# Performance
cargo bench                         # Backend benchmarks
./scripts/performance-test.sh       # Full performance suite

# Security
./scripts/security-scan.sh          # Security audit
```

### Watch Mode

```bash
# Backend (requires cargo-watch)
cargo install cargo-watch
cargo watch -x test

# Frontend (built-in)
npm test                            # Automatically watches
```

## Writing Tests

### Backend Test Template

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_function_name() {
        // Arrange
        let input = create_test_input();

        // Act
        let result = function_under_test(input);

        // Assert
        assert_eq!(result, expected_value);
    }

    #[tokio::test]
    async fn test_async_function() {
        // Arrange
        let input = create_test_input();

        // Act
        let result = async_function(input).await;

        // Assert
        assert!(result.is_ok());
    }
}
```

### Frontend Test Template

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@/test/utils/test-utils'
import { MyComponent } from './MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    // Arrange
    const props = { title: 'Test' }

    // Act
    render(<MyComponent {...props} />)

    // Assert
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('handles user interaction', async () => {
    // Arrange
    const handleClick = vi.fn()
    render(<MyComponent onClick={handleClick} />)

    // Act
    await fireEvent.click(screen.getByRole('button'))

    // Assert
    expect(handleClick).toHaveBeenCalledOnce()
  })
})
```

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test('user can complete workflow', async ({ page }) => {
    // Navigate
    await page.goto('/feature')

    // Interact
    await page.fill('input[name="field"]', 'value')
    await page.click('button:has-text("Submit")')

    // Assert
    await expect(page.locator('text=Success')).toBeVisible()
  })
})
```

## Test Best Practices

### ✅ DO

- Write tests before or alongside code (TDD)
- Use descriptive test names
- Follow Arrange-Act-Assert pattern
- Test behavior, not implementation
- Keep tests isolated and independent
- Use test utilities and helpers
- Mock external dependencies
- Clean up after tests

### ❌ DON'T

- Skip writing tests
- Test implementation details
- Use hard-coded timing (sleep)
- Share state between tests
- Write flaky tests
- Duplicate test logic
- Ignore failing tests

## Debugging Tests

### Backend

```bash
# Show test output
cargo test -- --nocapture

# Run specific test
cargo test test_name

# Show backtraces
RUST_BACKTRACE=1 cargo test

# Use debugger
rust-lldb target/debug/deps/test_binary
```

### Frontend

```typescript
// Debug single test
test.only('debug this test', () => {
  // Test code
})

// Print debug info
import { debug } from '@testing-library/react'
render(<Component />)
debug() // Prints DOM

// Use debugger
test('debug test', () => {
  debugger // Browser debugger will pause here
})
```

### E2E

```bash
# Run with headed browser
npx playwright test --headed

# Debug mode (step through)
npx playwright test --debug

# Specific test
npx playwright test example.spec.ts --debug

# View trace
npx playwright show-trace trace.zip

# Screenshots on failure (automatic)
```

## CI/CD Integration

Tests run automatically on:

- **Every push**: Fast feedback (lint + unit tests)
- **Pull requests**: Full test suite
- **Main branch**: Full suite + deployment
- **Scheduled**: Weekly security scans

### GitHub Actions

See `.github/workflows/`:
- `test.yml` - Main test workflow
- `performance.yml` - Performance testing
- `codeql.yml` - Security analysis

## Coverage Reports

### Backend

```bash
# Install tarpaulin
cargo install cargo-tarpaulin

# Generate coverage
cargo tarpaulin --out Html

# View report
open tarpaulin-report.html
```

### Frontend

```bash
# Generate coverage
npm run test:coverage

# View report
open coverage/lcov-report/index.html
```

### Coverage Goals

- **Overall**: 80%+
- **Critical paths**: 90%+
- **Utilities**: 85%+
- **UI components**: 75%+

## Performance Benchmarks

### Backend Benchmarks

```bash
# Run all benchmarks
cargo bench

# View results
open target/criterion/report/index.html

# Specific benchmark
cargo bench --bench query_benchmarks
```

### Frontend Performance

```bash
# Bundle analysis
npm run build
du -sh dist/*

# Lighthouse
lighthouse http://localhost:3000
```

## Security Testing

```bash
# Full security scan
./scripts/security-scan.sh

# Quick checks
cargo audit               # Backend dependencies
npm audit                # Frontend dependencies
```

## Test Data

### Fixtures

Located in:
- Backend: `backend/tests/common/fixtures.rs`
- Frontend: `frontend/src/test/mocks/mockData.ts`

### Factories

```rust
// Backend
use crate::tests::common::fixtures::create_test_user;
let user = create_test_user();
```

```typescript
// Frontend
import { mockUser } from '@/test/mocks/mockData'
const user = mockUser
```

## Troubleshooting

### Common Issues

**Issue**: Tests fail locally but pass in CI
- **Solution**: Ensure clean state, check environment variables

**Issue**: Flaky E2E tests
- **Solution**: Add proper waits, check for race conditions

**Issue**: Slow tests
- **Solution**: Use test doubles, optimize setup/teardown

**Issue**: Database connection errors
- **Solution**: Start test database with docker-compose

### Getting Help

1. Check error messages carefully
2. Run with verbose output
3. Review test documentation
4. Ask team for help
5. Check CI logs

## Contributing

When adding new tests:

1. Follow existing patterns
2. Update documentation if needed
3. Ensure tests pass locally
4. Keep tests fast and reliable
5. Review test coverage

## Resources

- [Full Testing Guide](../docs/TESTING.md)
- [Testing Strategy](../docs/TESTING_STRATEGY.md)
- [Rust Testing Book](https://doc.rust-lang.org/book/ch11-00-testing.html)
- [Vitest Docs](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)

---

**Questions?** Open an issue or contact the QA team.

