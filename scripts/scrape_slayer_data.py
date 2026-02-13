import requests
from bs4 import BeautifulSoup
import re
import json
import os

def fetch_slayer_data():
    url = "https://runescape.wiki/w/Slayer_monsters"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    print(f"Fetching {url}...")
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # The main table is usually the one with sortable class or relevant headers
        # Look for headers: "Monster", "Slayer level", "Combat level", "Life points", "Slayer XP"
        tables = soup.find_all('table', {'class': 'wikitable'})
        
        target_table = None
        for t in tables:
            headers = [th.get_text(strip=True).lower() for th in t.find_all('th')]
            # The wiki table often has colspan, so text search on th might fail if we don't handle colspan logic implicitly, 
            # but usually at least one simple TH exists.
            found_marker = False
            for h in headers:
               if "monster" in h or "slayer xp" in h:
                   found_marker = True
                   break
            if found_marker:
                target_table = t
                break
        
        if not target_table:
            print("Could not find Slayer Monsters table.")
            return

        monsters = []
        
        # Analyze headers to map columns
        headers = []
        header_row = target_table.find('tr')
        if not header_row: return

        for th in header_row.find_all('th'):
            text = th.get_text(strip=True)
            colspan = int(th.get('colspan', 1))
            for _ in range(colspan):
                headers.append(text)
        
        # Find indices
        name_idx = -1
        slayer_lvl_idx = -1
        xp_idx = -1
        location_idx = -1
        
        for i, h in enumerate(headers):
            h_lower = h.lower()
            if "monster" in h_lower:
                name_idx = i
            elif "slayer level" in h_lower:
                slayer_lvl_idx = i
            elif "slayer xp" in h_lower or "xp" in h_lower: # "Slayer XP"
                xp_idx = i
            elif "location" in h_lower:
                location_idx = i
        
        # Fallback indices if header detection fails (Wiki standard)
        # Based on fetch: | Image | Monster | Slayer Level | Equip | Cmb | HP | Slayer XP | Weakness | Loc | Drops |
        # 0=Img, 1=Name, 2=SLvl, 6=XP, 8=Loc
        if name_idx == -1: name_idx = 1
        if slayer_lvl_idx == -1: slayer_lvl_idx = 2
        if xp_idx == -1: xp_idx = 6
        if location_idx == -1: location_idx = 8

        print(f"Using indices: Name={name_idx}, Lvl={slayer_lvl_idx}, XP={xp_idx}, Loc={location_idx}")

        rows = target_table.find_all('tr')[1:]
        seen_names = set()

        for row in rows:
            cols = row.find_all(['td', 'th'])
            # Wiki tables often have rows with fewer columns if rowspan is used (e.g. grouped drops)
            # But the monster rows usually have full data.
            # Skip short rows
            if len(cols) <= xp_idx:
                continue
                
            # Name
            name_cell = cols[name_idx]
            name_text = name_cell.get_text(strip=True)
            if not name_text and len(cols) > 0:
                 # Check if column 0 has text?
                 pass
            
            # Clean name
            name = name_text
            # Use title attribute if available (better casing)
            a_tag = name_cell.find('a')
            if a_tag and a_tag.get('title'):
                name = a_tag.get('title')
            
            # Remove (item) or similar artifacts if present
            name = name.replace("(item)", "").strip()

            if not name:
                continue

            # Check for XP
            xp_cell = cols[xp_idx]
            xp_text = xp_cell.get_text(strip=True).replace(',', '')
            
            try:
                # Remove ref citations like [1]
                xp_text = re.sub(r'\[\d+\]', '', xp_text)
                xp_match = re.search(r'[\d.]+', xp_text)
                if not xp_match:
                    continue
                xp_val = float(xp_match.group(0))
            except:
                continue
                
            # Check for Slayer Level
            slayer_lvl = 1
            if len(cols) > slayer_lvl_idx:
                sl_text = cols[slayer_lvl_idx].get_text(strip=True)
                sl_match = re.search(r'\d+', sl_text)
                if sl_match:
                    slayer_lvl = int(sl_match.group(0))

            # Determine Category from Location
            category = "General"
            if len(cols) > location_idx:
                loc_text = cols[location_idx].get_text(strip=True).lower()
                if "sophanem" in loc_text: category = "Sophanem"
                elif "wilderness" in loc_text: category = "Wilderness"
                elif "gw2" in loc_text or "heart of gielinor" in loc_text: category = "God Wars 2"
                elif "god wars dungeon" in loc_text: category = "God Wars 1"
                elif "daemonheim" in loc_text: category = "Dungeoneering"
                elif "lost grove" in loc_text: category = "Lost Grove"
                elif "anachronia" in loc_text: category = "Anachronia"
                elif "ascension" in loc_text: category = "Ascension"
                elif "kuradal" in loc_text: category = "Kuradal"
                elif "slayer tower" in loc_text: category = "Slayer Tower"
                elif "fremennik" in loc_text: category = "Fremennik"
                elif "polypore" in loc_text: category = "Polypore"
                elif "dragons" in name.lower() or "dragon" in name.lower(): category = "Dragons"
            
            # ID
            base_id = re.sub(r'[^a-zA-Z0-9]', '_', name.lower())
            
            # Dedupe
            final_id = base_id
            counter = 1
            while final_id in seen_names:
                final_id = f"{base_id}_{counter}"
                counter += 1
            
            seen_names.add(final_id)
            
            monsters.append({
                "id": final_id,
                "name": name,
                "xp": xp_val,
                "level": slayer_lvl,
                "category": category
            })
            
        print(f"Scraped {len(monsters)} monsters.")
        update_js_file(monsters)

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

