import re
import json
import os

raw_file_path = r"c:\Users\jazz_\Desktop\Web Development Projects\portfolioProjects\RS3-Hub\scripts\raw_data.txt"
output_file_path = r"c:\Users\jazz_\Desktop\Web Development Projects\portfolioProjects\RS3-Hub\client\src\data\artefacts.js"

known_materials = [
    "Imperial iron", "Purpleheart wood", "Third Age iron", "Zarosian insignia", 
    "Samite silk", "Imperial steel", "White oak", "Goldrune", "Orthenglass", 
    "Cadmium red", "Ancient vis", "Tyrian purple", "Leather scraps", 
    "Chaotic brimstone", "Demonhide", "Eye of Dagon", "Hellfire metal", 
    "Keramos", "White marble", "Cobalt blue", "Everlight silvthril", 
    "Star of Saradomin", "Soapstone", "Blood of Orcus", "Vellum", 
    "Stormguard steel", "Wings of War", "Armadylean yellow", "Warforged bronze", 
    "Mark of the Kyzaj", "Fossilised bone", "Vulcanised rubber", "Yu'biusk clay", 
    "Aetherium alloy", "Quintessence", "Dragon metal", "Carbon black", 
    "Compass rose", "Felt", "Malachite green", "Animal furs", "Clay"
]

special_materials = [
    "Ruby", "Diamond", "Dragonstone", "Phoenix feather", "Rope", "Clockwork", 
    "Black mushroom ink", "Molten glass", "Sapphire", "Emerald", "Weapon poison (3)",
    "Silver bar", "Bronze bar", "White candle"
]

def determine_site(collection_str, name_str):
    s = collection_str.lower()
    n = name_str.lower()
    if "zaros" in s or "imperial" in s or "kharid" in s or "praetorian" in n: return "Kharid-et"
    if "saradomin" in s or "everlight" in s or "hallowed" in s or "dominion" in n: return "Everlight"
    if "zamorak" in s or "infernal" in s or "disorder" in n or "demon" in n: return "Infernal Source"
    if "armadyl" in s or "stormguard" in s or "avian" in n: return "Stormguard Citadel"
    if "bandos" in s or "warforge" in s or "gobbo" in s or "red rum" in s or "high priest" in n or "yurkolgokh" in n: return "Warforge!"
    if "dragonkin" in s or "orthen" in s or "moksha" in s or "xolo" in n: return "Orthen"
    if "daemonheim" in s: return "Daemonheim"
    return "Unknown"

artefacts = []

with open(raw_file_path, "r", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if not line.startswith("|"): continue
        parts = [p.strip() for p in line.split("|")]
        if len(parts) < 8: continue
        
        # Structure: | | Level | Image | Name | Materials | XP | ...
        # parts[0] is empty usually
        try:
            level = int(parts[1])
            name = parts[3]
            materials_str = parts[4]
            xp_str = parts[6].replace(",", "")
            collections_str = parts[9] if len(parts) > 9 else ""
            
            try:
                xp = float(xp_str)
            except:
                xp = 0.0

            # Parse materials
            # Regex to find "Quantity x Name"
            # The 'x' can be 'x' or '×'
            # Note: "1 × Name (damaged)" is always first.
            
            current_mats = {}
            
            # Split by looks like "14 x " or "14 × "
            # pattern: (\d+)\s*[x×]\s*
            matches = list(re.finditer(r'(\d+)\s*[x×]\s*', materials_str))
            
            for i, match in enumerate(matches):
                qty = int(match.group(1))
                start_index = match.end()
                
                # Determine end of this material name
                if i + 1 < len(matches):
                    end_index = matches[i+1].start()
                    raw_name = materials_str[start_index:end_index].strip()
                else:
                    raw_name = materials_str[start_index:].strip()
                
                # Clean name: remove "(damaged)" and trailing numbers if any (regex split handles numbers)
                if "(damaged)" in raw_name:
                    continue # Skip the base artefact
                
                # Handling "Mat1 Mat2" case where Mat2 has no quantity (Special mats)
                found_match = False
                for km in known_materials:
                    if raw_name.startswith(km):
                        current_mats[km] = qty
                        remainder = raw_name[len(km):].strip()
                        if remainder:
                            for sm in special_materials:
                                if sm in remainder:
                                    current_mats[sm] = 1
                        found_match = True
                        break
                
                if not found_match:
                    # Maybe it IS a special material directly listed as X times? e.g. "Bronze bar"
                     # but usually special mats are 1x and have no X.
                     # If we are here, we had a Quantity.
                     # Check if the name IS the material
                     current_mats[raw_name] = qty

            # Check for special materials that didn't have a multiplier x
            # They would be at the very end of the string, after the last known match
            # But my split logic includes the end in the last match processing.
            # "Hellfire metal Ruby" -> Processed above.
            
            # Additional pass for special materials if they appear alone?
            # "Name (damaged) Clockwork" -> "1 x Name" eats the clockwork? 
            # No, "Clockwork" is at the end.
            # My regex requires a number. "Clockwork" has no number.
            # So "1 x damaged item... Clockwork"
            # formatting: "1 x Item (damaged) 5 x Mat ... Clockwork"
            # The last match covers "Mat ... Clockwork".
            # My 'known_materials' check handles "Mat" and leaves "Clockwork".
            # The code `if sm in remainder` handles it.
            
            site = determine_site(collections_str, name)
            
            artefacts.append({
                "name": name,
                "level": level,
                "xp": xp,
                "materials": current_mats,
                "site": site,
                "collections": collections_str.split(" ") # rough parse
            })
            
        except Exception as e:
            print(f"Skipping line {name}: {e}")
            continue

# Write to JS
with open(output_file_path, "w", encoding="utf-8") as f:
    f.write("export const artefacts = ")
    json.dump(artefacts, f, indent=2)
    f.write(";")

print(f"Successfully processed {len(artefacts)} artefacts.")
