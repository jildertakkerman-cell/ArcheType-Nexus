import json
import os

# JSON data from the attachments
source_data_list = [
    # ABC XYZ combo Hangar (1).json
    {
        "archetype": "ABC",
        "combos": {
            "combo1": {
                "title": "Imported Combo",
                "description": "Automatically distilled from replay file.",
                "cards": [
                    {"id": "card_66399653_1", "name": "Union Hangar", "type": "spell", "zone": "zone-deck"},
                    {"id": "card_77411244_2", "name": "B-Buster Drake", "type": "monster", "zone": "zone-deck"},
                    # ... (truncated for brevity, include full content)
                ],
                "steps": [
                    {"text": "Draw Union Hangar", "card": "card_66399653_1", "to": "zone-hand"},
                    # ... full steps
                ]
            }
        }
    },
    # ABC XYZ combo Hangar less safe (1).json - same as above but with different steps
    {
        "archetype": "ABC",
        "combos": {
            "combo1": {
                "title": "Imported Combo",
                "description": "Automatically distilled from replay file.",
                "cards": [
                    {"id": "card_66399653_1", "name": "Union Hangar", "type": "spell", "zone": "zone-deck"},
                    # full cards
                ],
                "steps": [
                    # full steps
                ]
            }
        }
    },
    # ABC XYZ combo X  with TTG (1).json
    {
        "archetype": "ABC",
        "combos": {
            "combo1": {
                "title": "Imported Combo",
                "description": "Automatically distilled from replay file.",
                "cards": [
                    # full cards
                ],
                "steps": [
                    # full steps
                ]
            }
        }
    },
    # ABC XYZ combo X (1).json
    {
        "archetype": "ABC",
        "combos": {
            "combo1": {
                "title": "Imported Combo",
                "description": "Automatically distilled from replay file.",
                "cards": [
                    # full cards
                ],
                "steps": [
                    # full steps
                ]
            }
        }
    }
]

# Filenames for title generation
filenames = [
    "ABC XYZ combo Hangar (1).json",
    "ABC XYZ combo Hangar less safe (1).json",
    "ABC XYZ combo X  with TTG (1).json",
    "ABC XYZ combo X (1).json"
]

# Target file path
target_file = r"c:\Users\jilde\Documents\VSCode-Projects-main\Apps\ArcheType Nexus\assets\data\combos\a-to-z-combos.json"

# Load existing target data or initialize empty dict
if os.path.exists(target_file):
    with open(target_file, 'r') as f:
        target_data = json.load(f)
else:
    target_data = {}

# Function to generate title and description based on filename
def get_title_and_description(filename):
    base = filename.replace('.json', '').replace(' (1)', '')
    if 'Hangar less safe' in base:
        title = "ABC XYZ Combo with Hangar (Less Safe)"
        description = "A less safe variation of the ABC XYZ combo starting with Union Hangar, focusing on quick fusions."
    elif 'Hangar' in base:
        title = "ABC XYZ Combo with Hangar"
        description = "An ABC XYZ combo starting with Union Hangar for efficient summoning and fusions."
    elif 'X  with TTG' in base:
        title = "ABC XYZ Combo starting with X-Cross Cannon with TTG"
        description = "An ABC XYZ combo beginning with X-Cross Cannon, incorporating Torque Tune Gear for Synchro summons."
    elif 'X' in base:
        title = "ABC XYZ Combo starting with X-Cross Cannon"
        description = "A standard ABC XYZ combo starting with X-Cross Cannon, leading to powerful XYZ and Fusion summons."
    else:
        title = "ABC XYZ Combo"
        description = "A detailed combo guide for the ABC archetype."
    return title, description

# Process each source data
for i, source_data in enumerate(source_data_list):
    filename = filenames[i]
    
    archetype = source_data.get('archetype')
    if not archetype:
        print(f"No archetype found for {filename}")
        continue
    
    if archetype not in target_data:
        target_data[archetype] = {"combos": {}}
    
    combos = source_data.get('combos', {})
    for combo_key, combo_data in combos.items():
        # Generate new combo key
        new_combo_key = f"combo{len(target_data[archetype]['combos']) + 1}"
        
        # Update title and description
        title, description = get_title_and_description(filename)
        combo_data['title'] = title
        combo_data['description'] = description
        
        # Add to target
        target_data[archetype]['combos'][new_combo_key] = combo_data

# Write the merged data to the target file
with open(target_file, 'w') as f:
    json.dump(target_data, f, indent=4)

print("Merging completed successfully.")