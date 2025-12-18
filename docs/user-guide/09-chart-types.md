# Chart Types Guide

> **⏱️ Time to complete: 20 minutes**  
> **🎯 Goal: Master all four chart types and know when to use each one**

Choosing the right chart type is crucial for effective data communication. This guide covers each chart type in PilotBA, explains when to use it, and provides practical examples.

---

## What You'll Learn

- ✅ The four chart types available in PilotBA
- ✅ When to use each chart type
- ✅ How to configure each chart
- ✅ Best practices for each visualization
- ✅ Common mistakes to avoid

---

## Chart Types at a Glance

| Chart | Icon | Best For | Data Requirements |
|-------|------|----------|-------------------|
| **Bar Chart** | 📊 | Comparing categories | X: Categories, Y: Numbers |
| **Line Chart** | 📈 | Trends over time | X: Time/sequence, Y: Numbers |
| **Scatter Plot** | ⚬ | Relationships | X: Numbers, Y: Numbers |
| **Heatmap** | 🟦 | Patterns in grids | X: Categories, Y: Categories, Color: Numbers |

---

## Bar Chart 📊

### What It Shows

Bar charts display data as rectangular bars where the length represents the value. They're perfect for comparing quantities across categories.

```
Revenue by Region
                                        
$150K ┤                    ████████████
      │       ████████     ████████████
$100K ┤       ████████     ████████████
      │ ████  ████████     ████████████
 $50K ┤ ████  ████████     ████████████  ████
      │ ████  ████████     ████████████  ████
   $0 ┼─────────────────────────────────────────
        North   South        East       West
```

### When to Use

✅ **Use bar charts when:**
- Comparing values across categories
- Showing rankings or standings
- Displaying survey results
- Comparing performance metrics

❌ **Avoid bar charts when:**
- You have too many categories (>15)
- Showing trends over time (use line chart)
- Showing relationships between variables (use scatter)

### Configuration

| Setting | Recommendation |
|---------|----------------|
| **X Axis** | Category column (region, product, name) |
| **Y Axis** | Numeric column (revenue, count, amount) |
| **Show Grid** | Yes, for easier value reading |

### Example Use Cases

| Scenario | X Axis | Y Axis |
|----------|--------|--------|
| Sales by region | `region` | `revenue` |
| Products by quantity | `product` | `quantity_sold` |
| Employees by department | `department` | `employee_count` |
| Survey responses | `answer` | `response_count` |

### Best Practices

1. **Order bars meaningfully**: By value (highest to lowest) or alphabetically
2. **Use consistent colors**: Same color for all bars, or color by category
3. **Start Y-axis at zero**: Don't truncate—it distorts comparisons
4. **Limit categories**: 5-12 bars is ideal; more gets crowded

---

## Line Chart 📈

### What It Shows

Line charts connect data points with lines, showing how values change over a continuous dimension (usually time).

```
Monthly Revenue Trend

$100K ┤                              ●
      │                         ●──●
 $80K ┤                    ●───●
      │               ●───●
 $60K ┤          ●───●
      │     ●───●
 $40K ┤●───●
      │
   $0 ┼─────────────────────────────────────
       Jan  Feb  Mar  Apr  May  Jun  Jul
```

### When to Use

✅ **Use line charts when:**
- Showing trends over time
- Displaying continuous data
- Comparing multiple series over time
- Highlighting patterns, cycles, or changes

❌ **Avoid line charts when:**
- Categories aren't sequential
- You have very few data points (<4)
- Comparing unrelated categories

### Configuration

| Setting | Recommendation |
|---------|----------------|
| **X Axis** | Time or sequence column (date, month, step) |
| **Y Axis** | Numeric column (value to track) |
| **Line Width** | 2px for single line, 1-2px for multiple lines |
| **Show Grid** | Yes, helps track values |

### Example Use Cases

| Scenario | X Axis | Y Axis |
|----------|--------|--------|
| Revenue over time | `date` | `revenue` |
| Website traffic | `date` | `visitors` |
| Stock price | `timestamp` | `price` |
| Temperature trend | `hour` | `temperature` |

### Best Practices

1. **Use chronological order**: Time should flow left to right
2. **Connect the dots**: Lines should be continuous
3. **Limit series**: 2-5 lines maximum; more is confusing
4. **Consider markers**: Show data points for sparse data
5. **Mind the scale**: Don't compress too much variation

### Multiple Lines

You can show multiple lines by using the Color encoding:

```
X Axis: date
Y Axis: revenue
Color: region  → Creates one line per region
```

---

## Scatter Plot ⚬

### What It Shows

Scatter plots display individual data points positioned by two numeric values, revealing relationships, clusters, and outliers.

