
import requests
from bs4 import BeautifulSoup
import json
import re
import os

def scrape_crafting_data():
    url = "https://runescape.wiki/w/Crafting"
    
    try:
        print(f"Fetching {url}...")
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': 'https://www.google.com/'
        }
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        items = []
        seen_ids = set()
        
        # We need to find all tables
        tables = soup.find_all('table', {'class': 'wikitable'})
        
        print(f"Found {len(tables)} tables. Parsing...")
        
        for table in tables:
            rows = table.find_all('tr')
            if not rows:
                continue
                
            header_rows = []
            data_rows = []
            
            for row in rows:
                if row.find('th'):
                    header_rows.append(row)
                else:
                    data_rows.append(row)
            
            name_idx = -1
            level_idx = -1
            xp_idx = -1
            
            # 1. Try to find indices from the header text
            if header_rows:
                # Flatten all header cells from the first row (and second if exists) to text
                # Logic: Find 'Item'/'Image' column.
                
                # Check Row 1
                row1_cells = [c.get_text(strip=True).lower() for c in header_rows[0].find_all(['th', 'td'])]
                
                # NAME INDEX
                for i, text in enumerate(row1_cells):
                    if 'item' in text or 'product' in text:
                        if name_idx == -1: name_idx = i
                
                # Check for "Image" before "Item" - shift if necessary
                # If col 0 is Image and col 1 is Item, name_idx=1 is correct.
                
                # LEVEL / XP INDEX
                # Some tables have Level/XP in row 1
                for i, text in enumerate(row1_cells):
                    if 'level' in text or 'lv' in text: level_idx = i
                    if 'experience' in text or 'exp' in text or 'xp' in text: xp_idx = i
                
                # If not found, check Row 2 (common for "Crafting" -> "Lv", "XP")
                if (level_idx == -1 or xp_idx == -1) and len(header_rows) > 1:
                    row2_cells = [c.get_text(strip=True).lower() for c in header_rows[1].find_all(['th', 'td'])]
                    
                    # Row 2 usually corresponds to columns UNDER a colspan. 
                    # If "Crafting" was at index K with colspan 2, then Row 2 cells 0 and 1 correspond to K and K+1?
                    # Actually HTML table parsing is complex.
                    # Simplification: If we see Lv/XP in row 2, assume they match columns adjacent to name if name is found.
                    
                    # Common Pattern: | Image | Item | Crafting (colspan 2) | ... |
                    #                 |       |      | Lv | XP | ... |
                    # Data:           |  Img  | Name | 10 | 50 | ... |
                    # So indices: Name=1, Level=2, XP=3
                    
                    # Let's count non-colspan headers before "Crafting"
                    # This is getting complicated. Let's use a simpler data-driven heuristic.
                    pass

            # HEURISTIC FALLBACK: Scan data rows to find the pattern [String, Int, Float] or similar
            if (name_idx == -1 or level_idx == -1 or xp_idx == -1) and data_rows:
                # Check the first few rows to find consistent data types
                # We expect: Name (text), Level (int ~1-120), XP (float)
                
                candidates = [] # list of (n_i, l_i, x_i) tuples
                
                sample_row = data_rows[0]
                cells = sample_row.find_all(['td', 'th'])
                
                # Iterate all combinations of 3 columns to see if they look like Name, Level, XP
                for n in range(len(cells)):
                    for l in range(len(cells)):
                        if n == l: continue
                        for x in range(len(cells)):
                            if x == n or x == l: continue
                            
                            # Check first 5 rows
                            matches = 0
                            rows_checked = 0
                            for row in data_rows[:5]:
                                r_cells = row.find_all(['td', 'th'])
                                if len(r_cells) <= max(n,l,x): break
                                rows_checked += 1
                                
                                c_name = r_cells[n].get_text(strip=True)
                                c_lvl = r_cells[l].get_text(strip=True)
                                c_xp = r_cells[x].get_text(strip=True)

                                # Validation
                                is_name = len(c_name) > 2 and not re.match(r'^[\d.,]+$', c_name)
                                is_lvl = re.match(r'^\d+$', re.sub(r'[^\d]', '', c_lvl))
                                is_xp = re.match(r'^[\d.,]+$', c_xp)
                                
                                if is_name and is_lvl and is_xp:
                                    # Level sanity check
                                    val_lvl = int(re.sub(r'[^\d]', '', c_lvl))
                                    if 1 <= val_lvl <= 120:
                                        matches += 1
                            
                            if rows_checked > 0 and matches == rows_checked:
                                candidates.append((n, l, x))
                
                # Prefer candidates where Level is near Name and XP is near Level
                # And prefer indices matching headers if partial headers found
                if candidates:
                    # Pick the one with smallest sum of indices (left-most columns are more likely key data)
                    candidates.sort(key=lambda t: t[0] + t[1] + t[2])
                    best = candidates[0]
                    name_idx, level_idx, xp_idx = best

            # If still invalid
            if name_idx == -1 or level_idx == -1 or xp_idx == -1:
                continue

            # Parse Rows
            for row in data_rows:
                cells = row.find_all(['td', 'th'])
                if len(cells) <= max(name_idx, level_idx, xp_idx):
                    continue
                
                try:
                    name_text = cells[name_idx].get_text(strip=True)
                    # Clean garbage like "Leather gloves.png...Leather gloves" -> "Leather gloves"
                    # The text often contains the image name alt text.
                    # We can split by camelcase or duplicates?
                    # Or just take the last part if it looks duplicated.
                    # Actually, usually getting text strips parsing well.
                    # If "Leather gloves.png: RS3 Inventory image of Leather glovesLeather gloves", we want "Leather gloves".
                    
                    # Improved cleaning:
                    # If ".png" is in text, usually the text afterwards is the name.
                    if '.png' in name_text:
                        # Split by .png and take the last part, then clean "RS3 Inventory image..." if present
                        parts = name_text.split('.png')
                        candidate = parts[-1]
                        # Discard "RS3 Inventory image of..." markers which Wiki puts in alt text
                        if "RS3 Inventory image of" in candidate:
                             # Remove that phrase and what follows up to the item name? 
                             # Simpler: The item name is usually repeated.
                             # Regex to remove "RS3 Inventory image of [X]"
                             candidate = re.sub(r'RS3 Inventory image of .*?(?=[A-Z0-9])', '', candidate, flags=re.IGNORECASE)
                        
                        name_text = candidate.strip()
                        # Sometimes it results in "Leather glovesLeather gloves".
                        # If the string is a perfect repeat "X X", take X.
                        half = len(name_text) // 2
                        if name_text[:half] == name_text[half:]:
                             name_text = name_text[:half]

                    # Standard clean
                    name_text = name_text.replace("(m)", "").replace("(f2p)", "").strip()
                    if not name_text: continue

                    level_text = cells[level_idx].get_text(strip=True)
                    level = int(re.sub(r'[^\d]', '', level_text)) if re.sub(r'[^\d]', '', level_text) else 0
                    
                    xp_text = cells[xp_idx].get_text(strip=True)
                    xp = float(re.sub(r'[^\d.]', '', xp_text)) if re.sub(r'[^\d.]', '', xp_text) else 0.0

                    if level == 0 or xp == 0: continue

                    # ID and Category
                    clean_name = name_text.strip()
                    item_id = re.sub(r'[^\w\s-]', '', clean_name).lower().replace(' ', '_')
                    
                    # Additional filtering
                    if not item_id or len(item_id) < 2: continue
                    if re.match(r'^[\d.]+$', clean_name): continue
                    if clean_name.lower() in ['na', 'n/a', 'image', 'item']: continue
                    
                    if item_id in seen_ids: continue
                    
                    # Categorization Logic
                    category = "Other"
                    check_name = clean_name.lower()
                    
                    # Determine category
                    if 'urn' in check_name: category = "Urns"
                    elif 'leather' in check_name or 'hide' in check_name or 'snake' in check_name or 'carapace' in check_name or 'sirenic' in check_name:
                         if 'dragon' in check_name or 'd\'hide' in check_name: category = "Dragon Leather"
                         else: category = "Leather"
                    elif 'glass' in check_name or 'vial' in check_name or 'orb' in check_name or 'flask' in check_name or 'lens' in check_name: category = "Glass"
                    elif 'battlestaff' in check_name: category = "Battlestaves"
                    elif any(c in check_name for c in ['opal', 'jade', 'topaz', 'sapphire', 'emerald', 'ruby', 'diamond', 'dragonstone', 'onyx', 'hydrix', 'alchemical']):
                         if any(t in check_name for t in ['ring', 'necklace', 'amulet', 'bracelet', 'brooch', 'jewellery']): category = "Jewellery"
                         else: category = "Gems"
                    elif any(c in check_name for c in ['gold', 'silver', 'holy symbol', 'tiara']): category = "Jewellery"
                    elif any(c in check_name for c in ['pot', 'bowl', 'dish', 'clay', 'ceramic']): category = "Pottery"
                    elif any(c in check_name for c in ['ball of', 'string', 'rope', 'thread', 'cloth']): category = "Spinning"
                    elif any(c in check_name for c in ['cape', 'robe', 'hood', 'boots', 'gloves', 'hat']):
                         # If not caught by leather, maybe magic robes?
                         if 'imphide' in check_name or 'spider' in check_name or 'batwing' in check_name: category = "Magic Armour"
                         else: category = "Armour" # Generic
                    
                    items.append({
                        "id": item_id,
                        "name": clean_name,
                        "level": level,
                        "xp": xp,
                        "category": category
                    })
                    seen_ids.add(item_id)
                    
                except Exception:
                    continue

        items.sort(key=lambda x: x['level'])
        print(f"Found {len(items)} crafting items.")
        
        # Output file
        output_path = r"c:\Users\jazz_\Desktop\Web Development Projects\portfolioProjects\RS3-Hub\client\src\data\craftingData.js"
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("// Crafting Data - Auto-generated\n\n")
            f.write("export const CRAFTING_METHODS = [\n")
            for item in items:
                f.write(f"    {json.dumps(item)},\n")
            f.write("];\n")
            
        print("Done!")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    scrape_crafting_data()
