import requests
from bs4 import BeautifulSoup
import json
import re
import time
import os

BASE_URL = "https://runescape.wiki"
HOTSPOT_PAGE = "/w/Hotspot"

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://google.com'
}

def get_soup(url):
    full_url = BASE_URL + url if url.startswith('/') else url
    print(f"Fetching {full_url}...")
    try:
        response = requests.get(full_url, headers=HEADERS)
        if response.status_code == 200:
            return BeautifulSoup(response.text, 'html.parser')
        else:
            print(f"Failed to fetch {full_url}: Status {response.status_code}")
            return None
    except Exception as e:
        print(f"Error fetching {full_url}: {e}")
        return None

def clean_text(text):
    if not text:
        return ""
    # Remove hidden sorting text often found in wiki tables
    text = re.sub(r'<span style="display:none">.*?</span>', '', text)
    # Remove reference markers like [1]
    text = re.sub(r'\[.*?\]', '', text)
    # Remove edit links
    text = text.replace('edit | edit source', '')
    return text.strip()

def scrape_hotspots_by_room():
    soup = get_soup(HOTSPOT_PAGE)
    if not soup:
        return {}
    
    rooms = {}
    
    # Linear scan approach
    all_tags = soup.find_all(['h2', 'h3', 'ul'])
    
    in_section = False
    current_room = None
    
    print("Scanning page structure...")
    
    for tag in all_tags:
        text = clean_text(tag.get_text())
        
        if tag.name == 'h2':
            if "Hotspots by room" in text:
                print("Found 'Hotspots by room' section start.")
                in_section = True
                continue
            elif in_section:
                print(f"Found next section '{text}', stopping.")
                break
        
        if not in_section:
            continue
            
        if tag.name == 'h3':
            span = tag.find('span', class_='mw-headline')
            room_name = clean_text(span.get_text()) if span else text
            
            if room_name:
                current_room = room_name
                rooms[current_room] = []
                print(f"  Found Room: {current_room}")
        
        elif tag.name == 'ul' and current_room:
            links = tag.find_all('a')
            for link in links:
                hotspot_name = link.get_text()
                hotspot_url = link.get('href')
                
                if not hotspot_url or hotspot_url.startswith('#'):
                    continue
                if "File:" in hotspot_url or "action=edit" in hotspot_url:
                    continue
                    
                rooms[current_room].append({
                    "name": hotspot_name,
                    "url": hotspot_url
                })
            
    return rooms

def scrape_hotspot_items(hotspot_url):
    soup = get_soup(hotspot_url)
    if not soup:
        return []

    items = []
    
    # Look for the main wikitable
    tables = soup.find_all('table', {'class': 'wikitable'})
    
    target_table = None
    parser_mode = "unknown" # 'standard' or 'complex'
    
    for table in tables:
        # Check headers
        first_row = table.find('tr')
        if not first_row: continue
        
        headers = [th.get_text().strip().lower() for th in first_row.find_all('th')]
        
        # Mode A: Standard (has 'level' and 'item')
        if any('level' in h for h in headers) and any('item' in h or 'furniture' in h for h in headers):
            target_table = table
            parser_mode = "standard"
            break
            
        # Mode B: Complex (has 'key', 'item', 'requirements')
        # Typical Complex Headers: ['key[1]', 'item', 'requirements', 'experience', 'cost']
        if any('key' in h for h in headers) and any('requirements' in h for h in headers):
            target_table = table
            parser_mode = "complex"
            break
            
    if not target_table:
        print(f"No suitable table found for {hotspot_url}")
        return []

    # Parse based on mode
    rows = target_table.find_all('tr')
    
    if parser_mode == "standard":
        # Dynamic mapping
        headers = [clean_text(th.get_text()).lower() for th in rows[0].find_all('th')]
        
        def get_idx(candidates):
            for c in candidates:
                for i, h in enumerate(headers):
                    if c in h:
                        return i
            return -1

        level_idx = get_idx(['level'])
        item_idx = get_idx(['item', 'furniture', 'object', 'name'])
        mat_idx = get_idx(['material', 'requires'])
        xp_idx = get_idx(['experience', 'exp', 'xp'])
        
        start_row = 1

        for row in rows[start_row:]:
            cols = row.find_all(['td', 'th'])
            # Validation
            if not cols or (cols[0].name == 'th' and len(cols) == len(headers)): continue
            if len(cols) <= max(level_idx, item_idx): continue
            
            try:
                level = clean_text(cols[level_idx].get_text())
                
                item_col = cols[item_idx]
                item_link = item_col.find('a')
                item_name = clean_text(item_link.get_text()) if item_link else clean_text(item_col.get_text())
                
                materials = "N/A"
                if mat_idx != -1 and len(cols) > mat_idx:
                    materials = clean_text(cols[mat_idx].get_text())
                    
                xp = "N/A"
                if xp_idx != -1 and len(cols) > xp_idx:
                    xp = clean_text(cols[xp_idx].get_text())
                
                if item_name and level:
                    items.append({
                        "item": item_name,
                        "level": level,
                        "materials": materials,
                        "xp": xp
                    })
            except Exception:
                continue

    elif parser_mode == "complex":
        # Fixed indices based on debug:
        # 0: Key/Sort, 1: Img, 2: Item, 3: Level, 4:?, 5: Mats, 6: XP, 7: Cost
        # Sometimes there's header row 1, so start at row 2 usually
        
        start_row = 1
        # Check if row 1 is also a header row
        if len(rows) > 1:
            row1_cells = rows[1].find_all('th')
            if len(row1_cells) > 0 or (rows[1].find('td') and 'level' in rows[1].get_text().lower()):
                start_row = 2
        
        for row in rows[start_row:]:
            cols = row.find_all(['td', 'th'])
            if len(cols) < 7: continue # Need at least up to XP
            
            try:
                # Based on observation:
                # Item at 2
                item_col = cols[2]
                item_link = item_col.find('a')
                item_name = clean_text(item_link.get_text()) if item_link else clean_text(item_col.get_text())
                
                # Level at 3
                level = clean_text(cols[3].get_text())
                
                # Materials at 5
                materials = clean_text(cols[5].get_text())
                
                # XP at 6
                xp = clean_text(cols[6].get_text())
                
                if item_name and level:
                    items.append({
                        "item": item_name,
                        "level": level,
                        "materials": materials,
                        "xp": xp
                    })
            except Exception:
                continue
            
    return items

def main():
    print("Step 1: Scraping hotspots by room...")
    rooms_map = scrape_hotspots_by_room()
    
    if not rooms_map:
        print("No rooms found! Aborting.")
        return

    full_data = []
    
    print(f"\nFound {len(rooms_map)} rooms. Starting deep scrape...")
    
    for room, hotspots in rooms_map.items():
        print(f"\nProcessing Room: {room}")
        room_data = {
            "room": room,
            "hotspots": []
        }
        
        for hs in hotspots:
            print(f"  Scraping hotspot: {hs['name']}")
            items = scrape_hotspot_items(hs['url'])
            
            if items:
                room_data["hotspots"].append({
                    "hotspot_name": hs['name'],
                    "items": items
                })
            
            time.sleep(0.2)
            
        full_data.append(room_data)
        
    # Output to JS file
    output_path = r'c:\Users\jazz_\Desktop\Web Development Projects\portfolioProjects\RS3-Hub\client\src\data\constructionData.js'
    
    js_content = "const constructionData = " + json.dumps(full_data, indent=2) + ";\n\nexport default constructionData;"
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(js_content)
        
    print(f"\nDone! Saved to {output_path}")

if __name__ == "__main__":
    main()
