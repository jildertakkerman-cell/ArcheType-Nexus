# Combo Guide JSON Structure Update

## Summary
I've successfully updated the combo system to support two new features:

### 1. **Combo-Level Description**
You can now add a `description` field at the combo level (same level as `title`, `cards`, and `steps`). This description will be displayed in the combo guide with a nice italic, quoted style.

### 2. **Step-Level Custom Text**
Each step can now have an optional `customText` field that overrides the automatically generated combo step text. When `customText` is present, it will be used instead of the `text` field, and the automatic jargon expansion (like "SS" → "Special Summon") will be skipped.

## Updated JSON Structure

### Example (from mermail-combos.json):
```json
{
    "archetype": "Mermail Atlantean",
    "combos": {
        "combo1": {
            "title": "Fundamental 1-Card Starter (Shadow Squad Line)",
            "description": "This is the most fundamental combo line for Mermail. Starting with just Neptabyss, you can establish a strong board presence by leveraging Shadow Squad trigger effect and Dragoons search capabilities.",
            "cards": [...],
            "steps": [
                {
                    "text": "Normal Summon Neptabyss",
                    "customText": "Use your Normal Summon to place Neptabyss on the field. This is your combo starter!",
                    "card": "neptabyss",
                    "to": "zone-m3"
                },
                ...
            ]
        }
    }
}
```

## Files Updated

### 1. **combo-system.js** (JavaScript)
- Updated `ComboGuide.render()` method to:
  - Display the combo description if it exists (shown below the header with quote icons)
  - Use `step.customText` when available instead of auto-generated text
  - Skip jargon expansion when using customText

### 2. **JSON Files** (Data)
All three combo JSON files have been updated with example descriptions:

- **mermail-combos.json**: Added description to combo1 + customText example on first step
- **yummy-combos.json**: Added description to combo1
- **blue-eyes-combos.json**: Added description to combo1

## How It Works

### Description Display
When a combo has a `description` field, it will be displayed:
- Below the combo title header
- With an italic font style
- With quote icons on both sides
- With a subtle background color matching the theme

### Custom Text Override
When a step has `customText`:
- The `customText` is used instead of the `text` field for display
- No automatic jargon replacement happens (you have full control)
- Card name highlighting still works normally
- The `text` field is still used by the simulator for the log

## Usage Guidelines

### When to use `description`:
- Explain the overall strategy of the combo
- Mention key synergies or important cards
- Provide context for when to use this combo
- Keep it concise (1-2 sentences)

### When to use `customText`:
- When you want beginner-friendly explanations
- When the auto-generated text is too technical
- When you want to add extra context to a specific step
- When you want to avoid jargon expansion

### Optional Fields
Both `description` and `customText` are **optional**:
- If `description` is missing, no description section is shown
- If `customText` is missing, the system uses `text` with automatic jargon expansion

## Testing
The changes are backward compatible - all existing combos without these fields will continue to work exactly as before.

To see the changes in action:
1. Open any deck analysis page (e.g., Mermail Deck Analysis.html)
2. Navigate to the "Combo Guide" section
3. Expand the first combo to see the description
4. The first step will show the custom text instead of the auto-generated text
