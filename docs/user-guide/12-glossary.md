# Glossary

> **Definitions of key terms used in PilotBA and data analytics**

New to data analytics? This glossary explains the terms you'll encounter while using PilotBA. Terms are organized alphabetically for easy reference.

---

## A

### Aggregation
The process of combining multiple values into a single summary value. Common aggregations include SUM (total), AVG (average), COUNT (number of items), MIN (smallest), and MAX (largest).

**Example**: Calculating total sales by region is an aggregation.

### Apache Arrow
A high-performance data format used by PilotBA for fast data processing. Arrow stores data in columns rather than rows, making analytics operations much faster.

**Why it matters**: Arrow enables PilotBA to handle millions of rows efficiently.

### Axis
A reference line on a chart. Charts typically have:
- **X-axis**: The horizontal axis (bottom)
- **Y-axis**: The vertical axis (left side)

---

## B

### Bar Chart
A chart that displays data as rectangular bars. The length of each bar represents a value. Used for comparing categories.

**When to use**: Comparing sales by region, products by quantity, etc.

### Boolean
A data type with only two possible values: true or false (or yes/no, 1/0).

**Example**: "Is customer active?" → true or false

---

## C

### Category / Categorical Data
Data that represents groups or labels, not numbers. Categories are typically text values.

**Examples**: Region names (North, South), product types (Electronics, Accessories), status (Active, Inactive)

### Chart
A visual representation of data. PilotBA supports bar charts, line charts, scatter plots, and heatmaps.

### Column
A vertical set of values in a table, representing a single attribute or field. Also called a "field" or "variable."

**Example**: In a sales table, "revenue" is a column containing all revenue values.

### Completeness
A measure of data quality indicating what percentage of cells have values (are not null/empty).

**Formula**: (Total cells - Null cells) / Total cells × 100%

### Correlation
A statistical relationship between two variables. When one changes, the other tends to change in a predictable way.

- **Positive correlation**: Both increase together
- **Negative correlation**: One increases as the other decreases
- **No correlation**: No predictable relationship

### CSV (Comma-Separated Values)
A simple file format for tabular data where values are separated by commas and rows are separated by line breaks.

**Example**:
```
name,age,city
Alice,30,New York
Bob,25,Los Angeles
```

---

## D

### Dashboard
A view that displays multiple visualizations and data summaries together. In PilotBA, the Dashboard is the main home screen.

### Data Type
The kind of value a column contains. Common types:
- **Numeric**: Numbers (integers, decimals)
- **Text/String**: Words and characters
- **Date/Timestamp**: Calendar dates and times
- **Boolean**: True/false values

### Dataset
A collection of related data organized in rows and columns. In PilotBA, each uploaded file becomes a dataset.

### Descending
Sorted from highest to lowest (for numbers) or Z to A (for text).

**Opposite**: Ascending (lowest to highest, A to Z)

---

## E

### Encoding
In visualization, encoding means mapping data to visual properties. For example:
- Position (X/Y axis)
- Color
- Size
- Shape

### Export
Saving data or visualizations to a file for use outside PilotBA.

---

## F

### Field
Another term for column. A single attribute in a dataset.

### Filter
A condition that includes or excludes rows based on their values. Filtering reduces your data to only the rows you want to analyze.

**Example**: Filter where region = "North" shows only North region data.

### Float / Floating Point
A numeric data type that can have decimal places.

**Examples**: 3.14, 99.99, -0.5

### FPS (Frames Per Second)
A measure of how smoothly animations and interactions run. Higher is better. PilotBA targets 60 FPS.

---

## G

### GROUP BY
An operation that organizes data into groups based on one or more columns, then performs calculations on each group.

**Example**: GROUP BY region calculates separate totals for each region.

### Grid
The background lines on a chart that help readers estimate values. Can be toggled on/off in PilotBA.

---

## H

### Header Row
The first row in a CSV or table that contains column names rather than data values.

### Heatmap
A chart that displays values as colors in a grid. Useful for showing patterns across two categorical dimensions.

**When to use**: Activity by day/hour, product performance by region

### Hover / Tooltip
Information that appears when you move your mouse over a chart element. Shows exact values for that data point.

---

## I

### Integer
A whole number without decimal places.

**Examples**: 1, 42, -100, 1000000

---

## J

### JSON (JavaScript Object Notation)
A file format for structured data using key-value pairs and arrays.

**Example**:
```json
[
  {"name": "Alice", "age": 30},
  {"name": "Bob", "age": 25}
]
```

