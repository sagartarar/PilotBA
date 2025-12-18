# Aggregation & Grouping

> **⏱️ Time to complete: 20 minutes**  
> **🎯 Goal: Learn to summarize data with SUM, AVG, COUNT, and GROUP BY operations**

Raw data tells individual stories. Aggregation tells the big picture. This guide teaches you how to summarize thousands of rows into meaningful insights—like total sales by region, average order value by customer, or count of transactions by day.

---

## What You'll Learn

- ✅ What aggregation means and when to use it
- ✅ Understanding aggregation functions (SUM, AVG, COUNT, etc.)
- ✅ Grouping data by categories
- ✅ Combining multiple aggregations
- ✅ Real-world examples and use cases

---

## What is Aggregation?

Aggregation means **combining multiple values into a single summary value**.

### Before Aggregation (Raw Data)

```
┌──────────────┬────────────┬───────────┐
│ Region       │ Product    │ Revenue   │
├──────────────┼────────────┼───────────┤
│ North        │ Widget A   │ $1,200    │
│ North        │ Widget B   │ $800      │
│ North        │ Widget A   │ $1,500    │
│ South        │ Widget A   │ $2,100    │
│ South        │ Widget B   │ $950      │
│ ...          │ ...        │ ...       │
└──────────────┴────────────┴───────────┘
(10,000 rows)
```

### After Aggregation (Summary)

```
┌──────────────┬─────────────────┐
│ Region       │ Total Revenue   │
├──────────────┼─────────────────┤
│ North        │ $125,000        │
│ South        │ $98,000         │
│ East         │ $112,000        │
│ West         │ $89,000         │
└──────────────┴─────────────────┘
(4 rows)
```

**The power**: 10,000 rows became 4 meaningful insights!

---

## Accessing the Aggregation Builder

1. Go to the **Query** view
2. Click the **Aggregate** tab
3. Make sure a dataset is selected

```
[SCREENSHOT: Query view with Aggregate tab selected]
```

---

## Aggregation Functions

PilotBA supports six aggregation functions:

| Function | What It Does | Example Result |
|----------|--------------|----------------|
| **SUM** | Adds all values together | Total revenue: $424,000 |
| **AVG** | Calculates the average (mean) | Average order: $85.50 |
| **COUNT** | Counts number of rows | Number of orders: 4,965 |
| **MIN** | Finds the smallest value | Lowest price: $12.99 |
| **MAX** | Finds the largest value | Highest sale: $15,230 |
| **COUNT DISTINCT** | Counts unique values | Unique customers: 1,247 |

---

## Creating Your First Aggregation

### Step 1: Add an Aggregation

Click **"+ Add Aggregation"** in the Aggregate tab.

### Step 2: Configure the Aggregation

```
┌─────────────────────────────────────────────────────────────┐
│  Aggregation                                         [🗑️]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Function:  [SUM            ▼]                              │
│                                                             │
│  Column:    [revenue        ▼]                              │
│                                                             │
│  Alias:     [total_revenue   ]  (optional name for result)  │
│                                                             │
│  [✓] Enabled                                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

| Field | What to Enter |
|-------|---------------|
| **Function** | Which calculation to perform |
| **Column** | Which column to aggregate |
| **Alias** | Name for the result column (optional but recommended) |

### Step 3: Run the Query

Click **"Run Query"** to see your aggregated result.

---

## Grouping: The Power of GROUP BY

Aggregation becomes truly powerful when combined with grouping. Instead of one total, you get totals for each category.

### Without Grouping

```
Total Revenue: $424,000
```

### With Grouping by Region

```
┌──────────────┬─────────────────┐
│ Region       │ Total Revenue   │
├──────────────┼─────────────────┤
│ North        │ $125,000        │
│ South        │ $98,000         │
│ East         │ $112,000        │
│ West         │ $89,000         │
└──────────────┴─────────────────┘
```

### How to Add Grouping

1. In the Aggregate tab, click **"+ Add Aggregation"**
2. Set **Function** to **"Group By"**
3. Select the column to group by

```
┌─────────────────────────────────────────────────────────────┐
│  Group By                                            [🗑️]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Function:  [Group By       ▼]                              │
│                                                             │
│  Column:    [region         ▼]                              │
│                                                             │
│  [✓] Enabled                                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Complete Example: Sales Analysis

Let's build a complete aggregation query step by step.

### Goal
Calculate total revenue and average order value by region.

### Sample Data

