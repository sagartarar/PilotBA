# Platform Overview

> **⏱️ Time to complete: 10 minutes**  
> **🎯 Goal: Understand PilotBA's features and navigate the interface confidently**

This guide introduces you to PilotBA's interface and core capabilities. By the end, you'll know your way around and understand what each part of the platform does.

---

## What is PilotBA?

PilotBA is a **high-performance business analytics platform** designed to help you:

- 📊 **Visualize** large datasets with interactive charts
- 🔍 **Explore** your data through filtering and aggregation
- ⚡ **Analyze** millions of data points without slowdown
- 📁 **Manage** multiple datasets in one place

### What Makes PilotBA Special?

| Feature | What It Means for You |
|---------|----------------------|
| **WebGL-Powered** | Renders millions of data points smoothly at 60 FPS |
| **Apache Arrow** | Processes data 10x faster than traditional tools |
| **Browser-Based** | No installation needed—just open and use |
| **Interactive** | Zoom, pan, hover, and filter in real-time |

---

## The Main Interface

When you open PilotBA, you'll see four main areas. Let's explore each one.

```
┌─────────────────────────────────────────────────────────────────┐
│  🔷 NAVIGATION BAR                                              │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                  │
│   SIDEBAR    │              MAIN CONTENT AREA                   │
│              │                                                  │
│  • Dashboard │                                                  │
│  • Data      │     (Charts, Tables, Query Builder)              │
│  • Query     │                                                  │
│  • Settings  │                                                  │
│              │                                                  │
├──────────────┴──────────────────────────────────────────────────┤
│  📊 STATUS BAR / NOTIFICATIONS                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Navigation Bar

The top navigation bar contains:

| Element | Purpose |
|---------|---------|
| **PilotBA Logo** | Click to return to the Dashboard |
| **Upload Data** | Quick access to upload new datasets |
| **Create Chart** | Start creating a new visualization |
| **Theme Toggle** | Switch between light and dark modes |

```
[SCREENSHOT: Navigation bar with elements labeled]
```

---

## Main Views

PilotBA has four main views, accessible from the sidebar:

### 1. 📊 Dashboard View

Your home base for data analysis.

**What you'll find here:**
- All your uploaded datasets displayed as cards
- Quick statistics (rows, columns, file size)
- Charts you've created
- One-click access to create new visualizations

**When to use it:**
- Starting your analysis session
- Getting an overview of your data
- Switching between datasets

```
[SCREENSHOT: Dashboard view showing dataset cards and charts]
```

---

### 2. 📁 Data View

Deep dive into your datasets.

**What you'll find here:**
- **Dataset List** (left sidebar): All uploaded datasets
- **Overview Tab**: Quick statistics and column type breakdown
- **Columns Tab**: Detailed information about each column
- **Preview Tab**: See the actual data in a table format

**When to use it:**
- Understanding what's in your data
- Checking column types and data quality
- Previewing raw data before visualization

```
[SCREENSHOT: Data view showing the three tabs and dataset sidebar]
```

#### Data View Tabs Explained

| Tab | Shows | Use When |
|-----|-------|----------|
| **Overview** | Row count, column count, data completeness, column types | Getting a quick summary |
| **Columns** | Each column's name, type, null count, sample values | Understanding data structure |
| **Preview** | Raw data in table format | Verifying data looks correct |

---

### 3. 🔧 Query View

Build powerful data transformations.

**What you'll find here:**
- **Filter Builder**: Narrow down your data
- **Aggregation Builder**: Calculate sums, averages, counts
- **Sort Builder**: Order your results
- **Results Panel**: See query output in real-time

**When to use it:**
- Finding specific subsets of data
- Creating summary reports
- Preparing data for visualization

```
[SCREENSHOT: Query view showing filter, aggregate, and sort tabs]
```

---

### 4. ⚙️ Settings View

Customize your PilotBA experience.

**What you'll find here:**
- **Appearance**: Light, dark, or system theme
- **Performance**: Display settings (coming soon)
- **About**: Version information

```
[SCREENSHOT: Settings view with theme options]
```

---

## Key Interface Elements

### Dataset Cards

Each dataset appears as a card showing:

```
┌────────────────────────────────────┐
│ 📄 sales_data.csv                  │
│                                    │
│    12,450 rows  •  8 columns       │
│    Size: 1.2 MB                    │
│    Uploaded: Dec 18, 2025          │
│                                    │
│    [Select]  [Delete]              │
└────────────────────────────────────┘
```

- **File name**: The original name of your file
- **Row count**: How many records are in the dataset
- **Column count**: How many fields/variables
- **Size**: File size in memory
- **Upload date**: When you added it

---

### Chart Container

When viewing a chart, you'll see:

```
┌────────────────────────────────────────────────────────┐
│  Monthly Sales by Region                    [⚙️] [✕]  │
├────────────────────────────────────────────────────────┤
│                                                        │
│                    📊 CHART AREA                       │
│                                                        │
│     (Interactive visualization renders here)           │
│                                                        │
│                                                        │
├────────────────────────────────────────────────────────┤
│  X: month  |  Y: sales  |  Type: Bar                  │
└────────────────────────────────────────────────────────┘
```

- **Title**: Your chart's name (editable)
- **Settings icon (⚙️)**: Configure chart options
- **Close icon (✕)**: Remove the chart
- **Chart area**: The interactive visualization
- **Footer**: Shows current axis mappings

---

### Notifications

PilotBA keeps you informed with notifications:

| Type | Meaning |
|------|---------|
| ✅ **Success** (Green) | Action completed successfully |
| ⚠️ **Warning** (Yellow) | Something to be aware of |
| ❌ **Error** (Red) | Something went wrong |
| ℹ️ **Info** (Blue) | General information |

Notifications appear in the bottom-right corner and disappear automatically.

---

## Supported Features

### Data Formats

| Format | Extension | Best For |
|--------|-----------|----------|
| **CSV** | `.csv` | Simple tabular data, Excel exports |
| **JSON** | `.json` | Structured data, API responses |
| **Parquet** | `.parquet` | Large datasets, columnar storage |
| **Arrow** | `.arrow` | High-performance data exchange |

### Chart Types

| Chart | Icon | Best For |
|-------|------|----------|
| **Bar Chart** | 📊 | Comparing categories |
| **Line Chart** | 📈 | Trends over time |
| **Scatter Plot** | ⚬ | Relationships between variables |
| **Heatmap** | 🟦 | Patterns in grid data |

### Query Operations

| Operation | What It Does | Example |
|-----------|--------------|---------|
| **Filter** | Keep only matching rows | Sales > $10,000 |
| **Aggregate** | Calculate summaries | Total sales by region |
| **Sort** | Order results | Highest to lowest |

---

## Performance Indicators

PilotBA shows performance information to help you understand system status:

### In Development Mode

You may see a performance monitor showing:
- **FPS**: Frames per second (target: 60)
- **Memory**: Current memory usage
- **Render time**: How long each frame takes

> 💡 **Tip**: If you notice slow performance, try filtering your data to reduce the number of points being rendered.

---

## Keyboard Navigation

PilotBA supports keyboard navigation for accessibility:

| Key | Action |
|-----|--------|
| `Tab` | Move between interface elements |
| `Enter` | Activate buttons and links |
| `Escape` | Close modals and dialogs |
| `Arrow keys` | Navigate within components |

---

## Theme Options

PilotBA offers three theme options:

| Theme | Description |
|-------|-------------|
| **Light** | Bright background, dark text (good for well-lit environments) |
| **Dark** | Dark background, light text (easier on the eyes, saves battery) |
| **System** | Automatically matches your operating system preference |

To change themes:
1. Go to **Settings** in the sidebar
2. Click your preferred theme option

---

## What's Next?

Now that you know your way around, let's put PilotBA to work:

| Want to... | Read this guide |
|------------|-----------------|
| Upload your own data | [Uploading Your First Dataset](./03-uploading-data.md) |
| Create visualizations | [Creating Your First Chart](./04-creating-charts.md) |
| Filter and transform data | [Query Builder Tutorial](./08-query-builder.md) |

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                    PilotBA Quick Reference                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  VIEWS                    ACTIONS                           │
│  ──────                   ───────                           │
│  Dashboard → Overview     Upload → Add new data             │
│  Data → Explore datasets  Create Chart → Visualize          │
│  Query → Transform data   Filter → Narrow down              │
│  Settings → Preferences   Aggregate → Summarize             │
│                                                             │
│  CHART INTERACTIONS       SUPPORTED FORMATS                 │
│  ──────────────────       ─────────────────                 │
│  Hover → See values       CSV, JSON, Parquet, Arrow         │
│  Scroll → Zoom                                              │
│  Drag → Pan               CHART TYPES                       │
│  Click → Select           ───────────                       │
│                           Bar, Line, Scatter, Heatmap       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

**Next Guide**: [Uploading Your First Dataset →](./03-uploading-data.md)

---

*Need help? Check the [FAQ](./11-faq-troubleshooting.md) or [Glossary](./12-glossary.md)*

