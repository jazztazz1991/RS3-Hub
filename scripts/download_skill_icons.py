import requests
from bs4 import BeautifulSoup
import os
import re

def download_skill_icons():
    url = "https://runescape.wiki/w/Skills"
    base_url = "https://runescape.wiki"
    
    # Target directory relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    target_dir = os.path.join(project_root, "client", "src", "assets", "skills")
    
    if not os.path.exists(target_dir):
        os.makedirs(target_dir)
        print(f"Created directory: {target_dir}")
    
    print(f"Fetching skills page: {url}")
    try:
        response = requests.get(url)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # The skills are usually in a table or list.
        # Looking for the main skills table.
        # Alternatively, we can search for specific skill links which often have the icon.
        
        # Let's try to find the "Skills" navigation template or similar list, 
        # or iterate through known skill names if necessary, but scraping is better.
        
        # A common pattern on the wiki for skill icons is `File:Atk_icon.png` etc.
        # But let's try to find them on the page.
        
        # Specific to RS Wiki "Skills" page:
        # There are tables for Elite Skills, Combat Skills, Artisan Skills, Gathering Skills, Support Skills.
        
        # Let's look for tables with class "wikitable"
        tables = soup.find_all('table', class_='wikitable')
        
        count = 0
        
        for table in tables:
            rows = table.find_all('tr')
            for row in rows:
                # Usually the first cell contains the icon and link
                cells = row.find_all(['td', 'th'])
                if not cells:
                    continue
                    
                target_cell = cells[0]
                
                # Try to find an image
                img = target_cell.find('img')
                link = target_cell.find('a')
                
                if img and link:
                    skill_name = link.get('title')
                    if not skill_name:
                        # Fallback to text
                        skill_name = target_cell.get_text(strip=True)
                    
                    # Clean up skill name (remove ' (skill)', etc if present)
                    skill_name = skill_name.replace(" (skill)", "").strip()
                    
                    # Skip if it's not a known skill or is a header icon (like 'Combat')
                    # We might get some false positives, so let's filter or be careful.
                    # Commonly known skills list to validate:
                    known_skills = [
                        "Attack", "Strength", "Defence", "Ranged", "Prayer", "Magic", "Runecrafting", "Construction",
                        "Dungeoneering", "Constitution", "Agility", "Herblore", "Thieving", "Crafting", "Fletching",
                        "Slayer", "Hunter", "Divination", "Mining", "Smithing", "Fishing", "Cooking", "Firemaking",
                        "Woodcutting", "Farming", "Summoning", "Invention", "Archaeology", "Necromancy"
                    ]
                    
                    if skill_name in known_skills:
                        icon_url = img.get('src')
                        # Handle relative URLs
                        if icon_url.startswith('/'):
                            icon_url = base_url + icon_url
                            
                        # Download
                        try:
                            # Sanitize filename
                            safe_name = re.sub(r'[^\w\-_\. ]', '_', skill_name)
                            file_path = os.path.join(target_dir, f"{safe_name}.png")
                            
                            print(f"Downloading {skill_name} icon...")
                            img_data = requests.get(icon_url).content
                            with open(file_path, 'wb') as f:
                                f.write(img_data)
                            count += 1
                        except Exception as e:
                            print(f"Failed to download {skill_name}: {e}")

        print(f"Downloaded {count} skill icons.")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    download_skill_icons()
