# Creating Your First Chart

> **⏱️ Time to complete: 15 minutes**  
> **🎯 Goal: Create, customize, and interact with charts in PilotBA**

Charts transform raw numbers into visual insights. This guide walks you through creating your first visualization and teaches you the fundamentals of chart creation in PilotBA.

---

## What You'll Learn

- ✅ How to create a chart from your data
- ✅ Understanding chart configuration options
- ✅ Mapping data columns to chart axes
- ✅ Interacting with your visualization
- ✅ Managing multiple charts

---

## Prerequisites

Before creating a chart, you need:
- A dataset uploaded to PilotBA (see [Uploading Your First Dataset](./03-uploading-data.md))
- At least one numeric column in your data

---

## Creating a Chart: Step by Step

### Step 1: Select Your Dataset

1. Go to the **Dashboard** view
2. Click on the dataset you want to visualize
3. The dataset card will highlight to show it's selected

```
[SCREENSHOT: Dashboard with a dataset card selected/highlighted]
```

### Step 2: Open Chart Creator

Click the **"Create Chart"** button. You'll find it:
- In the top-right corner of the Dashboard
- Or by clicking the chart icon in the navigation bar

A chart configuration panel will appear:

```
┌────────────────────────────────────────┐
│         Create Chart                   │
├────────────────────────────────────────┤
│                                        │
│  Chart Type                            │
│  ┌──────────┐ ┌──────────┐            │
│  │ 📊 Bar   │ │ 📈 Line  │            │
│  └──────────┘ └──────────┘            │
│  ┌──────────┐ ┌──────────┐            │
│  │ ⚬ Scatter│ │ 🟦 Heat  │            │
│  └──────────┘ └──────────┘            │
│                                        │
│  Chart Title                           │
│  ┌────────────────────────────────┐   │
│  │ Monthly Sales                   │   │
│  └────────────────────────────────┘   │
│                                        │
│  Data Mapping                          │
│  X Axis: [Select column ▼]            │
│  Y Axis: [Select column ▼]            │
│                                        │
│           [Create Chart]               │
│                                        │
└────────────────────────────────────────┘
```

### Step 3: Choose Chart Type

Click on one of the four chart types:

| Chart Type | Best For | Example Use Case |
|------------|----------|------------------|
| **Bar Chart** 📊 | Comparing categories | Sales by region |
| **Line Chart** 📈 | Trends over time | Monthly revenue |
| **Scatter Plot** ⚬ | Relationships | Price vs. quantity |
| **Heatmap** 🟦 | Patterns in grids | Activity by hour/day |

> 💡 **Tip**: Not sure which to choose? Start with a Bar Chart—it's the most versatile for beginners.

### Step 4: Give It a Title

Enter a descriptive title for your chart. Good titles:
- Describe what the chart shows
- Are specific but concise
- Help others understand the visualization

**Examples:**
- ✅ "Q4 Sales by Product Category"
- ✅ "Customer Age Distribution"
- ❌ "Chart 1"
- ❌ "Data"

### Step 5: Map Your Data

This is the most important step! You're telling PilotBA which columns to use for each axis.

#### X Axis (Horizontal)
Choose what appears along the bottom of your chart:
- Categories (product names, regions, months)
- Time values (dates)
- Numeric ranges

#### Y Axis (Vertical)
Choose what determines the height/position:
- Always a numeric column
- The values you want to measure

#### Example Mapping

For a "Sales by Region" bar chart:
- **X Axis**: `region` (categories: North, South, East, West)
- **Y Axis**: `revenue` (numeric values)

```
[SCREENSHOT: Chart configuration with X=region, Y=revenue selected]
```

### Step 6: Create!

Click **"Create Chart"** (or the chart may preview automatically).

Your visualization appears in the main content area! 🎉

---

## Understanding the Chart Interface

Once created, your chart has several interactive elements:

```
┌─────────────────────────────────────────────────────────────┐
│  Monthly Sales by Region                         [⚙️] [✕]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   $80K ┤                                    ████            │
│        │                          ████      ████            │
│   $60K ┤              ████        ████      ████            │
│        │    ████      ████        ████      ████            │
│   $40K ┤    ████      ████        ████      ████            │
│        │    ████      ████        ████      ████            │
│   $20K ┤    ████      ████        ████      ████            │
│        │    ████      ████        ████      ████            │
│     $0 ┼────────────────────────────────────────────────    │
│            North     South       East      West             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  X: region  |  Y: revenue  |  Type: Bar Chart              │
└─────────────────────────────────────────────────────────────┘
```

### Interface Elements

| Element | Location | Purpose |
|---------|----------|---------|
| **Title** | Top left | Identifies the chart |
| **Settings** (⚙️) | Top right | Opens configuration panel |
| **Close** (✕) | Top right | Removes the chart |
| **Chart Area** | Center | The visualization itself |
| **Footer** | Bottom | Shows current data mappings |

---

## Interacting with Your Chart

PilotBA charts are fully interactive. Here's what you can do:

### 🖱️ Hover for Details

Move your mouse over any data point to see a tooltip with exact values:

```
┌─────────────────────┐
│  Region: North      │
│  Revenue: $45,230   │
└─────────────────────┘
```

### 🔍 Zoom In and Out

- **Mouse wheel**: Scroll up to zoom in, down to zoom out
- **Pinch gesture**: On touch devices, pinch to zoom

Zooming is especially useful for:
- Large datasets with many points
- Examining specific areas in detail
- Scatter plots with overlapping points

### ✋ Pan Around

When zoomed in:
- **Click and drag** to move around the chart
- Explore different areas of your data

### 🔄 Reset View

Double-click on the chart to reset to the original view.

---

## Customizing Your Chart

After creating a chart, you can customize it further.

### Opening Chart Settings

