# Understanding Your Data

> **⏱️ Time to complete: 10 minutes**  
> **🎯 Goal: Learn to explore dataset statistics, column types, and data quality in PilotBA**

Before diving into analysis, it's important to understand what's in your data. This guide shows you how to use PilotBA's data exploration features to get familiar with any dataset.

---

## What You'll Learn

- ✅ How to view dataset statistics
- ✅ Understanding column types and why they matter
- ✅ Identifying data quality issues
- ✅ Previewing raw data
- ✅ Making sense of the numbers

---

## Why Understanding Your Data Matters

Think of data exploration like reading the table of contents before diving into a book. It helps you:

- **Know what you're working with**: Column names, data types, size
- **Spot potential issues early**: Missing values, unexpected types
- **Choose the right analysis approach**: Different data types need different treatments
- **Avoid mistakes**: Like trying to sum text values!

---

## Accessing the Data View

1. Click **"Data"** in the sidebar navigation
2. Select a dataset from the left panel
3. You'll see three tabs: **Overview**, **Columns**, and **Preview**

```
[SCREENSHOT: Data view with the three tabs visible]
```

---

## The Overview Tab

The Overview tab gives you a bird's-eye view of your dataset.

### Quick Statistics

At the top, you'll see four key metrics:

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   12,450     │  │      8       │  │    98.5%     │  │     186      │
│    Rows      │  │   Columns    │  │ Completeness │  │ Null Values  │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

| Metric | What It Tells You |
|--------|-------------------|
| **Rows** | Total number of records in your dataset |
| **Columns** | Number of fields/variables |
| **Completeness** | Percentage of cells that have values (not empty) |
| **Null Values** | Count of missing/empty cells across all columns |

### Understanding Completeness

Completeness is calculated as:
```
Completeness = (Total Cells - Null Cells) / Total Cells × 100%
```

| Completeness | What It Means | Action Needed |
|--------------|---------------|---------------|
| **95-100%** | Excellent data quality | Good to go! |
| **80-95%** | Some missing data | Review which columns have gaps |
| **Below 80%** | Significant gaps | Investigate before analysis |

---

### Column Type Distribution

The Overview shows how your columns break down by type:

```
┌────────────────────────────────────────────────┐
│              Column Types                       │
├────────────────────────────────────────────────┤
│                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │    4     │  │    2     │  │    2     │     │
│  │ Numeric  │  │   Text   │  │  Date    │     │
│  └──────────┘  └──────────┘  └──────────┘     │
│                                                │
└────────────────────────────────────────────────┘
```

**Why this matters:**
- **Numeric columns**: Can be used for Y-axis, calculations, aggregations
- **Text columns**: Good for categories, labels, grouping
- **Date columns**: Perfect for time-based analysis

---

### Column List

Below the statistics, you'll see all columns with their types:

```
┌─────────────────────────────────────────────────┐
│  Column Name          Type                      │
├─────────────────────────────────────────────────┤
│  date                 Date                      │
│  product              Text                      │
│  quantity             Int64                     │
│  revenue              Float64                   │
│  region               Text                      │
│  salesperson          Text                      │
│  unit_price           Float64                   │
│  discount             Float64                   │
└─────────────────────────────────────────────────┘
```

---

## The Columns Tab

The Columns tab provides detailed information about each column.

### What You'll See for Each Column