```csv
order_id,date,region,product,quantity,unit_price,revenue
1001,2025-01-15,North,Widget A,10,25.00,250.00
1002,2025-01-15,South,Widget B,5,45.00,225.00
1003,2025-01-16,North,Widget A,15,25.00,375.00
1004,2025-01-16,East,Widget C,8,55.00,440.00
1005,2025-01-17,West,Widget B,12,45.00,540.00
...
```

### Step 1: Add Group By

- Function: **Group By**
- Column: **region**

### Step 2: Add SUM Aggregation

- Function: **SUM**
- Column: **revenue**
- Alias: **total_revenue**

### Step 3: Add AVG Aggregation

- Function: **AVG**
- Column: **revenue**
- Alias: **avg_order_value**

### Step 4: Add COUNT Aggregation

- Function: **COUNT**
- Column: **order_id**
- Alias: **order_count**

### Result

```
┌──────────┬───────────────┬─────────────────┬─────────────┐
│ region   │ total_revenue │ avg_order_value │ order_count │
├──────────┼───────────────┼─────────────────┼─────────────┤
│ North    │ $125,340      │ $342.50         │ 366         │
│ South    │ $98,220       │ $298.75         │ 329         │
│ East     │ $112,890      │ $315.20         │ 358         │
│ West     │ $89,550       │ $285.40         │ 314         │
└──────────┴───────────────┴─────────────────┴─────────────┘
```

---

## Aggregation Functions in Detail

### SUM - Adding Values Together

**Use when**: You want a total

**Examples**:
- Total revenue
- Total quantity sold
- Total hours worked

```
SUM(revenue) → $424,000
SUM(quantity) → 15,230 units
```

**Important**: Only works on numeric columns!

---

### AVG - Calculating Averages

**Use when**: You want the typical value

**Examples**:
- Average order value
- Average customer age
- Average response time

```
AVG(revenue) → $85.50
AVG(quantity) → 12.3 units
```

**Tip**: AVG ignores null values in the calculation.

---

### COUNT - Counting Rows

**Use when**: You want to know "how many"

**Examples**:
- Number of orders
- Number of customers
- Number of products

```
COUNT(order_id) → 4,965 orders
COUNT(*) → 4,965 rows
```

**Tip**: COUNT counts rows, even if some values are null.

---

### MIN - Finding the Smallest

**Use when**: You want the lowest value

**Examples**:
- Lowest price
- Earliest date
- Minimum quantity

```
MIN(price) → $12.99
MIN(order_date) → 2025-01-01
```

---

### MAX - Finding the Largest

**Use when**: You want the highest value

**Examples**:
- Highest sale
- Latest date
- Maximum quantity

```
MAX(revenue) → $15,230
MAX(order_date) → 2025-12-31
```

---

### COUNT DISTINCT - Counting Unique Values

**Use when**: You want to know how many different values exist

**Examples**:
- Number of unique customers
- Number of different products sold
- Number of distinct regions

```
COUNT DISTINCT(customer_id) → 1,247 unique customers
COUNT DISTINCT(product) → 45 different products
```

---

## Multiple Group By Columns

You can group by multiple columns for more detailed breakdowns.

### Example: Revenue by Region AND Product

**Group By**:
1. `region`
2. `product`

**Aggregate**:
- SUM(`revenue`) as `total_revenue`

**Result**:

```
┌──────────┬────────────┬───────────────┐
│ region   │ product    │ total_revenue │
├──────────┼────────────┼───────────────┤
│ North    │ Widget A   │ $45,230       │
│ North    │ Widget B   │ $38,110       │
│ North    │ Widget C   │ $42,000       │
│ South    │ Widget A   │ $32,450       │
│ South    │ Widget B   │ $35,770       │
│ ...      │ ...        │ ...           │
└──────────┴────────────┴───────────────┘
```

---

## Practical Scenarios

### Scenario 1: Monthly Sales Report

**Goal**: Total and average sales by month

**Setup**:
- Group By: `month` (or extract month from date)
- SUM: `revenue` → `monthly_total`
- AVG: `revenue` → `avg_sale`
- COUNT: `order_id` → `num_orders`

**Use case**: Monthly performance tracking

---

### Scenario 2: Top Salespeople

**Goal**: Who sold the most?

**Setup**:
- Group By: `salesperson`
- SUM: `revenue` → `total_sales`
- COUNT: `order_id` → `deals_closed`

**Use case**: Sales team performance review

---

### Scenario 3: Product Performance

**Goal**: Which products are bestsellers?

**Setup**:
- Group By: `product`
- SUM: `quantity` → `units_sold`
- SUM: `revenue` → `total_revenue`
- AVG: `unit_price` → `avg_price`

**Use case**: Inventory and pricing decisions

---

### Scenario 4: Customer Analysis

**Goal**: Customer spending patterns

