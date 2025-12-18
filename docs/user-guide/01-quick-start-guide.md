# Quick Start Guide

> **⏱️ Time to complete: 5 minutes**  
> **🎯 Goal: Create your first data visualization in PilotBA**

Welcome to PilotBA! This guide will get you from zero to your first chart in just 5 minutes. No prior experience needed—let's dive in!

---

## What You'll Accomplish

By the end of this guide, you'll have:
- ✅ Opened PilotBA in your browser
- ✅ Uploaded a sample dataset
- ✅ Created an interactive bar chart
- ✅ Explored your data visually

---

## Step 1: Open PilotBA

Open your web browser and navigate to:

```
http://localhost:3000
```

> 💡 **Tip**: PilotBA works best in Chrome, Firefox, or Edge. Make sure you're using a modern browser for the best experience.

You should see the PilotBA welcome screen:

```
[SCREENSHOT: PilotBA welcome screen with "Welcome to PilotBA" heading and upload area]
```

---

## Step 2: Download Sample Data

For this quick start, we'll use a simple sales dataset. Create a file called `quick_start_sales.csv` with this content:

```csv
month,sales,region,product
January,45000,North,Widget A
February,52000,North,Widget A
March,48000,North,Widget A
April,61000,South,Widget B
May,58000,South,Widget B
June,72000,South,Widget B
July,43000,East,Widget A
August,51000,East,Widget A
September,67000,East,Widget B
October,78000,West,Widget B
November,82000,West,Widget A
December,91000,West,Widget A
```

> 📝 **Note**: You can also use any CSV file you already have. PilotBA will automatically detect the columns.

---

## Step 3: Upload Your Data

1. **Drag and drop** your CSV file onto the upload area
   
   — OR —
   
   Click the upload area and **select your file** from the file browser

```
[SCREENSHOT: Drag and drop zone highlighted with file being dragged]
```

2. Wait a moment while PilotBA processes your file

3. You'll see a confirmation with your dataset details:
   - File name
   - Number of rows (12 in our example)
   - Number of columns (4 in our example)

```
[SCREENSHOT: Upload success showing "quick_start_sales.csv - 12 rows, 4 columns"]
```

🎉 **Congratulations!** Your data is now loaded into PilotBA.

---

## Step 4: Create Your First Chart

Now for the exciting part—let's visualize this data!

1. Click the **"Create Chart"** button in the top-right corner

2. In the chart creation panel:
   - **Chart Type**: Select **Bar Chart**
   - **X Axis**: Select **month**
   - **Y Axis**: Select **sales**

3. Click **"Create"** (or the chart will preview automatically)

```
[SCREENSHOT: Chart configuration panel with Bar Chart selected, month on X, sales on Y]
```

---

## Step 5: Explore Your Visualization

You now have an interactive bar chart showing sales by month! Try these interactions:

### 🖱️ Hover
Move your mouse over any bar to see the exact value.

### 🔍 Zoom
- **Scroll wheel**: Zoom in and out
- **Click and drag**: Pan around the chart

### 📊 What the Chart Shows
In our sample data, you can immediately see:
- December has the highest sales ($91,000)
- July has the lowest sales ($43,000)
- There's a general upward trend toward the end of the year

```
[SCREENSHOT: Completed bar chart with hover tooltip showing a value]
```

---

## 🎉 You Did It!

In just 5 minutes, you've:
- ✅ Loaded data into PilotBA
- ✅ Created an interactive visualization
- ✅ Explored your data visually

---

## What's Next?

Now that you've got the basics, here are your next steps:

| Want to... | Read this guide |
|------------|-----------------|
| Learn more about the interface | [Platform Overview](./02-platform-overview.md) |
| Upload different file types | [Uploading Your First Dataset](./03-uploading-data.md) |
| Try other chart types | [Chart Types Guide](./09-chart-types.md) |
| Filter your data | [Data Filtering Guide](./06-data-filtering.md) |
| Calculate totals and averages | [Aggregation & Grouping](./07-aggregation-grouping.md) |

---

## Quick Troubleshooting

### "My file won't upload"
- Make sure it's a supported format (CSV, JSON, Parquet)
- Check that the file isn't empty
- Try a smaller file first (under 10MB)

### "I don't see any data in my chart"
- Verify that you selected columns for both X and Y axes
- Make sure your Y axis column contains numbers

### "The page won't load"
- Ensure PilotBA is running (check with your administrator)
- Try refreshing the page
- Clear your browser cache

---

> 💡 **Pro Tip**: Bookmark PilotBA in your browser for quick access. You'll be using it a lot!

---

**Next Guide**: [Platform Overview →](./02-platform-overview.md)

---

*Need help? Check the [FAQ](./11-faq-troubleshooting.md) or [Glossary](./12-glossary.md)*

