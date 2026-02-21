import re
import requests
from bs4 import BeautifulSoup
import json
import os
import time

def scrape_ironman_farming():
    url = "https://runescape.wiki/w/Ironman_Mode/Strategies/Farming"
    headers = {
        'User-Agent': 'RS3-Hub-Scraper/1.0'
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Scrape the "Obtaining Food for Animals" table
        # Find the section and then the table following it
        # Try finding by ID first
        food_section = soup.find(id='Obtaining_Food_for_Animals')
        
        # Fallback: Find by text content if ID lookup fails
        if not food_section:
            headers = soup.find_all(['h2', 'h3', 'span'])
            for header in headers:
                if 'Obtaining Food for Animals' in header.get_text():
                    food_section = header
                    break
        
        if not food_section:
             print("Could not find 'Obtaining Food for Animals' section")
             # Retrieve all headers to debug
             # print("Available headers:", [h.get_text() for h in soup.find_all('span', class_='mw-headline')])
             return

        # Find the next table (wikitable) after this header
        table = food_section.find_next('table', class_='wikitable')
        
        if not table:
            print("Found section but could not find the table following it.")
            return

        print("Found table, extracting data...")
        
        food_data = []
        rows = table.find_all('tr')
        
        # Skip header row(s)
        # Verify first row is header
        start_row_index = 0
        if rows and rows[0].find('th'):
             start_row_index = 1
        
        for row in rows[start_row_index:]:
            cols = row.find_all(['td', 'th'])
            # Clean up text: remove reference links [1], [2] etc if any
            clean_cols = []
            for col in cols:
                # Remove sup tags (citations)
                for sup in col.find_all('sup'):
                    sup.decompose()
                
                # Get text with space separator to prevent words merging
                text = col.get_text(' ', strip=True)
                # Normalize whitespace
                text = ' '.join(text.split())
                # Fix punctuation spacing: remove space before period or comma
                text = re.sub(r'\s+([.,:;])', r'\1', text)
                clean_cols.append(text)

            if len(clean_cols) >= 4:
                animals = clean_cols[0]
                food_type = clean_cols[1]
                sources = clean_cols[2]
                ease = clean_cols[3]
                
                food_data.append({
                    "animals": animals,
                    "food_type": food_type,
                    "sources": sources,
                    "ease": ease
                })
        
        # Save to JSON
        output_dir = os.path.join(os.path.dirname(__file__), '../../../client/src/data/guides/farming')
        os.makedirs(output_dir, exist_ok=True)
        
        output_file = os.path.join(output_dir, 'ironmanFood.json')
        
        with open(output_file, 'w') as f:
            json.dump(food_data, f, indent=4)
            
        print(f"Successfully scraped {len(food_data)} food sources to {output_file}")
        
    except Exception as e:
        print(f"Error scraping Ironman Farming data: {e}")

if __name__ == "__main__":
    scrape_ironman_farming()
