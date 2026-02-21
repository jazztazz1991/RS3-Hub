import requests
from bs4 import BeautifulSoup
import json
import os
import re

def scrape_herblore_p2p():
    url = "https://runescape.wiki/w/Pay-to-play_Herblore_training"
    headers = {
        'User-Agent': 'RS3-Hub-Scraper/1.0'
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        methods = []
        
        # 1. Scrape "Profitable methods" table
        # Find the specific section or table
        profitable_section = soup.find(id='Profitable_methods')
        if not profitable_section:
             headers = soup.find_all(['h2', 'h3', 'span'])
             for header in headers:
                 if 'Profitable methods' in header.get_text():
                     profitable_section = header
                     break
        
        if profitable_section:
            # Table might be after text, so use find_all_next or iterate
            table = profitable_section.find_next('table', class_='wikitable')
            
            if table:
                rows = table.find_all('tr')
                # Check if first row is header
                start_row = 1 if rows and rows[0].find('th') else 0

                for row in rows[start_row:]:
                    cols = row.find_all(['td', 'th'])
                    if len(cols) >= 4: # Ensure enough columns (XP, GP, etc)
                        try:
                            # Level column usually first
                            level_text = cols[0].get_text(strip=True).replace('Herblore', '').strip()
                            
                            # Potion column usually second
                            potion_col = cols[1]
                            # Remove sup tags
                            for sup in potion_col.find_all('sup'):
                                sup.decompose()
                                
                            potion_text = potion_col.get_text(' ', strip=True) 
                            # Clean up potion name: Remove "RS3 Inventory image of ..."
                            potion_clean = re.sub(r'RS3 Inventory image of .*?(?=\s|$)', '', potion_text).strip()
                            # Often text is duplicated due to image alt "Prayer potion (3) Prayer potion"
                            # Split by ')' if present to take first part
                            if ')' in potion_clean:
                                potion_clean = potion_clean.split(')')[0] + ')'
                            
                            # XP column usually 3rd
                            xp = cols[2].get_text(strip=True)
                            
                            # Profit usually 4th
                            profit_val = cols[3].get_text(strip=True)
                            
                            methods.append({
                                "level": level_text,
                                "method": potion_clean,
                                "xp": xp,
                                "profit": profit_val,
                                "category": "Profitable"
                            })
                        except Exception as e:
                            # print(f"Skipping row due to error: {e}")
                            continue

        # 2. Add some manual low-level data if missing (Fastest path usually involves specific quests/potions)
        # Since the "Fastest methods" section is complex with sub-tables, we might manually basic path
        # or try to find "Fastest_methods_(1-99)"
        
        fastest_section = soup.find('span', id='Fastest_methods_(1-99)')
        if fastest_section:
             # This section often contains text descriptions or smaller tables
             # For now, let's just stick to the profitable table as a base and maybe add a manual list for 1-99 fastest
             pass

        # Manual addition of standard fastest path (approximate)
        fastest_path = [
            {"level": "1-3", "method": "Druidic Ritual Quest", "xp": "250", "category": "Fastest"},
            {"level": "3-5", "method": "Attack Potion (Guam + Eye of Newt)", "xp": "25", "category": "Fastest"},
            {"level": "5-12", "method": "Anti-poison (Marrentill + Unicorn Horn Dust)", "xp": "37.5", "category": "Fastest"},
            {"level": "12-26", "method": "Strength Potion (Tarromin + Limpwurt Root)", "xp": "50", "category": "Fastest"},
            {"level": "26-38", "method": "Energy Potion (Harralander + Chocolate Dust)", "xp": "67.5", "category": "Fastest"},
            {"level": "38-45", "method": "Prayer Potion (Ranarr + Snape Grass)", "xp": "87.5", "category": "Fastest"},
            {"level": "45-52", "method": "Super Attack (Irit + Eye of Newt)", "xp": "100", "category": "Fastest"},
            {"level": "52-55", "method": "Super Energy (Avantoe + Mort Myre Fungus)", "xp": "117.5", "category": "Fastest"},
            {"level": "55-63", "method": "Super Strength (Kwuarm + Limpwurt Root)", "xp": "125", "category": "Fastest"},
            {"level": "63-66", "method": "Super Restore (Snapdragon + Red Spiders' Eggs)", "xp": "142.5", "category": "Fastest"},
            {"level": "66-69", "method": "Super Defence (Cadantine + White Berries)", "xp": "150", "category": "Fastest"},
            {"level": "69-72", "method": "Antifire (Lantadyme + Dragon Scale Dust)", "xp": "157.5", "category": "Fastest"},
            {"level": "72-76", "method": "Super Ranging (Dwarf Weed + Wine of Zamorak)", "xp": "162.5", "category": "Fastest"},
            {"level": "76-81", "method": "Super Magic (Lantadyme + Potato Cactus)", "xp": "172.5", "category": "Fastest"},
            {"level": "81-88", "method": "Saradomin Brew (Toadflax + Crushed Nest)", "xp": "180", "category": "Fastest"},
            {"level": "88-96", "method": "Extreme Potions (Attack/Strength/Defence/Magic/Ranging)", "xp": "220-260", "category": "Fastest"},
            {"level": "96-99", "method": "Overloads", "xp": "1,000", "category": "Fastest"},
            {"level": "99+", "method": "Elder Overloads / Vuln Bombs", "xp": "Varied", "category": "Fastest"}
        ]
        
        # Combine lists
        all_methods = fastest_path + methods

        # Save to JSON
        output_dir = os.path.join(os.path.dirname(__file__), '../../../client/src/data/guides/herblore')
        os.makedirs(output_dir, exist_ok=True)
        
        output_file = os.path.join(output_dir, 'herbloreP2P.json')
        
        with open(output_file, 'w') as f:
            json.dump(all_methods, f, indent=4)
            
        print(f"Successfully scraped/generated {len(all_methods)} methods to {output_file}")
        
    except Exception as e:
        print(f"Error scraping P2P Herblore data: {e}")

if __name__ == "__main__":
    scrape_herblore_p2p()
