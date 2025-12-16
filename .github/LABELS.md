# GitHub Labels Reference

This document defines all labels used in the PilotBA repository for issue and PR management.

## How to Apply Labels

```bash
# Command line (using gh CLI)
gh issue edit <number> --add-label "handyman,status: todo,priority: high"

# Or on GitHub web interface
# Click "Labels" → Select appropriate labels
```

---

## Role Labels (Who works on it)

| Label | Color | Description | Usage |
|-------|-------|-------------|-------|
| `handyman` | ![#0052CC](https://via.placeholder.com/15/0052CC/000000?text=+) `#0052CC` | For Lead Dev (feature implementation, bug fixes) | Assign to Handyman |
| `toaster` | ![#00875A](https://via.placeholder.com/15/00875A/000000?text=+) `#00875A` | For Senior QA (testing tasks, E2E tests) | Assign to Toaster |
| `architect` | ![#5243AA](https://via.placeholder.com/15/5243AA/000000?text=+) `#5243AA` | For Project Architect (architecture, oversight) | Assign to Architect |

---

## Status Labels (Current state)

| Label | Color | Description | When to Use |
|-------|-------|-------------|-------------|
| `status: todo` | ![#CCCCCC](https://via.placeholder.com/15/CCCCCC/000000?text=+) `#CCCCCC` | Not started yet | New issues |
| `status: in-progress` | ![#0052CC](https://via.placeholder.com/15/0052CC/000000?text=+) `#0052CC` | Currently being worked on | When picked up |
| `status: review` | ![#FF991F](https://via.placeholder.com/15/FF991F/000000?text=+) `#FF991F` | Waiting for code review | PR created |
| `status: testing` | ![#00875A](https://via.placeholder.com/15/00875A/000000?text=+) `#00875A` | In testing phase | Toaster reviewing |
| `status: blocked` | ![#DE350B](https://via.placeholder.com/15/DE350B/000000?text=+) `#DE350B` | Blocked by something | Can't proceed |
| `status: done` | ![#36B37E](https://via.placeholder.com/15/36B37E/000000?text=+) `#36B37E` | Completed | Merged & closed |

---

## Type Labels (What kind of work)

| Label | Color | Description | Examples |
|-------|-------|-------------|----------|
| `feature` | ![#0052CC](https://via.placeholder.com/15/0052CC/000000?text=+) `#0052CC` | New feature or enhancement | WebGL rendering, Arrow pipeline |
| `bug` | ![#DE350B](https://via.placeholder.com/15/DE350B/000000?text=+) `#DE350B` | Bug or defect | Crashes, incorrect behavior |
| `testing` | ![#00875A](https://via.placeholder.com/15/00875A/000000?text=+) `#00875A` | Testing task | E2E tests, performance tests |
| `architecture` | ![#5243AA](https://via.placeholder.com/15/5243AA/000000?text=+) `#5243AA` | Architectural decision | ADRs, tech choices |
| `documentation` | ![#0747A6](https://via.placeholder.com/15/0747A6/000000?text=+) `#0747A6` | Documentation update | README, guides, docs |
| `refactor` | ![#FFAB00](https://via.placeholder.com/15/FFAB00/000000?text=+) `#FFAB00` | Code refactoring | Improve code quality |
| `security` | ![#FF5630](https://via.placeholder.com/15/FF5630/000000?text=+) `#FF5630` | Security issue or improvement | Vulnerabilities, hardening |
| `performance` | ![#6554C0](https://via.placeholder.com/15/6554C0/000000?text=+) `#6554C0` | Performance optimization | Speed, memory, efficiency |

---

## Priority Labels (How urgent)

| Label | Color | Description | SLA |
|-------|-------|-------------|-----|
| `priority: critical` | ![#FF5630](https://via.placeholder.com/15/FF5630/000000?text=+) `#FF5630` | Drop everything, emergency | < 4 hours |
| `priority: high` | ![#FF991F](https://via.placeholder.com/15/FF991F/000000?text=+) `#FF991F` | Next up, important | < 2 days |
| `priority: medium` | ![#0052CC](https://via.placeholder.com/15/0052CC/000000?text=+) `#0052CC` | Normal priority | < 1 week |
| `priority: low` | ![#00875A](https://via.placeholder.com/15/00875A/000000?text=+) `#00875A` | Nice to have, when time permits | < 1 month |

---

## Component Labels (What part of system)

| Label | Color | Description | Includes |
|-------|-------|-------------|----------|
| `component: frontend` | ![#0052CC](https://via.placeholder.com/15/0052CC/000000?text=+) `#0052CC` | Frontend changes | React, UI, client-side |
| `component: backend` | ![#00875A](https://via.placeholder.com/15/00875A/000000?text=+) `#00875A` | Backend changes | Rust, API, server-side |
| `component: infra` | ![#5243AA](https://via.placeholder.com/15/5243AA/000000?text=+) `#5243AA` | Infrastructure/DevOps | Docker, K8s, CI/CD |
| `component: viz` | ![#6554C0](https://via.placeholder.com/15/6554C0/000000?text=+) `#6554C0` | Visualization engine | WebGL, rendering |
| `component: data` | ![#00875A](https://via.placeholder.com/15/00875A/000000?text=+) `#00875A` | Data pipeline | Arrow, transformations |
| `component: db` | ![#0747A6](https://via.placeholder.com/15/0747A6/000000?text=+) `#0747A6` | Database | PostgreSQL, models |
| `component: auth` | ![#FF991F](https://via.placeholder.com/15/FF991F/000000?text=+) `#FF991F` | Authentication/authorization | JWT, security |

---

## Phase Labels (When to work on it)

| Label | Color | Description | Timeline |
|-------|-------|-------------|----------|
| `phase: 1` | ![#36B37E](https://via.placeholder.com/15/36B37E/000000?text=+) `#36B37E` | Foundation | Weeks 1-4 (Complete) |
| `phase: 2` | ![#0052CC](https://via.placeholder.com/15/0052CC/000000?text=+) `#0052CC` | Core Features | Weeks 5-10 (Current) |
| `phase: 3` | ![#6554C0](https://via.placeholder.com/15/6554C0/000000?text=+) `#6554C0` | Performance Optimization | Weeks 11-14 |
| `phase: 4` | ![#00875A](https://via.placeholder.com/15/00875A/000000?text=+) `#00875A` | Advanced Features | Weeks 15-18 |
| `phase: 5` | ![#FF991F](https://via.placeholder.com/15/FF991F/000000?text=+) `#FF991F` | Production Readiness | Weeks 19-22 |
| `phase: 6` | ![#5243AA](https://via.placeholder.com/15/5243AA/000000?text=+) `#5243AA` | Launch & Iteration | Weeks 23+ |

---

## Special Labels

| Label | Color | Description | When to Use |
|-------|-------|-------------|-------------|
| `good first issue` | ![#7057FF](https://via.placeholder.com/15/7057FF/000000?text=+) `#7057FF` | Good for newcomers | Easy, well-scoped |
| `help wanted` | ![#008672](https://via.placeholder.com/15/008672/000000?text=+) `#008672` | Extra attention needed | Need expertise |
| `wontfix` | ![#FFFFFF](https://via.placeholder.com/15/FFFFFF/000000?text=+) `#FFFFFF` | Won't be worked on | By design, out of scope |
| `duplicate` | ![#CFD3D7](https://via.placeholder.com/15/CFD3D7/000000?text=+) `#CFD3D7` | Duplicate of another issue | Link to original |
| `invalid` | ![#E4E4E4](https://via.placeholder.com/15/E4E4E4/000000?text=+) `#E4E4E4` | Not valid | Not a real issue |
| `question` | ![#D876E3](https://via.placeholder.com/15/D876E3/000000?text=+) `#D876E3` | Further information requested | Clarification needed |

---

## Label Combinations (Common patterns)

### Feature Development (Handyman)
```
feature + handyman + status: in-progress + priority: high + component: frontend + phase: 2
```

### Bug Fix (Handyman)
```
bug + handyman + status: todo + priority: critical + component: backend
```

### E2E Test Task (Toaster)
```
testing + toaster + status: in-progress + priority: medium + component: frontend + phase: 2
```

### Architecture Decision (Architect)
```
architecture + architect + status: review + priority: high + phase: 2
```

### Blocked Work
```
[any type] + [any role] + status: blocked + priority: high
(Add comment explaining what's blocking)
```

---

## Label Management

### Creating Labels (Architect only)

```bash
# Using gh CLI
gh label create "handyman" --color "0052CC" --description "For Lead Dev"
gh label create "toaster" --color "00875A" --description "For Senior QA"

# Or bulk create using this file as reference
```

### Updating Labels

```bash
# Edit label
gh label edit "old-name" --name "new-name" --color "RRGGBB"

# Delete label (careful!)
gh label delete "label-name"
```

### Syncing Labels Across Repos

If you have multiple repos, export/import labels:

```bash
# Export from this repo
gh label list --json name,color,description > labels.json

# Import to another repo
# (use script or manual creation)
```

---

## Label Workflows

### New Feature Request

1. Create issue with template
2. Apply labels:
   - `feature`
   - `handyman`
   - `status: todo`
   - `priority: [high|medium|low]`
   - `component: [frontend|backend|etc]`
   - `phase: 2` (or appropriate phase)

3. Architect reviews and may adjust priority

### Bug Report Triage

1. Bug created with labels:
   - `bug`
   - `status: todo`
   - Priority auto-set from template

2. Architect triages:
   - Verify severity → adjust priority
   - Assign component
   - Add `handyman` label
   - Assign to milestone if critical

3. Handyman picks up:
   - Change to `status: in-progress`
   - Work on fix

### Test Task Assignment

1. Feature complete:
   - Handyman adds comment tagging Toaster
   - Create [TEST] issue
   - Labels: `testing`, `toaster`, `status: todo`, `priority: medium`

2. Toaster picks up:
   - Change to `status: in-progress`
   - Write E2E tests
   - Change to `status: review` when done

---

## Search Queries Using Labels

### Find my work
```
is:open assignee:@me label:handyman
is:open assignee:@me label:toaster
```

### Find blocked issues
```
is:open label:"status: blocked"
```

### Find high-priority work
```
is:open label:"priority: high" label:handyman
is:open label:"priority: critical"
```

### Find Phase 2 work
```
is:open label:"phase: 2"
milestone:"Phase 2: Core Features"
```

### Find frontend bugs
```
is:open label:bug label:"component: frontend"
```

### Find items in review
```
is:open label:"status: review"
```

---

## Best Practices

### DO:
✅ Apply multiple labels for better filtering  
✅ Update status labels as work progresses  
✅ Use priority labels consistently  
✅ Add phase labels to connect to roadmap  
✅ Use component labels for filtering  

### DON'T:
❌ Leave issues without status labels  
❌ Use conflicting labels (e.g., multiple statuses)  
❌ Create custom labels without consulting Architect  
❌ Forget to update labels when moving to new status  

---

## Label Audit

**Quarterly Review (by Architect):**
- Review label usage
- Clean up unused labels
- Update label descriptions
- Consolidate duplicate/similar labels
- Document any changes here

**Last Audit:** December 16, 2025  
**Next Audit:** March 16, 2026

---

**Maintained by:** Project Architect  
**Last Updated:** December 16, 2025

