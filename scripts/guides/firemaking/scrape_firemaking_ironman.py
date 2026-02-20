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
    range_match = re.search(r'(\d+)(?:-(\d+))?', text)
    if range_match:
        min_level = int(range_match.group(1))
        if range_match.group(2):
            max_level = int(range_match.group(2))
        elif '+' in text:
            max_level = 99
    return min_level, max_level

def _method_descriptor(text):
    # Simply lowercase and split into words
    # We want to match "Oak logs" with "Oak logs", so keeping "logs" is actually fine/better
    # But P2P might be "Oak logs" and Ironman might be "Burning Oak logs"
    
    clean = text.lower()
    # Remove action verbs that might appear in titles
    clean = re.sub(r'\b(burning|firemaking|burn|chop)\b', '', clean)
    
    # Handle "Normal logs" -> "Logs" mapping explicitly for better matching
    if "normal logs" in clean:
        clean = clean.replace("normal logs", "logs")
        
    return clean.strip()

def scrape_firemaking_ironman():
    url = "https://runescape.wiki/w/Ironman_Mode/Strategies/Firemaking"
    methods = []
    
    try:
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        content = soup.find('div', {'class': 'mw-parser-output'})
        if not content:
            return

        all_headers = content.find_all(['h2', 'h3', 'h4'])
        current_category = "General"
        
        for i, header in enumerate(all_headers):
            text = header.get_text(strip=True).replace('[edit | edit source]', '')
            
            is_method = False
            # Look for "Level X-Y: Method" or just "X-Y: Method"
            match = re.search(r'(?:Level(?:s)?)?\s*(\d+(?:-\d+|\+)?)\s*[:|-]\s*(.*)', text, re.IGNORECASE)
            
            if match:
                is_method = True
                level_range = match.group(1)
                method_name = match.group(2)
                min_lvl, max_lvl = parse_level_range(level_range)
                
                notes = ""
                current_element = header.next_sibling
                
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

                notes = re.sub(r'\s+', ' ', notes).strip()

                # Attempt to extract XP rate
                xp_rate = "See Description"
                
                # Check for "X xp/h" or "X xp per hour" in notes
                # Matches: 250,000 Firemaking xp/h, 305,000 xp/hr
                xp_matches = re.finditer(r'([\d,]+)\s*(?:Firemaking\s+)?xp\s*(?:per|\/)\s*h(?:our|r)?', notes, re.IGNORECASE)
                found_rates = []
                for m in xp_matches:
                    rate = m.group(1)
                    if rate not in found_rates:
                        found_rates.append(rate)
                
                if found_rates:
                    # If multiple rates (min-max), join them
                    if len(found_rates) > 1:
                        # Sort roughly by numerical value to confirm range?
                        # Usually text is "250k ... 305k", so order of appearance works
                        xp_rate = f"{found_rates[0]} - {found_rates[-1]}"
                    else:
                        xp_rate = found_rates[0]

                if xp_rate == "See Description":
                    # Try existing generic matcher
                    xp_match = re.search(r'(\d{1,3}(?:,\d{3})*)\s*(?:experience|xp)\s*(?:per|an)\s*(?:hour|hr)', notes, re.IGNORECASE)
                    if xp_match:
                        xp_rate = f"{xp_match.group(1)}"
                
                if xp_rate == "See Description":
                     range_xp_match = re.search(r'(\d{1,3}(?:,\d{3})*)\s*(?:and|to)\s*(\d{1,3}(?:,\d{3})*)\s*(?:experience|xp)', notes, re.IGNORECASE)
                     if range_xp_match:
                         xp_rate = f"{range_xp_match.group(1)}-{range_xp_match.group(2)}"

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
        print(f"Error scraping Ironman Firemaking: {e}")

    # Fallback/Cross-reference P2P
    try:
        p2p_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'client', 'src', 'data', 'guides', 'firemaking', 'firemakingP2P.json')
        if os.path.exists(p2p_path):
            with open(p2p_path, 'r') as f:
                p2p_data = json.load(f)
                p2p_methods = p2p_data.get('methods', [])

            for method in methods:
                if method.get('xp_rate_raw') in ["See Description", None, "", "Varies"]:
                    # Create a set of keywords from the Ironman method name
                    iron_desc = _method_descriptor(method['method'])
                    iron_words = set(re.findall(r'\w+', iron_desc))
                    
                    # Discard generic words if they are the only thing? 
                    # "logs" is generic but essential for "Logs" method.
                    
                    best_match = None
                    max_overlap = 0
                    best_match_len_diff = 100 # Minimize length diff
                    
                    for p2p in p2p_methods:
                        p2p_desc = _method_descriptor(p2p['method'])
                        p2p_words = set(re.findall(r'\w+', p2p_desc))
                        
                        # Find intersection
                        intersection = iron_words.intersection(p2p_words)
                        overlap = len(intersection)
                        
                        # Calculate Jaccard similarity or similar metric to favor exact matches
                        # We want {oak, logs} to match {oak, logs} (2) better than {logs} (1)
                        # We also want to avoid {willow, logs} matching {oak, logs} via {logs} (1)
                        
                        if overlap > 0:
                            # Check if the core distinct word is present
                            # e.g. if 'oak' is in iron_words, it MUST be in p2p_words
                            # Identify "distinguishers" - words that aren't 'logs', 'branches', 'roots'
                            distinguishers = {w for w in iron_words if w not in ['logs', 'log', 'branches', 'roots', 'pyre', 'burning']}
                            
                            if distinguishers:
                                # if we have unique words, ALL of them should ideally be in the match
                                # or at least one
                                if not any(d in p2p_words for d in distinguishers):
                                    continue
                            
                            if overlap > max_overlap:
                                max_overlap = overlap
                                best_match = p2p
                                best_match_len_diff = abs(len(p2p_words) - len(iron_words))
                            elif overlap == max_overlap:
                                # Tie breaker: closer length
                                current_diff = abs(len(p2p_words) - len(iron_words))
                                if current_diff < best_match_len_diff:
                                    best_match = p2p
                                    best_match_len_diff = current_diff
                    
                    if best_match:
                        # Log debug if needed
                        # print(f"Matched '{method['method']}' ({iron_words}) with '{best_match['method']}' ({max_overlap} overlap)")
                        method['xp_rate_raw'] = best_match['xp_rate_raw']

    except Exception as e:
        print(f"Error referencing P2P: {e}")

    output_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'client', 'src', 'data', 'guides', 'firemaking', 'firemakingIronman.json')
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump({"methods": methods}, f, indent=4)
    print(f"Saved {len(methods)} methods to {output_path}")

if __name__ == "__main__":
    scrape_firemaking_ironman()
