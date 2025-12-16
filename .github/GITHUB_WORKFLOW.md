# GitHub Workflow for PilotBA Team Coordination

**Version:** 1.0  
**Last Updated:** December 16, 2025  
**Team:** Project Architect, Handyman (Lead Dev), Toaster (Senior QA)

---

## Team Roles & Responsibilities

### Project Architect (You)
- **Primary:** Overall oversight, architecture decisions, DevOps
- **GitHub Activities:**
  - Review all PRs before merge
  - Make architectural decisions (ADR issues)
  - Manage risks & issues documentation
  - Create milestones and project boards
  - Assign issues to Handyman or Toaster
  - Update project documentation

### Handyman (Lead Dev)
- **Primary:** Feature implementation, bug fixes
- **GitHub Activities:**
  - Pick up issues labeled `handyman`
  - Implement features and fix bugs
  - Write unit and integration tests
  - Create PRs with detailed descriptions
  - Respond to code review feedback
  - Hand off to Toaster for E2E testing

### Toaster (Senior QA)
- **Primary:** Testing, quality assurance, CI/CD
- **GitHub Activities:**
  - Pick up issues labeled `toaster`
  - Write E2E tests for features
  - Review PRs for test coverage
  - Maintain CI/CD pipelines
  - Report bugs found during testing
  - Approve PRs from testing perspective

---

## GitHub Labels System

### Role Labels
- `handyman` - For Lead Dev (feature implementation, bug fixes)
- `toaster` - For Senior QA (testing tasks)
- `architect` - For Project Architect (architecture decisions)

### Status Labels
- `status: todo` - Not started
- `status: in-progress` - Currently being worked on
- `status: review` - Ready for review
- `status: testing` - In testing phase
- `status: blocked` - Blocked by something
- `status: done` - Completed

### Type Labels
- `feature` - New feature
- `bug` - Bug report
- `testing` - Testing task
- `architecture` - Architectural decision
- `documentation` - Documentation update
- `refactor` - Code refactoring
- `security` - Security issue
- `performance` - Performance improvement

### Priority Labels
- `priority: critical` - Drop everything
- `priority: high` - Next up
- `priority: medium` - Normal priority
- `priority: low` - Nice to have

### Component Labels
- `component: frontend` - Frontend changes
- `component: backend` - Backend changes
- `component: infra` - Infrastructure/DevOps
- `component: viz` - Visualization engine
- `component: data` - Data pipeline

### Phase Labels
- `phase: 1` - Foundation (Complete)
- `phase: 2` - Core Features (Current)
- `phase: 3` - Performance Optimization
- `phase: 4` - Advanced Features
- `phase: 5` - Production Readiness
- `phase: 6` - Launch & Iteration

---

## Issue Workflow

### 1. Issue Creation

**By Architect:**
```
Create issue using template:
- [FEATURE] → Handyman
- [TEST] → Toaster
- [ADR] → Architect (self)

Add labels:
- Role: handyman/toaster/architect
- Status: status: todo
- Priority: priority: high/medium/low
- Component: component: frontend/backend/etc
- Phase: phase: 2
```

**By Handyman (when finding bugs):**
```
Create [BUG] issue
- Label: bug, handyman, status: todo, priority: high
- Fill out bug template completely
- Mention @architect for triage
```

**By Toaster (when needing tests):**
```
Create [TEST] issue for new test needs
- Label: testing, toaster, status: todo
- Link to feature issue
```

### 2. Issue Assignment

**Self-assignment:**
```bash
# Handyman picks up feature/bug
# Toaster picks up test task
# Architect picks up ADR

Comment on issue:
"Picking this up. ETA: [estimate]"

Update label: status: in-progress
```

### 3. Issue Progress

**While working:**
```
Update issue with progress comments:
- "Started implementation, completed X, Y pending"
- "Blocked by #123, waiting on resolution"
- "Found issue with approach, pivoting to Z"

Update labels if needed:
- status: blocked (if blocked)
- Link blocking issue
```

### 4. Issue Completion

**When done:**
```
Create PR and link issue:
"Fixes #123" or "Implements #123"

Comment on issue:
"PR #456 ready for review"

Update label: status: review
```

---

## Pull Request Workflow

### 1. PR Creation (by Handyman or Toaster)

```bash
# Create branch
git checkout -b feature/webgl-scatter-plot

# Do work, commit with conventional commits
git commit -m "feat(viz): add scatter plot rendering"

# Push and create PR
git push origin feature/webgl-scatter-plot

# On GitHub:
1. Use PR template
2. Fill out ALL sections
3. Add labels
4. Link related issues
5. Request review from Architect
```

