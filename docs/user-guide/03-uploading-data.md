# Uploading Your First Dataset

> **⏱️ Time to complete: 10 minutes**  
> **🎯 Goal: Learn to import data from CSV, JSON, and other formats into PilotBA**

Before you can analyze and visualize data, you need to get it into PilotBA. This guide covers everything you need to know about uploading data, from simple CSV files to advanced formats.

---

## What You'll Learn

- ✅ How to upload CSV files
- ✅ How to upload JSON files
- ✅ Understanding file format requirements
- ✅ Troubleshooting common upload issues
- ✅ Best practices for data preparation

---

## Supported File Formats

PilotBA supports four data formats:

| Format | Extension | Best For | Max Recommended Size |
|--------|-----------|----------|---------------------|
| **CSV** | `.csv` | Spreadsheet exports, simple tables | 100 MB |
| **JSON** | `.json` | API data, nested structures | 50 MB |
| **Parquet** | `.parquet` | Large datasets, analytics | 500 MB |
| **Arrow** | `.arrow` | High-performance workflows | 500 MB |

> 💡 **Tip**: For most business analysts, CSV is the go-to format. It's simple, widely supported, and works with Excel.

---

## Method 1: Drag and Drop (Recommended)

The easiest way to upload data:

1. **Open PilotBA** in your browser
2. **Locate your file** in your computer's file explorer
3. **Drag the file** onto the PilotBA window
4. **Drop it** in the upload zone

```
[SCREENSHOT: File being dragged onto the upload zone with visual feedback]
```

The upload zone will highlight when you drag a file over it, indicating it's ready to receive your data.

---

## Method 2: Click to Browse

Prefer using a file dialog? No problem:

1. **Click** the upload area (or the "Upload Data" button)
2. **Navigate** to your file in the file browser
3. **Select** your file and click "Open"

```
[SCREENSHOT: File browser dialog with a CSV file selected]
```

---

## Method 3: Upload Button

From anywhere in PilotBA:

1. Click the **"Upload Data"** button in the navigation bar
2. A modal will appear with the upload zone
3. Drag and drop or click to browse

This is useful when you're already working with data and want to add another dataset.

---

## What Happens After Upload

Once you upload a file, PilotBA:

1. **Parses** the file to understand its structure
2. **Detects** column names and data types
3. **Calculates** basic statistics (row count, column count)
4. **Stores** the data in memory for fast access

You'll see a success notification with details:

```
┌─────────────────────────────────────────┐
│  ✅ Dataset Uploaded Successfully       │
│                                         │
│  📄 sales_data.csv                      │
│  • 12,450 rows                          │
│  • 8 columns                            │
│  • 1.2 MB                               │
│                                         │
└─────────────────────────────────────────┘
```

---

## CSV File Requirements

CSV (Comma-Separated Values) is the most common format. Here's what PilotBA expects:

### Basic Structure

```csv
column1,column2,column3
value1,value2,value3
value4,value5,value6
```

### Requirements

| Requirement | Details |
|-------------|---------|
| **Header row** | First row should contain column names |
| **Delimiter** | Commas (`,`) separate values |
| **Encoding** | UTF-8 recommended |
| **Line endings** | Windows (CRLF) or Unix (LF) both work |

### Example: Good CSV

```csv
date,product,quantity,revenue,region
2025-01-15,Widget A,150,4500.00,North
2025-01-15,Widget B,200,8000.00,South
2025-01-16,Widget A,175,5250.00,East
2025-01-16,Widget C,90,3600.00,West
```

### Common CSV Issues

| Issue | Problem | Solution |
|-------|---------|----------|
| **No header** | PilotBA can't name columns | Add a header row |
| **Mixed delimiters** | Parsing errors | Use commas consistently |
| **Quoted commas** | Values with commas break | Wrap in double quotes: `"New York, NY"` |
| **Special characters** | Encoding issues | Save as UTF-8 |

---

## JSON File Requirements

JSON files should contain an array of objects:

### Expected Structure

```json
[
  {"column1": "value1", "column2": 123},
  {"column1": "value2", "column2": 456}
]
```

### Example: Good JSON

```json
[
  {
    "date": "2025-01-15",
    "product": "Widget A",
    "quantity": 150,
    "revenue": 4500.00,
    "region": "North"
  },
  {
    "date": "2025-01-15",
    "product": "Widget B",
    "quantity": 200,
    "revenue": 8000.00,
    "region": "South"
  }
]
```

### JSON Tips

- Each object in the array becomes a row
- Object keys become column names
- Values should be consistent types across rows
- Nested objects are flattened (advanced)

---

## Parquet and Arrow Files

These are advanced formats for large datasets:

### Parquet
- **What**: Columnar storage format from Apache
- **When to use**: Large datasets (millions of rows), data from data warehouses
- **How to get**: Export from Spark, Pandas, or data engineering tools

### Arrow IPC
- **What**: Apache Arrow's native format
- **When to use**: High-performance data pipelines
- **How to get**: Export from Arrow-compatible tools

> 📝 **Note**: If you're not sure what these are, stick with CSV or JSON. They cover 90% of use cases.

---

## Preparing Your Data

Before uploading, a little preparation goes a long way:

### ✅ Data Preparation Checklist

