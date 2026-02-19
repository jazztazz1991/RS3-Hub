import requests
from bs4 import BeautifulSoup
import json
import re
import os

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

def parse_level_range(text):
    min_level = 1
    max_level = 99
    # Match "1-20", "20+", "Level 50"
    range_match = re.search(r'(\d+)(?:-(\d+))?', text)
    if range_match:
        min_level = int(range_match.group(1))
        if range_match.group(2):
            max_level = int(range_match.group(2))
        elif '+' in text:
            max_level = 99
    return min_level, max_level

def scrape_fishing_p2p():
    url = "https://runescape.wiki/w/Pay-to-play_Fishing_training"
    methods = []
    
    try:
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        tables = soup.find_all('table', {'class': 'wikitable'})
        target_table = None
        for table in tables:
            headers_text = [th.get_text(strip=True).lower() for th in table.find_all('th')]
            if any('level' in h for h in headers_text) and any('xp' in h and 'hour' in h for h in headers_text):
                target_table = table
                break
        
        if target_table:
            rows = target_table.find_all('tr')[1:] 
            for row in rows:
                cols = row.find_all(['td', 'th'])
                if len(cols) < 3: continue
                
                try:
                    level_text = cols[0].get_text(strip=True)
                    method_text = cols[1].get_text(strip=True)
                    
                    xp_text = ""
                    notes_text = ""
                    for i in range(2, len(cols)):
                        text = cols[i].get_text(strip=True)
                        if not xp_text and any(c.isdigit() for c in text): xp_text = text
                        elif not notes_text and len(text) > 5: notes_text = text

                    min_lvl, max_lvl = parse_level_range(level_text)
                    
                    if min_lvl == 1 and max_lvl == 99 and not method_text: continue

                    methods.append({
                        "levels": level_text,
                        "min_level": min_lvl,
                        "max_level": max_lvl,
                        "method": method_text,
                        "xp_rate_raw": xp_text,
                        "notes": notes_text,
                        "type": "p2p"
                    })
                except: continue
    except Exception as e:
        print(f"Error scraping P2P: {e}")
        
    # Output to distinct P2P file
    output_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'client', 'src', 'data', 'guides', 'fishing', 'fishingP2P.json')
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump({"methods": methods}, f, indent=4)
    print(f"Saved {len(methods)} methods to {output_path}")

if __name__ == "__main__":
    scrape_fishing_p2p()
