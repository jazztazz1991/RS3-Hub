import requests
from bs4 import BeautifulSoup
import re
import json
import os

def fetch_urn_data():
    url = "https://runescape.wiki/w/Urns"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        print(f"Fetching {url}...")
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        urn_data = {}
        
        skills = [
            'Cooking', 'Divination', 'Farming', 'Fishing', 
            'Hunter', 'Mining', 'Prayer', 'Runecrafting', 
            'Smithing', 'Woodcutting'
        ]
        
        for skill in skills:
            print(f"Processing {skill}...")
            # Wiki headings: The skill name is in a span with id=Skill
            header = soup.find('span', {'id': skill})
            if not header:
                # Try finding 'id' attribute directly on the h3 or h2
                header = soup.find(id=skill)
            
            if not header:
                print(f"Could not find header for {skill}")
                continue
            
            # Find the table following this header
            # Sometimes header is inside a H3 or H2.
            parent_elem = header.find_parent(['h2', 'h3', 'h4'])
            if not parent_elem:
                parent_elem = header # Fallback
                
            table = parent_elem.find_next('table', {'class': 'wikitable'})
            
            if not table:
                print(f"No table found for {skill}")
                continue
                
            skill_urns = []
            
            # Analyze headers
            headers_list = []
            header_row = table.find('tr')
            if not header_row:
                continue
                
            for th in header_row.find_all('th'):
                text = th.get_text(strip=True)
                colspan = int(th.get('colspan', 1))
                for _ in range(colspan):
                    headers_list.append(text)
            
            # Map columns
            try:
                # Name often in column 1 (index 1) if col 0 is image, or col 0 if text
                # Inspection of wiki usually shows: <th>Urn</th> then rows have <td>Image</td><td>Name</td> ?
                # Or <td>Image and Name</td>
                # Check column headers count vs row cells count later
                
                # Heuristic mapping
                fill_xp_idx = -1
                bonus_xp_idx = -1
                level_idx = -1
                
                for i, h in enumerate(headers_list):
                    h_lower = h.lower()
                    if "xp to fill" in h_lower:
                        fill_xp_idx = i
                    elif "teleport xp" in h_lower:
                        bonus_xp_idx = i
                    elif "crafting level" in h_lower or h_lower == "level":
                        level_idx = i
                        
                # if skill == "Cooking":
                #      print(f"Headers: {headers_list}")
                #      print(f"Indices: Level={level_idx}, Fill={fill_xp_idx}, Bonus={bonus_xp_idx}")

                if fill_xp_idx == -1 or bonus_xp_idx == -1:
                    print(f"Missing XP columns for {skill}. Headers: {headers_list}")
                    continue

                # Iterate rows
                rows = table.find_all('tr')[1:] # Skip header
                for row in rows:
                    cols = row.find_all(['td', 'th'])
                    if not cols:
                        continue
                        
                    # Determine Name
                    # Usually column 0 or 1.
                    # Text from column 0
                    c0_text = cols[0].get_text(strip=True)
                    
                    final_name = c0_text
                    
                    # If column 1 exists and column 0 looks like just an image (empty text or filename), try col 1
                    if len(cols) > 1:
                        c1_text = cols[1].get_text(strip=True)
                        # If "urn" is in col 1 text but not col 0, pick col 1
                        if "urn" in c1_text.lower() and "urn" not in c0_text.lower():
                            final_name = c1_text
                            
                    # Remove " (unfired)", " (nr)", etc if grabbed accidentally, though usually distinct columns
                    # Clean up filename garbage if present
                    if ".png" in final_name:
                         # Try to extract from title attribute of start image or A tag
                         a_tag = cols[0].find('a')
                         if a_tag and a_tag.get('title'):
                             final_name = a_tag.get('title')
                    
                    final_name = final_name.replace('.png', '').strip()
                    
                    # Ensure it looks like an urn name
                    if "urn" not in final_name.lower():
                        continue
                    
                    # Skip (unfired), (nr), (no rune), (no gem) rows if they are separate rows?
                    # The table has ONE row per urn type usually, with columns for variants.
                    # But the name might be "Cracked mining urn"
                    # If the name is "Cracked mining urn (unfired)", skip.
                    if "(" in final_name and ")" in final_name:
                        # Check if it's the base name or a variant
                        # Actually we want the base name "Cracked mining urn"
                        pass

                    # Level
                    level_val = 1
                    if level_idx != -1 and len(cols) > level_idx:
                        l_text = cols[level_idx].get_text(strip=True)
                        m = re.search(r'\d+', l_text)
                        if m:
                            level_val = int(m.group(0))
                            
                    # Fill XP
                    fill_xp_val = 0.0
                    if len(cols) > fill_xp_idx:
                        fx_text = cols[fill_xp_idx].get_text(strip=True).replace(',', '')
                        m = re.search(r'[\d.]+', fx_text)
                        if m:
                            fill_xp_val = float(m.group(0))
                            
                    # Bonus XP
                    bonus_xp_val = 0.0
                    if len(cols) > bonus_xp_idx:
                        bx_text = cols[bonus_xp_idx].get_text(strip=True).replace(',', '')
                        # "120 (150)" -> take 120
                        # Split by space or paren
                        parts = bx_text.split('(')
                        first_part = parts[0].strip()
                        m = re.search(r'[\d.]+', first_part)
                        if m:
                            bonus_xp_val = float(m.group(0))
                            
                    # Validate
                    if fill_xp_val > 0:
                        skill_urns.append({
                            "name": final_name,
                            "level": level_val,
                            "fillXp": fill_xp_val,
                            "bonusXp": bonus_xp_val
                        })
                
                urn_data[skill] = skill_urns
                print(f"Found {len(skill_urns)} urns for {skill}")

            except Exception as e:
                print(f"Error parsing table for {skill}: {e}")
                
        save_to_file(urn_data)

    except Exception as e:
        print(f"Global Error: {e}")

def save_to_file(data):
    # Format as JS export
    js_content = "export const URN_DATA = {\n"
    
    for skill, urns in data.items():
        js_content += f"  {skill}: [\n"
        for urn in urns:
            js_content += f"    {{ name: '{urn['name']}', level: {urn['level']}, fillXp: {urn['fillXp']}, bonusXp: {urn['bonusXp']} }},\n"
        js_content += "  ],\n"
    
    js_content += "};\n"
    
    output_path = r"c:\Users\jazz_\Desktop\Web Development Projects\portfolioProjects\RS3-Hub\client\src\data\urnsData.js"
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"Successfully saved data to {output_path}")

if __name__ == "__main__":
    fetch_urn_data()
