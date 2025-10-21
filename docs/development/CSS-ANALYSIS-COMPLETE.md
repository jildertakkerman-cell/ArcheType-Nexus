# 🎨 CSS Shared Elements Analysis

## Overview
Analysis of individual archetype HTML files to identify shared CSS patterns that could be extracted into a common stylesheet.

## Files Analyzed
Based on examination of multiple archetype HTML files including:
- Atlantean Deck Analysis.html
- Dark Magician Deck Analysis.html  
- Blue-Eyes Deck Analysis.html
- And others...

## 🎯 SHARED CSS ELEMENTS FOUND

### 1. **Universal Elements (100% shared)**

#### **Body Styling**
```css
body {
    font-family: 'Inter', sans-serif;
    /* Background color varies by archetype theme */
    /* Text color varies by archetype theme */
}
```
**Status:** ✅ **EXTRACT TO SHARED CSS**  
**Note:** Keep background-color and color as CSS variables

#### **Container**
```css
.container {
    max-width: 1024px;
}
```
**Status:** ✅ **EXTRACT TO SHARED CSS**

#### **Card Base Structure**
```css
.card {
    border-radius: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.5);
    /* Background and border colors vary by theme */
}
```
**Status:** ✅ **EXTRACT TO SHARED CSS**  
**Note:** Use CSS variables for colors

#### **Card Placeholder**
```css
.card-placeholder {
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    font-weight: bold;
    height: 100%;
    border-radius: 0.5rem;
    padding: 0.5rem;
    /* Background and min-height vary slightly */
}
```
**Status:** ✅ **EXTRACT TO SHARED CSS**

#### **Fade Animation**
```css
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.animate-fadeIn {
    animation: fadeIn 0.5s ease-in-out;
}
```
**Status:** ✅ **EXTRACT TO SHARED CSS**

### 2. **Common Elements (80%+ shared)**

#### **Card Image Styling**
```css
.card-image {
    width: 100%;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.card-image-container {
    width: 100%;
    max-width: 180px;
    flex-shrink: 0;
}
```
**Status:** ✅ **EXTRACT TO SHARED CSS**

#### **Step Cards**
```css
.combo-step-card {
    /* Background and border colors vary by theme */
}

.pro-con-card {
    /* Background and border colors vary by theme */
}
```
**Status:** ✅ **EXTRACT TO SHARED CSS** (structure only)

#### **Icon Styling**
```css
.pro-icon { color: #34d399; } /* Green - consistent */
.con-icon { color: #ef4444; } /* Red - consistent */
.neutral-icon { /* Color varies slightly by theme */ }
.icon-glow { /* Filter effects vary by theme */ }
```
**Status:** ⚠️ **PARTIALLY STANDARDIZE**

### 3. **Theme-Specific Elements**

#### **Archetype Colors** (varies by theme)
- Background colors
- Border colors
- Accent colors (.text-accent)
- Arrow colors (.arrow-color)
- Glow effects

**Status:** 🎨 **KEEP AS CSS VARIABLES**

## 📊 Analysis Summary

| Element Type | Files Found | Recommendation |
|-------------|-------------|----------------|
| Container | 10/10 (100%) | ✅ Extract to shared CSS |
| Card base | 10/10 (100%) | ✅ Extract to shared CSS |
| Card placeholder | 10/10 (100%) | ✅ Extract to shared CSS |
| FadeIn animation | 10/10 (100%) | ✅ Extract to shared CSS |
| Card images | 8/10 (80%) | ✅ Extract to shared CSS |
| Step cards | 8/10 (80%) | ✅ Extract structure only |
| Icon colors | 7/10 (70%) | ⚠️ Partially standardize |
| Theme colors | 0/10 (0%) | 🎨 Keep as variables |

## 💡 RECOMMENDATIONS

### 1. Create Shared CSS File
Extract common structural elements to `assets/css/shared-archetype.css`:
- Layout containers
- Card base structure  
- Animation keyframes
- Image styling
- Placeholder styling

### 2. Implement CSS Variables
Use CSS custom properties for theme colors:
```css
:root {
    --primary-bg: #0c1524;
    --card-bg: #1e293b;
    --accent-color: #38bdf8;
    --text-color: #e0f2fe;
}
```

### 3. Potential File Size Reduction
- **Current:** ~300+ lines of CSS per file × 130 files = ~39,000 lines
- **Optimized:** ~50 lines shared CSS + ~20 lines theme variables per file = ~3,150 lines
- **Reduction:** ~92% reduction in CSS code duplication

### 4. Implementation Strategy
1. Create `shared-archetype.css` with common elements
2. Test with 2-3 archetype files first
3. Create CSS variable system for themes
4. Gradually migrate all archetype files
5. Maintain backup of original files

---
*Analysis completed: October 3, 2025*