```
┌─────────────────────────────────────────────────────────────┐
│  revenue                                          Float64   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Statistics                                                 │
│  ───────────                                                │
│  Count:        12,450                                       │
│  Null Count:   23 (0.2%)                                    │
│  Unique:       8,234                                        │
│                                                             │
│  For Numeric Columns:                                       │
│  ───────────────────                                        │
│  Min:          $12.50                                       │
│  Max:          $15,230.00                                   │
│  Mean:         $1,245.67                                    │
│  Median:       $890.00                                      │
│                                                             │
│  Sample Values                                              │
│  ─────────────                                              │
│  $450.00, $1,200.00, $89.50, $3,400.00, $750.00            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Column Statistics Explained

| Statistic | Meaning | Why It Matters |
|-----------|---------|----------------|
| **Count** | Number of non-null values | Shows how much data you have |
| **Null Count** | Number of missing values | Identifies data gaps |
| **Unique** | Number of distinct values | High = continuous, Low = categorical |
| **Min** | Smallest value | Spot outliers or data entry errors |
| **Max** | Largest value | Spot outliers or data entry errors |
| **Mean** | Average value | Central tendency |
| **Median** | Middle value | Less affected by outliers than mean |

---

## Understanding Data Types

PilotBA automatically detects data types. Here's what each means:

### Numeric Types

| Type | Description | Example Values |
|------|-------------|----------------|
| **Int8, Int16, Int32, Int64** | Whole numbers | `1`, `42`, `-100`, `1000000` |
| **Float32, Float64** | Decimal numbers | `3.14`, `99.99`, `-0.5` |
| **Decimal** | Precise decimals (financial) | `$1,234.56` |

**Use for**: Calculations, Y-axis in charts, aggregations (SUM, AVG)

### Text Types

| Type | Description | Example Values |
|------|-------------|----------------|
| **Utf8 / String** | Text values | `"North"`, `"Widget A"`, `"John Smith"` |

**Use for**: Categories, labels, X-axis in charts, grouping

### Date/Time Types

| Type | Description | Example Values |
|------|-------------|----------------|
| **Date** | Calendar dates | `2025-01-15` |
| **Timestamp** | Date with time | `2025-01-15 14:30:00` |

**Use for**: Time-based analysis, trends, X-axis for line charts

### Other Types

| Type | Description | Example Values |
|------|-------------|----------------|
| **Boolean** | True/False values | `true`, `false` |
| **Binary** | Raw data | (Not typically displayed) |

---

## The Preview Tab

The Preview tab shows your actual data in a table format.

### Features

- **Scrollable table**: Navigate through your data
- **Column headers**: Click to sort (if supported)
- **Row numbers**: Track your position in the data
- **Search/Filter**: Find specific values

```
[SCREENSHOT: Data preview table showing rows and columns]
```

### What to Look For

When previewing data, check for:

| Issue | What to Look For | Example |
|-------|------------------|---------|
| **Unexpected values** | Values that don't belong | Text in a number column |
| **Inconsistent formatting** | Same data, different formats | `Jan 1` vs `2025-01-01` |
| **Duplicates** | Repeated rows | Same record appearing twice |
| **Outliers** | Extreme values | Revenue of $999,999,999 |

---

## Common Data Quality Issues

### Issue 1: Missing Values (Nulls)

**What it looks like**: Empty cells, "null", "N/A", or blank spaces

**Impact**: 
- Aggregations may be inaccurate
- Charts may have gaps
- Filters may behave unexpectedly

**What to do**:
- Note which columns have missing values
- Decide: filter them out, or include with caution
- Consider if missing data is random or systematic

---

### Issue 2: Wrong Data Types

**What it looks like**: Numbers stored as text, dates as strings

**Impact**:
- Can't do math on "text" numbers
- Sorting may be alphabetical instead of numerical
- Date comparisons won't work

**Common signs**:
- Column shows as "Text" but contains numbers
- Numbers sort as: 1, 10, 2, 20 (alphabetical)
- Can't use column for Y-axis

**What to do**:
- Fix in source data before uploading
- Use consistent formatting

---

### Issue 3: Inconsistent Categories

**What it looks like**: Same thing spelled differently

**Examples**:
- `"North"`, `"north"`, `"NORTH"`, `"N"`
- `"New York"`, `"NY"`, `"New york"`

**Impact**:
- Grouping creates too many categories
- Aggregations split across variations

**What to do**:
- Clean data before uploading
- Standardize naming conventions

---

## Practical Exercise: Explore a Dataset

Let's practice with the sample sales data:

### Step 1: Upload the Sample Data

Create `sales_exploration.csv`:

```csv
date,product,category,quantity,unit_price,revenue,region,salesperson
2025-01-01,Widget A,Electronics,50,25.00,1250.00,North,Alice
2025-01-01,Widget B,Electronics,30,45.00,1350.00,South,Bob
2025-01-02,Gadget X,Accessories,100,12.00,1200.00,East,Carol
2025-01-02,Widget A,Electronics,75,25.00,1875.00,West,Dave
2025-01-03,Gadget Y,Accessories,60,18.00,1080.00,North,Alice
2025-01-03,Widget C,Electronics,,55.00,,South,Bob
2025-01-04,Widget A,Electronics,90,25.00,2250.00,East,Carol
2025-01-04,Gadget X,Accessories,120,12.00,1440.00,West,Dave
```

### Step 2: Check the Overview

1. Go to **Data** view
2. Select the dataset
3. Note: 8 rows, 8 columns

### Step 3: Spot the Issues

Look for:
- **Missing values**: Row 6 has missing `quantity` and `revenue`
- **Column types**: Are they detected correctly?

### Step 4: Examine Columns

Click the **Columns** tab:
- Which columns are numeric?
- Which are text?
- Any null counts?

### Step 5: Preview the Data

Click **Preview** tab:
- Can you see the missing values?
- Do the numbers look reasonable?

---

## Data Exploration Checklist

Before starting your analysis, run through this checklist:

### Basic Checks ✅

- [ ] How many rows and columns?
- [ ] What percentage is complete?
- [ ] Are column names clear and meaningful?

### Column Review ✅

- [ ] Are data types detected correctly?
- [ ] Which columns are numeric (for calculations)?
- [ ] Which columns are categorical (for grouping)?
- [ ] Any date columns (for time analysis)?

### Quality Check ✅

- [ ] How many null values? In which columns?
- [ ] Any obvious outliers in min/max?
- [ ] Do sample values look reasonable?

### Ready for Analysis ✅

- [ ] Do I understand what each column represents?
- [ ] Have I identified any data quality issues?
- [ ] Am I confident the data is suitable for my analysis?

---

## Tips for Data Exploration

### Do's ✅

- **Always explore before analyzing**: Know your data first
- **Check for nulls**: They affect calculations
- **Verify data types**: Ensure numbers are numbers
- **Look at sample values**: Catch obvious issues
- **Document what you find**: Note any concerns

### Don'ts ❌

- **Don't assume data is clean**: Always verify
- **Don't skip the preview**: Raw data reveals issues
- **Don't ignore warnings**: Completeness below 80% is a red flag
- **Don't proceed with bad data**: Fix issues first

---

## What's Next?

Now that you understand your data, let's work with it:

| Want to... | Read this guide |
|------------|-----------------|
| Filter to specific rows | [Data Filtering Guide](./06-data-filtering.md) |
| Calculate summaries | [Aggregation & Grouping](./07-aggregation-grouping.md) |
| Build complex queries | [Query Builder Tutorial](./08-query-builder.md) |
| Create visualizations | [Chart Types Guide](./09-chart-types.md) |

---

**Next Guide**: [Data Filtering Guide →](./06-data-filtering.md)

---

*Need help? Check the [FAQ](./11-faq-troubleshooting.md) or [Glossary](./12-glossary.md)*