**Setup**:
- Group By: `customer_id`
- SUM: `revenue` → `lifetime_value`
- COUNT: `order_id` → `num_orders`
- AVG: `revenue` → `avg_order`
- MIN: `order_date` → `first_order`
- MAX: `order_date` → `last_order`

**Use case**: Customer segmentation

---

### Scenario 5: Regional Category Analysis

**Goal**: How do product categories perform in each region?

**Setup**:
- Group By: `region`, `category`
- SUM: `revenue` → `total_revenue`
- COUNT: `order_id` → `order_count`

**Use case**: Regional marketing strategy

---

## Combining Filters with Aggregation

You can filter data BEFORE aggregating. This is powerful!

### Example: Q4 Sales by Region

**Step 1: Filter**
- Column: `order_date`
- Operator: `between`
- Values: `2025-10-01` and `2025-12-31`

**Step 2: Aggregate**
- Group By: `region`
- SUM: `revenue` → `q4_revenue`

**Result**: Total revenue by region, but only for Q4 orders.

---

## Understanding the Order of Operations

PilotBA processes your query in this order:

```
1. FILTER    → Remove rows that don't match conditions
      ↓
2. GROUP BY  → Organize remaining rows into groups
      ↓
3. AGGREGATE → Calculate SUM, AVG, etc. for each group
      ↓
4. SORT      → Order the results (if specified)
```

**Why this matters**: Filters reduce data BEFORE aggregation, making queries faster and results more focused.

---

## Tips for Effective Aggregation

### Do's ✅

- **Name your results**: Use aliases like `total_revenue` instead of `sum_1`
- **Start simple**: One aggregation, then add more
- **Combine with filters**: Aggregate only the data you need
- **Group thoughtfully**: Choose grouping columns that make business sense
- **Verify results**: Spot-check totals against known values

### Don'ts ❌

- **Don't aggregate text columns** (except with COUNT)
- **Don't forget grouping**: Without GROUP BY, you get one row
- **Don't over-group**: Too many group columns = too many rows
- **Don't ignore nulls**: They can affect AVG and COUNT differently

---

## Common Mistakes and Solutions

### Mistake 1: "My SUM is wrong"

**Cause**: Aggregating the wrong column, or data has duplicates

**Solution**: 
- Verify you selected the correct column
- Check for duplicate rows in source data
- Use COUNT to verify row counts

### Mistake 2: "I get too many rows"

**Cause**: Grouping by a column with many unique values

**Solution**:
- Group by fewer columns
- Group by broader categories
- Filter data first

### Mistake 3: "AVG doesn't match my calculation"

**Cause**: AVG ignores null values

**Solution**:
- Check for null values in the column
- Decide if nulls should be treated as zero
- Filter out nulls if needed

---

## Aggregation Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│              Aggregation Quick Reference                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FUNCTIONS                                                  │
│  ─────────                                                  │
│  SUM            Add all values         SUM(revenue)         │
│  AVG            Calculate average      AVG(price)           │
│  COUNT          Count rows             COUNT(order_id)      │
│  MIN            Find smallest          MIN(date)            │
│  MAX            Find largest           MAX(quantity)        │
│  COUNT DISTINCT Count unique values    COUNT DISTINCT(cust) │
│                                                             │
│  GROUP BY                                                   │
│  ────────                                                   │
│  • Creates separate calculations for each category          │
│  • Can group by multiple columns                            │
│  • Always add before aggregation functions                  │
│                                                             │
│  BEST PRACTICES                                             │
│  ──────────────                                             │
│  • Use meaningful aliases                                   │
│  • Filter before aggregating                                │
│  • Verify results with spot checks                          │
│  • Start simple, add complexity                             │
│                                                             │
│  COMMON COMBINATIONS                                        │
│  ───────────────────                                        │
│  Sales Report:    GROUP BY month + SUM(revenue)             │
│  Customer Value:  GROUP BY customer + SUM(revenue)          │
│  Product Mix:     GROUP BY product + COUNT(orders)          │
│  Regional:        GROUP BY region + AVG(price)              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## What's Next?

You've mastered aggregation! Continue building your skills:

| Want to... | Read this guide |
|------------|-----------------|
| Combine filter, aggregate, and sort | [Query Builder Tutorial](./08-query-builder.md) |
| Visualize aggregated data | [Chart Types Guide](./09-chart-types.md) |
| Learn about all chart options | [Advanced Chart Configuration](./10-advanced-charts.md) |

---

**Next Guide**: [Query Builder Tutorial →](./08-query-builder.md)

---

*Need help? Check the [FAQ](./11-faq-troubleshooting.md) or [Glossary](./12-glossary.md)*