**PR Title Convention:**
```
<type>(<scope>): <description> (Fixes #123)

Examples:
feat(viz): add scatter plot with instanced rendering (Fixes #45)
fix(api): resolve memory leak in data loader (Fixes #67)
test(e2e): add accessibility tests for dashboard (Implements #89)
```

### 2. PR Review Process

**Stage 1: Self-Review (by PR author)**
```
Before requesting review:
✓ Run all tests locally
✓ Check linting/formatting
✓ Review your own code
✓ Complete PR checklist
✓ Add comments for tricky parts
```

**Stage 2: Code Review (by Architect)**
```
Architect reviews:
✓ Architecture alignment
✓ Code quality
✓ Security implications
✓ Performance impact
✓ Documentation completeness

Leave feedback:
- Approval: "LGTM! ✅"
- Changes needed: Detailed comments
- Questions: Ask for clarification
```

**Stage 3: Testing Review (by Toaster)**
```
If PR by Handyman:
✓ Test coverage checked
✓ E2E tests pass
✓ No regressions
✓ Performance validated

Comment: "Tests validated ✅" or create [TEST] issue
```

**Stage 4: Final Approval**
```
Architect provides final approval:
- Approve PR
- Update issue: status: done
- Merge to develop
```

### 3. PR Merge

**By Architect only:**
```bash
# Squash and merge (keep history clean)
# Or regular merge (preserve commits)

# Delete source branch after merge

# Update related issues:
- Close issue
- Update project board
- Update documentation if needed
```

---

## Daily Workflow

### Morning Routine (All agents)

```
1. Check assigned issues
   - Filter: is:issue assignee:@me is:open
   - Priority: status: in-progress, then status: todo

2. Check GitHub notifications
   - PR reviews requested
   - Comments on your issues
   - Mentions

3. Update issue status
   - Comment on progress
   - Update labels if needed
   - Unblock blockers if resolved

4. Plan daily work
   - Pick next issue if current done
   - Estimate time
   - Comment ETA on issue
```

### During Work

```
Handyman:
- Work on feature/bug
- Commit frequently with good messages
- Update issue with progress
- Create [TEST] issue when feature ready for E2E
- Create PR when done

Toaster:
- Work on test task
- Write E2E tests
- Review Handyman's PRs for test coverage
- Report bugs found as [BUG] issues
- Update test documentation

Architect:
- Review PRs
- Make architectural decisions on [ADR] issues
- Triage new issues
- Update risks & documentation
- Monitor CI/CD
```

### End of Day

```
1. Commit and push work
   (even if not done - WIP commit is fine)

2. Update issue status
   - Comment on progress made
   - Note any blockers
   - Update ETA if needed

3. Create issues for tomorrow
   - Things discovered during work
   - Follow-up tasks needed

4. Quick team sync (optional)
   - Comment on standup issue
   - Highlight blockers
```

---

## Communication Patterns

### In Issue Comments

**Progress Update:**
```
Progress update (2025-12-16):
- ✅ Completed: Core rendering logic
- 🚧 In Progress: Interaction system
- 📋 Next: Performance optimization
- ETA: EOD tomorrow

Blocked by: #123 (waiting on data pipeline)
```

**Handoff (Handyman → Toaster):**
```
@Toaster - Feature complete! ✅

Implemented:
- Scatter plot rendering
- Zoom/pan interactions
- Unit tests (coverage: 85%)

Ready for E2E testing:
- Test scenario 1: [description]
- Test scenario 2: [description]

Known issues: None
PR: #456
```

**Review Feedback (Architect → Handyman):**
```
Code review feedback:

Overall: Looking good! Just a few items:

1. ⚠️ Performance: Consider using buffer pooling (line 42)
2. 📝 Documentation: Add JSDoc for public API (line 120)
3. ✅ Tests: Great coverage!

Please address items 1-2, then approved for merge.
```

**Bug Report (Toaster → Handyman):**
```
Bug found during E2E testing:

Issue: Scatter plot crashes with empty dataset
Severity: High
Reproducible: Always

See detailed bug report: #789

Can you prioritize this? Blocking release.
```

### In PR Comments

**Code Suggestion:**
```
```suggestion
// Use buffer pooling instead
const buffer = this.bufferPool.acquire(size);
```
```

**Question:**
```
❓ Why did we choose approach X over Y here?
Just want to understand the trade-offs.
```

**Approval:**
```
Looks great! ✅

Architecture: ✅
Tests: ✅
Documentation: ✅
Performance: ✅

Approved for merge.
```

---

## Project Board Setup

### Columns

```
Backlog → Todo → In Progress → Review → Testing → Done
```

### Column Rules

