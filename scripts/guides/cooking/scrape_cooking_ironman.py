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

def scrape_guide():
    url = "https://runescape.wiki/w/Ironman_Mode/Strategies/Cooking"
    print(f"Scraping {url}...")
    methods = []
    
    try:
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find headers (h2, h3, h4)
        # We look for any header that might contain level info or method names
        headers = soup.find_all(['h2', 'h3', 'h4'])
        print(f"Found {len(headers)} headers.")
        
        for i, header in enumerate(headers):
            header_text = header.get_text(strip=True)
            clean_header = clean_text(header_text)
            
            # Skip irrelevant sections
            if clean_header.lower() in ['navigation', 'search', 'personal tools', 'references', 'external links', 'see also', 'contents', 'notes']:
                continue

            # Heuristic: Valid guide headers usually start with "Levels" or contain a level range like "1-33"
            # Regex for level range: "Levels 1-33", "Level 5", "1-33", "50+"
            # OR specific keywords for Ironman/General guides
            is_level_match = re.search(r'(Level|Levels)?\s*\d+(\s*[-\u2013\u2014]\s*\d+|\+?)', clean_header, re.IGNORECASE)
            is_keyword_match = any(x in clean_header.lower() for x in ['method', 'training', 'route', 'fastest', 'levels', 'strategy', 'tips', 'quests', 'dailies'])
            
            if not (is_level_match or is_keyword_match):
                 continue

            # Extract content until next header
            content_parts = []
            curr = header.next_sibling
            
            # Handle potential header wrappers (MediaWiki generic)
            if header.parent.name == 'div' and 'mw-heading' in header.parent.get('class', []):
                curr = header.parent.next_sibling
            elif not curr and header.parent:
                 curr = header.parent.next_sibling

            while curr:
                # Stop at next header
                if getattr(curr, 'name', None) in ['h1', 'h2', 'h3', 'h4', 'h5']:
                     break
                
                # Stop at next header wrapper
                if getattr(curr, 'name', None) == 'div' and 'mw-heading' in curr.get('class', []):
                    break

                text = ""
                tag_name = getattr(curr, 'name', None)
                
                if tag_name == 'p':
                    text = curr.get_text(" ", strip=True)
                elif tag_name == 'ul':
                    items = [li.get_text(" ", strip=True) for li in curr.find_all('li')]
                    text = "\n".join([f"- {item}" for item in items])
                elif not tag_name and isinstance(curr, str):
                    text = curr.strip()
                
                # Basic cleaning
                clean_t = clean_text(text)
                if clean_t:
                    content_parts.append(clean_t)
                
                curr = curr.next_sibling
            
            if content_parts:
                methods.append({
                    "title": clean_header,
                    "content": content_parts
                })

    except Exception as e:
        print(f"Error scraping Cooking (ironman): {e}")
        return

    # Output path
    # Go up 3 levels from scripts/guides/{skill}/script.py to root/client/src/data/guides/{skill}
    base_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(base_dir, '..', '..', '..', 'client', 'src', 'data', 'guides', 'cooking')
    output_path = os.path.join(output_dir, 'cookingIronman.json')
    
    os.makedirs(output_dir, exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(methods, f, indent=4)
    
    print(f"Saved {len(methods)} methods to {output_path}")

if __name__ == "__main__":
    scrape_guide()
