import requests
from bs4 import BeautifulSoup
import json
import os
import re
import time

# File paths
DATA_FILE = os.path.join(os.path.dirname(__file__), '../client/src/data/questData.js')
USER_AGENT = "RS3HubQuestScraper/2.0 (Contact: local-dev)"

RS3_SKILLS = [
    'Attack', 'Defence', 'Strength', 'Constitution', 'Ranged', 'Prayer', 'Magic', 
    'Cooking', 'Woodcutting', 'Fletching', 'Fishing', 'Firemaking', 'Crafting', 
    'Smithing', 'Mining', 'Herblore', 'Agility', 'Thieving', 'Slayer', 
    'Farming', 'Runecrafting', 'Hunter', 'Construction', 'Summoning', 
    'Dungeoneering', 'Divination', 'Invention', 'Archaeology', 'Necromancy'
]

def load_data():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
        json_str = content.replace("export const QUEST_DATA = ", "").replace(";", "").strip()
        try:
            return json.loads(json_str)
        except json.JSONDecodeError:
            return []

def save_data(data):
    js_content = f"export const QUEST_DATA = {json.dumps(data, indent=4)};\n"
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        f.write(js_content)
    print("Saved progress.")

def parse_requirements(soup):
    req_data = {
        "skillReqs": [], 
        "questReqs": [],
        "itemReqs": [],
        "recommendedItems": []
    }
    
    # --- Helper to extract list from a TD, filtering garbage ---
    def extract_items_from_td(td):
        items = []
        if not td: return items
        
        # Check for unordered lists first
        uls = td.find_all('ul')
        if uls:
            for ul in uls:
                for li in ul.find_all('li'):
                    text = li.get_text(" ", strip=True)
                    # Filter out garbage
                    if not text or "uncheck all" in text.lower() or "[?]" in text:
                        continue
                    # Sometimes item text has leading spaces or bullets
                    text = text.strip('- \u2022')
                    if text:
                        items.append(text)
        else:
            # Fallback for comma separated or single line
            text = td.get_text("\n", strip=True)
            if text:
                lines = text.split('\n')
                for l in lines:
                    l = l.strip()
                    if l and "uncheck all" not in l.lower() and "[?]" not in l:
                         items.append(l)
        
        # Deduplicate while preserving order
        seen = set()
        unique_items = []
        for i in items:
             if i not in seen:
                 unique_items.append(i)
                 seen.add(i)
        return unique_items

    # --- 1. Find Requirements Table/Infobox ---
    # Strategy: Find any table row with a "Requirements" header
    # This covers both the sidebar infobox and the main "Overview" table
    
    # proper case check or flexible check
    req_header = None
    for th in soup.find_all('th'):
        text = th.get_text(" ", strip=True)
        if text == "Requirements" or (len(text) < 25 and "Requirements" in text):
            req_header = th
            break
    
    target_td = None
    
    # Store the table if we find it, so we can look for "Required items" in the same table
    found_table = None

    if req_header:
        parent_tr = req_header.find_parent('tr')
        if parent_tr:
            found_table = req_header.find_parent('table')
            # Check 1: Content in same row (e.g., | Requirements | ... |)
            siblings = req_header.find_next_siblings('td')
            if siblings:
                target_td = siblings[0]
            else:
                # Check 2: Content in next row (common in sidebars)
                content_tr = parent_tr.find_next_sibling('tr')
                if content_tr:
                    target_td = content_tr.find('td')
    
    if not target_td:
        # Fallback: specific infobox search if global search failed
        infobox = soup.find('table', {'class': 'infobox-quest'}) or soup.find('table', {'class': 'infobox'})
        if infobox:
            found_table = infobox
            # Try finding header in infobox
            req_header = None
            for th in infobox.find_all('th'):
                text = th.get_text(" ", strip=True)
                if text == "Requirements" or (len(text) < 25 and "Requirements" in text):
                    req_header = th
                    break

            if req_header:
                 parent_tr = req_header.find_parent('tr')
                 siblings = req_header.find_next_siblings('td')
                 if siblings:
                     target_td = siblings[0]
                 else:
                     content_tr = parent_tr.find_next_sibling('tr')
                     if content_tr:
                         target_td = content_tr.find('td')

    # --- Parse Items (Required & Recommended) ---
    # We use the found_table (which contains Requirements) to look for item headers
    if found_table:
        all_th = found_table.find_all('th')
        
        # 1. Required items
        item_header = None
        for th in all_th:
            text = th.get_text(" ", strip=True)
            if 'Required items' in text or 'Items required' in text:
                item_header = th
                break
        
        if item_header:
            item_td = None
            siblings = item_header.find_next_siblings('td')
            if siblings:
                item_td = siblings[0]
            else:
                p_tr = item_header.find_parent('tr')
                if p_tr:
                    n_tr = p_tr.find_next_sibling('tr')
                    if n_tr:
                        item_td = n_tr.find('td')
            
            if item_td:
                req_data["itemReqs"] = extract_items_from_td(item_td)

        # 2. Recommended items
        rec_header = None
        for th in all_th:
            text = th.get_text(" ", strip=True)
            # Match "Recommended" but avoid "Recommended combat level" if it's separate
            # Usually the header is just "Recommended" or "Recommended items"
            if 'Recommended' in text and len(text) < 50:
                 rec_header = th
                 break

        if rec_header:
            rec_td = None
            siblings = rec_header.find_next_siblings('td')
            if siblings:
                rec_td = siblings[0]
            else:
                 p_tr = rec_header.find_parent('tr')
                 if p_tr:
                     n_tr = p_tr.find_next_sibling('tr')
                     if n_tr:
                         rec_td = n_tr.find('td')
            
            if rec_td:
                req_data["recommendedItems"] = extract_items_from_td(rec_td)


    if target_td:
        # --- 1. Parse Skills ---
        # Get raw text but ignore hidden/nested junk if possible? 
        # Actually regex usually works fine even with junk, as long as we dedup.
        text_content = target_td.get_text(" ", strip=True)
        
        seen_skills = set()
        
        for skill in RS3_SKILLS:
            if skill in text_content and skill not in seen_skills:
                # Regex for "50 Construction" or "Construction (50)"
                p1 = fr"(\d+)\s+(?:\[\[)?{skill}(?:\]\])?"
                m1 = re.search(p1, text_content)
                if m1:
                    req_data["skillReqs"].append({"skill": skill, "level": int(m1.group(1))})
                    seen_skills.add(skill)
        
        # --- 2. Parse Quests ---
        # Heuristic: Avoid grabbing the entire recursive tree.
        # Direct requirements are usually in the top-level UL if a list exists.
        
        # Check if there is a 'questreq' table inside the TD (common for complex quests)
        # If so, we only want the TOP LEVEL items from it.
        questreq_table = target_td.find('table', class_='questreq')
        
        links_to_check = []
        
        if questreq_table:
            # The structure is typically:
            # UL > LI (Quest Name) > UL (Requirements List) > ...
            
            first_ul = questreq_table.find('ul')
            if first_ul:
                # Check root LI
                root_lis = first_ul.find_all('li', recursive=False)
                
                # If there's only 1 root LI (the quest itself), dive deeper
                if len(root_lis) == 1:
                    root_li = root_lis[0]
                    nested_ul = root_li.find('ul')
                    if nested_ul:
                        # Iterate direct children of the nested list
                        for li in nested_ul.find_all('li', recursive=False):
                            a = li.find('a')
                            if a:
                                links_to_check.append(a)
                    else:
                        # Maybe no requirements? Just the root?
                        pass
                else:
                    # Maybe it's a list of requirements directly?
                    for li in root_lis:
                        a = li.find('a')
                        if a:
                           links_to_check.append(a)
            else:
                links_to_check = questreq_table.find_all('a')
        else:
            links_to_check = target_td.find_all('a')

        # Limit to reasonable number to avoid grabbing footer links or massive trees if logic failed
        count = 0
        for link in links_to_check:
            title = link.get('title')
            text = link.get_text(strip=True)
            
            # Filters
            if not title: continue
            if title in RS3_SKILLS: continue
            if "Skill" in title or "Quest Points" in title: continue
            if "combat level" in text.lower(): continue
            
            # Avoid dupes
            if title not in req_data["questReqs"]:
                req_data["questReqs"].append(title)
                count += 1
            
            # Safety brake for non-nested lists (rarely have > 20 direct quest requirements)
            if count > 20: 
                break

    return req_data

