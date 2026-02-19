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

def scrape_mining_p2p():
    url = "https://runescape.wiki/w/Pay-to-play_Mining_training"
    methods = []
    
    try:
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        tables = soup.find_all('table', {'class': 'wikitable'})
        
        # In Mining guide there should be a table with "Level", "Method", "XP/hour"
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
                    xp_rate_text = cols[2].get_text(strip=True)
                    
                    min_lvl, max_lvl = parse_level_range(level_text)
                    
                    # Clean up method name
                    method_name = re.sub(r'\[.*?\]', '', method_text).strip()
                    method_name = re.sub(r'\s+', ' ', method_name)
                    
                    methods.append({
                        "levels": level_text,
                        "min_level": min_lvl,
                        "max_level": max_lvl,
                        "method": method_name,
                        "xp_rate_raw": xp_rate_text,
                        "notes": "Standard P2P training method",
                        "category": "Main",
                        "type": "p2p"
                    })
                except Exception as e:
                    print(f"Skipping row: {e}")
                    
    except Exception as e:
        print(f"Error scraping Mining P2P: {e}")

    # Output to distinct P2P file
    output_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'client', 'src', 'data', 'guides', 'mining', 'miningP2P.json')
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump({"methods": methods}, f, indent=4)
    print(f"Saved {len(methods)} methods to {output_path}")

if __name__ == "__main__":
    scrape_mining_p2p()
