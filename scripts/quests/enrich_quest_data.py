import requests
from bs4 import BeautifulSoup
import json
import os
import re
import time

# File paths
DATA_FILE = os.path.join(os.path.dirname(__file__), '../client/src/data/questData.js')
USER_AGENT = "RS3HubQuestScraper/1.0 (Contact: local-dev)"

# RS3 Skills list for robust matching
RS3_SKILLS = [
    'Attack', 'Defence', 'Strength', 'Constitution', 'Ranged', 'Prayer', 'Magic', 
    'Cooking', 'Woodcutting', 'Fletching', 'Fishing', 'Firemaking', 'Crafting', 
    'Smithing', 'Mining', 'Herblore', 'Agility', 'Thieving', 'Slayer', 
    'Farming', 'Runecrafting', 'Hunter', 'Construction', 'Summoning', 
    'Dungeoneering', 'Divination', 'Invention', 'Archaeology', 'Necromancy'
]

def load_data():
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
        # Strip JS export syntax to get JSON
        json_str = content.replace("export const QUEST_DATA = ", "").replace(";", "").strip()
        try:
            return json.loads(json_str)
        except json.JSONDecodeError as e:
            print(f"Failed to parse JSON: {e}")
            return []

def save_data(data):
    js_content = f"export const QUEST_DATA = {json.dumps(data, indent=4)};\n"
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        f.write(js_content)
    print("Saved progress to questData.js")

def parse_requirements(soup):
    req_data = {
        "skills": [],
        "quests": []
    }
    
    # Find Infobox
    infobox = soup.find('table', {'class': 'infobox'})
    if not infobox:
        return req_data

    # Find the "Requirements" row
    # It usually has a header "Requirements"
    req_row = None
    for tr in infobox.find_all('tr'):
        th = tr.find('th')
        if th and "Requirements" in th.get_text():
            req_row = tr
            break
            
    if not req_row:
        return req_data

    td = req_row.find('td')
    if not td:
        return req_data

    # Parse list items
    items = td.find_all('li')
    
    # If no list items, try lines separated by breaks
    if not items:
        # This is harder, usually it's in a list.
        # Check for direct links if no <li>
        pass

    for item in items:
        text = item.get_text(" ", strip=True)
        
        # Check for Skills
        # Patterns: "50 Construction", "Construction (50)", "50 [[Construction]]"
        found_skill = False
        for skill in RS3_SKILLS:
            if skill in text:
                # Try to find level
                clean_t = text.replace(skill, "")
                match = re.search(r'(\d+)', clean_t)
                if match:
                    level = int(match.group(1))
                    # Basic sanity check for level
                    if 1 <= level <= 120:
                        req_data["skills"].append({
                            "skill": skill,
                            "level": level
                        })
                        found_skill = True
                        break
        
        if found_skill:
            continue

        # Check for Quests
        # Usually links: <a href="/w/Quest_Name" title="Quest Name">Quest Name</a>
        links = item.find_all('a')
        for link in links:
            title = link.get('title', '')
            # Filter out non-quest links if possible 
            # (hard without a full list of quests, but we exclude skills)
            if title and title not in RS3_SKILLS and "Skill" not in title:
                # Simplistic: Assume if it links to something not a skill, it might be a quest
                # or we can check if the title exists in our full quest DB later.
                # For now, store it.
                req_data["quests"].append(title)

    return req_data

def enrich_quests():
    quests = load_data()
    print(f"Loaded {len(quests)} quests to process.")
    
    count = 0
    total = len(quests)
    
    for quest in quests:
        # Skip if already has parsed requirements (if we run this multiple times)
        if len(quest.get("requirements", [])) > 0 or len(quest.get("skillReqs", [])) > 0:
             continue
             
        title = quest["title"]
        url = f"https://runescape.wiki/w/{title.replace(' ', '_')}"
        
        try:
            print(f"[{count+1}/{total}] Fetching: {title}...")
            res = requests.get(url, headers={'User-Agent': USER_AGENT})
            
            if res.status_code == 200:
                soup = BeautifulSoup(res.content, 'html.parser')
                parsed = parse_requirements(soup)
                
                # Update quest object
                # We separate skill reqs and quest reqs for easier frontend logic
                quest["skillReqs"] = parsed["skills"]
                quest["questReqs"] = parsed["quests"]
                
                # Legacy field for compatibility logic if needed
                quest["requirements"] = parsed["quests"] # simplified
                
                count += 1
            else:
                print(f"Failed to fetch {title}: {res.status_code}")
                
        except Exception as e:
            print(f"Error processing {title}: {e}")
            
        # Be polite to the wiki
        time.sleep(0.5)
        
        # Save every 20 quests
        if count % 20 == 0:
            save_data(quests)

    # Final save
    save_data(quests)
    print("Done!")

if __name__ == "__main__":
    enrich_quests()