```
Price vs. Quantity Sold

Qty │
150 ┤  ●              ●
    │    ●   ●
100 ┤      ●  ●  ●
    │  ●     ●    ●
 50 ┤    ●  ●  ●      ●
    │  ●   ●    ●       ●
  0 ┼─────────────────────────
    $0   $25   $50   $75  $100
                  Price
```

### When to Use

✅ **Use scatter plots when:**
- Exploring relationships between two variables
- Finding correlations
- Identifying clusters or groups
- Spotting outliers
- Showing distribution of data points

❌ **Avoid scatter plots when:**
- One variable is categorical (use bar chart)
- You have very few points (<10)
- Showing trends over time (use line chart)

### Configuration

| Setting | Recommendation |
|---------|----------------|
| **X Axis** | Numeric column (independent variable) |
| **Y Axis** | Numeric column (dependent variable) |
| **Color** | Optional: category or third numeric variable |
| **Size** | Optional: fourth numeric variable |
| **Point Size** | 4-8px depending on data density |
| **Opacity** | 60-80% for overlapping points |

### Example Use Cases

| Scenario | X Axis | Y Axis |
|----------|--------|--------|
| Price vs. demand | `price` | `quantity_sold` |
| Age vs. income | `age` | `income` |
| Ad spend vs. conversions | `ad_spend` | `conversions` |
| Height vs. weight | `height` | `weight` |

### Interpreting Scatter Plots

| Pattern | Meaning |
|---------|---------|
| **Upward slope** | Positive correlation (as X increases, Y increases) |
| **Downward slope** | Negative correlation (as X increases, Y decreases) |
| **No pattern** | No correlation |
| **Clusters** | Groups in your data |
| **Outliers** | Unusual data points |

### Best Practices

1. **Use appropriate point sizes**: Smaller for dense data
2. **Add transparency**: Helps see overlapping points
3. **Color by category**: Reveals group differences
4. **Size by value**: Adds a third dimension (bubble chart effect)
5. **Look for patterns**: Correlations, clusters, outliers

---

## Heatmap 🟦

### What It Shows

Heatmaps display values as colors in a grid, showing patterns across two categorical dimensions.

```
Sales by Day and Hour

      Mon   Tue   Wed   Thu   Fri
 9AM  ░░░   ░░░   ░░░   ░░░   ███
10AM  ░░░   ▒▒▒   ▒▒▒   ▒▒▒   ███
11AM  ▒▒▒   ▒▒▒   ███   ███   ███
12PM  ███   ███   ███   ███   ███
 1PM  ███   ███   ███   ███   ▒▒▒
 2PM  ▒▒▒   ▒▒▒   ▒▒▒   ▒▒▒   ▒▒▒
 3PM  ░░░   ░░░   ░░░   ░░░   ░░░

░░░ = Low    ▒▒▒ = Medium    ███ = High
```

### When to Use

✅ **Use heatmaps when:**
- Showing patterns across two categories
- Visualizing matrices or tables
- Displaying time-based patterns (day × hour)
- Showing correlation matrices
- Comparing performance across dimensions

❌ **Avoid heatmaps when:**
- You have very few categories
- Exact values are important (hard to read precisely)
- Categories aren't meaningful as a grid

### Configuration

| Setting | Recommendation |
|---------|----------------|
| **X Axis** | Category column (columns of the grid) |
| **Y Axis** | Category column (rows of the grid) |
| **Color** | Numeric column (value to show as color) |
| **Color Palette** | Choose based on data type |

### Color Palettes

PilotBA offers several color palettes:

| Palette | Best For |
|---------|----------|
| **Viridis** | General purpose, colorblind-friendly |
| **Plasma** | High contrast, dramatic |
| **Inferno** | Heat/intensity data |
| **Magma** | Dark background emphasis |
| **Turbo** | Rainbow-like, high distinction |

### Example Use Cases

| Scenario | X Axis | Y Axis | Color |
|----------|--------|--------|-------|
| Activity by time | `day_of_week` | `hour` | `transaction_count` |
| Product × Region | `product` | `region` | `sales` |
| Feature correlation | `feature_1` | `feature_2` | `correlation` |
| Website engagement | `page` | `user_segment` | `time_spent` |

### Best Practices

1. **Order categories logically**: Time should be sequential
2. **Choose appropriate colors**: Sequential for values, diverging for +/-
3. **Include a legend**: Users need to interpret colors
4. **Limit grid size**: 10×10 is comfortable; larger gets hard to read
5. **Highlight patterns**: The goal is to see trends at a glance

---

## Choosing the Right Chart

Use this decision tree:

