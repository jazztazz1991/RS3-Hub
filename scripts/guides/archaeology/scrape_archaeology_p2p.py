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
    # Remove citations like [1], [edit]
    text = re.sub(r'\[.*?\]', '', text)
    # Remove edit links if they are part of the text
    text = text.replace('[edit | edit source]', '')
    return text.strip()

def scrape_archaeology_p2p():
    url = "https://runescape.wiki/w/Archaeology_training"
    methods = []
    
    try:
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find all h4 headers
        headers = soup.find_all('h4')
        print(f"Found {len(headers)} h4 headers.")
        
        for i, header in enumerate(headers):
            header_text = header.get_text(strip=True)
            clean_header = clean_text(header_text)
            
            # Regex for level range
            match = re.search(r'(\d+\s*[-\u2013\u2014]\s*\d+|\d+\+?)', clean_header)
            
            if match:
                level_range = match.group(1)
                
                # Extract content
                content_parts = []
                
                curr = header.next_sibling
                
                # If header is inside a wrapper div (common in newer MediaWiki), the content is likely sibling of the wrapper
                # Check if parent is a header wrapper
                if header.parent.name == 'div' and 'mw-heading' in header.parent.get('class', []):
                    curr = header.parent.next_sibling
                
                # Standard check if curr is None but parent has sibling
                elif not curr:
                    curr = header.parent.next_sibling

                while curr:
                   # Check if we hit the next header wrapper
                   if getattr(curr, 'name', None) == 'div' and 'mw-heading' in curr.get('class', []):
                       break
                   
                   # Check if we hit a direct header
                   if getattr(curr, 'name', None) in ['h1', 'h2', 'h3', 'h4']:
                       break
                   
                   text = ""
                   if getattr(curr, 'name', None):
                       # Access class safely
                       classes = curr.get('class', [])
                       if 'mw-editsection' not in classes:
                           text = curr.get_text(" ", strip=True)
                   elif isinstance(curr, str):
                       text = curr.strip()
                       
                   clean = clean_text(text)
                   if clean:
                       content_parts.append(clean)
                   
                   curr = curr.next_sibling
                
                method_description = " ".join(content_parts)
                
                if method_description:
                    methods.append({
                        "levels": level_range,
                        "method": method_description
                    })

    except Exception as e:
        print(f"Error scraping P2P Archaeology: {e}")

    # Output path
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    output_dir = os.path.join(base_dir, 'client', 'src', 'data', 'guides', 'archaeology')
    output_path = os.path.join(output_dir, 'archaeologyP2P.json')
    
    os.makedirs(output_dir, exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(methods, f, indent=4)
        
    print(f"Saved {len(methods)} methods to {output_path}")

if __name__ == "__main__":
    scrape_archaeology_p2p()
