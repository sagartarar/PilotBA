# Data Filtering Guide

> **⏱️ Time to complete: 15 minutes**  
> **🎯 Goal: Learn to filter data to find exactly what you need**

Filtering is one of the most powerful tools in data analysis. It lets you focus on specific subsets of your data—like sales from a particular region, customers above a certain age, or transactions from last month. This guide teaches you everything about filtering in PilotBA.

---

## What You'll Learn

- ✅ How to create filters in PilotBA
- ✅ Understanding different filter operators
- ✅ Combining multiple filters
- ✅ Filtering different data types
- ✅ Common filtering scenarios with examples

---

## What is Filtering?

Filtering means keeping only the rows that match certain conditions. Think of it like a sieve that lets through only what you want.

**Example**: From 10,000 sales records, show only:
- Sales from the "North" region
- Where revenue is greater than $1,000
- From the last quarter

**Result**: Maybe 500 rows that match all conditions.

---

## Accessing the Filter Builder

1. Go to the **Query** view (click "Query" in the sidebar)
2. Make sure a dataset is selected
3. Click the **Filter** tab

```
[SCREENSHOT: Query view with Filter tab selected]
```

---

## Creating Your First Filter

### Step 1: Add a Filter

Click **"+ Add Filter"** to create a new filter condition.

### Step 2: Configure the Filter

Each filter has three parts:

```
┌─────────────────────────────────────────────────────────────┐
│  Filter Condition                                    [🗑️]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Column:    [region          ▼]                             │
│                                                             │
│  Operator:  [equals          ▼]                             │
│                                                             │
│  Value:     [North            ]                             │
│                                                             │
│  [✓] Enabled                                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

| Part | What to Choose |
|------|----------------|
| **Column** | Which field to filter on |
| **Operator** | How to compare (equals, greater than, etc.) |
| **Value** | What to compare against |

### Step 3: Run the Query

Click **"Run Query"** to apply the filter and see results.

---

## Filter Operators Explained

PilotBA offers many operators for different situations:

### Comparison Operators

| Operator | Symbol | Meaning | Example |
|----------|--------|---------|---------|
| **Equals** | `=` | Exactly matches | `region = "North"` |
| **Not Equals** | `≠` | Does not match | `status ≠ "Cancelled"` |
| **Greater Than** | `>` | Larger than | `revenue > 1000` |
| **Greater or Equal** | `≥` | Larger or same | `quantity >= 10` |
| **Less Than** | `<` | Smaller than | `price < 50` |
| **Less or Equal** | `≤` | Smaller or same | `age <= 65` |

### Text Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| **Contains** | Text includes substring | `name contains "Smith"` |
| **Starts With** | Text begins with | `product starts with "Widget"` |
| **Ends With** | Text ends with | `email ends with "@company.com"` |

### Special Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| **Is Null** | Value is missing/empty | `discount is null` |
| **Is Not Null** | Value exists | `email is not null` |
| **In** | Matches any in a list | `region in "North, South, East"` |
| **Between** | Within a range (inclusive) | `price between 10 and 50` |

---

## Filtering by Data Type

Different column types work best with different operators.

### Filtering Numbers

**Best operators**: `=`, `≠`, `>`, `>=`, `<`, `<=`, `between`

**Examples**:

| Scenario | Column | Operator | Value |
|----------|--------|----------|-------|
| High-value sales | `revenue` | `>` | `5000` |
| Exact quantity | `quantity` | `=` | `100` |
| Price range | `price` | `between` | `10` and `50` |
| Non-zero values | `discount` | `≠` | `0` |

### Filtering Text

**Best operators**: `=`, `≠`, `contains`, `starts with`, `ends with`, `in`

**Examples**:

| Scenario | Column | Operator | Value |
|----------|--------|----------|-------|
| Specific region | `region` | `=` | `North` |
| Product search | `product_name` | `contains` | `Widget` |
| Multiple categories | `category` | `in` | `Electronics, Accessories` |
| Exclude status | `status` | `≠` | `Cancelled` |

### Filtering Dates

**Best operators**: `=`, `>`, `>=`, `<`, `<=`, `between`

**Examples**:

| Scenario | Column | Operator | Value |
|----------|--------|----------|-------|
| After a date | `order_date` | `>` | `2025-01-01` |
| Date range | `created_at` | `between` | `2025-01-01` and `2025-03-31` |
| Specific date | `ship_date` | `=` | `2025-06-15` |

> 💡 **Tip**: Use the format `YYYY-MM-DD` for dates (e.g., `2025-01-15`)

---

## Combining Multiple Filters

Real analysis often requires multiple conditions. PilotBA applies all enabled filters together (AND logic).

### Example: Finding High-Value North Region Sales

**Filter 1**:
- Column: `region`
- Operator: `equals`
- Value: `North`

**Filter 2**:
- Column: `revenue`
- Operator: `greater than`
- Value: `5000`

**Result**: Only rows where region is "North" AND revenue is greater than $5,000.

```
┌─────────────────────────────────────────────────────────────┐
│  Active Filters                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [✓] region equals "North"                           [🗑️]   │
│                                                             │
│  [✓] revenue > 5000                                  [🗑️]   │
│                                                             │
│  + Add Filter                                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Managing Multiple Filters

