# Advanced Chart Configuration

> **⏱️ Time to complete: 15 minutes**  
> **🎯 Goal: Master advanced chart customization options**

Once you've created basic charts, it's time to refine them. This guide covers advanced configuration options that help you create polished, professional visualizations.

---

## What You'll Learn

- ✅ Customizing chart appearance
- ✅ Working with color encodings
- ✅ Adjusting opacity and sizes
- ✅ Optimizing for different data densities
- ✅ Best practices for professional charts

---

## Accessing Chart Settings

To customize a chart:

1. **Create or select** a chart
2. Click the **settings icon** (⚙️) in the chart header
3. The configuration panel opens on the side

```
[SCREENSHOT: Chart with settings panel open]
```

---

## Display Options

These options control what elements appear on your chart:

### Show Grid

**What it does**: Displays background grid lines

| Setting | Best For |
|---------|----------|
| **On** | When precise value reading matters |
| **Off** | Clean, minimal presentations |

> 💡 **Tip**: Keep grid on for analytical work, consider turning off for presentations.

---

### Show Legend

**What it does**: Displays the legend explaining colors/sizes

| Setting | Best For |
|---------|----------|
| **On** | Charts with color or size encodings |
| **Off** | Simple charts with obvious meaning |

---

### Show Tooltip

**What it does**: Shows information when hovering over data points

**Recommendation**: Almost always keep this **On**. Tooltips are essential for exploring data.

---

### Animate

**What it does**: Enables smooth transitions when data changes

| Setting | Best For |
|---------|----------|
| **On** | Interactive exploration, presentations |
| **Off** | Large datasets (better performance) |

---

## Visual Customization

### Opacity

**What it does**: Controls transparency of chart elements (0-100%)

```
0%   ░░░░░░░░░░  Fully transparent (invisible)
50%  ▒▒▒▒▒▒▒▒▒▒  Semi-transparent
100% ██████████  Fully opaque (solid)
```

**Recommended settings by chart type**:

| Chart Type | Recommended Opacity | Why |
|------------|---------------------|-----|
| Bar Chart | 80-100% | Bars should be solid and readable |
| Line Chart | 100% | Lines need to be clearly visible |
| Scatter Plot | 50-80% | See overlapping points |
| Heatmap | 80-100% | Color intensity should be clear |

**When to reduce opacity**:
- Scatter plots with many overlapping points
- When showing multiple data series
- To create a softer visual appearance

---

### Point Size (Scatter Plots)

**What it does**: Controls the size of points in scatter plots

**Range**: 1px to 20px

**Guidelines**:

| Data Points | Recommended Size |
|-------------|------------------|
| < 100 | 8-12px |
| 100-1,000 | 5-8px |
| 1,000-10,000 | 3-5px |
| > 10,000 | 1-3px |

> 💡 **Tip**: Smaller points for dense data, larger points for sparse data.

---

### Line Width (Line Charts)

**What it does**: Controls the thickness of lines

**Range**: 1px to 10px

**Guidelines**:

| Scenario | Recommended Width |
|----------|-------------------|
| Single line | 2-3px |
| Multiple lines | 1-2px |
| Emphasis line | 3-4px |
| Background lines | 1px |

---

## Color Encoding

Color can represent an additional dimension of your data.

### Adding Color to Scatter Plots

1. In chart settings, find the **Color** dropdown
2. Select a column to map to color
3. Values will be represented by color intensity

**Example**: In a price vs. quantity scatter plot, color by `profit_margin`
- Low profit → Cool colors (blue)
- High profit → Warm colors (red/yellow)

### Color Palettes for Heatmaps

PilotBA offers five color palettes:

| Palette | Description | Best For |
|---------|-------------|----------|
| **Viridis** | Blue → Green → Yellow | General purpose, colorblind-friendly |
| **Plasma** | Blue → Pink → Yellow | High contrast |
| **Inferno** | Black → Red → Yellow | Heat/intensity data |
| **Magma** | Black → Pink → White | Dark backgrounds |
| **Turbo** | Blue → Cyan → Yellow → Red | Maximum distinction |

### Choosing the Right Palette