def parse_quick_guide(title):
    url = f"https://runescape.wiki/w/{title.replace(' ', '_')}/Quick_guide"
    try:
        res = requests.get(url, headers={'User-Agent': USER_AGENT})
        if res.status_code != 200:
            return []
            
        soup = BeautifulSoup(res.text, 'html.parser')
        content_div = soup.find('div', {'class': 'mw-parser-output'})
        if not content_div:
            return []

        guide_steps = []
        
        # We want all UL > LI elements that are direct children or in simple wrappers
        # But we must exclude TOC
        
        # Method: Find all 'ul' tags
        uls = content_div.find_all('ul', recursive=True)
        
        for ul in uls:
            # Check if inside TOC or Infobox or Navbox or tables
            # Also exclude 'questreq' and 'questdetails' tables which contain the requirement tree
            parent_table = ul.find_parent('table')
            if parent_table:
                classes = parent_table.get('class', [])
                if any(c in classes for c in ['infobox', 'navbox', 'questreq', 'questdetails']):
                    continue
            
            if ul.find_parent('div', {'class': 'toc'}) or \
               ul.find_parent('div', {'class': 'navbox'}):
                continue
                
            # Loop LIs
            for li in ul.find_all('li', recursive=False):
                # Clean text
                text = li.get_text(" ", strip=True)
                if text:
                    guide_steps.append(text)

        # Limit to first 50 steps to avoid grabbing footer links
        return guide_steps[:50]
        
    except Exception as e:
        print(f"Error fetching guide for {title}: {e}")
        return []