| Action | How |
|--------|-----|
| **Add filter** | Click "+ Add Filter" |
| **Remove filter** | Click the trash icon (🗑️) |
| **Disable temporarily** | Uncheck the "Enabled" checkbox |
| **Re-enable** | Check the "Enabled" checkbox |

> 💡 **Tip**: Disable filters instead of deleting them if you might need them again.

---

## Practical Examples

Let's work through common business scenarios:

### Scenario 1: Finding Top Customers

**Goal**: Find customers who have spent more than $10,000

**Setup**:
- Column: `total_purchases`
- Operator: `greater than`
- Value: `10000`

**Use case**: Identify VIP customers for special offers.

---

### Scenario 2: Regional Analysis

**Goal**: Analyze sales from East and West regions only

**Setup**:
- Column: `region`
- Operator: `in`
- Value: `East, West`

**Use case**: Compare performance across specific territories.

---

### Scenario 3: Finding Missing Data

**Goal**: Find records with missing email addresses

**Setup**:
- Column: `email`
- Operator: `is null`
- Value: (none needed)

**Use case**: Data quality check, identify records needing updates.

---

### Scenario 4: Date Range Analysis

**Goal**: Get all orders from Q1 2025

**Setup**:
- Column: `order_date`
- Operator: `between`
- Value 1: `2025-01-01`
- Value 2: `2025-03-31`

**Use case**: Quarterly reporting.

---

### Scenario 5: Product Search

**Goal**: Find all products with "Pro" in the name

**Setup**:
- Column: `product_name`
- Operator: `contains`
- Value: `Pro`

**Result**: Matches "ProWidget", "Widget Pro", "Professional Kit", etc.

**Use case**: Product category analysis.

---

### Scenario 6: Excluding Data

**Goal**: Show all orders except cancelled ones

**Setup**:
- Column: `status`
- Operator: `not equals`
- Value: `Cancelled`

**Use case**: Revenue reporting (exclude non-revenue records).

---

### Scenario 7: Complex Multi-Filter

**Goal**: Find high-value electronics sales in Q4 from the North region

**Filters**:

| # | Column | Operator | Value |
|---|--------|----------|-------|
| 1 | `category` | `equals` | `Electronics` |
| 2 | `revenue` | `greater than` | `1000` |
| 3 | `region` | `equals` | `North` |
| 4 | `order_date` | `between` | `2025-10-01` and `2025-12-31` |

**Use case**: Targeted performance analysis.

---

## The "In" Operator: Filtering Multiple Values

The `in` operator is powerful for matching multiple values at once.

### How to Use It

1. Select the column
2. Choose **"in"** as the operator
3. Enter values separated by commas

### Example

**Goal**: Show sales from North, South, and East regions (exclude West)

**Setup**:
- Column: `region`
- Operator: `in`
- Value: `North, South, East`

### Tips for "In" Operator

- Separate values with commas
- Spaces after commas are okay
- Values are case-sensitive (usually)
- Great for selecting specific categories

---

## The "Between" Operator: Range Filtering

