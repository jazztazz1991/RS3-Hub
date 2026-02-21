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

def scrape_farming_p2p():
    url = "https://runescape.wiki/w/Farming_training"
    methods = []
    
    try:
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Farming training is complex with POF sections.
        # We'll look for headers mentioning levels
        headers = soup.find_all(['h3', 'h4'])
        print(f"Found {len(headers)} headers.")

        for header in headers:
            header_text = header.get_text(strip=True)
            clean_header = clean_text(header_text)

            # Match level ranges or singular levels (Levels 1-17, Level 15, 17-54)
            match = re.search(r'(Levels?\s*)?(\d+[\s\u2013\u2014-]+\d+|\d+\+)', clean_header, re.IGNORECASE)

            if match:
                level_range = match.group(2).replace('\u2013', '-').replace('\u2014', '-')
                
                content_parts = []
                curr = header.next_sibling
                if header.parent.name == 'div' and 'mw-heading' in header.parent.get('class', []):
                    curr = header.parent.next_sibling

                while curr:
                    name = getattr(curr, 'name', None)
                    if name in ['h1', 'h2', 'h3', 'h4']:
                        break
                    if name == 'div' and 'mw-heading' in curr.get('class', []):
                         break

                    if name in ['p', 'ul', 'ol', 'dl']: # dl for definitions/lists
                        text = curr.get_text(" ", strip=True)
                        cleaned = clean_text(text)
                        if cleaned:
                            content_parts.append(cleaned)
                    
                    curr = curr.next_sibling
                
                full_method = " ".join(content_parts).strip()
                
                if full_method and len(full_method) > 20: 
                     methods.append({
                        "levels": level_range,
                        "method": full_method
                    })

    except Exception as e:
        print(f"Error scraping Farming P2P: {e}")

    # Output path
    current_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(current_dir))))
    
    output_dir = os.path.join(root_dir, 'client', 'src', 'data', 'guides', 'farming')
    output_path = os.path.join(output_dir, 'farmingP2P.json')
    
    print(f"Saving to {output_path}")
    os.makedirs(output_dir, exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(methods, f, indent=4)

if __name__ == "__main__":
    scrape_farming_p2p()
