import requests
from bs4 import BeautifulSoup
import json
import re
import os

def get_wiki_page(url):
    """Fetches the content of a wiki page."""
    response = requests.get(url)
    response.raise_for_status()  # Raise an exception for bad status codes
    return response.text

def parse_cooking_tables(html_content):
    """Parses the cooking tables from the wiki page."""
    soup = BeautifulSoup(html_content, 'html.parser')
    tables = soup.find_all('table', {'class': 'wikitable'})
    
    all_items = []
    

    for table in tables:
        headers = [header.get_text(strip=True) for header in table.find_all('th')]
        
        # We need headers to contain 'Level' and something resembling 'Experience'
        # Normalize headers to check containment
        level_idx = -1
        xp_idx = -1
        
        for i, h in enumerate(headers):
            h_lower = h.lower()
            if 'level' in h_lower and 'stop' not in h_lower: # Avoid 'Stops burning at level' being confused if strict 'Level' is missing, though usually Level exists
                if h == 'Level': # prioritize exact match
                     level_idx = i
                elif level_idx == -1:
                     level_idx = i
            
            if 'experience' in h_lower or 'xp' in h_lower:
                # Avoid 'GP/XP'
                if 'gp/xp' not in h_lower:
                    xp_idx = i

        if level_idx == -1 or xp_idx == -1:
            continue
            
        # Find index for the Item Name.
        name_idx = -1
        possible_name_headers = ['Name', 'Item', 'Fish', 'Meat', 'Raw item', 'Food']
        
        for h in possible_name_headers:
            if h in headers:
                name_idx = headers.index(h)
                break

        
        # If no known name header matches, check if column 1 looks reasonable (not image)
        if name_idx == -1:
            # Usually column 0 is empty header or Image. column 1 is Name.
            if len(headers) > 1 and headers[1] not in ['Level', 'Experience', 'Members', 'Image']:
                name_idx = 1
            elif len(headers) > 0 and headers[0] not in ['Level', 'Experience', 'Image']:
                name_idx = 0
                
        if name_idx == -1:
            continue

        rows = table.find('tbody').find_all('tr')
        
        for row in rows:
            cells = row.find_all('td')
            # Some header rows are inside tbody or multiple th rows
            if not cells: 
                continue

            # Ensure row has enough cells
            if len(cells) <= max(level_idx, xp_idx, name_idx):
                continue

            try:
                name = cells[name_idx].get_text(strip=True)
                
                # Filter out junk
                if not name or 'Total' in name:
                    continue
                if ' (bait)' in name or 'Burnt' in name:
                    continue

                level_str = cells[level_idx].get_text(strip=True)
                # Handle ranges or notes like "1 (to catch)"
                level_match = re.search(r'\d+', level_str)
                if not level_match:
                    continue
                level = int(level_match.group())

                xp_str = cells[xp_idx].get_text(strip=True)
                xp_match = re.search(r'[\d\.]+', xp_str.replace(',', ''))
                if not xp_match:
                    continue
                xp = float(xp_match.group())

                # Generate ID
                item_id = name.lower().replace(' ', '_').replace('(', '').replace(')', '')
                
                # Basic categorization based on header and name
                header_name = headers[name_idx]
                lower_name = name.lower()
                
                # Default
                category = 'Fish'

                # Check headers first
                if 'Meat' in header_name:
                    category = 'Meat'
                elif 'Brewing' in header_name or 'Ale' in header_name:
                    category = 'Drink'
                
                # Check name keywords (overrides header if specific)
                if 'meat' in lower_name or 'chicken' in lower_name or 'rabbit' in lower_name or 'beef' in lower_name or 'bacon' in lower_name or 'bird' in lower_name or 'steak' in lower_name or 'sausage' in lower_name:
                    category = 'Meat'
                elif 'potato' in lower_name or 'corn' in lower_name or 'onion' in lower_name or 'mushroom' in lower_name or 'vegetable' in lower_name:
                    category = 'Vegetable'
                elif 'pie' in lower_name or 'cake' in lower_name or 'pizza' in lower_name or 'bread' in lower_name or 'dough' in lower_name or 'blizzard' in lower_name or 'crunchies' in lower_name or 'batta' in lower_name or 'worm hole' in lower_name or 'biscuits' in lower_name:
                    category = 'Bakery'
                elif 'wine' in lower_name or 'ale' in lower_name or 'tea' in lower_name or 'brew' in lower_name or 'punch' in lower_name or 'blast' in lower_name or 'cocktail' in lower_name or 'gumbo' in lower_name or 'stew' in lower_name or 'soup' in lower_name:
                    category = 'Drink'
                elif 'cheese' in lower_name or 'egg' in lower_name or 'cream' in lower_name or 'butter' in lower_name or 'churn' in lower_name:
                    category = 'Dairy'
                elif 'pizza' in lower_name: # Handle Pizza if not caught above
                     category = 'Bakery'


                all_items.append({
                    'id': item_id,
                    'name': name,
                    'level': level,
                    'xp': xp,
                    'category': category
                })
            except (ValueError, IndexError, AttributeError) as e:
                # print(f"Skipping row: {e}")
                continue
                    
    return all_items

def generate_js_file(items, file_path):
    """Generates the JavaScript data file."""
    
    # Keep existing methods, as they are not on the wiki page
    cooking_methods = """
export const COOKING_METHODS = [
    { id: 'standard', name: 'Standard Range/Fire', multiplier: 1.0, description: 'Normal cooking method.' },
    { id: 'portable_range', name: 'Portable Range', multiplier: 1.1, description: 'Portable station (+10% Base XP).' },
    { id: 'urns', name: 'Standard + Urns', multiplier: 1.2, description: 'Adds ~20% bonus XP via urns.' },
    { id: 'portable_urns', name: 'Portable Range + Urns', multiplier: 1.32, description: 'Combined portable and urn bonuses.' }
    // 1.1 * 1.2 = 1.32 approx effective
];
"""
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write("// Cooking Data - Food and Methods\n\n")
        f.write("export const COOKING_ITEMS = [\n")
        for item in items:
            f.write(f"    {json.dumps(item)},\n")
        f.write("];\n\n")
        f.write(cooking_methods)

def main():
    """Main function to scrape and generate the file."""
    wiki_url = 'https://runescape.wiki/w/Cooking'
    
    # Robust path handling
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # Go up one level from 'scripts' to root, then down to data
    output_file = os.path.join(script_dir, '..', 'client', 'src', 'data', 'cookingData.js')
    output_file = os.path.abspath(output_file) # Normalize path
    
    print("Fetching data from RuneScape Wiki...")
    html_content = get_wiki_page(wiki_url)
    
    print("Parsing cooking data...")
    items = parse_cooking_tables(html_content)
    
    # Sort by level
    items.sort(key=lambda x: x['level'])
    
    print(f"Found {len(items)} cooking items.")
    
    if len(items) > 0:
        print(f"Generating {output_file}...")
        generate_js_file(items, output_file)
        print("Done!")
    else:
        print("No items found. Check scraping logic.")

if __name__ == '__main__':
    main()