The `between` operator finds values within a range (inclusive of both ends).

### How to Use It

1. Select the column
2. Choose **"between"** as the operator
3. Enter the minimum value
4. Enter the maximum value

### Example

**Goal**: Find products priced between $25 and $75

**Setup**:
- Column: `price`
- Operator: `between`
- Min Value: `25`
- Max Value: `75`

**Result**: Includes products at exactly $25 and $75, plus everything in between.

---

## Filter Results

After running a query with filters, you'll see:

### Results Summary

```
┌─────────────────────────────────────────────────────────────┐
│  Results                                                    │
│  ─────────                                                  │
│  Showing 234 of 12,450 rows (1.9%)                         │
│  Executed in 23ms                                          │
└─────────────────────────────────────────────────────────────┘
```

- **Row count**: How many rows match your filters
- **Percentage**: What portion of the original data
- **Execution time**: How fast the filter ran

### Results Table

The filtered data displays in a table below, showing only matching rows.

---

## Tips for Effective Filtering

### Do's ✅

- **Start broad, then narrow**: Add filters one at a time
- **Check your results**: Make sure the filter does what you expect
- **Use "between" for ranges**: Cleaner than two separate filters
- **Disable to compare**: Toggle filters to see the impact
- **Save complex filters**: Note down useful filter combinations

### Don'ts ❌

- **Don't over-filter**: Too many filters might return nothing
- **Don't forget case sensitivity**: "North" ≠ "north"
- **Don't use wrong operators**: `contains` doesn't work on numbers
- **Don't ignore null values**: They might be excluded unexpectedly

---

## Troubleshooting Filters

### "My filter returns no results"

**Possible causes**:
- Value doesn't exist in data (check spelling, case)
- Filters are too restrictive together
- Wrong operator for the data type

**Solutions**:
- Preview data to verify values exist
- Disable filters one by one to find the issue
- Check for case sensitivity

### "Filter doesn't seem to work"

**Possible causes**:
- Filter is disabled (unchecked)
- Wrong column selected
- Data type mismatch

**Solutions**:
- Ensure "Enabled" is checked
- Verify column selection
- Check column type matches operator

### "Too many results"

**Possible causes**:
- Filter is too broad
- Need additional filters

**Solutions**:
- Add more specific conditions
- Use "and" logic with multiple filters
- Narrow the value range

---

## Filter Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                  Filter Quick Reference                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  COMPARISON OPERATORS                                       │
│  ────────────────────                                       │
│  =     Equals              revenue = 1000                   │
│  ≠     Not equals          status ≠ "Cancelled"            │
│  >     Greater than        quantity > 50                    │
│  >=    Greater or equal    age >= 18                        │
│  <     Less than           price < 100                      │
│  <=    Less or equal       discount <= 0.2                  │
│                                                             │
│  TEXT OPERATORS                                             │
│  ──────────────                                             │
│  contains      product contains "Widget"                    │
│  starts with   name starts with "A"                         │
│  ends with     email ends with "@gmail.com"                 │
│                                                             │
│  SPECIAL OPERATORS                                          │
│  ─────────────────                                          │
│  is null       email is null                                │
│  is not null   phone is not null                            │
│  in            region in "North, South"                     │
│  between       date between 2025-01-01 and 2025-12-31      │
│                                                             │
│  TIPS                                                       │
│  ────                                                       │
│  • Multiple filters = AND logic                             │
│  • Disable filters to compare                               │
│  • Check case sensitivity for text                          │
│  • Use YYYY-MM-DD for dates                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## What's Next?

Now that you can filter data, learn to summarize it:

| Want to... | Read this guide |
|------------|-----------------|
| Calculate totals and averages | [Aggregation & Grouping](./07-aggregation-grouping.md) |
| Sort your results | [Query Builder Tutorial](./08-query-builder.md) |
| Visualize filtered data | [Creating Your First Chart](./04-creating-charts.md) |

---

**Next Guide**: [Aggregation & Grouping →](./07-aggregation-grouping.md)

---

*Need help? Check the [FAQ](./11-faq-troubleshooting.md) or [Glossary](./12-glossary.md)*

