# Query Builder Tutorial

> **⏱️ Time to complete: 25 minutes**  
> **🎯 Goal: Master the Query Builder to create powerful data transformations**

The Query Builder is where filtering, aggregation, and sorting come together. This tutorial walks you through building complete queries from start to finish, with real-world examples you can follow along with.

---

## What You'll Learn

- ✅ How to use the Query Builder interface
- ✅ Combining filters, aggregations, and sorts
- ✅ Building queries step-by-step
- ✅ Understanding query execution
- ✅ Saving and reusing query results

---

## The Query Builder Interface

The Query Builder has three main sections:

```
┌─────────────────────────────────────────────────────────────────┐
│  Query Builder                              [Reset] [Run Query] │
├──────────────────────┬──────────────────────────────────────────┤
│                      │                                          │
│   BUILDER PANEL      │           RESULTS PANEL                  │
│                      │                                          │
│  ┌────────────────┐  │   ┌────────────────────────────────────┐ │
│  │ Filter    (2)  │  │   │ Results                            │ │
│  │ Aggregate (3)  │  │   │ 234 rows × 4 columns               │ │
│  │ Sort      (1)  │  │   │ Executed in 23ms                   │ │
│  └────────────────┘  │   ├────────────────────────────────────┤ │
│                      │   │                                    │ │
│  [Filter conditions] │   │   [Results table]                  │ │
│  [Aggregations]      │   │                                    │ │
│  [Sort options]      │   │                                    │ │
│                      │   │                                    │ │
└──────────────────────┴──────────────────────────────────────────┘
```

### Builder Panel (Left)

Three tabs for building your query:
- **Filter**: Narrow down rows
- **Aggregate**: Summarize data
- **Sort**: Order results

### Results Panel (Right)

Shows the output of your query:
- Row and column count
- Execution time
- Data table with results

---

## Query Execution Order

Understanding the order helps you build better queries:

