import requests
from bs4 import BeautifulSoup
import re
import os

def fetch_herblore_data():
    items = []

    def clean_text(text):
        text = re.sub(r'\[.*?\]', '', text) 
        return text.strip()

    def clean_float(text):
        try:
            return float(re.sub(r'[^\d.]', '', text))
        except ValueError:
            return 0.0

    def clean_int(text):
        try:
            return int(re.sub(r'[^\d]', '', text))
        except ValueError:
            return 0

    headers_ua = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

    def scrape_table(url, type_label):
        print(f"Fetching {url}...")
        try:
            resp = requests.get(url, headers=headers_ua)
            soup = BeautifulSoup(resp.content, 'html.parser')
            tables = soup.find_all('table', class_='wikitable')
            
            for table_idx, table in enumerate(tables):
                rows = table.find_all('tr')[1:]
                
                # Default indices (Dynamic fallback)
                name_idx, level_idx, xp_idx = -1, -1, -1
                
                # FORCE MAPPING based on URL and Table Index logic if possible
                if type_label == 'herb':
                    used_indices = (4, 0, 1) # Name, Level, XP
                else:
                    used_indices = (1, 2, 3) # Name, Level, XP

                count_added = 0
                for row in rows:
                    cols = row.find_all(['td', 'th'])
                    
                    # Try Forced Indices first
                    successful = False
                    n_i, l_i, x_i = used_indices
                    
                    if len(cols) > max(n_i, l_i, x_i):
                        try:
                            raw_name = clean_text(cols[n_i].get_text())
                            raw_lvl = clean_text(cols[l_i].get_text())
                            raw_xp = clean_text(cols[x_i].get_text())
                            
                            if re.match(r'^\d+$', raw_lvl):
                                level = int(raw_lvl)
                                xp = clean_float(raw_xp)
                                name = raw_name
                                
                                if level > 0 and xp > 0 and len(name) > 1:
                                    successful = True
                                    
                                    category = 'Cleaning Herbs' if type_label == 'herb' else 'Potions'
                                    if type_label == 'herb':
                                        clean_name_str = "Clean " + name.replace("Grimy ", "")
                                        # Use replace for ' in ID
                                        item_id = f"clean_{name.lower().replace(' ', '_').replace('grimy_', '').replace('\'', '')}"
                                    else:
                                        bad = ['(unf)', 'grimy', 'clean', 'broken', 'recipe', 'flask']
                                        if any(x in name.lower() for x in bad) and 'mix' not in name.lower():
                                            successful = False
                                        elif name.lower() in ['image', '']: 
                                            successful = False
                                        else:
                                            # Use replace for ' in ID
                                            item_id = name.lower().replace(' ', '_').replace('(', '').replace(')', '').replace('\'', '')
                                            clean_name_str = name
                                    
                                    if successful:
                                        items.append({
                                            'id': item_id,
                                            'name': clean_name_str.replace("'", "\\'"), # Escape quotes in name for JS if using single quotes, or just rely on double quotes later
                                            'level': level,
                                            'xp': xp,
                                            'category': category
                                        })
                                        count_added += 1
                        except:
                            pass
                    
                    # Alternate mapping for herbs
                    if not successful and type_label == 'herb':
                        if len(cols) >= 5:
                            if not re.match(r'^\d+$', clean_text(cols[0].get_text())) and re.match(r'^\d+$', clean_text(cols[3].get_text())):
                                try:
                                    n = clean_text(cols[0].get_text())
                                    l = clean_int(cols[3].get_text())
                                    x = clean_float(cols[4].get_text())
                                    if l > 0 and x > 0 and len(n) > 1:
                                        # Use replace for ' in ID
                                        item_id = f"clean_{n.lower().replace(' ', '_').replace('\'', '')}"
                                        items.append({
                                            'id': item_id,
                                            'name': ("Clean " + n).replace("'", "\\'"),
                                            'level': l,
                                            'xp': x,
                                            'category': 'Cleaning Herbs'
                                        })
                                        count_added += 1
                                except: pass
                
        except Exception as e:
            print(f"Error fetching {url}: {e}")

    # 1. CLEANING HERBS
    scrape_table("https://runescape.wiki/w/Herbs", 'herb')
    # 2. POTIONS
    scrape_table("https://runescape.wiki/w/Potions", 'potion')

    # Sort
    items.sort(key=lambda x: x['level'])
    
    # Deduplicate
    unique = []
    seen = set()
    for item in items:
        clean_id = item['id'].strip()
        if clean_id not in seen:
            unique.append(item)
            seen.add(clean_id)
            
    boosts = [
         {'name': 'Herblore cape', 'boost': 1},
         {'name': 'Green spicy stew', 'boost': 5},
         {'name': 'Advanced pulse core', 'boost': 7},
         {'name': 'Botanist mask', 'boost': 0}, 
    ]
    
    js_content = "export const HERBLORE_ITEMS = [\n"
    for item in unique:
        # Use double quotes for string values to tolerate escaped single quotes like \' safely or Just clean strings.
        # Actually, I already escaped them above with replace("'", "\\'").
        # If I use single quotes in JS: 'name': 'Clean Rogue\'s Purse' -> Valid JS.
        js_content += f"  {{ id: '{item['id']}', name: '{item['name']}', level: {item['level']}, xp: {item['xp']}, category: '{item['category']}' }},\n"
    js_content += "];\n\n"
    
    js_content += "export const HERBLORE_BOOSTS = [\n"
    for boost in boosts:
        js_content += f"  {{ name: '{boost['name']}', boost: {boost['boost']} }},\n"
    js_content += "];\n"
    
    output_path = os.path.join(r"C:/Users/jazz_/Desktop/Web Development Projects/portfolioProjects/RS3-Hub/client/src/data/herbloreData.js")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w') as f:
        f.write(js_content)
    print(f"Successfully wrote {len(unique)} items to {output_path}")

if __name__ == "__main__":
    fetch_herblore_data()
