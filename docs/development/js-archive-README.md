# JavaScript Files Archive

## Overview
This archive contains JavaScript files that are not currently used by `index.html` but were part of the project's development history.

## Currently Used File
- **`main-reliable-optimized.js`** - The only JavaScript file currently referenced by `index.html`

## Archived Files

### Core Application Files
- **`main.js`** - Original main JavaScript file (likely from early development)
- **`main-optimized.js`** - First optimization attempt
- **`main-ultra-optimized.js`** - Ultra optimization version (possibly with issues)

### Data Files
- **`archetypes-data.js`** - Full archetype data with SVG icons
- **`archetypes-light.js`** - Lightweight version of archetype data

## Why These Files Were Archived

### Performance Optimization Evolution
The project went through several iterations:
1. `main.js` - Original implementation
2. `main-optimized.js` - First optimization pass
3. `main-ultra-optimized.js` - Aggressive optimization (possibly caused issues)
4. `main-reliable-optimized.js` - **CURRENT** - Balanced optimization that works reliably

### Data Architecture Changes
- `archetypes-data.js` and `archetypes-light.js` appear to be from an earlier data architecture
- Current version likely embeds data differently or uses a different loading mechanism

## Archive Safety
- ✅ All files are preserved for rollback capability
- ✅ No functionality is lost
- ✅ Clean file structure maintained
- ✅ Easy restoration if needed

## Restoration Instructions
If you need to restore any of these files:

```powershell
# Navigate to the js directory
cd "c:\Users\jilde\Downloads\Hobby-20250926T223016Z-1-001\Hobby\assets\js"

# Move specific file back (example)
Move-Item "archive\main.js" ".\"

# Or restore all files
Move-Item "archive\*" ".\"
```

## File Sizes (Archived)
```
archetypes-data.js          - [Contains full archetype data with SVG icons]
archetypes-light.js         - [Lightweight data version]
main.js                     - [Original main script]
main-optimized.js           - [First optimization]
main-ultra-optimized.js     - [Ultra optimization]
```

## Current State
- **Active JS files:** 1 file (`main-reliable-optimized.js`)
- **Archived JS files:** 5 files
- **Total space saved:** Clean main directory with only necessary files
- **Maintenance benefit:** Easier to identify what's actually being used

---
*Archive created: October 3, 2025*  
*Files moved based on analysis of index.html dependencies*