import requests
from bs4 import BeautifulSoup
import json
import re
import os

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

def clean_text(text):
    if not text:
        return ""
    text = re.sub(r'\[.*?\]', '', text)
    text = text.replace('[edit | edit source]', '')
    return text.strip()

def scrape_divination_p2p():
    url = "https://runescape.wiki/w/Pay-to-play_Divination_training"
    methods = []
    
    try:
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        # Find all headlines
        # The wiki structure varies. Sometimes it's H3, sometimes H4.
        # We will look for headers that contain "Levels" or digits
        
        headers = soup.find_all(['h3', 'h4'])
        print(f"Found {len(headers)} headers.")

        for header in headers:
            header_text = header.get_text(strip=True)
            clean_header = clean_text(header_text)

            # Check if header indicates a level range (e.g., "Levels 1-20")
            # Regex: Levels? \d+[-–]\d+ or Level \d+
            match = re.search(r'(Levels?\s*)?(\d+[\s\u2013\u2014-]+\d+|\d+\+)', clean_header, re.IGNORECASE)

            if match:
                level_range = match.group(2).replace('\u2013', '-').replace('\u2014', '-')
                
                # Extract methods
                content_parts = []
                
                # Determine next sibling (handling mw-heading wrapper if present)
                curr = header.next_sibling
                if header.parent.name == 'div' and 'mw-heading' in header.parent.get('class', []):
                    curr = header.parent.next_sibling
                
                # Iterate siblings until next header
                while curr:
                    name = getattr(curr, 'name', None)
                    
                    # Stop if we hit another header
                    if name in ['h1', 'h2', 'h3', 'h4']:
                        break
                    if name == 'div' and 'mw-heading' in curr.get('class', []):
                         # Usually contains a header
                         break
                    
                    # Extract text
                    if name == 'p' or name == 'ul':
                        text = curr.get_text(" ", strip=True)
                        cleaned = clean_text(text)
                        if cleaned:
                            content_parts.append(cleaned)
                    
                    curr = curr.next_sibling
                
                full_method = " ".join(content_parts).strip()
                
                # Only add if we have content and it's not likely a table of contents or navigation
                if full_method and len(full_method) > 20: 
                     methods.append({
                        "levels": level_range,
                        "method": full_method
                    })

    except Exception as e:
        print(f"Error scraping Divination P2P: {e}")

    # Output path
    # Go up 4 levels from scripts/guides/divination/script.py -> to root, then client/src/data/guides/divination
    # scripts/guides/divination is 3 levels deep from root?
    # root/scripts/guides/divination/file.py
    # we want root/client/src/data/guides/divination
    
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # up 3 levels: divination -> guides -> scripts -> root
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))) 
    # Wait, __file__ is scripts/guides/divination/scrape.py
    # os.path.dirname(__file__) is .../divination
    # .../divination -> .../guides -> .../scripts -> .../root
    # 3 levels up from directory
    
    # Actually let's use relative path from where we are
    # We are in scripts/guides/divination
    # We want client/src/data/guides/divination
    
    output_dir = os.path.join(root_dir, 'client', 'src', 'data', 'guides', 'divination')
    output_path = os.path.join(output_dir, 'divinationP2P.json')
    
    print(f"Saving to {output_path}")
    os.makedirs(output_dir, exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(methods, f, indent=4)

if __name__ == "__main__":
    scrape_divination_p2p()
