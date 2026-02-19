import requests
from bs4 import BeautifulSoup
import json
import os
import re

# Constants
WIKI_URL = "https://runescape.wiki/w/List_of_quests"
USER_AGENT = "RS3HubQuestScraper/1.0 (Contact: local-dev)"

def clean_text(text):
    if not text:
        return ""
    # Remove hidden spans used for sorting
    text = re.sub(r'<span[^>]*display\s*:\s*none[^>]*>.*?</span>', '', text)
    # Remove references like [1]
    text = re.sub(r'\[\d+\]', '', text)
    return text.strip()

def fetch_quest_list():
    print(f"Fetching quest list from {WIKI_URL}...")
    
    headers = {'User-Agent': USER_AGENT}
    
    try:
        response = requests.get(WIKI_URL, headers=headers)
        if response.status_code != 200:
            print(f"Failed to fetch page: {response.status_code}")
            return []
            
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Based on debug output, the table has headers:
        # ['Name', '', 'Length', 'Age', 'Combat', 'QP', 'Series', 'Release date']
        # The empty header is likely the Members/F2P icon column
        # Or difficulty is "DIfficulty" but sometimes labeled differently or scraped empty?
        # Actually in the debug output I didn't see "Difficulty".
        # Let's target the table that has "Name" and "QP" and "Series".
        
        tables = soup.find_all('table')
        target_table = None
        
        for table in tables:
            headers = [th.get_text(strip=True) for th in table.find_all('th')]
            header_text = " ".join(headers).lower()
            if "name" in header_text and "qp" in header_text and "series" in header_text:
                target_table = table
                break
                
        if not target_table:
            print("Could not find quest table.")
            return []
            
        quests = []
        rows = target_table.find_all('tr')
        
        # Skip header rows
        for row in rows:
            cols = row.find_all(['td', 'th'])
            # We identified 8 columns in the debug output
            # 0: Name
            # 1: Members/Difficulty? (Debug showed empty string header)
            # 2: Length
            # 3: Age? (Debug showed Age - Fifth Age/Sixth Age)
            # 4: Combat? (Debug showed Combat - difficulty?)
            # 5: QP
            # 6: Series
            # 7: Release date
            
            if len(cols) < 6:
                continue

            # Skip header rows
            if all(c.name == 'th' for c in cols):
                continue
                
            # Extract Name (Col 0)
            name_cell = cols[0]
            name_link = name_cell.find('a')
            if not name_link:
                continue
            name = name_link.get_text().strip()
            
            # Extract Members Status (Col 1)
            # This column often has an image for members, or empty for free?
            # Or it might be difficulty. 
            # Looking at the live wiki, Column 2 is usually Members status (icon) + F2P icon
            # Let's inspect content of Col 1
            col1_content = str(cols[1])
            is_members = "Member_icon.png" in col1_content or "Members" in cols[1].get_text()
            
            # Extract Length (Col 2)
            length = clean_text(cols[2].get_text())
            
            # Extract Age (Col 3) -> Not critical usually, maybe skip
            
            # Extract Combat/Difficulty (Col 4)
            # Live wiki says "Difficulty" column usually exists, but debug listed "Combat".
            # "Combat" usually refers to combat requirement?
            # Or maybe "Difficulty" is hidden?
            # Let's assume Col 4 is difficulty-related or just store it as "Difficulty" for now
            difficulty = clean_text(cols[4].get_text()) if len(cols) > 4 else "Unknown"

            # Extract QP (Col 5)
            if len(cols) > 5:
                qp_text = clean_text(cols[5].get_text())
                qp_match = re.search(r'\d+', qp_text)
                qp = int(qp_match.group(0)) if qp_match else 0
            else:
                qp = 0
                
            # Series (Col 6)
            series = clean_text(cols[6].get_text()) if len(cols) > 6 else None
            
            quest = {
                "title": name,
                "isMembers": is_members,
                "length": length,
                "difficulty": difficulty,
                "questPoints": qp,
                "series": series
            }
            quests.append(quest)
            
        print(f"Successfully scraped {len(quests)} quests.")
        
        output_path = os.path.join(os.path.dirname(__file__), '../client/src/data/questData.js')
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        quests.sort(key=lambda x: x['title'])
        js_content = f"export const QUEST_DATA = {json.dumps(quests, indent=4)};\n"
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(js_content)
            
        return quests

    except Exception as e:
        print(f"Error scraping: {e}")
        return []

if __name__ == "__main__":
    fetch_quest_list()
