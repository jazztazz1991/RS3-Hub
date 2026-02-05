import requests
from bs4 import BeautifulSoup
import re
import os

def fetch_fletching_data():
    url = "https://runescape.wiki/w/Fletching"
    print(f"Fetching {url}...")
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    
    items = []

    def clean_text(text):
        # Remove citations like [n 1], [1], etc.
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

    tables = soup.find_all('table', class_='wikitable')
    print(f"Found {len(tables)} tables.")

    # 1. BOWS
    print("Scraping Bows...")
    bow_count = 0
    for table in tables:
        if "Shortbow" in table.get_text() and "Shieldbow" in table.get_text():
            rows = table.find_all('tr')
            for row in rows:
                cols = row.find_all(['td', 'th'])
                if len(cols) >= 6: 
                    name_col = clean_text(cols[1].get_text())
                    
                    if "Upgrade" in name_col or "shortbow" not in name_col.lower() and "shieldbow" not in name_col.lower() and "ogre" not in name_col.lower():
                         continue

                    try:
                        level = clean_int(cols[2].get_text())
                        xp_cut = clean_float(cols[4].get_text())
                        xp_string = clean_float(cols[5].get_text())
                        
                        if xp_cut > 0:
                            items.append({
                                'id': name_col.lower().replace(' ', '_') + '_u',
                                'name': f"{name_col} (u)",
                                'level': level,
                                'xp': xp_cut,
                                'category': 'Bow (Cut)'
                            })
                            bow_count += 1
                        
                        if xp_string > 0:
                            items.append({
                                'id': name_col.lower().replace(' ', '_'),
                                'name': name_col,
                                'level': level,
                                'xp': xp_string,
                                'category': 'Bow (String)'
                            })
                            bow_count += 1
                    except:
                        pass
            if bow_count > 0:
                print(f"Found Bows table with {bow_count} entries.")
                break 

    # 2. ARROWS
    print("Scraping Arrows...")
    arrow_count = 0
    for table in tables:
        if "Bronze arrow" in table.get_text() and "Headless arrow" in table.get_text():
            rows = table.find_all('tr')
            for row in rows:
                cols = row.find_all(['td', 'th'])
                if len(cols) >= 5:
                    name_col = clean_text(cols[1].get_text())
                    if "Arrow" not in name_col and "arrow" not in name_col.lower():
                        continue
                        
                    try:
                        level = clean_int(cols[2].get_text())
                        xp_batch = clean_float(cols[4].get_text())
                        if xp_batch == 0:
                             xp_item = clean_float(cols[3].get_text())
                             if xp_item > 0:
                                 xp_batch = xp_item * 15
                        if xp_batch > 0:
                            items.append({
                                'id': name_col.lower().replace(' ', '_'),
                                'name': name_col,
                                'level': level,
                                'xp': xp_batch,
                                'category': 'Arrows'
                            })
                            arrow_count += 1
                    except:
                         pass
            if arrow_count > 0:
                print(f"Found Arrows table with {arrow_count} entries.")
                break

    # 3. BOLTS
    print("Scraping Bolts...")
    bolt_count = 0
    for table in tables:
        if "Bronze bolts" in table.get_text():
            rows = table.find_all('tr')
            for row in rows:
                cols = row.find_all(['td', 'th'])
                if len(cols) >= 6:
                    name_col = clean_text(cols[1].get_text())
                    if "bolts" not in name_col.lower():
                        continue
                    try:
                        level = clean_int(cols[2].get_text())
                        xp_batch = clean_float(cols[4].get_text())
                        if xp_batch == 0:
                             xp_item = clean_float(cols[3].get_text())
                             if xp_item > 0:
                                 xp_batch = xp_item * 10 
                        if xp_batch > 0:
                            items.append({
                                'id': name_col.lower().replace(' ', '_'),
                                'name': name_col,
                                'level': level,
                                'xp': xp_batch,
                                'category': 'Bolts'
                            })
                            bolt_count += 1
                    except:
                        pass
            if bolt_count > 0:
                print(f"Found Bolts table with {bolt_count} entries.")
                break

    # 4. DARTS
    print("Scraping Darts...")
    dart_count = 0
    for table in tables:
        if "Bronze dart" in table.get_text():
            rows = table.find_all('tr')
            for row in rows:
                cols = row.find_all(['td', 'th'])
                if len(cols) >= 4:
                    name_col = clean_text(cols[1].get_text())
                    if "dart" not in name_col.lower():
                        continue
                    try:
                        level = clean_int(cols[2].get_text())
                        xp_val = clean_float(cols[3].get_text())
                        if xp_val < 50 and xp_val > 0:
                            xp_val = xp_val * 10
                        if xp_val > 0:
                            items.append({
                                'id': name_col.lower().replace(' ', '_'),
                                'name': name_col,
                                'level': level,
                                'xp': xp_val,
                                'category': 'Darts'
                            })
                            dart_count += 1
                    except:
                        pass
            if dart_count > 0:
                print(f"Found Darts table with {dart_count} entries.")
                break

    items.sort(key=lambda x: x['level'])
    
    unique_items = []
    seen_ids = set()
    for item in items:
        # Final clean on ID just in case
        clean_id = item['id'].replace('__', '_').strip('_')
        # Also clean [n_1] from ID if scraping logic left it there (depends on when lower() was called)
        # In current script clean_text is called EARLY so name_col is clean.
        # But ID uses name_col.lower().replace(' ', '_').
        # Since name_col is clean, ID should be clean.
        
        if clean_id not in seen_ids:
            item['id'] = clean_id
            unique_items.append(item)
            seen_ids.add(clean_id)
    
    boosts = [
        {'name': 'Fletching potion', 'boost': 3},
        {'name': 'Spicy stew (Orange)', 'boost': 5}, 
        {'name': 'Dragonfruit pie', 'boost': 4},
        {'name': 'Fletching cape', 'boost': 1},
    ]

    js_content = "export const FLETCHING_ITEMS = [\n"
    for item in unique_items:
        js_content += f"  {{ id: '{item['id']}', name: '{item['name']}', level: {item['level']}, xp: {item['xp']}, category: '{item['category']}' }},\n"
    js_content += "];\n\n"
    
    js_content += "export const FLETCHING_BOOSTS = [\n"
    for boost in boosts:
        js_content += f"  {{ name: '{boost['name']}', boost: {boost['boost']} }},\n"
    js_content += "];\n"
    
    output_path = os.path.join(r"C:/Users/jazz_/Desktop/Web Development Projects/portfolioProjects/RS3-Hub/client/src/data/fletchingData.js")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w') as f:
        f.write(js_content)
    print(f"Successfully wrote {len(unique_items)} items to {output_path}")

if __name__ == "__main__":
    fetch_fletching_data()