def main():
    quests = load_data()
    print(f"Loaded {len(quests)} quests.")
    
    count = 0
    for q in quests:
        # Check for garbage in guide
        has_garbage_guide = False
        if "guide" in q and len(q["guide"]) > 0:
            first_step = q["guide"][0]
            if "Rocking Out The Great" in first_step or len(first_step) > 500: # Heuristic for dumping requirement tree
                has_garbage_guide = True
                print(f"[{q['title']}] Detected garbage guide. Forcing re-scrape.")
                q["guide"] = [] # Clear it

        # Only process if missing data
        needs_reqs = (len(q.get("skillReqs", [])) == 0 and len(q.get("questReqs", [])) == 0)
        # Check if item requirements are missing or empty
        needs_items = "itemReqs" not in q or len(q.get("itemReqs", [])) == 0
        
        needs_guide = "guide" not in q or len(q["guide"]) == 0 or has_garbage_guide
        
        if not needs_reqs and not needs_guide and not needs_items:
            continue
            
        print(f"Processing {q['title']}...")
        
        # 1. Fetch Requirements if needed
        if needs_reqs or needs_items:
            url = f"https://runescape.wiki/w/{q['title'].replace(' ', '_')}"
            try:
                res = requests.get(url, headers={'User-Agent': USER_AGENT})
                if res.status_code == 200:
                    soup = BeautifulSoup(res.text, 'html.parser')
                    parsed = parse_requirements(soup)
                    
                    if needs_reqs:
                        q["skillReqs"] = parsed["skillReqs"]
                        q["questReqs"] = parsed["questReqs"]
                    
                    # Always update items if we fetched the page
                    q["itemReqs"] = parsed.get("itemReqs", [])
                    q["recommendedItems"] = parsed.get("recommendedItems", [])
            except Exception as e:
                print(f"Req fetch failed: {e}")

        # 2. Fetch Guide if needed
        if needs_guide:
            q["guide"] = parse_quick_guide(q['title'])

        count += 1
        time.sleep(0.5) # throttled
        
        if count % 10 == 0:
            save_data(quests)

    save_data(quests)
    print("Done.")

if __name__ == "__main__":
    main()