```
┌─────────────────────────────────────────────────────────────┐
│              Palette Selection Guide                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Is colorblind accessibility important?                     │
│  └─ Yes → Use Viridis                                       │
│                                                             │
│  Is your data about heat/intensity?                         │
│  └─ Yes → Use Inferno or Plasma                             │
│                                                             │
│  Need maximum color distinction?                            │
│  └─ Yes → Use Turbo                                         │
│                                                             │
│  Using a dark background?                                   │
│  └─ Yes → Use Magma                                         │
│                                                             │
│  Not sure?                                                  │
│  └─ Use Viridis (safe default)                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Size Encoding (Scatter Plots)

Size can represent a fourth dimension in scatter plots (creating a "bubble chart" effect).

### Adding Size Encoding

1. In chart settings, find the **Size** dropdown
2. Select a numeric column
3. Larger values = larger points

**Example**: Plot price (X) vs. quantity (Y), size by revenue
- Small bubbles = low revenue transactions
- Large bubbles = high revenue transactions

### Size Best Practices

1. **Use sparingly**: Size is harder to compare than position
2. **Combine with color**: Size + color can show two extra dimensions
3. **Adjust base point size**: May need to reduce base size when using size encoding
4. **Consider the story**: Does size add meaning or just clutter?

---

## Optimizing for Data Density

Different data densities require different settings:

### Sparse Data (< 100 points)

```
Recommended Settings:
├─ Point Size: 8-12px
├─ Opacity: 80-100%
├─ Show Grid: On
├─ Animate: On
└─ Show Tooltip: On
```

### Medium Density (100-1,000 points)

```
Recommended Settings:
├─ Point Size: 5-8px
├─ Opacity: 70-90%
├─ Show Grid: On
├─ Animate: On
└─ Show Tooltip: On
```

### Dense Data (1,000-10,000 points)

```
Recommended Settings:
├─ Point Size: 3-5px
├─ Opacity: 50-70%
├─ Show Grid: Optional
├─ Animate: Off (performance)
└─ Show Tooltip: On
```

### Very Dense Data (> 10,000 points)

```
Recommended Settings:
├─ Point Size: 1-3px
├─ Opacity: 30-50%
├─ Show Grid: Off
├─ Animate: Off
└─ Show Tooltip: On
└─ Consider: Sampling or aggregation
```

---

## Chart-Specific Tips

### Bar Charts

**For better readability**:
- Keep bars the same color (unless color has meaning)
- Order bars by value (highest to lowest) or alphabetically
- Don't use too many categories (5-12 is ideal)
- Always start Y-axis at zero

**Avoid**:
- 3D effects (distorts perception)
- Too many colors without meaning
- Truncated Y-axis

---

### Line Charts

**For clearer trends**:
- Use consistent line width
- Limit to 2-5 lines maximum
- Use different colors for different series
- Consider adding data point markers for sparse data

**Avoid**:
- Too many lines (becomes spaghetti)
- Inconsistent time intervals
- Missing data points without indication

---

### Scatter Plots

**For better insights**:
- Use opacity to reveal overlapping points
- Add color encoding for categories
- Adjust point size based on data density
- Look for clusters, trends, outliers

**Avoid**:
- Points too large (hide patterns)
- Points too small (hard to see)
- No opacity with overlapping data

---

### Heatmaps

**For clearer patterns**:
- Choose appropriate color palette
- Order categories logically (time should be sequential)
- Use consistent grid sizes
- Include a color legend

**Avoid**:
- Too many categories (grid becomes tiny)
- Poor color choices (hard to distinguish values)
- Missing legend

---

## Creating Professional Charts

### The CLEAR Framework

**C**ontext
- Add a descriptive title
- Include axis labels
- Provide a legend if using color/size

**L**egibility
- Use appropriate font sizes
- Ensure sufficient contrast
- Don't overcrowd

**E**fficiency
- Remove unnecessary elements
- Focus on the message
- Use appropriate chart type

**A**ccuracy
- Start numeric axes at zero
- Don't distort proportions
- Represent data honestly

**R**elevance
- Show data that matters
- Filter out noise
- Highlight key insights

---

### Before and After Example

**Before** (needs improvement):
- Generic title: "Chart 1"
- Too many data points
- No color meaning
- Cluttered appearance

**After** (professional):
- Descriptive title: "Q4 Sales by Region"
- Filtered to relevant data
- Color indicates performance
- Clean, focused appearance

---

## Quick Settings Reference

```
┌─────────────────────────────────────────────────────────────┐
│           Quick Settings Reference                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  BAR CHART                                                  │
│  ─────────                                                  │
│  Opacity: 80-100%  |  Grid: On  |  Animate: On              │
│                                                             │
│  LINE CHART                                                 │
│  ──────────                                                 │
│  Line Width: 2px  |  Grid: On  |  Animate: On               │
│                                                             │
│  SCATTER PLOT                                               │
│  ────────────                                               │
│  Point Size: 3-8px (varies)  |  Opacity: 50-80%             │
│  Color: Optional  |  Size: Optional                         │
│                                                             │
│  HEATMAP                                                    │
│  ───────                                                    │
│  Palette: Viridis (default)  |  Opacity: 80-100%            │
│  Grid: Implicit  |  Legend: On                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## What's Next?

You've mastered chart customization! Continue learning:

| Want to... | Read this guide |
|------------|-----------------|
| Troubleshoot issues | [FAQ & Troubleshooting](./11-faq-troubleshooting.md) |
| Review terminology | [Glossary](./12-glossary.md) |
| Start over with basics | [Quick Start Guide](./01-quick-start-guide.md) |

---

**Congratulations!** You've completed the core PilotBA user guides. You now have the skills to upload data, create queries, build visualizations, and customize them professionally.

---

*Need help? Check the [FAQ](./11-faq-troubleshooting.md) or [Glossary](./12-glossary.md)*

