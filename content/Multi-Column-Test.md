---
tags:
  - TEST
date: 2025-01-17
---

# Multi-Column Test Page

This page demonstrates the multi-column markdown functionality.

## Basic Two Columns

--- start-multi-column: basic_test
```column-settings
Number of Columns: 2
```

### Left Column
This is the content in the left column. It can contain:
- Lists
- **Bold text**
- *Italic text*
- And regular paragraphs

The content flows naturally and can be as long or short as needed.

--- column-break ---

### Right Column
This is the content in the right column. It demonstrates:
1. Numbered lists
2. Different content types
3. Balanced layout

The columns will automatically balance on mobile devices.

--- end-multi-column

## Three Columns with Custom Settings

--- start-multi-column: three_col_test
```column-settings
Number of Columns: 3
Border: off
Shadow: off
```

### Column 1
Short content in the first column.

--- column-break ---

### Column 2
Medium length content in the second column with some additional text to show how content flows.

--- column-break ---

### Column 3
Longer content in the third column with even more text to demonstrate how the layout adapts to different content lengths and how the responsive design works.

--- end-multi-column

## Custom Spacing and Alignment

--- start-multi-column: custom_test
```column-settings
Number of Columns: 2
Column Spacing: 3rem
Alignment: [Left, Center]
```

### Instructions (Left Aligned)
1. Follow these steps carefully
2. Each step builds on the previous
3. Pay attention to details

--- column-break ---

### Notes (Center Aligned)
Important reminders and tips go here.

This content is center-aligned to demonstrate the alignment feature.

--- end-multi-column

This concludes the multi-column test page. 