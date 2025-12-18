# FAQ & Troubleshooting

> **Your go-to resource for common questions and solutions**

Having trouble? You're in the right place. This guide covers frequently asked questions and solutions to common issues in PilotBA.

---

## Table of Contents

1. [Getting Started FAQs](#getting-started-faqs)
2. [Data Upload Issues](#data-upload-issues)
3. [Chart Problems](#chart-problems)
4. [Query Builder Issues](#query-builder-issues)
5. [Performance Issues](#performance-issues)
6. [General FAQs](#general-faqs)

---

## Getting Started FAQs

### Q: What browsers does PilotBA support?

**A:** PilotBA works best with modern browsers:
- ✅ Google Chrome (recommended)
- ✅ Mozilla Firefox
- ✅ Microsoft Edge
- ✅ Safari (macOS)
- ⚠️ Internet Explorer (not supported)

For best performance, use the latest version of Chrome or Firefox.

---

### Q: How do I access PilotBA?

**A:** Open your web browser and navigate to:
```
http://localhost:3000
```

If this doesn't work:
1. Check that PilotBA is running (ask your administrator)
2. Try clearing your browser cache
3. Ensure you're on the correct network

---

### Q: Is my data stored on a server?

**A:** PilotBA processes data in your browser. Your uploaded data:
- Is stored in browser memory while you're using PilotBA
- Is NOT automatically sent to any server
- Is cleared when you close the browser tab

> 💡 **Tip**: Always follow your organization's data handling policies.

---

### Q: Can multiple people use PilotBA at the same time?

**A:** Yes! Each user works in their own browser session. Data uploaded by one user is not visible to others.

---

## Data Upload Issues

### Problem: "File format not supported"

**Symptoms**: Error message when trying to upload a file

**Causes**:
- File has wrong extension
- File type not supported

**Solutions**:
1. Check the file extension is one of: `.csv`, `.json`, `.parquet`, `.arrow`
2. Rename the file if the extension is wrong
3. Convert to a supported format

**Supported formats**:
| Format | Extension |
|--------|-----------|
| CSV | `.csv` |
| JSON | `.json` |
| Parquet | `.parquet` |
| Arrow | `.arrow` |

---

### Problem: "Failed to parse file"

**Symptoms**: Upload starts but fails with parsing error

**Causes**:
- Malformed CSV (inconsistent columns, bad quotes)
- Invalid JSON syntax
- Corrupted file

**Solutions**:

**For CSV files**:
1. Open in a text editor and check for:
   - Consistent number of columns in each row
   - Properly quoted values containing commas
   - No special characters in column names
2. Try saving as UTF-8 encoding
3. Remove any blank rows at the end

**For JSON files**:
1. Validate at [jsonlint.com](https://jsonlint.com)
2. Ensure it's an array of objects: `[{...}, {...}]`
3. Check for trailing commas

---

### Problem: "File is too large"

**Symptoms**: Browser becomes slow or unresponsive during upload

**Causes**:
- File exceeds browser memory limits
- Very large dataset

**Solutions**:
1. **Reduce file size**:
   - Remove unnecessary columns
   - Filter to needed rows before uploading
   - Use a sample of the data

2. **Use efficient formats**:
   - Parquet files are much smaller than CSV
   - Consider converting large CSV to Parquet

3. **Increase browser memory** (advanced):
   - Close other tabs
   - Restart browser
   - Use a machine with more RAM

**Recommended file sizes**:
| Format | Recommended Max |
|--------|-----------------|
| CSV | 100 MB |
| JSON | 50 MB |
| Parquet | 500 MB |

---

### Problem: "Column types detected incorrectly"

**Symptoms**: Numbers showing as text, dates not recognized

**Causes**:
- Mixed data types in a column
- Unusual formatting

**Solutions**:
1. **Clean your data before upload**:
   - Ensure consistent types per column
   - Remove text from numeric columns
   - Use standard date format: `YYYY-MM-DD`

2. **Check for hidden characters**:
   - Spaces before/after numbers
   - Currency symbols ($, €)
   - Thousand separators (commas in numbers)

---

### Problem: "Special characters appear corrupted"

**Symptoms**: Characters like é, ñ, 中 display incorrectly

**Cause**: File encoding mismatch

**Solution**:
1. Save your file as UTF-8 encoding
2. In Excel: Save As → CSV UTF-8
3. In text editors: Check encoding settings

---

## Chart Problems

### Problem: "Chart shows no data"

**Symptoms**: Empty chart area, no bars/lines/points

**Causes**:
- No columns selected for axes
- Y-axis column is not numeric
- All data filtered out

**Solutions**:
1. **Check axis selections**:
   - Verify X and Y axis columns are selected
   - Ensure Y axis is a numeric column

2. **Check filters**:
   - Go to Query view
   - Disable all filters
   - See if data appears

3. **Verify data exists**:
   - Check the Data view
   - Confirm the dataset has rows

---

### Problem: "Chart looks wrong or distorted"

**Symptoms**: Unexpected appearance, wrong values shown

**Causes**:
- Wrong column selected
- Data type mismatch
- Scale issues

**Solutions**:
1. **Verify column selection**:
   - Double-check X and Y axis columns
   - Make sure they match your intention

2. **Check data types**:
   - Y axis should be numeric
   - X axis should match chart type (categories for bar, dates for line)

3. **Reset the chart**:
   - Delete and recreate the chart
   - Start with default settings

---

### Problem: "Chart is very slow"

**Symptoms**: Laggy interactions, low frame rate

**Causes**:
- Too many data points
- Complex visualization
- Browser resource limits

**Solutions**:
1. **Reduce data points**:
   - Filter your data first
   - Use aggregation to summarize
   - Consider sampling (for scatter plots)

2. **Simplify the chart**:
   - Disable animations
   - Reduce opacity
   - Use smaller point sizes

3. **Browser optimization**:
   - Close other tabs
   - Clear browser cache
   - Use Chrome for best WebGL performance

---

### Problem: "Hover tooltips not showing"

**Symptoms**: No information appears when hovering over data points

**Causes**:
- Tooltips disabled
- Browser compatibility issue

**Solutions**:
1. Check chart settings: Enable "Show Tooltip"
2. Try a different browser
3. Refresh the page

---

## Query Builder Issues

### Problem: "Run Query button is disabled"

**Symptoms**: Can't click the Run Query button

**Cause**: No query operations added

**Solution**: Add at least one:
- Filter condition
- Aggregation
- Sort order

---

### Problem: "Query returns no results"

**Symptoms**: 0 rows returned after running query

**Causes**:
- Filters too restrictive
- No data matches conditions
- Typo in filter value

**Solutions**:
1. **Check filter values**:
   - Verify spelling (case-sensitive!)
   - Check for extra spaces
   - Confirm value exists in data

2. **Disable filters one by one**:
   - Find which filter is too restrictive
   - Adjust or remove it

3. **Preview your data**:
   - Go to Data view
   - Check what values actually exist

---

### Problem: "Aggregation results seem wrong"

**Symptoms**: SUM, AVG, or COUNT values don't match expectations

**Causes**:
- Wrong column selected
- Missing GROUP BY
- Null values affecting calculations

**Solutions**:
1. **Verify column selection**:
   - Make sure you're aggregating the right column

2. **Check for GROUP BY**:
   - Without GROUP BY, you get one total
   - Add GROUP BY for per-category results

3. **Account for nulls**:
   - AVG ignores null values
   - COUNT counts non-null values
   - Check your data for missing values

---

### Problem: "Sort doesn't seem to work"

**Symptoms**: Results not in expected order

**Causes**:
- Sort applied to wrong column
- Text sorting vs. numeric sorting
- Multiple conflicting sorts

**Solutions**:
1. Verify the sort column matches what you want to order
2. Check if the column is text (alphabetical) or numeric
3. Remove extra sorts and keep only the one you need

---

## Performance Issues

### Problem: "PilotBA is running slowly"

**Symptoms**: General sluggishness, delays in interactions

**Solutions**:

1. **Reduce data size**:
   - Work with smaller datasets
   - Filter before visualizing
   - Use aggregation to summarize

2. **Optimize browser**:
   - Close unnecessary tabs
   - Clear browser cache
   - Restart browser

3. **Check system resources**:
   - Close other applications
   - Check available RAM
   - Use a more powerful machine if needed

---

### Problem: "Browser tab crashes"

**Symptoms**: Tab becomes unresponsive or closes

**Causes**:
- Out of memory
- Dataset too large
- Browser bug

**Solutions**:
1. Use smaller datasets
2. Try a different browser
3. Increase system memory
4. Report the issue to your administrator

---

### Problem: "Charts are not smooth (low FPS)"

**Symptoms**: Jerky animations, laggy interactions

**Solutions**:
1. Reduce the number of data points
2. Disable animations in chart settings
3. Use Chrome (best WebGL support)
4. Check if hardware acceleration is enabled in browser

---

## General FAQs

### Q: How do I delete a dataset?

**A:** 
1. Go to Dashboard or Data view
2. Hover over the dataset card
3. Click the trash icon (🗑️)
4. Confirm deletion

> ⚠️ **Warning**: This also deletes any charts created from that dataset.

---

### Q: Can I undo changes?

**A:** PilotBA doesn't have a global undo. However:
- Deleted charts can be recreated
- Query changes can be reset with the Reset button
- Datasets can be re-uploaded

---

### Q: How do I export my chart?

**A:** Export functionality is coming soon. Currently, you can:
- Take a screenshot (Print Screen or Snipping Tool)
- Use browser's print function to save as PDF

---

### Q: Can I save my queries?

**A:** Query saving is planned for a future release. For now:
- Note down your query settings
- Recreate queries when needed

---

### Q: How do I change the theme (light/dark)?

**A:** 
1. Click "Settings" in the sidebar
2. Choose Light, Dark, or System
3. Theme changes immediately

---

### Q: Is there a keyboard shortcut reference?

**A:** See [Keyboard Shortcuts](./13-keyboard-shortcuts.md) for the complete list.

---

### Q: How do I report a bug?

**A:** 
1. Note what you were doing when the bug occurred
2. Capture any error messages
3. Contact your system administrator
4. Provide: browser version, steps to reproduce, expected vs. actual behavior

---

## Error Messages Reference

| Error Message | Meaning | Solution |
|---------------|---------|----------|
| "File format not supported" | Wrong file type | Use CSV, JSON, Parquet, or Arrow |
| "Failed to parse file" | File content is malformed | Fix file formatting |
| "Column not found" | Referenced column doesn't exist | Check column name spelling |
| "Invalid operation" | Operation not supported for data type | Use appropriate operation for column type |
| "Out of memory" | Dataset too large | Reduce data size |

---

## Still Need Help?

If you can't find the answer here:

1. **Check other guides**: The answer might be in a specific topic guide
2. **Review the Glossary**: Term confusion? Check [Glossary](./12-glossary.md)
3. **Contact support**: Reach out to your system administrator

---

## Quick Troubleshooting Checklist

When something goes wrong, try these steps in order:

- [ ] Refresh the page
- [ ] Clear browser cache
- [ ] Try a different browser
- [ ] Check that data is properly formatted
- [ ] Verify column selections
- [ ] Disable filters to see all data
- [ ] Reduce dataset size
- [ ] Restart browser
- [ ] Check system resources (RAM, CPU)

---

*Can't find what you're looking for? Check the [Glossary](./12-glossary.md) for term definitions.*

