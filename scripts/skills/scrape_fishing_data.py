import requests
from bs4 import BeautifulSoup
import json
import re
import os

def get_fishing_data():
    url = "https://runescape.wiki/w/Fishing"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find the "Types of fish" table
        tables = soup.find_all('table', {'class': 'wikitable'})
        target_table = None
        
        for table in tables:
            headers_text = [th.get_text(strip=True).lower() for th in table.find_all('th')]
            if 'fish' in headers_text and 'xp' in headers_text and 'level' in headers_text:
                target_table = table
                break
        
        if not target_table:
            # Fallback for "Types of fish" section specifically
            header = soup.find('span', {'id': 'Types_of_fish'})
            if header:
                # Iterate siblings to find table
                for sibling in header.parent.next_siblings:
                    if sibling.name == 'table':
                        target_table = sibling
                        break
        
        if not target_table:
            print("Could not find the 'Types of fish' table.")
            return []

        fishing_items = []
        
        # Process rows
        rows = target_table.find_all('tr')[1:] # Skip header
        
        for row in rows:
            cols = row.find_all(['td', 'th'])
            if len(cols) < 5:
                continue
                
            # Column mapping based on observation:
            # 0: Image
            # 1: Fish Name
            # 2: Level
            # 3: XP
            # 4: Members/F2P
            # 6: Tool Name (Index 6 roughly, need to be careful with colspans/rowspans if any)
            
            # Use safe extraction
            try:
                name_col = cols[1]
                level_col = cols[2]
                xp_col = cols[3]
                tool_col = cols[6] if len(cols) > 6 else None
                
                name = name_col.get_text(strip=True)
                
                # Check directly for known junk or empty names
                if not name:
                    continue
                    
                level_text = level_col.get_text(strip=True)
                # Handle ranges or notes (e.g. "90 (95)") -> take first number
                level_match = re.search(r'(\d+)', level_text)
                level = int(level_match.group(1)) if level_match else 0
                
                xp_text = xp_col.get_text(strip=True).replace(',', '')
                xp_match = re.search(r'([0-9.]+)', xp_text)
                xp = float(xp_match.group(1)) if xp_match else 0
                
                tool = "Unknown"
                if tool_col:
                    tool = tool_col.get_text(strip=True)
                
                # Create ID
                # Remove "Raw " for cleaner ID, slugify
                clean_name = name.replace("Raw ", "")
                item_id = re.sub(r'[^a-zA-Z0-9]', '_', clean_name.lower()).strip('_')
                
                # Categorize based on tool
                category = "Other"
                tool_lower = tool.lower()
                
                if "net" in tool_lower:
                    category = "Net"
                elif "cage" in tool_lower or "pot" in tool_lower:
                    category = "Cage"
                elif "harpoon" in tool_lower:
                    category = "Harpoon"
                elif "fly fishing" in tool_lower or "fly-fishing" in tool_lower:
                    category = "Fly Fishing"
                elif "barbarian" in tool_lower:
                    category = "Barbarian"
                elif "rod" in tool_lower: # Catch-all for other rods
                    category = "Bait"
                
                # Specific overrides if needed
                if "leaping" in name.lower():
                    category = "Barbarian"
                if "wobbegong" in name.lower():
                    category = "Arc"
                if "croesus" in name.lower() or "fungal" in name.lower():
                    category = "Boss"

                item = {
                    "id": item_id,
                    "name": name,
                    "level": level,
                    "xp": xp,
                    "category": category
                }
                
                fishing_items.append(item)
                
            except Exception as e:
                print(f"Skipping row due to error: {e}")
                continue
                
        return fishing_items

    except Exception as e:
        print(f"Error fetching data: {e}")
        return []

def save_to_file(items):
    # Static boosts data to preserve
    boosts_data = """
export const FISHING_BOOSTS = [
    { id: 'urns', name: 'Decorated Urns', multiplier: 0.2, description: '+20% XP (Requires Urns)' },
    { id: 'fishing_outfit', name: 'Fishing Outfit', multiplier: 0.05, description: '+5% XP' },
    { id: 'shark_outfit', name: 'Shark Outfit (Combined)', multiplier: 0.07, description: '+7% XP' },
    { id: 'torstol', name: 'Torstol Incense', multiplier: 0.02, description: '+2% XP' },
    { id: 'clan_avatar', name: 'Clan Avatar', multiplier: 0.06, description: '+6% XP' },
    { id: 'call_of_sea', name: 'Call of the Sea (Aura)', multiplier: 0.0, description: 'Increases catch rate, not XP per fish' },
    { id: 'perfect_juju', name: 'Perfect Juju Potion', multiplier: 0.05, description: '+5% XP (Avg via double catch)' }, // 5% chance to double fish = 5% XP boost roughly
    { id: 'raf', name: 'Refer a Friend', multiplier: 0.1, description: '+10% XP' },
    { id: 'crystallise', name: 'Crystallise', multiplier: 0.875, description: '+87.5% XP (No fish)' }
];
"""
    
    output_path = r"c:\Users\jazz_\Desktop\Web Development Projects\portfolioProjects\RS3-Hub\client\src\data\fishingData.js"
    
    # Sort items by level
    items.sort(key=lambda x: x['level'])
    
    js_content = "// Fishing Data - Fish and Boosts\n\n"
    js_content += "export const FISHING_ITEMS = [\n"
    
    for item in items:
        # Format explicitly to match style
        js_content += f"    {{ id: '{item['id']}', name: '{item['name']}', level: {item['level']}, xp: {item['xp']}, category: '{item['category']}' }},\n"
        
    js_content += "];\n"
    js_content += boosts_data
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"Successfully wrote {len(items)} items to {output_path}")

if __name__ == "__main__":
    data = get_fishing_data()
    if data:
        save_to_file(data)
    else:
        print("No data found.")
