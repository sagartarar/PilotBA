---
name: Bug Report
about: Report a bug for Handyman (Lead Dev) to fix
title: '[BUG] '
labels: 'bug, handyman, status: todo, priority: high'
assignees: ''
---

## Bug Description

**Summary:**
[Clear, concise description of the bug]

**Severity:**
- [ ] Critical (System down, data loss, security vulnerability)
- [ ] High (Major functionality broken, workaround available)
- [ ] Medium (Feature impaired, workaround exists)
- [ ] Low (Minor issue, cosmetic, or edge case)

**Component:**
- [ ] Frontend - WebGL Rendering
- [ ] Frontend - Data Pipeline
- [ ] Frontend - UI Components
- [ ] Backend - API
- [ ] Backend - Database
- [ ] Backend - Authentication
- [ ] Infrastructure
- [ ] Other: [specify]

---

## Reproduction Steps

**Environment:**
- OS: [e.g., Ubuntu 20.04, macOS 14, Windows 11]
- Browser: [e.g., Chrome 120, Firefox 121, Safari 17]
- Node version: [e.g., 20.10.0]
- Rust version: [e.g., 1.75.0]

**Steps to reproduce:**
1. Step 1
2. Step 2
3. Step 3
4. ...

**Expected behavior:**
[What should happen]

**Actual behavior:**
[What actually happens]

**Frequency:**
- [ ] Always (100%)
- [ ] Often (> 50%)
- [ ] Sometimes (< 50%)
- [ ] Rarely (< 10%)

---

## Error Information

**Error message:**
```
[Paste error message here]
```

**Stack trace:**
```
[Paste stack trace here]
```

**Console logs:**
```
[Paste relevant console output]
```

**Screenshots/Videos:**
[Attach screenshots or screen recordings if applicable]

---

## Impact Assessment

**Users affected:**
- [ ] All users
- [ ] Specific user role: [specify]
- [ ] Specific feature: [specify]
- [ ] Development only

**Data impact:**
- [ ] Data loss possible
- [ ] Data corruption possible
- [ ] No data impact

**Security impact:**
- [ ] Security vulnerability
- [ ] No security impact

**Workaround available:**
- [ ] Yes: [describe workaround]
- [ ] No

---

## Root Cause Analysis (for Handyman)

**Suspected cause:**
[Your hypothesis about what's causing the bug]

**Related code:**
- File: [path/to/file.ts]
- Line(s): [line numbers]
- Function: [function name]

**Recent changes:**
- [ ] Introduced in PR #[number]
- [ ] Regression from commit [hash]
- [ ] Existed before recent changes

---

## Fix Strategy (for Handyman)

**Proposed solution:**
[How you plan to fix this]

**Changes needed:**
- [ ] File 1: [describe changes]
- [ ] File 2: [describe changes]

**Testing approach:**
- [ ] Unit test for regression
- [ ] Integration test
- [ ] Manual testing steps

**Estimated effort:**
- [ ] Quick fix (< 1 hour)
- [ ] Small (1-4 hours)
- [ ] Medium (1 day)
- [ ] Large (2-3 days)

---

## Testing Requirements (for Toaster)

**Regression test:**
- [ ] Create test that reproduces the bug
- [ ] Verify test fails before fix
- [ ] Verify test passes after fix

**Additional testing:**
- [ ] Related functionality still works
- [ ] Edge cases tested
- [ ] Cross-browser testing (if frontend)
- [ ] Performance impact assessed

**Test files to create/update:**
```
backend/tests/unit/[file]
frontend/src/[component].test.tsx
e2e/[scenario].spec.ts
```

---

## Verification Checklist

- [ ] Bug reproduced and understood
- [ ] Root cause identified
- [ ] Fix implemented
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Regression test added
- [ ] Manual testing completed
- [ ] Code reviewed
- [ ] Security implications assessed
- [ ] Performance impact assessed
- [ ] Documentation updated

---

## Related Issues

**Duplicates:**
- Duplicate of #[issue number]

**Related bugs:**
- Related to #[issue number]

**Blocked by:**
- Blocked by #[issue number]

---

## Hotfix Required?

- [ ] Yes - This needs immediate production deployment
- [ ] No - Can wait for next release

**If hotfix:**
- [ ] Architect approval obtained
- [ ] Hotfix branch created
- [ ] Fast-tracked testing plan defined
- [ ] Rollback plan documented

---

## Security Considerations

**Is this a security vulnerability?**
- [ ] Yes - Follow security disclosure process
- [ ] No

**If security vulnerability:**
- **Severity:** [Critical | High | Medium | Low]
- **CVSS Score:** [if applicable]
- **Attack Vector:** [describe]
- **Mitigation:** [immediate steps to reduce risk]
- **Private issue?** [Yes/No]

---

## Notes

[Any additional context, logs, or information]

---

**Labels:** `bug`, `handyman`, `status: todo`, `priority: [critical|high|medium|low]`, `component: [frontend|backend|infra]`

**Assigned to:** Handyman (Lead Dev)
**Reviewed by:** Project Architect
**Tested by:** Toaster (Senior QA)