```
┌─────────────────────────────────────────────────────────────┐
│                 Which Chart Should I Use?                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  What's your question?                                      │
│                                                             │
│  ├─ "How do categories compare?"                            │
│  │     → BAR CHART 📊                                       │
│  │                                                          │
│  ├─ "How does something change over time?"                  │
│  │     → LINE CHART 📈                                      │
│  │                                                          │
│  ├─ "Is there a relationship between two things?"           │
│  │     → SCATTER PLOT ⚬                                     │
│  │                                                          │
│  └─ "What patterns exist across two categories?"            │
│        → HEATMAP 🟦                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Quick Reference Table

| Question Type | Chart | Example |
|---------------|-------|---------|
| Compare categories | Bar | "Which region has highest sales?" |
| Show trend | Line | "How has revenue changed monthly?" |
| Find relationship | Scatter | "Does price affect quantity sold?" |
| Find patterns | Heatmap | "When are customers most active?" |

---

## Chart Configuration Options

All charts share some common options:

### Display Options

| Option | What It Does | Default |
|--------|--------------|---------|
| **Show Grid** | Background grid lines | On |
| **Show Legend** | Color/size legend | On |
| **Show Tooltip** | Hover information | On |
| **Animate** | Smooth transitions | On |

### Visual Options

| Option | What It Does | Default |
|--------|--------------|---------|
| **Opacity** | Transparency (0-100%) | 80% |
| **Point Size** | Size of scatter points | 6px |
| **Line Width** | Thickness of lines | 2px |

---

## Practical Examples

### Example 1: Sales Dashboard

**Data**: Monthly sales by region

**Charts to create**:
1. **Bar Chart**: Total sales by region (comparison)
2. **Line Chart**: Monthly trend (time series)
3. **Heatmap**: Region × Month performance (pattern)

---

### Example 2: Customer Analysis

**Data**: Customer transactions

**Charts to create**:
1. **Bar Chart**: Customers by segment (distribution)
2. **Scatter Plot**: Age vs. spending (relationship)
3. **Line Chart**: Customer growth over time (trend)

---

### Example 3: Product Performance

**Data**: Product sales data

**Charts to create**:
1. **Bar Chart**: Top 10 products by revenue
2. **Scatter Plot**: Price vs. units sold
3. **Heatmap**: Product × Region sales

---

## Common Mistakes

### Mistake 1: Wrong Chart Type

**Problem**: Using a pie chart mindset with bar charts  
**Solution**: Bar charts are better for comparing—embrace them!

### Mistake 2: Too Much Data

**Problem**: 100 bars in a bar chart  
**Solution**: Filter to top N, or use aggregation

### Mistake 3: Misleading Axes

**Problem**: Y-axis doesn't start at zero  
**Solution**: Always start numeric axes at zero for comparisons

### Mistake 4: No Clear Message

**Problem**: Chart doesn't answer a question  
**Solution**: Start with a question, then choose the chart

### Mistake 5: Poor Color Choices

**Problem**: Colors don't add meaning  
**Solution**: Use color purposefully—for categories or values

---

## Chart Types Summary

```
┌─────────────────────────────────────────────────────────────┐
│                   Chart Types Summary                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  BAR CHART 📊                                               │
│  ────────────                                               │
│  Purpose: Compare categories                                │
│  X: Categories  Y: Values                                   │
│  Example: Sales by region                                   │
│                                                             │
│  LINE CHART 📈                                              │
│  ────────────                                               │
│  Purpose: Show trends over time                             │
│  X: Time/sequence  Y: Values                                │
│  Example: Monthly revenue                                   │
│                                                             │
│  SCATTER PLOT ⚬                                             │
│  ──────────────                                             │
│  Purpose: Show relationships                                │
│  X: Numbers  Y: Numbers                                     │
│  Example: Price vs. quantity                                │
│                                                             │
│  HEATMAP 🟦                                                 │
│  ──────────                                                 │
│  Purpose: Show patterns in grids                            │
│  X: Categories  Y: Categories  Color: Values                │
│  Example: Activity by day/hour                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## What's Next?

Now that you know the chart types, learn to customize them:

| Want to... | Read this guide |
|------------|-----------------|
| Customize chart appearance | [Advanced Chart Configuration](./10-advanced-charts.md) |
| Troubleshoot issues | [FAQ & Troubleshooting](./11-faq-troubleshooting.md) |
| Review terminology | [Glossary](./12-glossary.md) |

---

**Next Guide**: [Advanced Chart Configuration →](./10-advanced-charts.md)

---

*Need help? Check the [FAQ](./11-faq-troubleshooting.md) or [Glossary](./12-glossary.md)*

