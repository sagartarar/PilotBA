# Pull Request

## Description

**Brief summary:**
[One-sentence summary of what this PR does]

**Type of change:**
- [ ] 🚀 New feature (Handyman)
- [ ] 🐛 Bug fix (Handyman)
- [ ] 🧪 Test implementation (Toaster)
- [ ] 📚 Documentation update (Architect/Handyman/Toaster)
- [ ] 🔧 Refactoring (no functional changes)
- [ ] ⚡ Performance improvement
- [ ] 🔒 Security fix
- [ ] 🏗️ Infrastructure/DevOps (Architect)

**Related issues:**
- Fixes #[issue number]
- Implements #[issue number]
- Related to #[issue number]

---

## Changes Made

### Frontend
- [ ] Component changes: [list]
- [ ] State management: [changes]
- [ ] Styling: [changes]
- [ ] API integration: [changes]

### Backend
- [ ] API endpoints: [new/modified]
- [ ] Database models: [new/modified]
- [ ] Business logic: [changes]
- [ ] Auth changes: [if applicable]

### Tests
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Performance tests added/updated

### Documentation
- [ ] API docs updated
- [ ] README updated
- [ ] Architecture docs updated
- [ ] Code comments added

---

## Testing Checklist

### By Handyman (Lead Dev)
- [ ] Code runs locally without errors
- [ ] Unit tests pass: `cargo test` / `npm test`
- [ ] Integration tests pass
- [ ] Linting passes: `cargo clippy` / `npm run lint`
- [ ] Formatting checked: `cargo fmt --check` / `npm run type-check`
- [ ] No new warnings introduced
- [ ] Manual testing completed

### By Toaster (Senior QA)
- [ ] E2E tests pass (if applicable)
- [ ] Cross-browser tested (if frontend)
- [ ] Accessibility tested (if UI changes)
- [ ] Performance targets met
- [ ] No regression in existing functionality
- [ ] Test coverage maintained (80%+)

### By Architect
- [ ] Architecture alignment verified
- [ ] Security implications reviewed
- [ ] Performance impact assessed
- [ ] Documentation completeness checked

---

## Code Quality

**Test Coverage:**
- Before: [%]
- After: [%]
- Change: [+/- %]

**Performance Impact:**
| Metric | Before | After | Change |
|--------|--------|-------|--------|
| [metric] | [value] | [value] | [+/- %] |

**Bundle Size Impact (if frontend):**
- Before: [KB]
- After: [KB]
- Change: [+/- KB]

**Linting:**
- [ ] No linting errors
- [ ] No linting warnings
- [ ] Code formatted consistently

---

## Security Checklist

- [ ] No secrets/credentials in code
- [ ] Input validation implemented
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (output encoding)
- [ ] CSRF protection (if applicable)
- [ ] Authentication/authorization checked
- [ ] Dependencies scanned: `cargo audit` / `npm audit`
- [ ] Security tests pass

---

## Performance Checklist (if applicable)

- [ ] Performance benchmarks run
- [ ] No memory leaks detected
- [ ] Profiling completed
- [ ] Performance targets met:
  - [ ] API response < 500ms (p95)
  - [ ] FPS 60+ (if visualization)
  - [ ] Load time < 200ms (if data loading)

---

## Breaking Changes

- [ ] This PR contains breaking changes
- [ ] Migration guide provided
- [ ] Backward compatibility maintained
- [ ] Version bump planned

**If breaking changes:**
[Describe the breaking changes and migration path]

---

## Screenshots/Videos (if applicable)

**Before:**
[Screenshots/video of before state]

**After:**
[Screenshots/video of after state]

---

## Deployment Notes

**Requires:**
- [ ] Database migration
- [ ] Environment variable changes
- [ ] Infrastructure changes
- [ ] Cache clearing
- [ ] Service restart

**Deployment order:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Rollback plan:**
[How to rollback if this deployment causes issues]

---

## Agent Handoff

### Handyman → Toaster
- [ ] Feature complete and tested locally
- [ ] Unit tests passing (80%+ coverage)
- [ ] Integration tests passing
- [ ] Ready for E2E testing
- [ ] Known issues documented: [list any]

### Toaster → Architect
- [ ] All tests passing
- [ ] E2E tests added/updated
- [ ] Performance validated
- [ ] Security validated
- [ ] Ready for final review

### Architect → Merge
- [ ] Architecture approved
- [ ] Documentation approved
- [ ] Risk assessment complete
- [ ] Approved for merge

---

## Checklist Before Requesting Review

### For Handyman
- [ ] Self-reviewed code
- [ ] Followed coding standards
- [ ] Added/updated tests
- [ ] Updated documentation
- [ ] No console.log / debug code left
- [ ] Commit messages follow convention
- [ ] Branch up-to-date with develop

### For Toaster
- [ ] Test strategy documented
- [ ] All test scenarios covered
- [ ] Tests are stable (not flaky)
- [ ] Coverage target met
- [ ] Test documentation complete

### For All
- [ ] PR title is clear and descriptive
- [ ] PR description is complete
- [ ] All checklist items addressed
- [ ] Labels applied correctly
- [ ] Related issues linked

---

## Review Notes

**Special considerations:**
[Anything reviewers should pay special attention to]

**Areas of concern:**
[Any areas you're uncertain about]

**Questions for reviewers:**
1. [Question 1]
2. [Question 2]

---

## Post-Merge Tasks

- [ ] Update related issues
- [ ] Update project board
- [ ] Notify stakeholders (if needed)
- [ ] Monitor metrics post-deployment
- [ ] Create follow-up issues (if needed)

---

**Labels:** `[feature|bug|test|docs|refactor]`, `[handyman|toaster|architect]`, `[frontend|backend|infra]`, `[priority: high|medium|low]`

**Reviewers:**
- Primary: [Architect]
- Secondary: [Handyman/Toaster]

**Phase:** [1|2|3|4|5|6]

