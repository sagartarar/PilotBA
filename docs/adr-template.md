# ADR-XXXX: [Title]

**Status:** [Proposed | Accepted | Deprecated | Superseded]  
**Date:** YYYY-MM-DD  
**Decision Makers:** [Names/Roles]  
**Technical Story:** [Link to issue/epic if applicable]

---

## Context and Problem Statement

[Describe the context and problem statement in 2-3 sentences. What is the issue we're trying to solve? What are the driving factors?]

**Example:**
*We need to choose a data format for efficient client-side data processing of large datasets (1M+ rows). The current JSON format is too slow for parsing and uses excessive memory.*

---

## Decision Drivers

[List the key factors that influence the decision]

- **Performance:** [Performance requirements and constraints]
- **Developer Experience:** [Impact on development workflow]
- **Maintainability:** [Long-term maintenance considerations]
- **Cost:** [Financial or resource costs]
- **Compatibility:** [Integration with existing systems]
- **Team Skills:** [Current team expertise or learning curve]
- [Additional drivers specific to this decision]

---

## Considered Options

### Option 1: [Name]

**Description:**  
[Brief description of this option]

**Pros:**
- ✅ [Advantage 1]
- ✅ [Advantage 2]
- ✅ [Advantage 3]

**Cons:**
- ❌ [Disadvantage 1]
- ❌ [Disadvantage 2]
- ❌ [Disadvantage 3]

**Technical Details:**
- [Implementation approach]
- [Dependencies required]
- [Integration points]

**Performance Characteristics:**
- [Performance metrics or estimates]
- [Scalability considerations]

**Cost & Effort:**
- **Implementation Time:** [Estimate]
- **Learning Curve:** [Low/Medium/High]
- **Ongoing Maintenance:** [Low/Medium/High]

---

### Option 2: [Name]

**Description:**  
[Brief description of this option]

**Pros:**
- ✅ [Advantage 1]
- ✅ [Advantage 2]
- ✅ [Advantage 3]

**Cons:**
- ❌ [Disadvantage 1]
- ❌ [Disadvantage 2]
- ❌ [Disadvantage 3]

**Technical Details:**
- [Implementation approach]
- [Dependencies required]
- [Integration points]

**Performance Characteristics:**
- [Performance metrics or estimates]
- [Scalability considerations]

**Cost & Effort:**
- **Implementation Time:** [Estimate]
- **Learning Curve:** [Low/Medium/High]
- **Ongoing Maintenance:** [Low/Medium/High]

---

### Option 3: [Name]

[Repeat structure for additional options]

---

## Decision Outcome

**Chosen option:** Option [X] - [Name]

**Justification:**  
[Explain in 2-4 paragraphs why this option was chosen over the others. Reference the decision drivers and how this option best addresses them.]

**Example:**
*We chose Apache Arrow (Option 2) because it provides the best balance of performance and developer experience. While it has a steeper learning curve than TypedArray (Option 1), the performance benefits (10x faster parsing, 50% less memory) justify the investment. The columnar format aligns perfectly with our analytical workload, and the standardization enables zero-copy data sharing with the backend.*

**Consequences:**

- **Positive:**
  - [Positive outcome 1]
  - [Positive outcome 2]
  - [Positive outcome 3]

- **Negative:**
  - [Negative outcome 1 and how we'll mitigate]
  - [Negative outcome 2 and how we'll mitigate]

- **Neutral:**
  - [Neutral change 1]
  - [Neutral change 2]

---

## Implementation Plan

### Phase 1: [Phase Name] (Timeline)
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

### Phase 2: [Phase Name] (Timeline)
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

### Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

---

## Validation

[How will we validate this decision was correct?]

**Metrics to Track:**
- [Metric 1: target value]
- [Metric 2: target value]
- [Metric 3: target value]

**Review Date:** [Date to review decision effectiveness]

**Rollback Plan:**  
[If this decision proves incorrect, how can we rollback or pivot?]

---

## Related Decisions

- [ADR-YYYY: Related Decision 1](link)
- [ADR-ZZZZ: Related Decision 2](link)

**Supersedes:**
- [ADR-AAAA: Previous Decision](link) *(if applicable)*

**Superseded by:**
- [ADR-BBBB: New Decision](link) *(if deprecated)*

---

## References

- [Link to research document]
- [Link to performance benchmarks]
- [Link to external documentation]
- [Link to relevant discussions]

---

## Notes

[Any additional notes, caveats, or context that don't fit above]

---

**Document History:**

| Date | Author | Change |
|------|--------|--------|
| YYYY-MM-DD | [Name] | Initial draft |
| YYYY-MM-DD | [Name] | Updated after review |
| YYYY-MM-DD | [Name] | Final decision |

