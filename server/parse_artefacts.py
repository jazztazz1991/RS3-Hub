import re
import json

def parse_artefacts(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split by row separator (must be at start of line to avoid formula conflicts)
    # Using regex split to handle potential leading whitespace or just expected newline
    rows = re.split(r'\n\|-', content)
    
    artefacts = []
    
    for row in rows:
        # Check if row is empty or just header
        if not re.search(r'\|\s*\d+', row):
            continue

        # Level: Look for | Level format
        level_match = re.search(r'\|\s*(\d+)', row)
        if not level_match:
            continue
        level = int(level_match.group(1))
        
        # Name
        name_match = re.search(r'\{\{[Pp]linkt\|([^}]+)\}\}', row)
        if not name_match:
            continue
        name_raw = name_match.group(1)
        if '|' in name_raw:
            name = name_raw.split('|')[-1]
        else:
            name = name_raw
        
        name = name.strip()
        
        # XP
        xp = 0.0
        float_matches = re.findall(r'\|\s*([\d,]+\.\d+)', row)
        for match in float_matches:
            try:
                val = float(match.replace(',', ''))
                if val > 100: # XP filter
                    xp = val
                    break
            except:
                continue
        
        # Collections / Faction / Digsite
        collection_matches = re.findall(r'\[\[([^\]]+)\]\]', row)
        
        faction = "Unknown"
        digsite = "Unknown"
        
        found_collections = []
        
        for col in collection_matches:
            col_clean = col.strip()
            # if "Museum" in col_clean: continue # Don't skip Museum, it contains hints like Zarosian V
            
            # Keywords
            if "Zarosian" in col_clean:
                faction = "Zarosian"
                found_collections.append(col_clean)
            elif "Zamorakian" in col_clean:
                faction = "Zamorakian"
                found_collections.append(col_clean)
            elif "Saradominist" in col_clean:
                faction = "Saradominist"
                found_collections.append(col_clean)
            elif "Armadylean" in col_clean:
                faction = "Armadylean"
                found_collections.append(col_clean)
            elif "Bandosian" in col_clean or "Green Gobbo" in col_clean or "Red Rum" in col_clean:
                faction = "Bandosian"
                found_collections.append(col_clean)
            elif "Dragonkin" in col_clean:
                faction = "Dragonkin"
                found_collections.append(col_clean)
        
        # Hookah pipe debug removed
        # if name == "Hookah pipe": ...
        
        # Determine Digsite
        if faction == "Zarosian":
            is_senntisten = False
            for c in found_collections:
                if c.endswith(" V") or c.endswith(" VI") or c.endswith(" VII"):
                    is_senntisten = True
                if "Senntisten" in row:
                    is_senntisten = True
            digsite = "Senntisten" if is_senntisten else "Kharid-et"
                
        elif faction == "Zamorakian":
            digsite = "Infernal Source"
        elif faction == "Saradominist":
            digsite = "Everlight"
        elif faction == "Armadylean":
            digsite = "Stormguard Citadel"
        elif faction == "Bandosian":
            digsite = "Warforge!"
        elif faction == "Dragonkin":
            is_daemonheim = False
            for c in found_collections:
                if c.endswith(" V") or c.endswith(" VI") or c.endswith(" VII"):
                    is_daemonheim = True
            if "Daemonheim" in row or "kinship" in name.lower() or "castle gatestone" in name.lower():
                is_daemonheim = True
            
            # Correction: Some early dragonkin are Orthen
            digsite = "Daemonheim" if is_daemonheim else "Orthen"
            
        # Special Case: Tutorial / Fallbacks
        if level == 1 and "sword" in name.lower():
            digsite = "Archaeology Guild"
            faction = "Zarosian"
            
        if faction == "Unknown":
            if "Primis Elementis" in name:
                faction = "Zarosian"
                digsite = "Kharid-et"
            elif "Venator" in name and faction == "Unknown":
                faction = "Zarosian"
                digsite = "Kharid-et"
            elif "Dragonkin" in name.lower(): 
                faction = "Dragonkin"
                digsite = "Orthen"
            elif "Tetracompass" in name:
                faction = "Special"
                digsite = "Special"
                xp = 2065.0 
        
        # Manual Overrides for stubborn items
        if name == "Teleportation crystal":
            faction = "Dragonkin"
            digsite = "Orthen"
        elif name == "Ceremonial dragonkin device" or name == "Ceremonial dragonkin tablet":
            faction = "Dragonkin"
            digsite = "Orthen"
        elif name == "Spear of Annihilation":
            faction = "Bandosian"
            digsite = "Warforge!"
            
        artefacts.append({
            "name": name,
            "level": level,
            "xp": xp,
            "digsite": digsite,
            "faction": faction
        })

    artefacts.sort(key=lambda x: x['level'])
    
    js_content = "export const artefacts = " + json.dumps(artefacts, indent=4) + ";"
    
    # Write file
    with open('client/src/data/artefacts.js', 'w', encoding='utf-8') as f:
        f.write(js_content)
        
    print(f"Processed {len(artefacts)} artefacts.")
    unknowns = [a['name'] for a in artefacts if a['digsite'] == "Unknown" and a['name'] != "Tetracompass (unpowered)"]
    if unknowns:
        print(f"Artefacts with Unknown digsite: {unknowns}")

if __name__ == "__main__":
    parse_artefacts("server/artefacts_raw.txt")
