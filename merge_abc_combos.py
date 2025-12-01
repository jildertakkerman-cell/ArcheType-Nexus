import json
import os

# Define the file paths and their metadata
combo_data = [
    {
        "file": r"C:\Users\jilde\Downloads\ABC XYZ combo Hangar less safe.json",
        "title": "Union Hangar Start - ABC/XYZ Full Board",
        "description": "Starting with Union Hangar, this combo builds into ABC-Dragon Buster and XYZ-Hyper Dragon Cannon with Cyber Dragon Infinity for negation. A less safe variant that requires Hangar in hand."
    },
    {
        "file": r"C:\Users\jilde\Downloads\ABC XYZ combo X  with TTG.json",
        "title": "X-Cross Cannon Start with Therion Engine",
        "description": "Opens with X-Cross Cannon and incorporates the Therion engine via Ancient Fairy Dragon into Therion Discolosseum and King Regulus. Ends on ABC-Dragon Buster, XYZ-Hyper Dragon Cannon, and Cyber Dragon Infinity."
    },
    {
        "file": r"C:\Users\jilde\Downloads\ABC XYZ combo X.json",
        "title": "X-Cross Cannon Start - Standard ABC/XYZ",
        "description": "A streamlined combo starting with X-Cross Cannon, using Union Controller and Silhouhatte Rabbit to generate resources. Ends on ABC-Dragon Buster, XYZ-Hyper Dragon Cannon, and Cyber Dragon Infinity."
    },
    {
        "file": r"C:\Users\jilde\Downloads\ABC XYZ combo Hangar.json",
        "title": "Union Hangar Start - ABC Dragon Buster",
        "description": "Standard Hangar combo using Unauthorized Reactivation to equip A-Assault Core. Ends on ABC-Dragon Buster and Cyber Dragon Infinity for disruption."
    }
]

# Target file
target_file = r"C:\Users\jilde\Documents\VSCode-Projects-main\Apps\ArcheType Nexus\assets\data\combos\a-to-z-combos.json"

# Initialize fresh merged data
merged_data = {
    "archetype": "A-to-Z",
    "combos": {}
}

combo_counter = 1

# Merge the combos
for item in combo_data:
    file_path = item["file"]
    title = item["title"]
    desc = item["description"]
    
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            for combo_key, combo_info in data.get("combos", {}).items():
                new_key = f"combo{combo_counter}"
                combo_info["title"] = title
                combo_info["description"] = desc
                merged_data["combos"][new_key] = combo_info
                print(f"✓ Added {new_key}: {title}")
                print(f"  Cards: {len(combo_info.get('cards', []))}, Steps: {len(combo_info.get('steps', []))}")
                combo_counter += 1
    else:
        print(f"✗ File not found: {file_path}")

# Write to target file
with open(target_file, 'w', encoding='utf-8') as f:
    json.dump(merged_data, f, indent=2, ensure_ascii=False)

print(f"\n✓ Merged {len(merged_data['combos'])} combos into {target_file}")

# Print summary
print("\n=== Combo Summary ===")
for key, combo in merged_data["combos"].items():
    print(f"\n{key}:")
    print(f"  Title: {combo['title']}")
    print(f"  Description: {combo['description']}")