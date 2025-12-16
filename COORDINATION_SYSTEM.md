# PilotBA - Hybrid Coordination System

**Version:** 1.0  
**Date:** December 16, 2025  
**System Type:** Documentation + GitHub Issues

---

## 🎯 System Overview

This document describes how the **Project Architect**, **Handyman (Lead Dev)**, and **Toaster (Senior QA)** coordinate work on PilotBA using a hybrid approach:

1. **Comprehensive Documentation** (persistent knowledge)
2. **GitHub Issues** (task tracking and communication)

All three agents work on the **same GitHub repository** under the **same GitHub username** (no conflicts).

---

## 🎭 Team Structure

```
┌─────────────────────────────────────────┐
│      Project Architect (Architect)      │
│   - Architecture & design decisions     │
│   - DevOps & infrastructure             │
│   - Risk management                     │
│   - Product management                  │
│   - Final PR approvals                  │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
┌───────▼──────┐  ┌───▼──────────┐
│  Handyman    │  │   Toaster    │
│  (Lead Dev)  │  │  (Senior QA) │
│              │  │              │
│ - Features   │  │ - E2E tests  │
│ - Bug fixes  │  │ - Test review│
│ - Unit tests │  │ - CI/CD      │
│ - Code       │  │ - Quality    │
└──────────────┘  └──────────────┘
```

**Communication Method:** GitHub Issues, PR Comments, Documentation

---

## 📚 Documentation Layer (Persistent Knowledge)

### Core Documents