```
┌─────────────────────────────────────────────────────────────┐
│                    Query Execution Order                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   1. SOURCE DATA                                            │
│      Your original dataset (e.g., 10,000 rows)              │
│                          ↓                                  │
│   2. FILTER                                                 │
│      Remove rows that don't match (e.g., 3,000 rows left)   │
│                          ↓                                  │
│   3. AGGREGATE (GROUP BY + Functions)                       │
│      Summarize into groups (e.g., 50 rows)                  │
│                          ↓                                  │
│   4. SORT                                                   │
│      Order the results (still 50 rows)                      │
│                          ↓                                  │
│   5. RESULTS                                                │
│      Final output displayed in table                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Tutorial 1: Basic Sales Report

Let's build a query to answer: **"What are total sales by region?"**

### Sample Data

Use this data for the tutorial (save as `sales_tutorial.csv`):

```csv
order_id,date,region,product,category,quantity,unit_price,revenue,salesperson
1001,2025-01-15,North,Widget A,Electronics,10,25.00,250.00,Alice
1002,2025-01-15,South,Widget B,Electronics,5,45.00,225.00,Bob
1003,2025-01-16,North,Gadget X,Accessories,15,12.00,180.00,Alice
1004,2025-01-16,East,Widget C,Electronics,8,55.00,440.00,Carol
1005,2025-01-17,West,Widget A,Electronics,12,25.00,300.00,Dave
1006,2025-01-17,North,Gadget Y,Accessories,20,18.00,360.00,Alice
1007,2025-01-18,South,Widget B,Electronics,7,45.00,315.00,Bob
1008,2025-01-18,East,Widget A,Electronics,10,25.00,250.00,Carol
1009,2025-01-19,West,Gadget X,Accessories,25,12.00,300.00,Dave
1010,2025-01-19,North,Widget C,Electronics,6,55.00,330.00,Eve
```

### Step 1: Upload the Data

1. Go to Dashboard
2. Upload `sales_tutorial.csv`
3. Verify: 10 rows, 9 columns

### Step 2: Open Query Builder

1. Click **"Query"** in the sidebar
2. Ensure your dataset is selected

### Step 3: Add Aggregation

1. Click the **Aggregate** tab
2. Click **"+ Add Aggregation"**
3. Configure:
   - Function: **Group By**
   - Column: **region**

4. Click **"+ Add Aggregation"** again
5. Configure:
   - Function: **SUM**
   - Column: **revenue**
   - Alias: **total_revenue**

### Step 4: Run the Query

Click **"Run Query"**

### Expected Result

```
┌──────────┬───────────────┐
│ region   │ total_revenue │
├──────────┼───────────────┤
│ North    │ 1120.00       │
│ South    │ 540.00        │
│ East     │ 690.00        │
│ West     │ 600.00        │
└──────────┴───────────────┘
```

🎉 **Congratulations!** You've built your first query!

---

## Tutorial 2: Filtered Report

**Question**: "What are sales by salesperson for Electronics only?"

### Step 1: Add a Filter

1. Click the **Filter** tab
2. Click **"+ Add Filter"**
3. Configure:
   - Column: **category**
   - Operator: **equals**
   - Value: **Electronics**

### Step 2: Add Aggregations

1. Click the **Aggregate** tab
2. Add Group By: **salesperson**
3. Add SUM: **revenue** → **electronics_sales**
4. Add COUNT: **order_id** → **num_orders**

### Step 3: Run the Query

Click **"Run Query"**

### Expected Result

```
┌─────────────┬──────────────────┬────────────┐
│ salesperson │ electronics_sales │ num_orders │
├─────────────┼──────────────────┼────────────┤
│ Alice       │ 250.00           │ 1          │
│ Bob         │ 540.00           │ 2          │
│ Carol       │ 690.00           │ 2          │
│ Dave        │ 300.00           │ 1          │
│ Eve         │ 330.00           │ 1          │
└─────────────┴──────────────────┴────────────┘
```

---

## Tutorial 3: Sorted Results

**Question**: "Which regions have the highest average order value?"

### Step 1: Clear Previous Query

Click **"Reset"** to start fresh.

### Step 2: Build the Query

**Aggregate Tab**:
1. Group By: **region**
2. AVG: **revenue** → **avg_order_value**
3. COUNT: **order_id** → **order_count**

**Sort Tab**:
1. Click **"+ Add Sort"**
2. Configure:
   - Column: **avg_order_value**
   - Direction: **Descending** (highest first)

### Step 3: Run the Query

### Expected Result

```
┌──────────┬─────────────────┬─────────────┐
│ region   │ avg_order_value │ order_count │
├──────────┼─────────────────┼─────────────┤
│ East     │ 345.00          │ 2           │
│ North    │ 280.00          │ 4           │
│ West     │ 300.00          │ 2           │
│ South    │ 270.00          │ 2           │
└──────────┴─────────────────┴─────────────┘
```

---

## Tutorial 4: Complex Multi-Step Query

**Question**: "For orders over $200, what's the total revenue by product category, sorted by revenue?"

This combines all three query components!

### Step 1: Add Filter

**Filter Tab**:
- Column: **revenue**
- Operator: **greater than**
- Value: **200**

### Step 2: Add Aggregations

**Aggregate Tab**:
1. Group By: **category**
2. SUM: **revenue** → **total_revenue**
3. AVG: **revenue** → **avg_revenue**
4. COUNT: **order_id** → **num_orders**

### Step 3: Add Sort

**Sort Tab**:
- Column: **total_revenue**
- Direction: **Descending**

### Step 4: Run the Query

### Expected Result

```
┌─────────────┬───────────────┬─────────────┬────────────┐
│ category    │ total_revenue │ avg_revenue │ num_orders │
├─────────────┼───────────────┼─────────────┼────────────┤
│ Electronics │ 2110.00       │ 301.43      │ 7          │
│ Accessories │ 660.00        │ 330.00      │ 2          │
└─────────────┴───────────────┴─────────────┴────────────┘
```

---

## The Sort Builder

### Adding Sorts

1. Click the **Sort** tab
2. Click **"+ Add Sort"**
3. Choose:
   - **Column**: Which column to sort by
   - **Direction**: Ascending (A→Z, 0→9) or Descending (Z→A, 9→0)

### Multiple Sorts

You can add multiple sort levels. The first sort has priority.

**Example**: Sort by region (A→Z), then by revenue (high→low)

```
┌─────────────────────────────────────────────────────────────┐
│  Sort Order                                                 │
├─────────────────────────────────────────────────────────────┤
│  1. region        Ascending   (Primary sort)         [🗑️]   │
│  2. total_revenue Descending  (Secondary sort)       [🗑️]   │
│                                                             │
│  + Add Sort                                                 │
└─────────────────────────────────────────────────────────────┘
```

### Sort Direction Guide

| Data Type | Ascending | Descending |
|-----------|-----------|------------|
| **Numbers** | 1, 2, 3, ... | ..., 3, 2, 1 |
| **Text** | A, B, C, ... | ..., C, B, A |
| **Dates** | Oldest first | Newest first |

---

## Working with Query Results

### Understanding the Results Panel

After running a query, you'll see:

```
┌─────────────────────────────────────────────────────────────┐
│  Results                                                    │
│  ─────────                                                  │
│  234 rows × 4 columns                                       │
│  Executed in 23ms                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Interactive data table with results]                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### What You Can Do with Results

| Action | How |
|--------|-----|
| **Scroll** | Navigate through rows |
| **Resize columns** | Drag column borders |
| **View full values** | Hover over truncated text |

---

## Query Building Best Practices

### Start Simple, Add Complexity

```
Step 1: Just aggregation → Verify it works
Step 2: Add filter → Verify it works
Step 3: Add sort → Verify it works
```

### Use Reset Wisely

- **Reset** clears ALL query components
- Useful when starting a new question
- Disable individual components instead of resetting if you want to compare

### Check Row Counts

