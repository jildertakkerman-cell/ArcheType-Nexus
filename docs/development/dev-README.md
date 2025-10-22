# Development Files

This directory contains development, testing, and archival files used during the project's evolution.

## Directory Structure

### `testing/` - Test and Comparison Files
- **`test-refactor.html`** - Testing page for validating refactored archetype data
- **`icon-test.html`** - Testing page for verifying SVG icon loading and display
- **`performance-comparison.html`** - Comprehensive performance comparison tool showing before/after optimization metrics

### `tools/` - Development Tools
- **`migration-tool.html`** - Helper tool for extracting archetype data from the original HTML file during refactoring

### `archive/` - Historical Versions
- **`index-original.html`** - The original 9,491-line monolithic HTML file (archived for reference)
- **`index.html`** - The refactored version before final optimizations (archived)

## Usage

### Testing Files
The testing files are designed to validate different aspects of the application:

1. **Test Refactor** - Run `test-refactor.html` to verify archetype data extraction and structure
2. **Icon Test** - Open `icon-test.html` to check SVG icon rendering and loading
3. **Performance Comparison** - Use `performance-comparison.html` to measure and compare loading times

### Tools
The migration tool was used during the initial refactoring process and can be referenced for understanding the data extraction methodology.

### Archive
The archived files preserve the project's history:
- Original file shows the starting point (9,491 lines)
- Refactored version shows the intermediate stage before final optimizations

## Notes

- These files are for development purposes and are not part of the main application
- Testing files may reference assets in the main `assets/` directory
- Archive files are preserved for historical reference and rollback capability if needed
- Some files may have absolute paths that need adjustment if moved to different environments

## Related Documentation

See `docs/development/` for detailed documentation about the refactoring, performance optimization, and icon fixing processes that these files supported.