**Backlog:**
- All new issues
- Unprioritized
- Architect triages weekly

**Todo:**
- Prioritized and ready to work
- Assigned to Handyman or Toaster
- Label: status: todo

**In Progress:**
- Currently being worked on
- Label: status: in-progress
- Update with comments

**Review:**
- PR created
- Awaiting code review
- Label: status: review

**Testing:**
- Code approved
- Toaster validating
- Label: status: testing

**Done:**
- Merged to develop
- Issue closed
- Label: status: done

---

## Milestones

### Phase 2: Core Features (Current)
```
Due: January 31, 2026

Issues:
- [x] #1: Test infrastructure
- [x] #2: Documentation
- [ ] #3: WebGL rendering engine
- [ ] #4: Apache Arrow pipeline
- [ ] #5: Backend authentication
- [ ] #6: Database models
- [ ] #7: Basic UI components

Progress: 30% (2/7 complete)
```

### Creating Milestones

**By Architect:**
```
For each phase:
1. Create milestone
2. Set due date
3. Add description with goals
4. Assign issues to milestone
5. Track progress weekly
```

---

## Search Filters (Save These)

### For Handyman
```
# My assigned issues
is:issue assignee:@me is:open label:handyman

# My open PRs
is:pr author:@me is:open

# Issues needing my attention
is:issue mentions:@me is:open
```

### For Toaster
```
# My test tasks
is:issue assignee:@me is:open label:toaster

# PRs needing test review
is:pr is:open label:handyman -label:tested

# Bugs to verify
is:issue is:open label:bug label:status:testing
```

### For Architect
```
# All PRs needing review
is:pr is:open review-requested:@me

# Architecture decisions pending
is:issue is:open label:architecture

# Blocked issues
is:issue is:open label:status:blocked

# Current phase progress
is:issue milestone:"Phase 2: Core Features"
```

---

## Notifications Settings

**Recommended:**
```
Watch: Releases only
Custom:
  ✓ Issues: Mentions, participating
  ✓ Pull requests: Mentions, review requested, participating
  ✓ Actions: Failures only
  ✗ Releases: Off (unless needed)
```

---

## Emergency Workflow

### Critical Bug in Production

```
1. Handyman creates [BUG] issue
   - Label: bug, priority: critical
   - Mention @architect immediately

2. Architect triages
   - Confirm severity
   - Approve hotfix workflow
   - Create hotfix branch from main

3. Handyman fixes
   - Work on hotfix branch
   - Fast PR with minimal changes
   - Skip normal review for speed

4. Toaster validates
   - Smoke test only
   - Full regression post-deploy

5. Architect deploys
   - Deploy hotfix
   - Monitor metrics
   - Post-mortem issue created

6. Follow-up
   - Full fix in develop
   - Update documentation
   - Update risks log
```

---

## Weekly Sync (Async via Issues)

**Create Weekly Sync Issue:**

```markdown
# Weekly Sync - Week of Dec 16, 2025

## Progress Updates

### Handyman
- Completed: [list]
- In Progress: [list]
- Blockers: [list]
- Next week: [plans]

### Toaster
- Completed: [list]
- In Progress: [list]
- Blockers: [list]
- Next week: [plans]

### Architect
- Decisions made: [list]
- Risks updated: [list]
- Next week: [plans]

## Metrics
- Issues closed: X
- PRs merged: X
- Test coverage: X%
- Phase 2 progress: X%

## Action Items
- [ ] @handyman: [action]
- [ ] @toaster: [action]
- [ ] @architect: [action]
```

---

## Tips for Success

### For All Agents

✅ **DO:**
- Comment frequently on issues
- Link issues in commits/PRs
- Use templates consistently
- Keep labels updated
- Ask questions early
- Document decisions
- Celebrate wins! 🎉

❌ **DON'T:**
- Leave issues without updates for > 2 days
- Merge without approval
- Skip checklist items
- Force push to shared branches
- Close issues without PR
- Work on unassigned issues

---

## Quick Reference

### Issue Templates
- Feature: `.github/ISSUE_TEMPLATE/feature-request.md`
- Bug: `.github/ISSUE_TEMPLATE/bug-report.md`
- Test: `.github/ISSUE_TEMPLATE/test-task.md`
- ADR: `.github/ISSUE_TEMPLATE/architecture-decision.md`

### Useful Commands
```bash
# List issues assigned to you
gh issue list --assignee @me

# Create issue from template
gh issue create --template feature-request.md

# Create PR
gh pr create --fill

# Review PR
gh pr review <number> --approve
```

---

**Last Updated:** December 16, 2025  
**Maintained by:** Project Architect  
**Review Schedule:** Monthly

