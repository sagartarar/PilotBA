# PilotBA - Risk Register & Issue Tracking

**Version:** 1.1  
**Last Updated:** January 9, 2026  
**Owner:** Project Architect  
**Review Frequency:** Weekly

---

## Table of Contents

1. [Risk Management Framework](#risk-management-framework)
2. [Active Risks](#active-risks)
3. [Resolved Risks](#resolved-risks)
4. [Known Issues](#known-issues)
5. [Issue Resolution Log](#issue-resolution-log)
6. [Lessons Learned](#lessons-learned)

---

## Risk Management Framework

### Risk Scoring Matrix

**Probability:**

- **Low (1)**: < 20% chance
- **Medium (2)**: 20-50% chance
- **High (3)**: > 50% chance

**Impact:**

- **Low (1)**: Minor inconvenience, no schedule impact
- **Medium (2)**: Some schedule delay, workaround available
- **High (3)**: Major schedule delay, no workaround
- **Critical (4)**: Project-threatening

**Risk Score = Probability × Impact**

**Priority:**

- **1-2**: Low priority - Monitor
- **3-4**: Medium priority - Prepare mitigation
- **6+**: High priority - Active mitigation required

### Risk Categories

- **Technical**: Technology limitations, performance issues
- **Security**: Vulnerabilities, compliance
- **Infrastructure**: DevOps, deployment, scaling
- **Resource**: Team capacity, skills gaps
- **External**: Dependencies, third-party services
- **Schedule**: Timeline risks, blockers

---

## Active Risks

### Risk #1: WebGL Performance Target Not Met

**Category:** Technical  
**Status:** 🟡 Active - Monitoring  
**Date Identified:** December 16, 2025  
**Probability:** Medium (2)  
**Impact:** High (3)  
**Risk Score:** 6 (High Priority)

**Description:**
The WebGL rendering engine may not achieve 60 FPS with 10M data points across all target browsers and hardware configurations.

**Impact if Realized:**

- Degraded user experience
- Need to reduce data point limits
- Potential re-architecture of visualization approach
- Schedule delay of 2-3 weeks

**Mitigation Strategy:**

1. **Proactive:**

   - Implement performance benchmarks early (Phase 2)
   - Test on low-end hardware regularly
   - Use instanced rendering and GPU culling
   - Implement progressive rendering as fallback

2. **Reactive:**
   - If FPS < 60: Enable adaptive sampling
   - If FPS < 45: Reduce default data point limit
   - If FPS < 30: Fallback to Canvas2D for smaller datasets

**Monitoring:**

- Weekly performance benchmark runs
- FPS metrics in dev environment
- User testing on target hardware

**Owner:** Development Agent  
**Review Date:** January 15, 2026

---

### Risk #2: Apache Arrow Learning Curve

**Category:** Technical  
**Status:** 🟡 Active - Preparing  
**Date Identified:** December 16, 2025  
**Probability:** Medium (2)  
**Impact:** Medium (2)  
**Risk Score:** 4 (Medium Priority)

**Description:**
Team unfamiliarity with Apache Arrow may lead to implementation delays or suboptimal data pipeline design.

**Impact if Realized:**

- Schedule delay of 1-2 weeks
- Performance not optimized
- Need for refactoring later

**Mitigation Strategy:**

1. **Proactive:**

   - Allocate learning time in Phase 2
   - Build small proof-of-concept first
   - Review Apache Arrow examples and documentation
   - Consider consulting with Arrow experts

2. **Reactive:**
   - Start with simpler TypedArray approach
   - Gradually migrate to Arrow
   - Hire contractor if needed

**Monitoring:**

- Progress on Arrow implementation
- Performance benchmarks vs targets
- Code review feedback

**Owner:** Development Agent  
**Review Date:** January 8, 2026

---

### Risk #3: Database Scalability

**Category:** Infrastructure  
**Status:** 🟢 Low - Monitoring  
**Date Identified:** December 16, 2025  
**Probability:** Low (1)  
**Impact:** High (3)  
**Risk Score:** 3 (Medium Priority)

**Description:**
PostgreSQL may not scale to handle expected data volume and query load without optimization.

**Impact if Realized:**

- Slow API responses
- Database connection exhaustion
- Need for database sharding
- Schedule delay for optimization

**Mitigation Strategy:**

1. **Proactive:**

   - Design with proper indexes from start
   - Use connection pooling
   - Implement Redis caching layer
   - Monitor query performance
   - Load testing in Phase 3

2. **Reactive:**
   - Add read replicas
   - Optimize slow queries
   - Increase connection pool size
   - Consider database sharding

**Monitoring:**

- Query execution time (weekly)
- Connection pool utilization
- Database CPU/memory usage
- Load test results

**Owner:** Project Architect  
**Review Date:** January 20, 2026

---

### Risk #4: Security Vulnerability Discovered

**Category:** Security  
**Status:** 🟢 Low - Monitoring  
**Date Identified:** December 16, 2025  
**Probability:** Low (1)  
**Impact:** Critical (4)  
**Risk Score:** 4 (Medium Priority)

**Description:**
A HIGH or CRITICAL security vulnerability could be discovered in application code or dependencies, requiring immediate remediation.

**Impact if Realized:**

- Emergency hotfix required
- Potential data breach
- Compliance issues
- Reputation damage
- Schedule disruption

**Mitigation Strategy:**

1. **Proactive:**

   - Weekly dependency scanning
   - Security tests in CI/CD
   - CodeQL static analysis
   - Security code reviews
   - Penetration testing before launch

2. **Reactive:**
   - Immediate security patch workflow
   - Hotfix branch deployment
   - Incident response plan
   - User notification if data affected

**Monitoring:**

- Security scan results (daily)
- Dependency vulnerability alerts
- Security audit findings
- Failed security tests

**Owner:** Testing Agent  
**Review Date:** Ongoing (Weekly)

---

### Risk #5: Rust Compilation Times Impact Productivity

**Category:** Technical  
**Status:** 🟡 Active - Monitoring  
**Date Identified:** December 16, 2025  
**Probability:** Medium (2)  
**Impact:** Low (1)  
**Risk Score:** 2 (Low Priority)

**Description:**
As backend codebase grows, Rust compilation times may become slow, impacting developer productivity.

**Impact if Realized:**

- Slower feedback loops
- Developer frustration
- Reduced productivity

**Mitigation Strategy:**

1. **Proactive:**

   - Use `cargo watch` for incremental compilation
   - Modularize code to reduce rebuild scope
   - Use mold linker for faster linking
   - Consider sccache for caching
   - Keep dependencies minimal

2. **Reactive:**
   - Upgrade to more powerful dev machines
   - Use remote compilation
   - Split into smaller crates

**Monitoring:**

- Compilation time metrics
- Developer feedback
- CI/CD build times

**Owner:** Development Agent  
**Review Date:** January 30, 2026

---

### Risk #6: Browser Memory Limits

**Category:** Technical  
**Status:** 🟡 Active - Preparing  
**Date Identified:** December 16, 2025  
**Probability:** Medium (2)  
**Impact:** Medium (2)  
**Risk Score:** 4 (Medium Priority)

**Description:**
Browser memory limits (typically 1-2GB per tab) may be exceeded when handling very large datasets, causing crashes.

**Impact if Realized:**

- Browser tab crashes
- Poor user experience
- Need to reduce data limits
- Implementation of streaming approaches

**Mitigation Strategy:**

1. **Proactive:**

   - Monitor memory usage in development
   - Implement data sampling strategies
   - Use streaming for large datasets
   - Release WebGL resources properly
   - Buffer pooling to reuse memory

2. **Reactive:**
   - Reduce default data point limits
   - Add memory usage warnings
   - Implement auto-sampling when memory high
   - Use Web Workers for data processing

**Monitoring:**

- Memory profiling (weekly)
- Heap snapshot comparisons
- User reports of crashes
- Memory leak detection tests

**Owner:** Development Agent  
**Review Date:** January 15, 2026

---

### Risk #7: Third-Party Dependency Breaking Changes

**Category:** External  
**Status:** 🟢 Low - Monitoring  
**Date Identified:** December 16, 2025  
**Probability:** Low (1)  
**Impact:** Medium (2)  
**Risk Score:** 2 (Low Priority)

**Description:**
Major updates to critical dependencies (React, Actix, Arrow, etc.) may introduce breaking changes requiring significant refactoring.

**Impact if Realized:**

- Unexpected refactoring work
- Compatibility issues
- Schedule delay

**Mitigation Strategy:**

1. **Proactive:**

   - Pin dependency versions
   - Use Dependabot for gradual updates
   - Test updates in separate branch
   - Review changelogs before updating
   - Maintain compatibility tests

2. **Reactive:**
   - Stay on current version if update breaks
   - Gradual migration approach
   - Use compatibility shims if available

**Monitoring:**

- Dependabot PRs
- Security advisories
- Dependency update changelog reviews

**Owner:** Testing Agent  
**Review Date:** Ongoing (Monthly)

---

### Risk #8: Team Member Unavailability

**Category:** Resource  
**Status:** 🟢 Low - Monitoring  
**Date Identified:** December 16, 2025  
**Probability:** Low (1)  
**Impact:** Medium (2)  
**Risk Score:** 2 (Low Priority)

**Description:**
Temporary unavailability of Development Agent or Testing Agent due to illness, vacation, or other commitments.

**Impact if Realized:**

- Schedule delays
- Blocked progress on features
- Reduced code review capacity

**Mitigation Strategy:**

1. **Proactive:**

   - Comprehensive documentation
   - Knowledge sharing sessions
   - Cross-training on critical components
   - Clear handoff procedures
   - Code reviews for knowledge distribution

2. **Reactive:**
   - Architect can cover urgent items
   - Adjust schedule/priorities
   - Postpone non-critical work

**Monitoring:**

- Team availability calendar
- Sprint capacity planning

**Owner:** Project Architect  
**Review Date:** Ongoing

---

## Resolved Risks

### Risk #R1: Test Infrastructure Missing

**Category:** Technical  
**Status:** ✅ Resolved  
**Date Identified:** November 2025  
**Date Resolved:** December 10, 2025  
**Original Risk Score:** 9 (Probability: 3, Impact: 3)

**Description:**
Lack of comprehensive test infrastructure would make development slow and risky.

**Resolution:**

- Implemented 180+ tests across all layers
- Set up CI/CD pipelines
- Created testing documentation
- Established testing standards

**Outcome:**
Risk eliminated. Comprehensive test infrastructure in place.

---

## Known Issues

### Issue #1: Docker Compose Occasional Startup Failures

**Category:** Infrastructure  
**Status:** 🟡 Open  
**Severity:** Low  
**Date Identified:** December 15, 2025  
**Affected Component:** docker-compose.yml  
**Impact:** Developers need to restart services occasionally

**Description:**
Occasionally, one or more Docker services (usually PostgreSQL or Redis) fail to start properly on first `docker-compose up`, requiring a restart.

**Workaround:**

```bash
docker-compose down
docker-compose up -d
# Wait for health checks
docker-compose ps
```

**Root Cause:**
Likely timing issue with health checks or resource contention during startup.

**Proposed Solution:**

1. Increase health check intervals
2. Add startup delay to dependent services
3. Improve health check reliability

**Assigned To:** Project Architect  
**Priority:** Low  
**Target Resolution:** January 2026

---

### Issue #2: Playwright Tests Occasionally Flaky on CI

**Category:** Testing  
**Status:** 🟡 Open  
**Severity:** Medium  
**Date Identified:** December 12, 2025  
**Affected Component:** e2e/\*.spec.ts
**Impact:** CI/CD pipeline noise, potential false failures

**Description:**
Some E2E tests occasionally fail on CI with timeout or element not found errors, but pass on retry.

**Affected Tests:**

- `e2e/example.spec.ts` - "should navigate between pages" (5% flake rate)
- `e2e/api-health.spec.ts` - "should handle concurrent requests" (3% flake rate)

**Workaround:**

- Tests automatically retry (max 2 retries)
- Rerun failed tests manually if needed

**Root Cause Analysis:**

- Network timing variability in CI environment
- Potentially insufficient wait conditions
- Race conditions in test setup

**Proposed Solution:**

1. Add more explicit wait conditions
2. Use Playwright's built-in `waitForLoadState()`
3. Increase timeout for specific operations
4. Mock external API calls

**Assigned To:** Testing Agent  
**Priority:** Medium  
**Target Resolution:** January 15, 2026

---

### Issue #3: VS Code Rust-Analyzer High Memory Usage

**Category:** Development  
**Status:** 🟢 Open - Won't Fix  
**Severity:** Low  
**Date Identified:** December 10, 2025  
**Affected Component:** Developer tooling  
**Impact:** High memory usage on developer machines

**Description:**
Rust-analyzer extension in VS Code uses significant memory (1-2GB) when working with backend codebase.

**Workaround:**

- Disable rust-analyzer when not working on backend
- Restart VS Code periodically
- Increase system memory if possible

**Root Cause:**
Known issue with rust-analyzer for large projects with many dependencies.

**Status:**
Accepted limitation. Monitor rust-analyzer updates for improvements.

**Assigned To:** N/A  
**Priority:** Low  
**Target Resolution:** N/A (External dependency)

---

### Issue #4: Vitest/Playwright Expect Module Conflict (CRITICAL)

**Category:** Testing  
**Status:** 🔴 Open - Blocking  
**Severity:** Critical  
**Date Identified:** January 9, 2026  
**Affected Component:** E2E test suite  
**Impact:** E2E tests cannot execute; blocks QA testing

**Description:**
When running `npm run test:e2e` from the frontend workspace, there's a conflict between `@vitest/expect` and `@playwright/test` expect modules. Both try to define the same Jest matchers symbol.

**Error:**

```
TypeError: Cannot redefine property: Symbol($$jest-matchers-object)
    at /u/tarar/PilotBA/node_modules/@vitest/expect/dist/index.js:21:10
```

**Root Cause:**
Both Vitest and Playwright define the same Symbol for Jest matchers object. When loaded in the same Node.js process, the second one fails to redefine the frozen property.

**Workaround (Temporary):**
Run E2E tests from project root with npx:

```bash
cd /u/tarar/PilotBA && npx playwright test
```

Note: Requires web servers to be running manually first.

**Proposed Solution:**

1. **Option A:** Move Playwright config to use a separate test environment
2. **Option B:** Configure explicit module isolation in playwright.config.ts
3. **Option C:** Upgrade to latest versions of both libraries which may resolve conflict

**Assigned To:** Handyman  
**Priority:** Critical  
**Target Resolution:** January 10, 2026

---

### Issue #5: Quadtree Implementation Bugs

**Category:** Technical  
**Status:** 🟡 Open  
**Severity:** High  
**Date Identified:** January 9, 2026  
**Affected Component:** `frontend/src/viz-engine/utils/Quadtree.ts`  
**Impact:** 8 unit tests failing; data visualization accuracy affected

**Description:**
The Quadtree implementation has bugs causing:

- Incorrect point counts after operations (e.g., expecting 100 points, getting 164)
- Duplicate insertions when points are at same location
- Query returning wrong number of points
- Size tracking not accounting for all insertions

**Failing Tests:**

- `should subdivide when capacity exceeded`
- `should find all points in bounds`
- `should find points in partial range`
- `should handle small query range`
- `should clear all points`
- `should return correct size after subdivisions`
- `should handle many points at same location`
- `should handle capacity of 1`

**Root Cause:**
Suspected issues in `insert()`, `query()`, and `subdivide()` methods. Size tracking may be counting points multiple times or not accounting for subdivision correctly.

**Proposed Solution:**

1. Review size tracking logic in `insert()` and `subdivide()`
2. Ensure `clear()` resets all state including subdivided children
3. Add guard against duplicate insertions at same coordinates

**Assigned To:** Handyman  
**Priority:** High  
**Target Resolution:** January 15, 2026

---

### Issue #6: simplifyLine Stack Overflow on Negative Tolerance

**Category:** Technical  
**Status:** 🟡 Open  
**Severity:** Medium  
**Date Identified:** January 9, 2026  
**Affected Component:** `frontend/src/viz-engine/utils/simplify.ts`  
**Impact:** 1 security test failing; potential DoS vector

**Description:**
The `simplifyLine()` function throws `RangeError: Maximum call stack size exceeded` when called with a negative tolerance value.

**Error:**

```
AssertionError: expected [Function] to not throw an error but
'RangeError: Maximum call stack size exceeded' was thrown
```

**Root Cause:**
No input validation for negative tolerance values, causing infinite recursion in the Douglas-Peucker algorithm.

**Proposed Solution:**

```typescript
export function simplifyLine(points: Point[], tolerance: number): Point[] {
  // Add input validation
  if (tolerance < 0) {
    tolerance = 0; // Treat negative as zero tolerance
  }
  // ... rest of function
}
```

**Assigned To:** Handyman  
**Priority:** Medium  
**Target Resolution:** January 12, 2026

---

## Issue Resolution Log

### Resolved Issues

#### Issue #R1: Frontend Build Failing with Memory Error

**Status:** ✅ Resolved  
**Date Identified:** December 8, 2025  
**Date Resolved:** December 9, 2025  
**Resolution Time:** 1 day

**Description:**
Vite build process failing with "JavaScript heap out of memory" error during production builds.

**Root Cause:**
Node.js default heap size (1.4GB) insufficient for large bundle analysis.

**Solution:**
Updated build scripts to increase Node memory:

```json
"build": "NODE_OPTIONS=--max-old-space-size=4096 vite build"
```

**Resolved By:** Development Agent

---

#### Issue #R2: PostgreSQL Connection Pool Exhaustion in Tests

**Status:** ✅ Resolved  
**Date Identified:** December 11, 2025  
**Date Resolved:** December 12, 2025  
**Resolution Time:** 1 day

**Description:**
Integration tests occasionally failing with "connection pool exhausted" errors.

**Root Cause:**
Tests not properly cleaning up database connections.

**Solution:**

1. Added connection cleanup in test teardown
2. Reduced max connections in test config
3. Implemented connection timeout

**Resolved By:** Testing Agent

---

## Lessons Learned

### Lesson #1: Start with Test Infrastructure

**Date:** December 10, 2025  
**Category:** Process

**What Happened:**
Investing in comprehensive test infrastructure early (Phase 1) paid significant dividends.

**What Went Well:**

- 180+ tests caught numerous bugs early
- CI/CD automation saved manual testing time
- Confidence in refactoring increased
- Documentation helped onboarding

**What Could Be Improved:**

- Could have started E2E tests even earlier
- Some test utilities could be more reusable

**Action Items:**

- Continue test-first development approach
- Share test utilities across test suites
- Document testing patterns for consistency

---

### Lesson #2: Docker Compose for Dev Environment

**Date:** December 8, 2025  
**Category:** Infrastructure

**What Happened:**
Using Docker Compose for local development (Postgres, Redis, MinIO) significantly improved developer experience.

**What Went Well:**

- Consistent environment across team
- Easy to start/stop services
- No conflicts with local installations
- Health checks ensure services ready

**What Could Be Improved:**

- Initial setup could be more automated
- Some startup timing issues
- Better documentation of troubleshooting

**Action Items:**

- Create setup script for first-time users
- Improve health check reliability
- Add more troubleshooting docs

---

### Lesson #3: Documentation is Critical

**Date:** December 16, 2025  
**Category:** Process

**What Happened:**
Creating comprehensive documentation early (architecture, testing, workflow) has been invaluable.

**What Went Well:**

- New contributors can onboard quickly
- Reduces repetitive questions
- Serves as architectural decision record
- Keeps team aligned

**What Could Be Improved:**

- Need to keep docs in sync with code
- Some docs could be more concise
- Visual diagrams helpful but time-consuming

**Action Items:**

- Make documentation updates part of PR checklist
- Use automated tools where possible (API docs)
- Review and update docs monthly

---

## Risk Review Schedule

### Weekly Review (Every Monday)

**Review Checklist:**

- [ ] Update risk probabilities based on recent events
- [ ] Check mitigation strategy progress
- [ ] Review new issues from past week
- [ ] Update issue status and priorities
- [ ] Check monitoring metrics for risks

### Monthly Review (First Monday of Month)

**Review Checklist:**

- [ ] Comprehensive risk assessment
- [ ] Close resolved risks
- [ ] Identify new risks
- [ ] Update impact assessments
- [ ] Review lessons learned
- [ ] Update mitigation strategies
- [ ] Team retrospective on risk management

---

## Risk Escalation Process

### When to Escalate

Escalate a risk to Project Architect if:

- Risk score increases to 6+
- Mitigation strategy failing
- New information significantly changes impact
- Risk realized or close to realization
- Resource constraints prevent mitigation

### Escalation Format

```markdown
## Risk Escalation: [Risk Name]

**Current Status:** [Status]
**Risk Score:** [Score] (up from [previous])
**Urgency:** [Low/Medium/High/Critical]

**Situation:**
[What changed and why escalation needed]

**Impact:**
[Detailed impact if realized]

**Recommended Action:**
[What should be done]

**Timeline:**
[When decision needed]
```

---

## Metrics Dashboard

### Risk Metrics (Updated Weekly)

| Metric                            | Current | Target   | Status  |
| --------------------------------- | ------- | -------- | ------- |
| **Active High-Priority Risks**    | 1       | < 3      | 🟢 Good |
| **Open Critical Issues**          | 0       | 0        | 🟢 Good |
| **Open High-Priority Issues**     | 0       | < 2      | 🟢 Good |
| **Open Medium-Priority Issues**   | 2       | < 5      | 🟢 Good |
| **Average Issue Resolution Time** | 1 day   | < 3 days | 🟢 Good |
| **Risks Realized (Last Month)**   | 0       | 0        | 🟢 Good |

### Risk Trend

```
Month       | High Risks | Medium Risks | Total
------------|------------|--------------|-------
Dec 2025    | 1          | 5            | 6
Jan 2026    | TBD        | TBD          | TBD
```

---

## Contact & Ownership

**Risk Management Owner:** Project Architect  
**Issue Tracker:** Testing Agent  
**Escalation Point:** Project Architect

**Review Schedule:**

- Weekly: Every Monday 10:00 AM
- Monthly: First Monday of month 2:00 PM

**Document Version Control:**

- Version: 1.1
- Last Updated: December 23, 2025
- Next Review: December 30, 2025

---

## Roadmap Risks (Added December 23, 2025)

### Risk #9: Identity Provider Integration Complexity

**Category:** Technical  
**Status:** 🟢 Planned - Monitoring  
**Date Identified:** December 23, 2025  
**Probability:** Medium (2)  
**Impact:** Medium (2)  
**Risk Score:** 4 (Medium Priority)

**Description:**
Integrating with multiple identity providers (OAuth, SAML, LDAP) requires careful handling of different protocols and edge cases.

**Mitigation Strategy:**

1. Start with OAuth (Google, Microsoft, GitHub) - well-documented
2. Use established libraries (oauth2-rs, samael for SAML)
3. Build abstraction layer for all providers
4. Phase implementation: OAuth → SAML → LDAP

**Owner:** Development Agent  
**Review Date:** February 2026

---

### Risk #10: Cloud Migration Data Consistency

**Category:** Infrastructure  
**Status:** 🟢 Planned - Preparing  
**Date Identified:** December 23, 2025  
**Probability:** Medium (2)  
**Impact:** High (3)  
**Risk Score:** 6 (High Priority)

**Description:**
Migrating from local PostgreSQL/MinIO to cloud-managed services (RDS, S3) could cause data loss or inconsistency if not handled properly.

**Mitigation Strategy:**

1. Use database migration tools (pg_dump/pg_restore)
2. Implement checksums for file validation
3. Run parallel systems during migration
4. Have rollback plan ready
5. Test restore procedures before migration

**Owner:** Project Architect  
**Review Date:** Before cloud migration

---

### Risk #11: Competitive Feature Gap

**Category:** Business  
**Status:** 🟡 Active - Monitoring  
**Date Identified:** December 23, 2025  
**Probability:** Low (1)  
**Impact:** Medium (2)  
**Risk Score:** 2 (Low Priority)

**Description:**
Tableau, Power BI, and Looker have years of feature development. Users may expect features we haven't implemented yet.

**Mitigation Strategy:**

1. Focus on performance differentiation (10M points @ 60 FPS)
2. Prioritize most-requested features
3. Clear documentation of supported vs. planned features
4. Community feedback for feature prioritization

**Owner:** Project Architect  
**Review Date:** Monthly

---

**Note:** This is a living document. All team members should:

1. Report new risks immediately
2. Update status of assigned risks/issues
3. Participate in risk reviews
4. Escalate concerns proactively
5. Document lessons learned
