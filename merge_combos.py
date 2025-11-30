import json
import os

# Paths to the combo files
combo_files = [
    r"c:\Users\jilde\Downloads\ABC XYZ combo X.json",
    r"c:\Users\jilde\Downloads\ABC XYZ combo Hangar (4).json",
    r"c:\Users\jilde\Downloads\ABC XYZ combo Hangar less safe.json",
    r"c:\Users\jilde\Downloads\ABC XYZ combo X  with TTG.json"
]

# Corresponding titles
titles = [
    "ABC XYZ combo X",
    "ABC XYZ combo Hangar",
    "ABC XYZ combo Hangar less safe",
    "ABC XYZ combo X with TTG"
]

# Target file
target_file = r"c:\Users\jilde\Documents\VSCode-Projects-main\Apps\ArcheType Nexus\assets\data\combos\a-to-z-combos.json"

# Load existing data
if os.path.exists(target_file):
    with open(target_file, 'r') as f:
        merged_data = json.load(f)
else:
    merged_data = {
        "archetype": "ABC",
        "combos": {}
    }

# Find the next combo number
existing_combos = list(merged_data["combos"].keys())
if existing_combos:
    combo_numbers = [int(k.replace('combo', '')) for k in existing_combos if k.startswith('combo')]
    combo_counter = max(combo_numbers) + 1 if combo_numbers else 1
else:
    combo_counter = 1

for file_path, title in zip(combo_files, titles):
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            data = json.load(f)
            # Assuming each file has "combos" with "combo1"
            for combo_key, combo_data in data.get("combos", {}).items():
                new_key = f"combo{combo_counter}"
                combo_data["title"] = title
                merged_data["combos"][new_key] = combo_data
                combo_counter += 1
    else:
        print(f"File not found: {file_path}")

# Write to target file
with open(target_file, 'w', encoding='utf-8') as f:
    json.dump(merged_data, f, indent=2, ensure_ascii=False)

print("Merged combos saved to a-to-z-combos.json")