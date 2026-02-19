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

def _method_descriptor(text):
    return text.lower().replace('fishing', '').replace('catch', '')

def scrape_fishing_ironman():
    url = "https://runescape.wiki/w/Ironman_Mode/Strategies/Fishing"
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
        # We need to process them in order of appearance
        all_headers = content.find_all(['h2', 'h3', 'h4'])
        
        current_category = "General"
        
        for i, header in enumerate(all_headers):
            text = header.get_text(strip=True).replace('[edit | edit source]', '')
            
            # Update Category
            if header.name == 'h2' or header.name == 'h3':
                if "Fishing" in text or "experience" in text or "food" in text:
                    current_category = text
            
            # Process Method
            if header.name == 'h4':
                # Regex to check if this is a method header (e.g. "1-20: ...")
                match = re.search(r'^(\d+(?:-\d+|\+)?)\s*[:|-]\s*(.*)', text)
                if match:
                    level_range = match.group(1)
                    method_name = match.group(2)
                    min_lvl, max_lvl = parse_level_range(level_range)
                    
                    # Extract content using next_siblings but handle potential nesting
                    # If we can't find content via next_sibling, we might be inside a container.
                    # Let's try to iterate through the parent's siblings if we hit a wall?
                    # actually, the safest way for Flat Wiki content is usually next_element iteration
                    # until we hit another header.
                    
                    notes = ""
                    current_element = header.next_sibling
                    
                    while current_element:
                        # Check if we've hit the next header
                        if current_element.name in ['h1', 'h2', 'h3', 'h4', 'h5']:
                            break
                        
                        if current_element.name == 'p':
                            # Use separator=' ' to prevent "wordword" issues with links
                            notes += current_element.get_text(' ', strip=True) + " "
                        elif current_element.name == 'ul':
                             for li in current_element.find_all('li'):
                                 # Use separator=' ' for list items too
                                 notes += "- " + li.get_text(' ', strip=True) + " "
                        
                        current_element = current_element.next_sibling
                    
                    # If notes are still empty, maybe the header is wrapped (e.g. <div class="mw-heading"><h3>...</h3></div>)
                    if not notes.strip() and header.parent.name == 'div':
                         current_element = header.parent.next_sibling
                         while current_element:
                            if current_element.name in ['h1', 'h2', 'h3', 'h4', 'h5'] or \
                               (current_element.name == 'div' and current_element.find(['h1', 'h2', 'h3', 'h4', 'h5'])):
                                break
                            
                            if current_element.name == 'p':
                                # Use separator=' ' for paragraphs in wrapped sections
                                notes += current_element.get_text(' ', strip=True) + " "
                            elif current_element.name == 'ul':
                                for li in current_element.find_all('li'):
                                    # Use separator=' ' for lists in wrapped sections
                                    notes += "- " + li.get_text(' ', strip=True) + " "
                            
                            current_element = current_element.next_sibling

                    # Clean up multiple spaces
                    notes = re.sub(r'\s+', ' ', notes).strip()

                    # Attempt to extract XP rate from notes
                    xp_rate = "See Description"
                    xp_match = re.search(r'(\d{1,3}(?:,\d{3})*)\s*(?:experience|xp)\s*(?:per|an)\s*(?:hour|hr)', notes, re.IGNORECASE)
                    if xp_match:
                        xp_rate = f"{xp_match.group(1)} XP/hr"
                    
                    # Fallback for ranges like "41,000 and 49,000 experience"
                    if xp_rate == "See Description":
                        range_xp_match = re.search(r'(\d{1,3}(?:,\d{3})*)\s*(?:and|to)\s*(\d{1,3}(?:,\d{3})*)\s*(?:experience|xp)', notes, re.IGNORECASE)
                        if range_xp_match:
                            xp_rate = f"{range_xp_match.group(1)}-{range_xp_match.group(2)} XP/hr"

                    methods.append({

                        "levels": level_range,
                        "min_level": min_lvl,
                        "max_level": max_lvl,
                        "method": method_name,
                        "xp_rate_raw": xp_rate,
                        "notes": notes.strip(),
                        "category": current_category,
                        "type": "ironman"
                    })



    except Exception as e:
        print(f"Error scraping Ironman: {e}")

    # Fallback to P2P rates if not found
    try:
        p2p_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'client', 'src', 'data', 'guides', 'fishing', 'fishingP2P.json')
        if os.path.exists(p2p_path):
            with open(p2p_path, 'r') as f:
                p2p_data = json.load(f)
                p2p_methods = p2p_data.get('methods', [])

            for method in methods:
                 # Check if XP rate is missing or generic
                if method.get('xp_rate_raw') in ["See Description", None, ""]:
                    # Create a set of keywords for the ironman method
                    iron_words = set(re.findall(r'\w+',_method_descriptor(method['method'])))
                    
                    best_match = None
                    max_overlap = 0
                    
                    for p2p in p2p_methods:
                        p2p_words = set(re.findall(r'\w+', _method_descriptor(p2p['method'])))
                        overlap = len(iron_words.intersection(p2p_words))
                        
                        # We need a decent overlap, or at least the main noun
                        if overlap > max_overlap:
                            max_overlap = overlap
                            best_match = p2p
                    
                    if best_match and max_overlap > 0:
                        method['xp_rate_raw'] = best_match['xp_rate_raw']

    except Exception as e:
         print(f"Error cross-referencing P2P data: {e}")

    # Output to distinct Ironman file
    output_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'client', 'src', 'data', 'guides', 'fishing', 'fishingIronman.json')
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump({"methods": methods}, f, indent=4)
    print(f"Saved {len(methods)} methods to {output_path}")

if __name__ == "__main__":
    scrape_fishing_ironman()