Watch how row counts change:
- After filter: Rows should decrease
- After aggregation: Usually fewer rows (grouped)
- After sort: Same rows, different order

### Name Your Columns

Always use aliases for aggregations:
- ❌ `sum_1`, `avg_2`
- ✅ `total_revenue`, `avg_order_value`

---

## Common Query Patterns

### Pattern 1: Top N Analysis

**Question**: "What are the top 5 products by revenue?"

```
Aggregate:
  - Group By: product
  - SUM: revenue → total_revenue

Sort:
  - total_revenue, Descending

(Take first 5 rows from results)
```

---

### Pattern 2: Time-Based Analysis

**Question**: "Monthly sales trend"

```
Aggregate:
  - Group By: month (or date column)
  - SUM: revenue → monthly_revenue
  - COUNT: order_id → num_orders

Sort:
  - month, Ascending
```

---

### Pattern 3: Comparison Analysis

**Question**: "Compare Electronics vs Accessories performance"

```
Filter:
  - category IN "Electronics, Accessories"

Aggregate:
  - Group By: category
  - SUM: revenue → total_revenue
  - AVG: revenue → avg_order
  - COUNT: order_id → order_count
```

---

### Pattern 4: Threshold Analysis

**Question**: "High-value customers (spent > $1000)"

```
Aggregate:
  - Group By: customer_id
  - SUM: revenue → lifetime_value

Filter (post-aggregation concept):
  - Look at results where lifetime_value > 1000
```

---

### Pattern 5: Multi-Dimensional Analysis

**Question**: "Sales by region and category"

```
Aggregate:
  - Group By: region
  - Group By: category
  - SUM: revenue → total_revenue

Sort:
  - region, Ascending
  - total_revenue, Descending
```

---

## Troubleshooting Queries

### "Run Query button is disabled"

**Cause**: No operations added  
**Solution**: Add at least one filter, aggregation, or sort

### "Query returns no results"

**Causes**:
- Filters too restrictive
- No data matches conditions

**Solutions**:
- Disable filters one by one
- Check filter values for typos
- Verify data exists in the column

### "Results don't look right"

**Causes**:
- Wrong column selected
- Aggregation applied to wrong field
- Missing Group By

**Solutions**:
- Review each query component
- Check column names carefully
- Ensure Group By is added before aggregations

### "Query is slow"

**Causes**:
- Large dataset
- Complex aggregations
- No filters applied

**Solutions**:
- Add filters to reduce data first
- Simplify aggregations
- Consider sampling (advanced)

---

## Query Builder Workflow

Here's a recommended workflow for building queries:

```
┌─────────────────────────────────────────────────────────────┐
│                   Query Building Workflow                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. DEFINE YOUR QUESTION                                    │
│     "What do I want to know?"                               │
│                          ↓                                  │
│  2. IDENTIFY NEEDED COLUMNS                                 │
│     Which columns answer the question?                      │
│                          ↓                                  │
│  3. DETERMINE FILTERS                                       │
│     What data should be included/excluded?                  │
│                          ↓                                  │
│  4. PLAN AGGREGATIONS                                       │
│     What summaries are needed?                              │
│     What should be grouped?                                 │
│                          ↓                                  │
│  5. DECIDE SORT ORDER                                       │
│     How should results be ordered?                          │
│                          ↓                                  │
│  6. BUILD & TEST                                            │
│     Build incrementally, test each step                     │
│                          ↓                                  │
│  7. REFINE                                                  │
│     Adjust based on results                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Practice Exercises

Try these on your own with the sample data:

### Exercise 1: Product Analysis
**Question**: What's the total quantity sold for each product?

<details>
<summary>Click to see solution</summary>

```
Aggregate:
  - Group By: product
  - SUM: quantity → total_quantity
```
</details>

---

### Exercise 2: Salesperson Performance
**Question**: Who has the highest average order value?

<details>
<summary>Click to see solution</summary>

```
Aggregate:
  - Group By: salesperson
  - AVG: revenue → avg_order_value

Sort:
  - avg_order_value, Descending
```
</details>

---

### Exercise 3: Regional Electronics
**Question**: What are total Electronics sales by region, sorted highest to lowest?

<details>
<summary>Click to see solution</summary>

```
Filter:
  - category equals "Electronics"

Aggregate:
  - Group By: region
  - SUM: revenue → electronics_revenue

Sort:
  - electronics_revenue, Descending
```
</details>

---

## What's Next?

You've mastered the Query Builder! Now visualize your results:

| Want to... | Read this guide |
|------------|-----------------|
| Create charts from query results | [Chart Types Guide](./09-chart-types.md) |
| Customize visualizations | [Advanced Chart Configuration](./10-advanced-charts.md) |
| Troubleshoot issues | [FAQ & Troubleshooting](./11-faq-troubleshooting.md) |

---

**Next Guide**: [Chart Types Guide →](./09-chart-types.md)

---

*Need help? Check the [FAQ](./11-faq-troubleshooting.md) or [Glossary](./12-glossary.md)*