Click the **settings icon** (⚙️) in the chart header to open the configuration panel.

### Available Options

#### Display Options

| Option | What It Does |
|--------|--------------|
| **Show Grid** | Display/hide background grid lines |
| **Show Legend** | Display/hide the legend |
| **Show Tooltip** | Enable/disable hover tooltips |
| **Animate** | Enable/disable animations |

#### Visual Options

| Option | What It Does | Available For |
|--------|--------------|---------------|
| **Opacity** | Transparency of elements (0-100%) | All charts |
| **Point Size** | Size of data points | Scatter plots |
| **Line Width** | Thickness of lines | Line charts |

#### Color Options

For scatter plots and heatmaps, you can map a third column to color:
- Select a numeric column from the **Color** dropdown
- Values will be represented by color intensity

---

## Changing Data Mappings

Need to switch columns? No problem:

1. Click the **settings icon** (⚙️)
2. In the **Data Mapping** section, select different columns
3. The chart updates automatically

This is great for exploring different perspectives on your data without creating new charts.

---

## Managing Multiple Charts

### Creating Additional Charts

1. Click **"Create Chart"** again
2. Configure your new chart
3. Both charts appear in the Charts view

### Switching Between Charts

In the **Charts** tab of the Dashboard:
1. See all your charts listed in the sidebar
2. Click a chart name to view it
3. The selected chart displays in the main area

### Deleting a Chart

1. In the chart list, hover over the chart name
2. Click the **X** icon
3. The chart is removed

> ⚠️ **Note**: Deleting a chart cannot be undone, but you can always recreate it.

---

## Practical Examples

Let's create charts for common business scenarios:

### Example 1: Sales by Product (Bar Chart)

**Scenario**: You want to see which products generate the most revenue.

**Setup**:
- Chart Type: **Bar Chart**
- X Axis: `product`
- Y Axis: `revenue`

**Result**: Bars showing revenue for each product, making it easy to spot top performers.

---

### Example 2: Revenue Trend (Line Chart)

**Scenario**: You want to see how revenue changes over time.

**Setup**:
- Chart Type: **Line Chart**
- X Axis: `date`
- Y Axis: `revenue`

**Result**: A line showing revenue progression, revealing trends and patterns.

---

### Example 3: Price vs. Quantity (Scatter Plot)

**Scenario**: You want to understand the relationship between price and quantity sold.

**Setup**:
- Chart Type: **Scatter Plot**
- X Axis: `unit_price`
- Y Axis: `quantity`
- Color (optional): `category`

**Result**: Points showing each product, revealing if higher prices correlate with lower quantities.

---

### Example 4: Sales Activity Heatmap

**Scenario**: You want to see when sales activity is highest.

**Setup**:
- Chart Type: **Heatmap**
- X Axis: `day_of_week`
- Y Axis: `hour`
- Color: `transaction_count`

**Result**: A grid showing activity intensity, highlighting peak times.

---

## Tips for Effective Charts

### Do's ✅

- **Match chart type to your question**: Bar for comparison, Line for trends
- **Use clear titles**: Describe what the chart shows
- **Start with simple mappings**: Add complexity gradually
- **Experiment**: Try different chart types with the same data

### Don'ts ❌

- **Don't overcrowd**: Too many data points can be confusing
- **Don't use pie charts for many categories**: (PilotBA doesn't have them for this reason!)
- **Don't ignore axis labels**: Make sure they make sense
- **Don't forget context**: A chart without context is just shapes

---

## Troubleshooting

### "I don't see any data in my chart"

**Possible causes**:
- No column selected for X or Y axis
- Y axis column doesn't contain numbers
- Data has been filtered to zero rows

**Solutions**:
- Check that both axes have columns selected
- Ensure Y axis is a numeric column
- Check if any filters are applied

### "My chart looks wrong"

**Possible causes**:
- Wrong column selected
- Data types not detected correctly

**Solutions**:
- Double-check your axis selections
- View your data in the Data tab to verify values

### "The chart is slow"

**Possible causes**:
- Very large dataset
- Too many data points

**Solutions**:
- Filter your data first
- Use aggregation to reduce data points
- Consider sampling (covered in advanced guides)

---

## What's Next?

You've created your first chart! Here's where to go next:

| Want to... | Read this guide |
|------------|-----------------|
| Learn about each chart type in detail | [Chart Types Guide](./09-chart-types.md) |
| Filter data before charting | [Data Filtering Guide](./06-data-filtering.md) |
| Create summary statistics | [Aggregation & Grouping](./07-aggregation-grouping.md) |
| Understand your data better | [Understanding Your Data](./05-understanding-data.md) |

---

## Quick Reference

```
┌─────────────────────────────────────────────────────────────┐
│              Chart Creation Quick Reference                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CHART TYPES                                                │
│  ───────────                                                │
│  Bar Chart    → Compare categories                          │
│  Line Chart   → Show trends over time                       │
│  Scatter Plot → Show relationships                          │
│  Heatmap      → Show patterns in grids                      │
│                                                             │
│  INTERACTIONS                                               │
│  ────────────                                               │
│  Hover        → See exact values                            │
│  Scroll       → Zoom in/out                                 │
│  Drag         → Pan when zoomed                             │
│  Double-click → Reset view                                  │
│                                                             │
│  AXIS MAPPING                                               │
│  ────────────                                               │
│  X Axis       → Categories, dates, or ranges                │
│  Y Axis       → Numeric values (measurements)               │
│  Color        → Optional third dimension                    │
│  Size         → Optional fourth dimension (scatter only)    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

**Next Guide**: [Understanding Your Data →](./05-understanding-data.md)

---

*Need help? Check the [FAQ](./11-faq-troubleshooting.md) or [Glossary](./12-glossary.md)*

