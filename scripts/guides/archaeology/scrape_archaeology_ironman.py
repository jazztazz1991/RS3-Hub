import requests
from bs4 import BeautifulSoup
import json
import os
import re

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

def scrape_archaeology_ironman():
    url = "https://runescape.wiki/w/Ironman_Mode/Strategies/Archaeology"
    print(f"Fetching {url}...")
    
    methods = []
    
    try:
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 1. Find the 'Training methods' header (h3 or h4)
        # We look for a header that contains "Training methods"
        training_header = None
        for header in soup.find_all(['h3', 'h4']):
            if 'Training methods' in header.get_text(strip=True):
                training_header = header
                break
        
        if not training_header:
            print("Could not find 'Training methods' header.")
            return

        # 2. Look for the next table element
        table = training_header.find_next('table')
        if not table:
            print("Could not find table after 'Training methods' header.")
            return

        # 3. Iterate through the table rows tr
        rows = table.find_all('tr')
        
        for row in rows:
            cols = row.find_all(['td', 'th']) # Get both types of cells
            
            # Skip rows that don't have enough columns (e.g. headers or malformed rows)
            # We need at least the first two columns: Levels, Notes
            # Some rows might be just a single th spanning multiple columns
            if len(cols) < 2:
                continue
                
            # If the first cell is a 'th' it might be a header row, check text to skip confirm
            first_cell_text = cols[0].get_text(strip=True).lower()
            if 'level' in first_cell_text or 'notes' in first_cell_text:
                continue

            # 4. Extract 'Levels' (first column) and 'Notes' (second column)
            levels_text = cols[0].get_text(strip=True)
            
            # For the second column (Notes), we want structured content if possible
            # But prompt says treat 'Notes' as 'method'. So just get text.
            method_text = cols[1].get_text(" ", strip=True)

            # simplistic cleaning
            levels_text = re.sub(r'\[.*?\]', '', levels_text).strip()
            method_text = re.sub(r'\[.*?\]', '', method_text).strip()
            # Clean up excessive whitespace
            method_text = re.sub(r'\s+', ' ', method_text).strip()

            # 5. Treat 'Notes' as the 'method'
            # 6. Save as a JSON list of objects with `levels` and `method`
            entry = {
                "levels": levels_text,
                "method": method_text
            }
            methods.append(entry)

    except Exception as e:
        print(f"Error scraping Archaeology Ironman: {e}")
        return

    # Determine output path
    # We want to save to client/src/data/guides/archaeology/archaeologyIronman.json
    # relative to this script: ../../../client/src/data/guides/archaeology/archaeologyIronman.json
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # Go up 3 levels from scripts/guides/archaeology to root
    workspace_root = os.path.dirname(os.path.dirname(os.path.dirname(script_dir)))
    
    output_dir = os.path.join(workspace_root, 'client', 'src', 'data', 'guides', 'archaeology')
    output_path = os.path.join(output_dir, 'archaeologyIronman.json')
    
    os.makedirs(output_dir, exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(methods, f, indent=4)
        
    print(f"Saved {len(methods)} entries to {output_path}")

if __name__ == "__main__":
    scrape_archaeology_ironman()
