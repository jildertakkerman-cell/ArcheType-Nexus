"""
Merge ABC XYZ combo JSON files into a single a-to-z-combos.json file.
"""

import json
from pathlib import Path


def load_json(file_path: str) -> dict:
    """Load a JSON file and return its contents."""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def merge_combo_files():
    """Merge multiple ABC XYZ combo files into one."""
    
    downloads_path = Path(r"C:\Users\jilde\Downloads")
    output_path = Path(r"C:\Users\jilde\Documents\VSCode-Projects-main\Apps\ArcheType Nexus\assets\data\a-to-z-combos.json")
    
    # Define the combo files with their new titles and descriptions
    combo_files = [
        {
            "file": downloads_path / "ABC XYZ combo X.json",
            "title": "X-Cross Cannon Starter",
            "description": "Start with X-Cross Cannon to search Union pieces, build into Platinum Gadget plays, and end on ABC-Dragon Buster + XYZ-Hyper Dragon Cannon + Cyber Dragon Infinity."
        },
        {
            "file": downloads_path / "ABC XYZ combo Hangar.json",
            "title": "Union Hangar 1-Card Combo",
            "description": "Use Union Hangar as your single starter to search B-Buster Drake, combo through Union Controller, and end on ABC-Dragon Buster + Cyber Dragon Infinity with Azurune protection."
        },
        {
            "file": downloads_path / "ABC XYZ combo Hangar less safe.json",
            "title": "Union Hangar Extended (XYZ Finish)",
            "description": "Alternative Union Hangar line using Union Activation to access X-Cross Cannon, ending on ABC-Dragon Buster + XYZ-Hyper Dragon Cannon + Cyber Dragon Infinity."
        },
        {
            "file": downloads_path / "ABC XYZ combo X  with TTG.json",
            "title": "X-Cross Cannon + Torque Tune Gear",
            "description": "X-Cross Cannon opener with Torque Tune Gear tech into Ancient Fairy Dragon for Therion Discolosseum access, ending on Therion King Regulus + ABC-Dragon Buster + XYZ-Hyper Dragon Cannon + Cyber Dragon Infinity."
        }
    ]
    
    # Create the merged structure
    merged = {
        "archetype": "ABC",
        "combos": {}
    }
    
    # Process each combo file
    for i, combo_info in enumerate(combo_files, start=1):
        file_path = combo_info["file"]
        
        if not file_path.exists():
            print(f"Warning: File not found: {file_path}")
            continue
        
        print(f"Loading: {file_path.name}")
        data = load_json(file_path)
        
        # Get the combo data (assuming it's in combo1)
        if "combos" in data and "combo1" in data["combos"]:
            combo_data = data["combos"]["combo1"].copy()
            
            # Update title and description
            combo_data["title"] = combo_info["title"]
            combo_data["description"] = combo_info["description"]
            
            # Add to merged combos with new key
            combo_key = f"combo{i}"
            merged["combos"][combo_key] = combo_data
            print(f"  -> Added as {combo_key}: {combo_info['title']}")
    
    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Write the merged file
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(merged, f, indent=2, ensure_ascii=False)
    
    print(f"\nMerged {len(merged['combos'])} combos into: {output_path}")
    
    # Print summary
    print("\nCombos in merged file:")
    for key, combo in merged["combos"].items():
        print(f"  {key}: {combo['title']}")
        print(f"         Cards: {len(combo['cards'])}, Steps: {len(combo['steps'])}")


if __name__ == "__main__":
    merge_combo_files()