def update_js_file(monsters):
    path = r"c:\Users\jazz_\Desktop\Web Development Projects\portfolioProjects\RS3-Hub\client\src\data\slayerData.js"
    
    # Read existing file to preserve SLAYER_MASTERS
    # Fallback default masters if read fails
    slayer_masters_content = """export const SLAYER_MASTERS = [
    {
        id: 'laniakea',
        name: 'Laniakea (Anachronia)',
        level: 90,
        avgXp: 75000, 
        description: 'Highest level master. Great for cluster tasks.'
    },
    {
        id: 'mandrith',
        name: 'Mandrith (Wilderness)',
        level: 85,
        avgXp: 95000,
        description: 'Wilderness tasks. High risk, high average XP.'
    },
    {
        id: 'morvran',
        name: 'Morvran (Prifddinas)',
        level: 85,
        avgXp: 60000,
        description: 'Standard high-level master.'
    },
    {
        id: 'kuradal',
        name: 'Kuradal',
        level: 75,
        avgXp: 45000,
        description: 'Ancient Cavern dungeon tasks.'
    },
    {
        id: 'sumona',
        name: 'Sumona',
        level: 35,
        avgXp: 25000,
        description: 'Pollnivneach specialized tasks.'
    },
    {
        id: 'vannaka',
        name: 'Vannaka',
        level: 30, // combat lvl rq
        avgXp: 8000,
        description: 'Mid-level training.'
    },
    {
        id: 'jacquelyn',
        name: 'Jacquelyn',
        level: 1,
        avgXp: 200,
        description: 'Point boosting (Tasks take ~1 min).'
    }
];"""

    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            # Try to extract SLAYER_MASTERS block
            match = re.search(r'export const SLAYER_MASTERS = \[.*?\];', content, re.DOTALL)
            if match:
                slayer_masters_content = match.group(0)
    except:
        print("Could not read existing file, using default masters.")

    # Sort monsters by Level desc, then Name
    monsters.sort(key=lambda x: (-x['level'], x['name']))

    # Format output
    js_content = slayer_masters_content + "\n\n"
    js_content += "export const SLAYER_MONSTERS = [\n"
    for m in monsters:
        # Escape single quotes in names
        safe_name = m['name'].replace("'", "\\'")
        js_content += f"    {{ id: '{m['id']}', name: '{safe_name}', xp: {m['xp']}, level: {m['level']}, category: '{m['category']}' }},\n"
    js_content += "];\n"
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(js_content)
    print(f"Updated {path}")

if __name__ == "__main__":
    fetch_slayer_data()
