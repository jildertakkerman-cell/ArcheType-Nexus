# PowerShell Scripts

This directory contains PowerShell automation scripts for managing the Yu-Gi-Oh archetype data.

## Scripts

### extract-archetypes.ps1
Extracts archetype data from the main `index.html` file and generates a complete JavaScript data file.

**Usage:**
```powershell
.\extract-archetypes.ps1
```

**What it does:**
- Reads the archetype array from `index.html`
- Creates `assets/js/archetypes-data-complete.js` with the extracted data
- Provides statistics on the extraction (file size, archetype count)

### create-light-data.ps1
Creates a lightweight version of the archetype data for faster initial page loading.

**Usage:**
```powershell
.\create-light-data.ps1
```

**What it does:**
- Reads the full archetype data from `assets/js/archetypes-data.js`
- Creates `assets/js/archetypes-light.js` with just basic info (name, description, filepath)
- Removes SVG icon data to reduce file size
- Shows file size reduction statistics

## Requirements
- PowerShell 5.1 or later
- Scripts should be run from the `scripts/` directory
- Input files must exist in their expected locations

## Notes
- Both scripts use relative paths based on the script location
- Scripts will create output files in the `assets/js/` directory
- Error handling is included for missing files or parsing issues