- [ ] **Column headers are clear**: `revenue` not `col1`
- [ ] **Data types are consistent**: Don't mix numbers and text in the same column
- [ ] **Dates are formatted**: Use `YYYY-MM-DD` format (e.g., `2025-01-15`)
- [ ] **No empty rows**: Remove blank rows at the end
- [ ] **File size is reasonable**: Under 100 MB for CSV

### Example: Before and After

**❌ Before (problematic):**
```csv
col1,col2,col3
Jan 15,Widget A,$4,500
January 16th,Widget B,8000
,Widget C,
```

**✅ After (clean):**
```csv
date,product,revenue
2025-01-15,Widget A,4500
2025-01-16,Widget B,8000
2025-01-17,Widget C,3200
```

---

## Working with Multiple Datasets

PilotBA lets you work with multiple datasets simultaneously:

### Adding Another Dataset

1. Click **"Upload Data"** in the navigation bar
2. Upload your new file
3. Both datasets appear in the sidebar

### Switching Between Datasets

1. Go to the **Data** view or **Dashboard**
2. Click on a dataset card to select it
3. The selected dataset becomes active for charts and queries

### Deleting a Dataset

1. Hover over the dataset card
2. Click the **trash icon** (🗑️)
3. Confirm deletion

> ⚠️ **Warning**: Deleting a dataset also removes any charts created from it. This cannot be undone.

---

## Troubleshooting Upload Issues

### "File format not supported"

**Cause**: The file extension isn't recognized  
**Solution**: Ensure your file ends with `.csv`, `.json`, `.parquet`, or `.arrow`

### "Failed to parse file"

**Cause**: The file content doesn't match the expected format  
**Solutions**:
- For CSV: Check for consistent delimiters and proper quoting
- For JSON: Validate JSON syntax at [jsonlint.com](https://jsonlint.com)
- Try opening in a text editor to inspect

### "File is too large"

**Cause**: File exceeds browser memory limits  
**Solutions**:
- Filter data before uploading (keep only needed columns/rows)
- Use Parquet format for large files (more efficient)
- Split into multiple smaller files

### "Column types detected incorrectly"

**Cause**: Mixed data types in a column  
**Solution**: Clean your data to ensure consistent types per column

### "Special characters appear corrupted"

**Cause**: File encoding mismatch  
**Solution**: Save your file as UTF-8 encoding

---

## Sample Datasets for Practice

Want to practice? Here are sample datasets you can create:

### Sample 1: Sales Data (sales_data.csv)

```csv
date,product,category,quantity,unit_price,revenue,region,salesperson
2025-01-01,Widget A,Electronics,50,25.00,1250.00,North,Alice
2025-01-01,Widget B,Electronics,30,45.00,1350.00,South,Bob
2025-01-02,Gadget X,Accessories,100,12.00,1200.00,East,Carol
2025-01-02,Widget A,Electronics,75,25.00,1875.00,West,Dave
2025-01-03,Gadget Y,Accessories,60,18.00,1080.00,North,Alice
2025-01-03,Widget C,Electronics,40,55.00,2200.00,South,Bob
2025-01-04,Widget A,Electronics,90,25.00,2250.00,East,Carol
2025-01-04,Gadget X,Accessories,120,12.00,1440.00,West,Dave
2025-01-05,Widget B,Electronics,55,45.00,2475.00,North,Eve
2025-01-05,Gadget Y,Accessories,80,18.00,1440.00,South,Frank
```

### Sample 2: Customer Data (customers.csv)

```csv
customer_id,name,email,signup_date,total_purchases,loyalty_tier,city,age
C001,John Smith,john@email.com,2024-03-15,1250.00,Gold,New York,34
C002,Jane Doe,jane@email.com,2024-05-22,890.00,Silver,Los Angeles,28
C003,Bob Wilson,bob@email.com,2024-01-10,2100.00,Platinum,Chicago,45
C004,Alice Brown,alice@email.com,2024-07-08,450.00,Bronze,Houston,31
C005,Charlie Davis,charlie@email.com,2024-02-28,1800.00,Gold,Phoenix,39
```

---

## Best Practices

### Do's ✅

- **Use descriptive column names**: `total_revenue` not `tr`
- **Keep files focused**: One dataset per business concept
- **Clean data before upload**: Fix issues in Excel/source first
- **Use consistent date formats**: `YYYY-MM-DD` works best
- **Document your data**: Know what each column means

### Don'ts ❌

- **Don't upload sensitive data** without proper authorization
- **Don't include formulas**: Export values only from Excel
- **Don't mix data types** in the same column
- **Don't use special characters** in column names
- **Don't upload excessively large files** when you only need a subset

---

## What's Next?

Your data is uploaded! Now let's visualize it:

| Want to... | Read this guide |
|------------|-----------------|
| Create your first chart | [Creating Your First Chart](./04-creating-charts.md) |
| Explore your data structure | [Understanding Your Data](./05-understanding-data.md) |
| Filter to specific rows | [Data Filtering Guide](./06-data-filtering.md) |

---

**Next Guide**: [Creating Your First Chart →](./04-creating-charts.md)

---

*Need help? Check the [FAQ](./11-faq-troubleshooting.md) or [Glossary](./12-glossary.md)*

