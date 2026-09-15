import json
import os

# Directory with the combo files
temp_dir = 'temp_jsons'

# Get list of JSON files
json_files = [f for f in os.listdir(temp_dir) if f.endswith('.json')]

# Custom titles and descriptions
custom_info = {
    "ABC XYZ combo Hangar less safe.json": {
        "title": "ABC XYZ Combo with Hangar (Less Safe)",
        "description": "A variant of the ABC XYZ combo using Union Hangar with reduced safety measures, distilled from replay file."
    },
    "ABC XYZ combo X  with TTG.json": {
        "title": "ABC XYZ Combo X with Torque Tune Gear",
        "description": "ABC XYZ combo starting with X-Cross Cannon, incorporating Torque Tune Gear, distilled from replay file."
    },
    "ABC XYZ combo X.json": {
        "title": "ABC XYZ Combo X",
        "description": "Standard ABC XYZ combo starting with X-Cross Cannon, distilled from replay file."
    },
    "ABC XYZ combo Hangar.json": {
        "title": "ABC XYZ Combo with Hangar",
        "description": "ABC XYZ combo utilizing Union Hangar for setup, distilled from replay file."
    }
}

# Target file
target_file = r"assets\data\combos\a-to-z-combos.json"

# Load existing data
if os.path.exists(target_file) and os.path.getsize(target_file) > 0:
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

for file_name in json_files:
    file_path = os.path.join(temp_dir, file_name)
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            data = json.load(f)
            # Assuming each file has "combos" with "combo1"
            for combo_key, combo_data in data.get("combos", {}).items():
                new_key = f"combo{combo_counter}"
                if file_name in custom_info:
                    combo_data["title"] = custom_info[file_name]["title"]
                    combo_data["description"] = custom_info[file_name]["description"]
                else:
                    combo_data["title"] = os.path.splitext(file_name)[0]
                merged_data["combos"][new_key] = combo_data
                combo_counter += 1
    else:
        print(f"File not found: {file_path}")

# Write to target file
with open(target_file, 'w', encoding='utf-8') as f:
    json.dump(merged_data, f, indent=2, ensure_ascii=False)

print("Merged combos saved to a-to-z-combos.json")