---

## L

### Legend
A guide on a chart that explains what colors, shapes, or sizes represent.

### Line Chart
A chart that connects data points with lines, showing how values change over a continuous dimension (usually time).

**When to use**: Trends over time, sequential data

---

## M

### MAX
An aggregation function that returns the largest value in a set.

### Mean
The average value. Calculated by summing all values and dividing by the count.

**Formula**: Mean = Sum of values / Number of values

### Median
The middle value when data is sorted. Less affected by outliers than the mean.

### MIN
An aggregation function that returns the smallest value in a set.

---

## N

### Null
A missing or empty value. Different from zero or blank text—null means "no value present."

**Impact**: Nulls can affect calculations (AVG ignores them, for example).

### Numeric Data
Data consisting of numbers that can be used in mathematical operations.

---

## O

### Operator
A symbol or keyword that specifies a comparison or calculation.

**Filter operators**: equals, greater than, contains, between, etc.

### Outlier
A data point that is significantly different from other values. May indicate errors or genuinely unusual cases.

---

## P

### Pan
Moving around a chart view by clicking and dragging. Used when zoomed in.

### Parquet
A columnar file format designed for efficient data storage and retrieval. Smaller and faster than CSV for large datasets.

### Percentage
A value expressed as a fraction of 100.

**Formula**: (Part / Whole) × 100

---

## Q

### Query
A request for specific data from a dataset. In PilotBA, queries combine filters, aggregations, and sorts.

### Query Builder
The PilotBA interface for creating data queries without writing code.

---

## R

### Row
A horizontal set of values in a table, representing a single record or observation.

**Example**: In a sales table, one row might be: "Jan 15, Widget A, North, $1,200"

---

## S

### Sampling
Selecting a subset of data to represent the whole. Used when datasets are too large to display entirely.

### Scatter Plot
A chart that displays individual data points positioned by two numeric values. Shows relationships and distributions.

**When to use**: Finding correlations, identifying clusters

### Schema
The structure of a dataset: column names, data types, and constraints.

### Sort
Arranging data in a specific order (ascending or descending) based on one or more columns.

### String
A data type consisting of text characters. Also called "text" or "varchar."

### SUM
An aggregation function that adds all values together.

---

## T

### Table
A structured arrangement of data in rows and columns. The fundamental way data is organized in PilotBA.

### Text
A data type for storing words, sentences, or any character data. Also called "string."

### Timestamp
A data type that includes both date and time information.

**Example**: 2025-01-15 14:30:00

### Tooltip
See [Hover](#hover--tooltip).

### Trend
A general direction in which data is moving over time. Can be upward, downward, or flat.

---

## U

### UTF-8
A character encoding standard that supports virtually all written languages. Recommended for CSV files.

---

## V

### Value
A single piece of data in a cell (intersection of a row and column).

### Variable
Another term for column. Something that varies across records.

### Visualization
A graphical representation of data. Charts, graphs, and maps are visualizations.

---

## W

### WebGL
A technology that enables high-performance graphics in web browsers. PilotBA uses WebGL to render millions of data points smoothly.

---

## X

### X-Axis
The horizontal axis on a chart. Typically shows categories, time, or an independent variable.

---

## Y

### Y-Axis
The vertical axis on a chart. Typically shows numeric values or the dependent variable.

---

## Z

### Zoom
Magnifying a portion of a chart to see more detail. In PilotBA, use the scroll wheel to zoom.

---

## Common Abbreviations

| Abbreviation | Meaning |
|--------------|---------|
| **AVG** | Average |
| **CSV** | Comma-Separated Values |
| **FPS** | Frames Per Second |
| **JSON** | JavaScript Object Notation |
| **MAX** | Maximum |
| **MIN** | Minimum |
| **N/A** | Not Available / Not Applicable |
| **NULL** | No value / Missing |
| **SUM** | Summation / Total |

---

## Mathematical Symbols in Filters

| Symbol | Meaning | Example |
|--------|---------|---------|
| `=` | Equals | revenue = 1000 |
| `≠` | Not equals | status ≠ "Cancelled" |
| `>` | Greater than | age > 18 |
| `>=` | Greater than or equal | quantity >= 10 |
| `<` | Less than | price < 50 |
| `<=` | Less than or equal | discount <= 0.2 |

---

*Can't find a term? Check the [FAQ](./11-faq-troubleshooting.md) or ask your administrator.*

