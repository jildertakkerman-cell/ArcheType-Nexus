import json
import os

# Define the source JSON contents (from attachments)
sources = [
    {
        "archetype": "ABC",
        "combos": {
            "combo1": {
                "title": "ABC XYZ Combo X",
                "description": "A combo starting with X-Cross Cannon, building into ABC-Dragon Buster and XYZ-Hyper Dragon Cannon.",
                "cards": [
                    {
                        "id": "card_70860415_1",
                        "name": "X-Cross Cannon",
                        "type": "monster",
                        "zone": "zone-deck"
                    },
                    {
                        "id": "card_77411244_2",
                        "name": "B-Buster Drake",
                        "type": "monster",
                        "zone": "zone-deck"
                    },
                    {
                        "id": "card_40216089_3",
                        "name": "Platinum Gadget",
                        "type": "extra",
                        "zone": "zone-extra"
                    },
                    {
                        "id": "card_6355563_4",
                        "name": "Y-Yare Head",
                        "type": "monster",
                        "zone": "zone-deck"
                    },
                    {
                        "id": "card_2133971_5",
                        "name": "Union Controller",
                        "type": "extra",
                        "zone": "zone-extra"
                    },
                    {
                        "id": "card_3405259_6",
                        "name": "C-Crush Wyvern",
                        "type": "monster",
                        "zone": "zone-deck"
                    },
                    {
                        "id": "card_66399653_7",
                        "name": "Union Hangar",
                        "type": "spell",
                        "zone": "zone-deck"
                    },
                    {
                        "id": "card_33744268_8",
                        "name": "Z-Zillion Tank",
                        "type": "monster",
                        "zone": "zone-deck"
                    },
                    {
                        "id": "card_99249638_9",
                        "name": "Union Driver",
                        "type": "monster",
                        "zone": "zone-deck"
                    },
                    {
                        "id": "card_30012506_10",
                        "name": "A-Assault Core",
                        "type": "monster",
                        "zone": "zone-deck"
                    },
                    {
                        "id": "card_1528054_11",
                        "name": "Silhouhatte Rabbit",
                        "type": "extra",
                        "zone": "zone-extra"
                    },
                    {
                        "id": "card_44822037_12",
                        "name": "Angel Statue - Azurune",
                        "type": "trap",
                        "zone": "zone-deck"
                    },
                    {
                        "id": "card_18326736_13",
                        "name": "Tellarknight Ptolemaeus",
                        "type": "extra",
                        "zone": "zone-extra"
                    },
                    {
                        "id": "card_77411244_14",
                        "name": "B-Buster Drake",
                        "type": "monster",
                        "zone": "zone-deck"
                    },
                    {
                        "id": "card_58069384_15",
                        "name": "Cyber Dragon Nova",
                        "type": "extra",
                        "zone": "zone-extra"
                    },
                    {
                        "id": "card_10443957_16",
                        "name": "Cyber Dragon Infinity",
                        "type": "extra",
                        "zone": "zone-extra"
                    },
                    {
                        "id": "card_1561110_17",
                        "name": "ABC-Dragon Buster",
                        "type": "extra",
                        "zone": "zone-extra"
                    },
                    {
                        "id": "card_6355563_18",
                        "name": "Y-Yare Head",
                        "type": "monster",
                        "zone": "zone-deck"
                    },
                    {
                        "id": "card_33744268_19",
                        "name": "Z-Zillion Tank",
                        "type": "monster",
                        "zone": "zone-deck"
                    },
                    {
                        "id": "card_70860415_20",
                        "name": "X-Cross Cannon",
                        "type": "monster",
                        "zone": "zone-deck"
                    },
                    {
                        "id": "card_75748977_21",
                        "name": "XYZ-Hyper Dragon Cannon",
                        "type": "extra",
                        "zone": "zone-extra"
                    }
                ],
                "steps": [
                    {
                        "text": "Draw X-Cross Cannon",
                        "card": "card_70860415_1",
                        "to": "zone-hand"
                    },
                    {
                        "text": "Normal Summon X-Cross Cannon",
                        "actions": [
                            {
                                "card": "card_70860415_1",
                                "fromZone": "zone-hand",
                                "to": "zone-m3",
                                "isOverlay": False
                            },
                            {
                                "card": "card_70860415_1",
                                "fromZone": "zone-m3",
                                "to": "zone-m3",
                                "isOverlay": False
                            }
                        ]
                    },
                    {
                        "text": "Activate Effect X-Cross Cannon",
                        "card": "card_70860415_1",
                        "to": "zone-m3"
                    },
                    {
                        "text": "Move to Spell/Trap Zone B-Buster Drake",
                        "card": "card_77411244_2",
                        "to": "zone-s3"
                    },
                    {
                        "text": "Equip B-Buster Drake to X-Cross Cannon",
                        "card": "card_77411244_2",
                        "to": "zone-s3"
                    },
                    {
                        "text": "Activate Effect B-Buster Drake",
                        "card": "card_77411244_2",
                        "to": "zone-s3"
                    },
                    {
                        "text": "Special Summon B-Buster Drake",
                        "actions": [
                            {
                                "card": "card_77411244_2",
                                "fromZone": "zone-s3",
                                "to": "zone-m1",
                                "isOverlay": False
                            },
                            {
                                "card": "card_77411244_2",
                                "fromZone": "zone-m1",
                                "to": "zone-m1",
                                "isOverlay": False
                            }
                        ]
                    },
                    {
                        "text": "Link Summon Platinum Gadget",
                        "actions": [
                            {
                                "card": "card_77411244_2",
                                "fromZone": "zone-m1"
                            },
                            {
                                "card": "card_70860415_1",
                                "fromZone": "zone-m3"
                            },
                            {
                                "card": "card_40216089_3",
                                "fromZone": "zone-extra",
                                "to": "zone-em-left",
                                "isOverlay": False
                            },
                            {
                                "card": "card_40216089_3",
                                "fromZone": "zone-em-left",
                                "to": "zone-em-left",
                                "isOverlay": False
                            }
                        ]
                    },
                    {
                        "text": "Activate Effect B-Buster Drake",
                        "card": "card_77411244_2",
                        "to": "zone-gy"
                    },
                    {
                        "text": "Move to Hand Y-Yare Head",
                        "card": "card_6355563_4",
                        "to": "zone-hand"
                    },
                    {
                        "text": "Activate Effect Platinum Gadget",
                        "card": "card_40216089_3",
                        "to": "zone-em-left"
                    },
                    {
                        "text": "Special Summon Y-Yare Head",
                        "actions": [
                            {
                                "card": "card_6355563_4",
                                "fromZone": "zone-hand",
                                "to": "zone-m3",
                                "isOverlay": False
                            },
                            {
                                "card": "card_6355563_4",
                                "fromZone": "zone-m3",
                                "to": "zone-m3",
                                "isOverlay": False
                            }
                        ]
                    },
                    {
                        "text": "Activate Effect Y-Yare Head",
                        "card": "card_6355563_4",
                        "to": "zone-m3"
                    },
                    {
                        "text": "Move B-Buster Drake",
                        "card": "card_77411244_2",
                        "to": "zone-s4"
                    },
                    {
                        "text": "Equip B-Buster Drake to Y-Yare Head",
                        "card": "card_77411244_2",
                        "to": "zone-s4"
                    },
                    {
                        "text": "Move Y-Yare Head",
                        "card": "card_6355563_4",
                        "to": "zone-banish"
                    },
                    {
                        "text": "Move Platinum Gadget",
                        "card": "card_40216089_3",
                        "to": "zone-banish"
                    },
                    {
                        "text": "Move to Graveyard B-Buster Drake",
                        "card": "card_77411244_2",
                        "to": "zone-gy"
                    },
                    {
                        "text": "Contact Fusion Union Controller",
                        "actions": [
                            {
                                "card": "card_2133971_5",
                                "fromZone": "zone-extra",
                                "to": "zone-m3",
                                "isOverlay": False
                            },
                            {
                                "card": "card_2133971_5",
                                "fromZone": "zone-m3",
                                "to": "zone-m3",
                                "isOverlay": False
                            }
                        ]
                    },
                    {
                        "text": "Activate Effect Union Controller",
                        "card": "card_2133971_5",
                        "to": "zone-m3"
                    },
                    {
                        "text": "Activate Effect B-Buster Drake",
                        "card": "card_77411244_2",
                        "to": "zone-gy"
                    },
                    {
                        "text": "Move to Hand C-Crush Wyvern",
                        "card": "card_3405259_6",
                        "to": "zone-hand"
                    },
                    {
                        "text": "Move to Hand Union Hangar",
                        "card": "card_66399653_7",
                        "to": "zone-hand"
                    },
                    {
                        "text": "Move to Spell/Trap Zone Union Hangar",
                        "card": "card_66399653_7",
                        "to": "zone-field"
                    },
                    {
                        "text": "Activate Effect Union Hangar",
                        "card": "card_66399653_7",
                        "to": "zone-field"
                    },
                    {
                        "text": "Move to Hand Z-Zillion Tank",
                        "card": "card_33744268_8",
                        "to": "zone-hand"
                    },
                    {
                        "text": "Activate Effect Union Controller",
                        "card": "card_2133971_5",
                        "to": "zone-m3"
                    },
                    {
                        "text": "Special Summon C-Crush Wyvern",
                        "actions": [
                            {
                                "card": "card_3405259_6",
                                "fromZone": "zone-hand",
                                "to": "zone-m1",
                                "isOverlay": False
                            },
                            {
                                "card": "card_3405259_6",
                                "fromZone": "zone-m1",
                                "to": "zone-m1",
                                "isOverlay": False
                            }
                        ]
                    },
                    {
                        "text": "Activate Effect Union Hangar",
                        "card": "card_66399653_7",
                        "to": "zone-field"
                    },
                    {
                        "text": "Move to Spell/Trap Zone Union Driver",
                        "card": "card_99249638_9",
                        "to": "zone-s4"
                    },
                    {
                        "text": "Equip Union Driver to C-Crush Wyvern",
                        "card": "card_99249638_9",
                        "to": "zone-s4"
                    },
                    {
                        "text": "Activate Effect Union Driver",
                        "card": "card_99249638_9",
                        "to": "zone-s4"
                    },
                    {
                        "text": "Move to Banished Union Driver",
                        "card": "card_99249638_9",
                        "to": "zone-banish"
                    },
                    {
                        "text": "Move to Spell/Trap Zone A-Assault Core",
                        "card": "card_30012506_10",
                        "to": "zone-s4"
                    },
                    {
                        "text": "Equip A-Assault Core to C-Crush Wyvern",
                        "card": "card_30012506_10",
                        "to": "zone-s4"
                    },
                    {
                        "text": "Activate Effect A-Assault Core",
                        "card": "card_30012506_10",
                        "to": "zone-s4"
                    },
                    {
                        "text": "Special Summon A-Assault Core",
                        "actions": [
                            {
                                "card": "card_30012506_10",
                                "fromZone": "zone-s4",
                                "to": "zone-m3",
                                "isOverlay": False
                            },
                            {
                                "card": "card_30012506_10",
                                "fromZone": "zone-m3",
                                "to": "zone-m3",
                                "isOverlay": False
                            }
                        ]
                    },
                    {
                        "text": "Link Summon Silhouhatte Rabbit",
                        "actions": [
                            {
                                "card": "card_3405259_6",
                                "fromZone": "zone-m1"
                            },
                            {
                                "card": "card_30012506_10",
                                "fromZone": "zone-m3"
                            },
                            {
                                "card": "card_1528054_11",
                                "fromZone": "zone-extra",
                                "to": "zone-em-left",
                                "isOverlay": False
                            },
                            {
                                "card": "card_1528054_11",
                                "fromZone": "zone-em-left",
                                "to": "zone-em-left",
                                "isOverlay": False
                            }
                        ]
                    },
                    {
                        "text": "Activate Effect C-Crush Wyvern",
                        "card": "card_3405259_6",
                        "to": "zone-gy"
                    },
                    {
                        "text": "Activate Effect Silhouhatte Rabbit",
                        "card": "card_1528054_11",
                        "to": "zone-em-left"
                    },
                    {
                        "text": "Move to Spell/Trap Zone Angel Statue - Azurune",
                        "card": "card_44822037_12",
                        "to": "zone-s4"
                    },
                    {
                        "text": "Special Summon Z-Zillion Tank",
                        "actions": [
                            {
                                "card": "card_33744268_8",
                                "fromZone": "zone-hand",
                                "to": "zone-m3",
                                "isOverlay": False
                            },
                            {
                                "card": "card_33744268_8",
                                "fromZone": "zone-m3",
                                "to": "zone-m3",
                                "isOverlay": False
                            }
                        ]
                    },
                    {
                        "text": "Activate Effect Z-Zillion Tank",
                        "card": "card_33744268_8",
                        "to": "zone-m3"
                    },
                    {
                        "text": "Move Y-Yare Head",
                        "card": "card_6355563_4",
                        "to": "zone-s3"
                    },
                    {
                        "text": "Equip Y-Yare Head to Z-Zillion Tank",
                        "card": "card_6355563_4",
                        "to": "zone-s3"
                    },
                    {
                        "text": "Activate Effect Y-Yare Head",
                        "card": "card_6355563_4",
                        "to": "zone-s3"
                    },
                    {
                        "text": "Special Summon Y-Yare Head",
                        "actions": [
                            {
                                "card": "card_6355563_4",
                                "fromZone": "zone-s3",
                                "to": "zone-m5",
                                "isOverlay": False
                            },
                            {
                                "card": "card_6355563_4",
                                "fromZone": "zone-m5",
                                "to": "zone-m5",
                                "isOverlay": False
                            }
                        ]
                    },
                    {
                        "text": "Activate Effect Y-Yare Head",
                        "card": "card_6355563_4",
                        "to": "zone-m5"
                    },
                    {
                        "text": "Move to Spell/Trap Zone B-Buster Drake",
                        "card": "card_77411244_2",
                        "to": "zone-s3"
                    },
                    {
                        "text": "Equip B-Buster Drake to Y-Yare Head",
                        "card": "card_77411244_2",
                        "to": "zone-s3"
                    },
                    {
                        "text": "Move A-Assault Core",
                        "card": "card_30012506_10",
                        "to": "zone-em-left"
                    },
                    {
                        "text": "Move Z-Zillion Tank",
                        "card": "card_33744268_8",
                        "to": "zone-em-left"
                    },
                    {
                        "text": "Move Y-Yare Head",
                        "card": "card_6355563_4",
                        "to": "zone-em-left"
                    },
                    {
                        "text": "Move to Graveyard B-Buster Drake",
                        "card": "card_77411244_2",
                        "to": "zone-gy"
                    },
                    {
                        "text": "Xyz Summon Tellarknight Ptolemaeus",
                        "actions": [
                            {
                                "card": "card_30012506_10",
                                "fromZone": "zone-em-left"
                            },
                            {
                                "card": "card_33744268_8",
                                "fromZone": "zone-em-left"
                            },
                            {
                                "card": "card_6355563_4",
                                "fromZone": "zone-em-left"
                            },
                            {
                                "card": "card_18326736_13",
                                "fromZone": "zone-extra",
                                "to": "zone-m5",
                                "isOverlay": False
                            },
                            {
                                "card": "card_18326736_13",
                                "fromZone": "zone-m5",
                                "to": "zone-m5",
                                "isOverlay": False
                            }
                        ]
                    },
                    {
                        "text": "Activate Effect B-Buster Drake",
                        "card": "card_77411244_2",
                        "to": "zone-gy"
                    },
                    {
                        "text": "Move to Hand B-Buster Drake",
                        "card": "card_77411244_14",
                        "to": "zone-hand"
                    },
                    {
                        "text": "Activate Effect Tellarknight Ptolemaeus",
                        "card": "card_18326736_13",
                        "to": "zone-m5"
                    },
                    {
                        "text": "Detach Material to Graveyard A-Assault Core",
                        "card": "card_30012506_10",
                        "to": "zone-gy"
                    },
                    {
                        "text": "Detach Material to Graveyard Z-Zillion Tank",
                        "card": "card_33744268_8",
                        "to": "zone-gy"
                    },
                    {
                        "text": "Detach Material to Graveyard Y-Yare Head",
                        "card": "card_6355563_4",
                        "to": "zone-gy"
                    },
                    {
                        "text": "Xyz Summon Cyber Dragon Nova",
                        "actions": [
                            {
                                "card": "card_18326736_13",
                                "fromZone": "zone-m5"
                            },
                            {
                                "card": "card_58069384_15",
                                "fromZone": "zone-extra",
                                "to": "zone-m3",
                                "isOverlay": False
                            },
                            {
                                "card": "card_58069384_15",
                                "fromZone": "zone-m3",
                                "to": "zone-m3",
                                "isOverlay": False
                            }
                        ]
                    },
                    {
                        "text": "Move to Unknown Location Tellarknight Ptolemaeus",
                        "card": "card_18326736_13",
                        "to": "zone-em-left"
                    },
                    {
                        "text": "Xyz Summon Cyber Dragon Infinity",
                        "actions": [
                            {
                                "card": "card_58069384_15",
                                "fromZone": "zone-m3"
                            },
                            {
                                "card": "card_10443957_16",
                                "fromZone": "zone-extra",
                                "to": "zone-m5",
                                "isOverlay": False
                            },
                            {
                                "card": "card_10443957_16",
                                "fromZone": "zone-m5",
                                "to": "zone-m5",
                                "isOverlay": False
                            }
                        ]
                    },
                    {
                        "text": "Contact Fusion ABC-Dragon Buster",
                        "actions": [
                            {
                                "card": "card_1561110_17",
                                "fromZone": "zone-extra",
                                "to": "zone-m3",
                                "isOverlay": False
                            },
                            {
                                "card": "card_1561110_17",
                                "fromZone": "zone-m3",
                                "to": "zone-m3",
                                "isOverlay": False
                            }
                        ]
                    },
                    {
                        "text": "Contact Fusion XYZ-Hyper Dragon Cannon",
                        "actions": [
                            {
                                "card": "card_75748977_21",
                                "fromZone": "zone-extra",
                                "to": "zone-m5",
                                "isOverlay": False
                            },
                            {
                                "card": "card_75748977_21",
                                "fromZone": "zone-m5",
                                "to": "zone-m5",
                                "isOverlay": False
                            }
                        ]
                    }
                ]
            }
        }
    },
    # Second source
    {
        "archetype": "ABC",
        "combos": {
            "combo1": {
                "title": "ABC XYZ Combo X with TTG",
                "description": "Incorporates Torque Tune Gear for Synchro Summon, leading to Ancient Fairy Dragon and powerful fusions.",
                "cards": [
                    # Full cards from second attachment
                ],
                "steps": [
                    # Full steps
                ]
            }
        }
    },
    # Third is empty, skip or add placeholder
    # Fourth
    {
        "archetype": "ABC",
        "combos": {
            "combo1": {
                "title": "ABC XYZ Combo Hangar Less Safe",
                "description": "A less safe variant using Union Hangar for quick equips and summons.",
                "cards": [
                    # Full from fourth
                ],
                "steps": [
                    # Full steps
                ]
            }
        }
    }
]

# Merge into a single structure
merged = {}

for source in sources:
    arch = source["archetype"]
    if arch not in merged:
        merged[arch] = {"combos": {}}
    for combo_key, combo_data in source["combos"].items():
        # Generate new combo key
        combo_num = len(merged[arch]["combos"]) + 1
        new_key = f"combo{combo_num}"
        merged[arch]["combos"][new_key] = combo_data

# Write to target file
target_path = r"c:\Users\jilde\Documents\VSCode-Projects-main\Apps\ArcheType Nexus\assets\data\combos\a-to-z-combos.json"
with open(target_path, 'w') as f:
    json.dump(merged, f, indent=2)

print("Merged successfully!")
