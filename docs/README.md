# Documentation

This directory contains all project documentation organized by category.

## Structure

### Development Documentation (`development/`)
Technical documentation about the project's evolution and improvements:

- **[README-refactoring.md](development/README-refactoring.md)** - Details about the initial refactoring from monolithic to modular structure
- **[REFACTORING-COMPLETE.md](development/REFACTORING-COMPLETE.md)** - Summary of the complete refactoring process and results
- **[PERFORMANCE-OPTIMIZATION-COMPLETE.md](development/PERFORMANCE-OPTIMIZATION-COMPLETE.md)** - Performance improvements that achieved 6x faster loading
- **[ICON-FIXES-COMPLETE.md](development/ICON-FIXES-COMPLETE.md)** - Resolution of icon loading issues and SVG display problems
- **[dev-README.md](development/dev-README.md)** - Documentation about development files (testing, tools, archives)
- **[js-archive-README.md](development/js-archive-README.md)** - Documentation about archived JavaScript files

### Project Documentation
- **[scripts-README.md](scripts-README.md)** - Documentation for PowerShell automation scripts

## Timeline

1. **Initial Refactoring** - Broke down 9,491-line file into modular components
2. **Performance Optimization** - Implemented lazy loading and pagination for 6x speed improvement
3. **Icon Fixes** - Resolved SVG icon loading and display issues
4. **Documentation Organization** - Organized all documentation into logical structure

## For Developers

If you're working on this project, start by reading the development documentation in chronological order:

1. [README-refactoring.md](development/README-refactoring.md) - Understand the new structure
2. [REFACTORING-COMPLETE.md](development/REFACTORING-COMPLETE.md) - See what was accomplished
3. [PERFORMANCE-OPTIMIZATION-COMPLETE.md](development/PERFORMANCE-OPTIMIZATION-COMPLETE.md) - Learn about performance features
4. [ICON-FIXES-COMPLETE.md](development/ICON-FIXES-COMPLETE.md) - Understand icon implementation

## Contributing

When adding new documentation:
- Place technical/development docs in `development/`
- Use descriptive filenames with dates if applicable
- Update this index when adding new files
- Follow the existing markdown formatting conventions