| Document | Purpose | Who Updates | Frequency |
|----------|---------|-------------|-----------|
| **PROJECT_ARCHITECTURE.md** | Complete architecture, tech stack, phases | Architect | As needed |
| **RISKS_AND_ISSUES.md** | Active risk management, issue log | Architect | Weekly |
| **WORKFLOW_GUIDE.md** | How to work on the project | Architect | Monthly |
| **EXECUTIVE_SUMMARY.md** | Stakeholder overview | Architect | Monthly |
| **docs/TESTING.md** | Testing guide and standards | Toaster | As needed |
| **docs/design/*.md** | Design documents | Architect/Handyman | As needed |
| **docs/adr/*.md** | Architectural decision records | Architect | Per decision |

### Why Documentation First?

- **Persistent:** Survives between sessions
- **Searchable:** Easy to find information
- **Versioned:** Git tracks all changes
- **Async:** No real-time coordination needed
- **Human-readable:** Works for humans too

---

## 🔧 GitHub Issues Layer (Task Tracking)

### Issue Templates

Located in `.github/ISSUE_TEMPLATE/`:

1. **feature-request.md** → For Handyman
   - New features to implement
   - Technical requirements
   - Acceptance criteria
   - Implementation plan

2. **bug-report.md** → For Handyman
   - Bug reports
   - Reproduction steps
   - Fix strategy
   - Testing requirements

3. **test-task.md** → For Toaster
   - E2E test tasks
   - Test scenarios
   - Performance/security testing
   - Coverage requirements

4. **architecture-decision.md** → For Architect
   - ADR proposals
   - Options analysis
   - Impact assessment
   - Decision tracking

### Labels System

See [.github/LABELS.md](.github/LABELS.md) for complete reference.

**Key Labels:**
- **Role:** `handyman`, `toaster`, `architect`
- **Status:** `status: todo`, `status: in-progress`, `status: review`, `status: testing`, `status: done`
- **Priority:** `priority: critical`, `priority: high`, `priority: medium`, `priority: low`
- **Component:** `component: frontend`, `component: backend`, `component: infra`
- **Phase:** `phase: 2` (current phase)

---

## 🔄 Coordination Workflows

### Workflow 1: Feature Development

```
┌─────────────────┐
│ Architect       │  1. Creates [FEATURE] issue
│                 │     Labels: handyman, status: todo, priority: high
└────────┬────────┘     Assigns to Phase 2 milestone
         │
         ▼
┌─────────────────┐
│ Handyman        │  2. Picks up issue
│                 │     Comments: "Picking this up. ETA: 2 days"
└────────┬────────┘     Changes label: status: in-progress
         │
         │           3. Implements feature
         │              - Writes tests first
         │              - Implements code
         │              - Comments on progress
         │
         ▼
┌─────────────────┐  4. Creates PR
│ Handyman        │     - Links issue: "Fixes #123"
│                 │     - Fills out PR template
└────────┬────────┘     - Requests review from Architect
         │              - Changes issue label: status: review
         │
         ▼
┌─────────────────┐  5. Reviews PR
│ Architect       │     - Code quality check
│                 │     - Architecture alignment
└────────┬────────┘     - Leaves feedback or approves
         │
         ▼
┌─────────────────┐  6. Creates [TEST] issue
│ Architect       │     Labels: toaster, status: todo
│                 │     Links to feature PR
└────────┬────────┘     Mentions @Toaster
         │
         ▼
┌─────────────────┐  7. Writes E2E tests
│ Toaster         │     - Picks up test task
│                 │     - Implements E2E tests
└────────┬────────┘     - Validates feature works
         │              - Comments on test results
         │
         ▼
┌─────────────────┐  8. Final approval & merge
│ Architect       │     - Verifies tests pass
│                 │     - Merges PR
└────────┬────────┘     - Closes issues
         │              - Updates documentation
         │
         ▼
      [DONE]
```

### Workflow 2: Bug Fix

```
┌─────────────────┐
│ Toaster or      │  1. Finds bug during testing
│ Handyman        │     Creates [BUG] issue
└────────┬────────┘     Labels: bug, handyman, priority: high
         │              Mentions @Architect
         │
         ▼
┌─────────────────┐  2. Triages bug
│ Architect       │     - Confirms severity
│                 │     - Assigns priority
└────────┬────────┘     - May adjust labels
         │
         ▼
┌─────────────────┐  3. Picks up and fixes
│ Handyman        │     - Creates fix branch
│                 │     - Writes regression test
└────────┬────────┘     - Implements fix
         │              - Creates PR
         │
         ▼
┌─────────────────┐  4. Validates fix
│ Toaster         │     - Runs regression test
│                 │     - Verifies bug gone
└────────┬────────┘     - Approves PR
         │
         ▼
┌─────────────────┐  5. Merges and closes
│ Architect       │     - Final review
│                 │     - Merge PR
└────────┬────────┘     - Update risk log if needed
         │
         ▼
      [DONE]
```

### Workflow 3: Architectural Decision

```
┌─────────────────┐
│ Handyman or     │  1. Encounters decision point
│ Toaster         │     Creates [ADR] issue
└────────┬────────┘     Labels: architecture, decision-required
         │              Proposes options
         │
         ▼
┌─────────────────┐  2. Reviews proposal
│ Architect       │     - Analyzes options
│                 │     - Requests input if needed
└────────┬────────┘     - Gathers context
         │
         ▼
┌─────────────────┐  3. Makes decision
│ Architect       │     - Documents in ADR
│                 │     - Creates docs/adr/XXX.md
└────────┬────────┘     - Updates PROJECT_ARCHITECTURE.md
         │              - Comments decision on issue
         │              - Closes issue
         │
         ▼
┌─────────────────┐  4. Implement decision
│ Handyman        │     - Follows ADR guidance
│                 │     - Creates feature/refactor issue
└─────────────────┘     - Proceeds with implementation
```

---

## 💬 Communication Patterns

### In Issue Comments

**When picking up work (Handyman/Toaster):**
```
Picking this up!

Plan:
- Step 1: [description]
- Step 2: [description]
- Step 3: [description]

ETA: 2 days
Will update daily with progress.
```

**Progress update:**
```
Progress update (Day 1):
✅ Completed: Basic structure and tests
🚧 In Progress: Core implementation
📋 Next: Integration and polish

On track for ETA.
```

**Handoff to another agent:**
```
@Toaster - Feature complete and ready for E2E testing! ✅

What's done:
- Scatter plot rendering with 10M points
- Zoom/pan interactions
- Unit tests (coverage: 87%)
- Integration tests passing

Test scenarios to cover:
1. Render large dataset (1M+ points)
2. Zoom in/out smoothly
3. Pan across chart
4. Hover tooltips work

Known issues: None

PR: #456
Let me know if you need anything!
```

**Review feedback (Architect):**
```
Great work! Just a few items before merge:

1. ⚠️ Performance: Consider using instanced rendering for better FPS (line 142)
2. 📝 Docs: Please add JSDoc comments for public methods
3. 🧪 Tests: Add test for empty dataset edge case
4. ✅ Everything else looks good!

Please address 1-3, then I'll approve.
```

### In PR Comments

**Approval (Architect):**
```
LGTM! ✅

Code quality: ✅
Architecture: ✅
Tests: ✅ (89% coverage)
Performance: ✅
Documentation: ✅

Great work on the scatter plot!
Approved for merge.
```

**Test validation (Toaster):**
```
E2E tests completed ✅

Results:
- All scenarios passing
- Cross-browser tested (Chrome, Firefox, Safari)
- Performance validated: 62 FPS with 10M points
- Accessibility: WCAG AA compliant
- No regressions found

Ready for merge from testing perspective.
```

---

## 📊 Project Board

### Columns Setup

```
Backlog → Todo → In Progress → Review → Testing → Done
```

### How Issues Move

1. **Backlog:** New issues, unprioritized
2. **Todo:** Prioritized, ready to work, assigned
3. **In Progress:** Being worked on actively
4. **Review:** PR created, awaiting code review
5. **Testing:** Code approved, E2E testing
6. **Done:** Merged and closed

### Automation (if enabled)

- New issues → Backlog
- Issue assigned → Todo
- Label `status: in-progress` → In Progress
- PR created → Review
- Label `status: testing` → Testing
- PR merged → Done

---

## 🗓️ Weekly Rhythm

### Monday: Week Planning

**Architect creates Weekly Sync issue:**
```markdown
# Weekly Sync - Week of Dec 16, 2025

## Last Week
- Issues closed: 5
- PRs merged: 3
- Test coverage: 82%
- Phase 2 progress: 35%

## This Week Goals
- [ ] Complete WebGL scatter plot
- [ ] Start Apache Arrow pipeline
- [ ] Add E2E tests for dashboard

## Assignments
- @Handyman: #45 (scatter plot), #46 (arrow loader)
- @Toaster: #47 (scatter e2e), #48 (dashboard e2e)
- @Architect: Review ADR #49, update risks

## Blockers
- None currently

## Notes
[Any additional context]
```

### Daily: Async Updates

**Everyone comments on issues with progress:**
- What was done yesterday
- What's planned today
- Any blockers

### Friday: Week Wrap-up

**Architect updates Weekly Sync issue:**
- Mark completed items
- Note any carry-over
- Update metrics
- Identify next week's priorities

---

## 🚨 Escalation Process

### When to Escalate

**Handyman/Toaster → Architect:**
- Blocked for > 1 day
- Architectural decision needed
- Scope unclear
- Priority conflict

**How to Escalate:**
```
1. Comment on issue: "@Architect - escalation needed"

2. Explain:
   - What's blocking
   - What you've tried
   - What you need

3. Apply label: status: blocked

4. Link any related issues
```

**Architect Response SLA:**
- Critical: < 4 hours
- High: < 24 hours
- Medium: < 48 hours

---

## 🔍 Finding Work

### For Handyman

```bash
# High priority features/bugs
is:issue is:open label:handyman label:"priority: high" label:"status: todo"

# Current phase work
is:issue is:open label:handyman milestone:"Phase 2: Core Features"

# Quick wins
is:issue is:open label:handyman label:"good first issue"
```

### For Toaster

```bash
# Test tasks assigned to me
is:issue is:open label:toaster assignee:@me

# Features needing E2E tests
is:issue is:open label:testing label:"status: testing"

# PRs to review for test coverage
is:pr is:open label:handyman -label:"test-reviewed"
```

### For Architect

```bash
# PRs needing review
is:pr is:open review-requested:@me

# ADRs pending decision
is:issue is:open label:architecture label:"decision-required"

# Blocked work
is:issue is:open label:"status: blocked"

# All Phase 2 progress
milestone:"Phase 2: Core Features"
```

---

## 🎯 Success Metrics

### Issue Metrics (Weekly)

- Issues created: [count]
- Issues closed: [count]
- Average time to close: [days]
- Blocked issues: [count]

### PR Metrics (Weekly)

- PRs created: [count]
- PRs merged: [count]
- Average review time: [hours]
- Average time to merge: [days]

### Quality Metrics (Weekly)

- Test coverage: [%]
- E2E test count: [count]
- Security issues: [count]
- Performance benchmarks: [pass/fail]

### Phase Progress

- Phase 2 completion: [%]
- On track for milestone: [yes/no]
- Blockers: [count]

---

## 🛠️ Tools & Resources

### Essential Links

- **Documentation:** [Project docs index](README.md)
- **Workflow:** [WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md)
- **GitHub Workflow:** [.github/GITHUB_WORKFLOW.md](.github/GITHUB_WORKFLOW.md)
- **Labels:** [.github/LABELS.md](.github/LABELS.md)
- **Onboarding:** [TEAM_ONBOARDING.md](TEAM_ONBOARDING.md)

### GitHub CLI Commands

```bash
# List my issues
gh issue list --assignee @me

# Create issue
gh issue create --template feature-request.md

# Create PR
gh pr create --fill

# Review PR
gh pr review <number> --approve
gh pr review <number> --comment --body "Looks good!"

# Merge PR
gh pr merge <number> --squash

# View project board
gh project list
```

---

## 📋 Checklists

### Before Starting Work (All)

- [ ] Issue is assigned to me
- [ ] Issue has clear requirements
- [ ] No blockers
- [ ] Updated issue: status: in-progress
- [ ] Commented with ETA

### Before Creating PR (Handyman)

- [ ] All tests pass locally
- [ ] Linting passes
- [ ] 80%+ test coverage
- [ ] Security checks pass
- [ ] Documentation updated
- [ ] Conventional commit messages
- [ ] Branch up-to-date with develop

### Before Approving PR (Architect)

- [ ] Code quality acceptable
- [ ] Architecture alignment verified
- [ ] Security implications reviewed
- [ ] Performance impact acceptable
- [ ] Tests adequate
- [ ] Documentation updated

### Before Closing Issue (All)

- [ ] PR merged (if applicable)
- [ ] Tests passing in main/develop
- [ ] Documentation updated
- [ ] Related issues linked/closed
- [ ] Lessons learned documented (if applicable)

---

## 🎉 Advantages of This System

### Why This Works

1. **Documentation First**
   - Persistent knowledge
   - Survives agent sessions
   - Works for humans too
   - Git-versioned

2. **GitHub Issues**
   - Clear task tracking
   - Async communication
   - No real-time coordination needed
   - Built-in notifications

3. **Same Username**
   - No author confusion
   - Single contributor graph
   - Simplified permissions

4. **Templates**
   - Consistency
   - Complete information
   - Easy to follow

5. **Labels**
   - Easy filtering
   - Clear status
   - Priority visible

### What Makes It Different

- **Hybrid:** Combines persistent docs with dynamic issues
- **Async:** No need for simultaneous sessions
- **Scalable:** Works with 3 agents or 30 humans
- **Clear:** Roles, workflows, and handoffs defined
- **Tracked:** GitHub provides full history

---

## 🚀 Getting Started

### For New Agents

1. **Read:** [TEAM_ONBOARDING.md](TEAM_ONBOARDING.md) for your role
2. **Setup:** Clone repo, install dependencies
3. **Familiarize:** Run tests, explore code
4. **Find work:** Use GitHub searches for your role
5. **Pick issue:** Comment and start working
6. **Follow workflow:** Create PR, get reviewed, iterate
7. **Communicate:** Comment frequently on issues

### For Returning Agents

1. **Check notifications:** GitHub notifications
2. **Review:** Any PRs needing your review
3. **Continue:** Work on in-progress issues
4. **Update:** Comment on progress made
5. **Coordinate:** Tag others when needed

---

**This system enables effective coordination without real-time communication!** 🎯

**Maintained by:** Project Architect  
**Last Updated:** December 16, 2025  
**Review Schedule:** Monthly

