import json

# Target file
target_file = 'assets/data/combos/a-to-z-combos.json'

# Load the data
with open(target_file, 'r') as f:
    data = json.load(f)

# Define new titles and descriptions
updates = {
    "combo1": {
        "title": "ABC Hangar to ABC-Dragon Buster",
        "description": "A combo utilizing Union Hangar to set up Union Drivers and special summon key ABC pieces, leading to the fusion summon of ABC-Dragon Buster."
    },
    "combo2": {
        "title": "ABC Hangar (Less Safe) to XYZ-Hyper Cannon",
        "description": "A variant of the Union Hangar combo that is less consistent but leads to the XYZ summon of XYZ-Hyper Dragon Cannon."
    },
    "combo3": {
        "title": "ABC X with TTG to XYZ-Hyper Cannon",
        "description": "An ABC combo starting with X-Cross Cannon, incorporating TTG elements, culminating in the XYZ summon of XYZ-Hyper Dragon Cannon."
    },
    "combo4": {
        "title": "ABC X to XYZ-Hyper Cannon",
        "description": "A standard ABC combo beginning with X-Cross Cannon, building through various unions and links to achieve XYZ-Hyper Dragon Cannon."
    }
}

# Update the combos
for combo_key, update in updates.items():
    if combo_key in data["combos"]:
        data["combos"][combo_key]["title"] = update["title"]
        data["combos"][combo_key]["description"] = update["description"]

# Write back
with open(target_file, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Titles and descriptions updated.")