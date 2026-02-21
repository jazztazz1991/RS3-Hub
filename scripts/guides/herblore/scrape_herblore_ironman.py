import requests
from bs4 import BeautifulSoup
import json
import os
import re

def scrape_herblore_ironman():
    url = "https://runescape.wiki/w/Ironman_Mode/Strategies/Herblore"
    headers = {
        'User-Agent': 'RS3-Hub-Scraper/1.0'
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        herb_data = []
        secondary_data = []
        
        # 1. Herbs Table
        # Look for "Herbs and related training methods"
        herb_section = soup.find(id='Herbs_and_related_training_methods')
        if not herb_section:
             # Fallback search
             for h in soup.find_all(['h2', 'h3', 'span']):
                 if 'Herbs and related training methods' in h.get_text():
                     herb_section = h
                     break
        
        if herb_section:
            table = herb_section.find_next('table', class_='wikitable')
            if table:
                rows = table.find_all('tr')
                start_row = 1 if rows and rows[0].find('th') else 0
                for row in rows[start_row:]:
                    cols = row.find_all(['td', 'th'])
                    if len(cols) >= 4:
                        try:
                            # Herb Col
                            herb_col = cols[0]
                            # Remove sup
                            for s in herb_col.find_all('sup'): s.decompose()
                            herb_text = herb_col.get_text(' ', strip=True)
                            herb_clean = re.sub(r'RS3 Inventory image of .*?(?=\s|$)', '', herb_text).strip()
                            
                            # Source Col
                            source_col = cols[1]
                            for s in source_col.find_all('sup'): s.decompose()
                            source_text = source_col.get_text(' ', strip=True) # Space separator
                            
                            # Potion Col
                            potion_col = cols[2]
                            for s in potion_col.find_all('sup'): s.decompose()
                            potion_text = potion_col.get_text(' ', strip=True)
                            potion_clean = re.sub(r'RS3 Inventory image of .*?(?=\s|$)', '', potion_text).strip()
                            
                            # Level Col
                            level_text = cols[3].get_text(strip=True)
                            
                            herb_data.append({
                                "herb": herb_clean,
                                "source": source_text,
                                "potion": potion_clean,
                                "level": level_text
                            })
                        except Exception as e:
                            continue

        # 2. Secondaries Table
        # Look for "Secondaries"
        sec_section = soup.find(id='Secondaries')
        if not sec_section:
            for h in soup.find_all(['h2', 'h3', 'span']):
                 if 'Secondaries' in h.get_text():
                     sec_section = h
                     break
        
        if sec_section:
            table = sec_section.find_next('table', class_='wikitable')
            if table:
                rows = table.find_all('tr')
                start_row = 1 if rows and rows[0].find('th') else 0
                for row in rows[start_row:]:
                    cols = row.find_all(['td', 'th'])
                    if len(cols) >= 2:
                        try:
                            # Secondary Col
                            sec_col = cols[0]
                            # Remove sup
                            for s in sec_col.find_all('sup'): s.decompose()
                            # Check if it's a section header row (some rows might span)
                            if sec_col.get('colspan'): continue 
                            
                            sec_text = sec_col.get_text(' ', strip=True)
                            sec_clean = re.sub(r'RS3 Inventory image of .*?(?=\s|$)', '', sec_text).strip()
                            
                            # Source Col
                            source_col = cols[1]
                            for s in source_col.find_all('sup'): s.decompose()
                            source_text = source_col.get_text(' ', strip=True)
                            
                            secondary_data.append({
                                "secondary": sec_clean,
                                "source": source_text
                            })
                        except Exception:
                            continue

        # Save to JSON
        output_dir = os.path.join(os.path.dirname(__file__), '../../../client/src/data/guides/herblore')
        os.makedirs(output_dir, exist_ok=True)
        
        # Save Herbs
        with open(os.path.join(output_dir, 'ironmanHerbs.json'), 'w') as f:
            json.dump(herb_data, f, indent=4)
            
        # Save Secondaries
        with open(os.path.join(output_dir, 'ironmanSecondaries.json'), 'w') as f:
            json.dump(secondary_data, f, indent=4)
            
        print(f"Successfully scraped {len(herb_data)} herbs and {len(secondary_data)} secondaries.")
        
    except Exception as e:
        print(f"Error scraping Ironman Herblore data: {e}")

if __name__ == "__main__":
    scrape_herblore_ironman()
