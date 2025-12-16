# PilotBA - Team Onboarding Guide

**Welcome to PilotBA!** 🎉

This guide will help you get started quickly based on your role.

---

## 🎭 Choose Your Role

- **[Project Architect](#project-architect-onboarding)** - Overall oversight, architecture, DevOps
- **[Handyman (Lead Dev)](#handyman-lead-dev-onboarding)** - Feature implementation, bug fixes
- **Toaster (Senior QA)](#toaster-senior-qa-onboarding)** - Testing, quality assurance

---

## Project Architect Onboarding

### Your Mission
Oversee the project, make architectural decisions, manage risks, coordinate between Handyman and Toaster, handle DevOps.

### Day 1: Get Oriented

**Read these documents (in order):**
1. [README.md](README.md) - Project overview
2. [PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md) - Complete architecture
3. [RISKS_AND_ISSUES.md](RISKS_AND_ISSUES.md) - Current risks
4. [EXECUTIVE_SUMMARY.md](EXECUTIVE_SUMMARY.md) - Stakeholder view

**Time:** ~2 hours

### Day 2: Setup Your Environment

```bash
# Clone repo
git clone <repo-url>
cd PilotBA

# Install dependencies
make install

# Start services
make docker-up

# Verify everything works
docker-compose ps  # All services healthy?
```

### Day 3: Understand the Workflow

**Read:**
- [WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md) - Development workflow
- [.github/GITHUB_WORKFLOW.md](.github/GITHUB_WORKFLOW.md) - GitHub coordination

**Setup GitHub:**
- Configure labels from [.github/LABELS.md](.github/LABELS.md)
- Create Project Board with columns: Backlog, Todo, In Progress, Review, Testing, Done
- Create Milestone for Phase 2

### Day 4: Review Current State

**Check:**
- Open issues (triage and prioritize)
- Open PRs (review any pending)
- CI/CD pipelines (all passing?)
- Risk register (anything new?)

**Update:**
- [RISKS_AND_ISSUES.md](RISKS_AND_ISSUES.md) with current status
- Create first Weekly Sync issue

### Your Daily Routine

**Morning (15 min):**
- Check GitHub notifications
- Review new issues/PRs
- Update risk register if needed

**During Day:**
- Review PRs from Handyman/Toaster
- Make architectural decisions on ADRs
- Triage new issues
- Update documentation

**End of Day (10 min):**
- Quick status check on Phase 2 progress
- Comment on any blockers
- Plan tomorrow's reviews

### Key Responsibilities

- ✅ Review and approve ALL PRs before merge
- ✅ Make architectural decisions (respond to ADR issues)
- ✅ Weekly risk review
- ✅ Weekly sync issue creation
- ✅ Documentation updates
- ✅ DevOps and infrastructure oversight

### Your Toolkit

**Essential Docs:**
- PROJECT_ARCHITECTURE.md (your north star)
- RISKS_AND_ISSUES.md (your radar)
- WORKFLOW_GUIDE.md (your playbook)

**GitHub Searches:**
```
# PRs needing your review
is:pr is:open review-requested:@me

# ADRs pending decision
is:issue is:open label:architecture

# Blocked issues
is:issue is:open label:"status: blocked"

# Current phase progress
milestone:"Phase 2: Core Features"
```

---

## Handyman (Lead Dev) Onboarding

### Your Mission
Implement features, fix bugs, write unit & integration tests, get code reviewed and merged.

### Day 1: Get Oriented

**Read these documents:**
1. [README.md](README.md) - Project overview
2. [WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md) - Especially "Development Agent Workflow"
3. [docs/design/01-webgl-rendering-engine.md](docs/design/01-webgl-rendering-engine.md) - WebGL design
4. [docs/design/02-data-processing-pipeline.md](docs/design/02-data-processing-pipeline.md) - Data pipeline design

**Time:** ~2 hours

### Day 2: Setup Development Environment

```bash
# Clone repo
git clone <repo-url>
cd PilotBA

# Install dependencies
make install

# Start services
make docker-up

# Start backend (Terminal 1)
make dev-backend

# Start frontend (Terminal 2)
make dev-frontend

# Visit http://localhost:3000 - it works!
```

**Setup your IDE:**
- Install recommended VS Code extensions (see `.vscode/extensions.json`)
- Configure format-on-save
- Setup Rust-analyzer and ESLint

### Day 3: Run the Test Suite

```bash
# Backend tests
cd backend
cargo test        # All tests
cargo test --lib  # Unit tests only
cargo bench       # Benchmarks

# Frontend tests
cd frontend
npm test         # Interactive mode
npm run test:coverage  # With coverage
npm run test:ui  # Visual UI

# E2E tests (both services must be running)
npx playwright test
npx playwright test --ui  # Interactive

# All tests
./scripts/run-all-tests.sh
```

**Goal:** Get familiar with test structure and coverage.

### Day 4: Pick Your First Issue

**Find beginner-friendly work:**
```
# On GitHub
is:issue is:open label:handyman label:"good first issue"
# Or
is:issue is:open label:handyman label:"priority: medium" milestone:"Phase 2"
```

**Self-assign:**
- Comment: "Picking this up. ETA: [your estimate]"
- Change label to `status: in-progress`

**Read the issue carefully:**
- Acceptance criteria
- Technical requirements
- Related design docs
- Test requirements

### Your Daily Routine

**Morning (10 min):**
- Check assigned issues
- Check PR review feedback
- Plan the day's work

**During Day:**
1. Write tests first (TDD)
2. Implement feature
3. Run tests
4. Fix issues
5. Commit with good messages
6. Update issue with progress

**Before Creating PR:**
```bash
# Backend
cd backend
cargo fmt --check
cargo clippy -- -D warnings
cargo test
cargo audit

# Frontend
cd frontend
npm run type-check
npm run lint
npm test -- --run
npm audit

# All tests
cd .. && ./scripts/run-all-tests.sh
```

**Create PR:**
- Use PR template
- Fill out ALL sections
- Link issue: "Fixes #123"
- Request review from Architect
- Tag Toaster when ready for E2E

### Your Workflow

```
1. Pick issue (label: handyman, status: todo)
   ↓
2. Create feature branch: feature/name
   ↓
3. Write tests (TDD)
   ↓
4. Implement feature
   ↓
5. Run all tests + linting
   ↓
6. Commit (conventional commits)
   ↓
7. Push and create PR
   ↓
8. Address review feedback
   ↓
9. Handoff to Toaster for E2E
   ↓
10. PR merged by Architect
```

### Key Responsibilities

- ✅ Implement features from issues labeled `handyman`
- ✅ Fix bugs labeled `handyman`
- ✅ Write unit & integration tests (80%+ coverage)
- ✅ Follow code quality standards
- ✅ Update documentation
- ✅ Respond to PR feedback
- ✅ Handoff to Toaster when ready for E2E testing

### Your Toolkit

**Essential Docs:**
- WORKFLOW_GUIDE.md → Development Agent Workflow
- docs/design/*.md (design documents)
- docs/adr/*.md (architectural decisions)
- docs/TESTING.md (testing guide)

**GitHub Searches:**
```
# My assigned work
is:issue assignee:@me is:open label:handyman

# My open PRs
is:pr author:@me is:open

# High priority bugs
is:issue is:open label:bug label:"priority: high"
```

**VS Code Shortcuts:**
- `Cmd/Ctrl + P` - Quick file open
- `Cmd/Ctrl + Shift + F` - Search project
- `F5` - Start debugging
- `Cmd/Ctrl + `` - Toggle terminal

---

## Toaster (Senior QA) Onboarding

### Your Mission
Write E2E tests, validate quality, maintain CI/CD, ensure no regressions.

### Day 1: Get Oriented

**Read these documents:**
1. [README.md](README.md) - Project overview
2. [WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md) - Especially "Testing Agent Workflow"
3. [docs/TESTING.md](docs/TESTING.md) - Complete testing guide
4. [docs/TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md) - Testing philosophy
5. [TEST_INFRASTRUCTURE_OVERVIEW.md](TEST_INFRASTRUCTURE_OVERVIEW.md) - What's been built

**Time:** ~2 hours

### Day 2: Setup Testing Environment

```bash
# Clone repo
git clone <repo-url>
cd PilotBA

# Install dependencies
make install

# Start services (needed for E2E)
make docker-up
make dev-backend   # Terminal 1
make dev-frontend  # Terminal 2

# Install Playwright browsers
npx playwright install
npx playwright install-deps
```

**Verify tests work:**
```bash
# Run existing E2E tests
npx playwright test

# Run in UI mode (great for developing tests)
npx playwright test --ui

# Run in debug mode
npx playwright test --debug
```

### Day 3: Explore Test Structure

**Study existing tests:**
```
e2e/
├── example.spec.ts           # Basic E2E examples
├── api-health.spec.ts        # API health checks
└── accessibility.spec.ts     # A11y tests

frontend/src/test/
├── setup.ts                  # Test configuration
├── mocks/                    # MSW mocks
├── utils/                    # Test utilities
└── integration/              # Integration tests

backend/tests/
├── common/                   # Test utilities
├── unit/                     # Unit tests
└── integration/              # Integration tests
```

**Run and read tests:**
```bash
# Backend
cd backend && cargo test -- --nocapture

# Frontend
cd frontend && npm test

# E2E
npx playwright test --headed  # Watch them run!
```

### Day 4: Write Your First Test

**Find test task:**
```
# On GitHub
is:issue is:open label:toaster label:"good first issue"
```

**Or create test for recent feature:**
- Look for recently merged PRs
- Check if E2E test exists
- Create test task if needed

**Write test using this pattern:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Arrange - Setup
    await page.goto('http://localhost:3000');
    
    // Act - Interact
    await page.click('button[data-testid="submit"]');
    
    // Assert - Verify
    await expect(page.locator('.result')).toHaveText('Success');
  });
});
```

### Your Daily Routine

**Morning (15 min):**
- Check assigned test tasks
- Check PRs needing test review
- Check CI/CD status

**During Day:**
1. Write E2E tests for features
2. Review Handyman PRs for test coverage
3. Run tests and check for flakiness
4. Report bugs found as issues
5. Maintain CI/CD pipelines

**Test Development Cycle:**
```
1. Pick test task or review PR
   ↓
2. Understand feature/scenario
   ↓
3. Write test scenarios
   ↓
4. Implement tests (Playwright)
   ↓
5. Run 10+ times to check flakiness
   ↓
6. Add to CI/CD
   ↓
7. Document test
   ↓
8. Create PR or approve Handyman's PR
```

### Key Responsibilities

- ✅ Write E2E tests for all features
- ✅ Review PRs for test coverage
- ✅ Maintain CI/CD pipelines
- ✅ Run performance tests
- ✅ Run security scans
- ✅ Report bugs as issues
- ✅ Ensure tests are stable (not flaky)
- ✅ Update test documentation

### Your Toolkit

**Essential Docs:**
- docs/TESTING.md (your bible)
- docs/TESTING_STRATEGY.md (your philosophy)
- WORKFLOW_GUIDE.md → Testing Agent Workflow
- tests/README.md (quick reference)

**Testing Tools:**
- Playwright (E2E)
- Vitest (Frontend unit)
- Cargo test (Backend unit)
- k6 (Load testing)
- Lighthouse (Performance)
- Axe (Accessibility)

**GitHub Searches:**
```
# My test tasks
is:issue assignee:@me is:open label:toaster

# PRs needing test review
is:pr is:open label:handyman -label:tested

# Bugs to verify
is:issue is:open label:bug label:"status: testing"
```

**Playwright Commands:**
```bash
# Run tests
npx playwright test                  # All tests
npx playwright test --ui             # Interactive UI
npx playwright test --debug          # Debug mode
npx playwright test --project=chromium  # Specific browser
npx playwright test example.spec.ts  # Specific file

# Generate tests
npx playwright codegen http://localhost:3000

# View reports
npx playwright show-report
```

---

## Common Setup Issues

### Docker services won't start

```bash
# Check what's using the ports
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :9000  # MinIO

# Stop conflicting services or use docker-compose restart
docker-compose down -v
docker-compose up -d
```

### Backend compilation fails

```bash
# Clear cache and rebuild
cd backend
cargo clean
cargo build

# Update Rust
rustup update
```

### Frontend build fails

```bash
# Clear cache
cd frontend
rm -rf node_modules package-lock.json
npm install

# Or use
npm cache clean --force
npm install
```

### Playwright browsers missing

```bash
npx playwright install
npx playwright install-deps
```

---

## Getting Help

### Documentation
1. **Start here:** README.md
2. **Your role:** WORKFLOW_GUIDE.md (find your section)
3. **Testing:** docs/TESTING.md
4. **Architecture:** PROJECT_ARCHITECTURE.md

### GitHub Issues
- Create issue if stuck
- Tag `@architect` for questions
- Use `question` label

### Team Communication
- Comment on issues/PRs
- Use Weekly Sync issue
- Tag relevant people

---

## First Week Goals

### All Roles
- [ ] Environment setup complete
- [ ] All tests running locally
- [ ] Documentation read
- [ ] First contribution made
- [ ] Comfortable with workflow

### Architect
- [ ] Reviewed all existing issues/PRs
- [ ] Risk register up-to-date
- [ ] Project board configured
- [ ] First Weekly Sync created
- [ ] First ADR reviewed

### Handyman
- [ ] First feature implemented
- [ ] First PR created and merged
- [ ] Tests passing
- [ ] Code reviewed
- [ ] Comfortable with tech stack

### Toaster
- [ ] First E2E test written
- [ ] First PR test-reviewed
- [ ] CI/CD understood
- [ ] All test types run successfully
- [ ] Bug reported

---

## Success Checklist (30 Days)

### Week 1: Setup & Orientation
- [ ] Environment working
- [ ] Documentation read
- [ ] First contribution

### Week 2: First Real Work
- [ ] Multiple contributions
- [ ] Comfortable with workflow
- [ ] Participated in reviews

### Week 3: Productive
- [ ] Working independently
- [ ] High quality output
- [ ] Helping improve processes

### Week 4: Team Member
- [ ] Fully integrated
- [ ] Contributing to architecture/strategy
- [ ] Mentoring others (if applicable)

---

**Welcome aboard! Let's build something amazing! 🚀**

**Questions?** Create an issue or check the docs!

**Maintained by:** Project Architect  
**Last Updated:** December 16, 2025

