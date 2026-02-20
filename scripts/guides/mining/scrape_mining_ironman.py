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

def scrape_mining_ironman():
    url = "https://runescape.wiki/w/Ironman_Mode/Strategies/Mining"
    methods = []
    
    try:
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Get content area
        content = soup.find('div', {'class': 'mw-parser-output'})
        if not content:
            return

        all_headers = content.find_all(['h2', 'h3', 'h4'])
        
        current_category = "General"
        
        for i, header in enumerate(all_headers):
            text = header.get_text(strip=True).replace('[edit | edit source]', '')
            
            # Check for header based methods (Levels X-Y: ...)
            is_method = False
            level_range = None
            match = None
            method_name = ""

            # Pattern 1: Explicit "Levels X-Y: Method Name" (Strict colon or spaced dash)
            # Use strict separator to avoid matching "1-99" as "1" (level) "-" (sep) "99" (method)
            match1 = re.search(r'Level(?:s)?\s*(\d+(?:-\d+|\+)?)\s*(?::| - )\s*(.*)', text, re.IGNORECASE)
            if match1:
                match = match1
                level_range = match.group(1)
                method_name = match.group(2).strip()
            
            # Pattern 2: Start with "X-Y: Method Name"
            if not match:
                match2 = re.search(r'^(\d+(?:-\d+|\+)?)\s*(?::| - )\s*(.*)', text)
                if match2:
                    match = match2
                    level_range = match.group(1)
                    method_name = match.group(2).strip()

            # Pattern 3: Just "Levels X-Y" with no method name (Common in Alternative Methods)
            if not match:
                match3 = re.search(r'^Level(?:s)?\s*(\d+(?:-\d+|\+)?)', text, re.IGNORECASE)
                if match3 and len(text.strip().split()) <= 4: 
                     match = match3
                     level_range = match.group(1)
                     method_name = ""

            if match:
                is_method = True
                
                # Fix for "Levels 1-99" -> Shooting Stars
                if level_range == "1-99" and not method_name.strip():
                    method_name = "Shooting Stars"
                
                # Fix for "Levels 60-70" -> Mining Guild
                if level_range == "60-70" and not method_name.strip():
                     method_name = "Mining Guild (Orichalcite/Drakolith)"
                
                # If we still have no name, use the text but clean it
                if not method_name:
                     method_name = text.replace(f"Levels {level_range}", "").replace(f"Level {level_range}", "").replace(level_range, "").strip(": -")
                     if not method_name:
                         method_name = "Mining Method"

                min_lvl, max_lvl = parse_level_range(level_range)
                
                 # Extract content
                notes = ""
                current_element = header.next_sibling
                
                # Iterate until next header of same or higher level
                while current_element:
                    if current_element.name in ['h1', 'h2', 'h3', 'h4']:
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
                            if current_element.name in ['h1', 'h2', 'h3', 'h4'] or \
                               (current_element.name == 'div' and current_element.find(['h1', 'h2', 'h3', 'h4'])):
                                break
                            
                            if current_element.name == 'p':
                                notes += current_element.get_text(' ', strip=True) + " "
                            elif current_element.name == 'ul':
                                for li in current_element.find_all('li'):
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
                
                # Specific overrides for known methods
                if "Shooting Stars" in method_name:
                    xp_rate = "Variable (D&D)"
                elif "Mining Guild" in method_name:
                    xp_rate = "Standard Mining XP"
                elif "Primal rocks" in method_name: # Ensure we catch the 250k+ if not caught
                     if "250,000+" in notes:
                          xp_rate = "250,000+ XP/hr"

                methods.append({
                    "levels": level_range,
                    "min_level": min_lvl,
                    "max_level": max_lvl,
                    "method": method_name,
                    "xp_rate_raw": xp_rate,
                    "notes": notes,
                    "category": current_category,
                    "type": "ironman"
                })
            
            elif header.name == 'h2':
                 clean_text = text.strip()
                 if clean_text not in ["Contents", "Navigation menu", "See also", "References", "External links"]:
                     current_category = clean_text

    except Exception as e:
        print(f"Error scraping Ironman Mining: {e}")

    # Fallback to P2P rates if not found
    try:
        p2p_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'client', 'src', 'data', 'guides', 'mining', 'miningP2P.json')
        if os.path.exists(p2p_path):
            with open(p2p_path, 'r') as f:
                p2p_data = json.load(f)
                p2p_methods = p2p_data.get('methods', [])

            for method in methods:
                if method['xp_rate_raw'] == "See Description":
                    # Try to find match in P2P
                    # Simple fuzzy match: check if key words overlap
                    iron_words = set(re.findall(r'\w+', method['method'].lower()))
                    
                    best_match = None
                    max_overlap = 0
                    
                    for p2p in p2p_methods:
                        p2p_words = set(re.findall(r'\w+', p2p['method'].lower()))
                        overlap = len(iron_words.intersection(p2p_words))
                        if overlap > max_overlap:
                            max_overlap = overlap
                            best_match = p2p
                    
                    if best_match and max_overlap > 0:
                        method['xp_rate_raw'] = best_match['xp_rate_raw']

    except Exception as e:
        print(f"Error cross-referencing P2P data: {e}")

    # Output to distinct Ironman file
    output_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'client', 'src', 'data', 'guides', 'mining', 'miningIronman.json')
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump({"methods": methods}, f, indent=4)
    print(f"Saved {len(methods)} methods to {output_path}")

if __name__ == "__main__":
    scrape_mining_ironman()
