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

def scrape_woodcutting_ironman():
    url = "https://runescape.wiki/w/Ironman_Mode/Strategies/Woodcutting"
    methods = []
    
    try:
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Get content area
        content = soup.find('div', {'class': 'mw-parser-output'})
        if not content:
            return

        # Find all potential start points (Categories and Methods)
        # In Woodcutting guide, methods are often H3 (e.g. "Levels 1-10: Regular trees")
        all_headers = content.find_all(['h2', 'h3', 'h4'])
        
        current_category = "General"
        
        for i, header in enumerate(all_headers):
            text = header.get_text(strip=True).replace('[edit | edit source]', '')
            
            # Woodcutting guide structure is flatter than Fishing
            # Headers like "Levels 1-10: ..." are H3
            
            # Check if this header looks like a method (starts with Level...)
            is_method = False
            match = re.search(r'Level(?:s)?\s*(\d+(?:-\d+|\+)?)\s*[:|-]\s*(.*)', text, re.IGNORECASE)
            
            if match:
                is_method = True
                level_range = match.group(1)
                method_name = match.group(2)
                min_lvl, max_lvl = parse_level_range(level_range)
                
                 # Extract content
                notes = ""
                current_element = header.next_sibling
                
                # Iterate until next header of same or higher level
                # Since these are H3, we stop at H1, H2, H3
                while current_element:
                    if current_element.name in ['h1', 'h2', 'h3']:
                        break
                    
                    if current_element.name == 'p':
                        notes += current_element.get_text(' ', strip=True) + " "
                    elif current_element.name == 'ul':
                            for li in current_element.find_all('li'):
                                notes += "- " + li.get_text(' ', strip=True) + " "
                    
                    current_element = current_element.next_sibling
                
                # Check for wrapped content
                if not notes.strip() and header.parent.name == 'div':
                         current_element = header.parent.next_sibling
                         while current_element:
                            if current_element.name in ['h1', 'h2', 'h3'] or \
                               (current_element.name == 'div' and current_element.find(['h1', 'h2', 'h3'])):
                                break
                            
                            if current_element.name == 'p':
                                notes += current_element.get_text(' ', strip=True) + " "
                            elif current_element.name == 'ul':
                                for li in current_element.find_all('li'):
                                    notes += "- " + li.get_text(' ', strip=True) + " "
                            
                            current_element = current_element.next_sibling

                # Clean up multiple spaces
                notes = re.sub(r'\s+', ' ', notes).strip()

                methods.append({
                    "levels": level_range,
                    "min_level": min_lvl,
                    "max_level": max_lvl,
                    "method": method_name,
                    "xp_rate_raw": "See Description",
                    "notes": notes,
                    "category": current_category,
                    "type": "ironman"
                })
            
            # If it's not a method, maybe it's a category?
            # But in this specific wiki page, there are no explicit categories like "Fishing for Food"
            # So we keep "General" or update if we find H2s like "Tips"
            elif header.name == 'h2':
                 clean_text = text.strip()
                 if clean_text not in ["Contents", "Navigation menu", "See also", "References", "External links"]:
                     current_category = clean_text


    except Exception as e:
        print(f"Error scraping Ironman Woodcutting: {e}")

    # Output to distinct Ironman file
    output_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'client', 'src', 'data', 'guides', 'woodcutting', 'woodcuttingIronman.json')
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump({"methods": methods}, f, indent=4)
    print(f"Saved {len(methods)} methods to {output_path}")

if __name__ == "__main__":
    scrape_woodcutting_ironman()
