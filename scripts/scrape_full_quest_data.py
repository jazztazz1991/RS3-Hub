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

BLACKLIST_REQS = [
    "Morytania", "Kandarin", "Asgarnia", "Misthalin", "Wilderness", "Fremennik", "Tirannwn",
    "Ability to", "Access to", "Enter", "The ability", "Total", "Combat", 
    "started", "partially", "Partial"
]

def load_data():
    if not os.path.exists(DATA_FILE):
        return []
        
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
            # Remove JS export syntax
            json_str = content.replace("export const QUEST_DATA = ", "").strip()
            # Remove trailing semicolon
            if json_str.endswith(";"):
                json_str = json_str[:-1]
            
            # Remove trailing commas (simplified regex)
            json_str = re.sub(r",\s*([\]}])", r"\1", json_str)
            
            return json.loads(json_str)
    except Exception as e:
        print(f"CRITICAL ERROR loading data: {e}")
        return []

def save_data(data):
    if not data:
        print("Warning: Attempting to save empty data. Aborting to prevent data loss.")
        return

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
            if title == "Varrock": continue # Common mis-link
            if title == "Dig Site" and "The Dig Site" not in title: continue # "Dig Site" place vs "The Dig Site" quest
            
            # Global Blacklist Check
            is_blacklisted = False
            for b in BLACKLIST_REQS:
                if b.lower() in title.lower() or b.lower() in text.lower():
                    is_blacklisted = True
                    break
            if is_blacklisted: continue

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
        # Check against cache (simple file check or length check if data exists)
        # Assuming we just want to fetch fresh here
        pass # always fetch for now

    except Exception as e:
        print(f"Error prepping fetch: {e}")

    try:
        res = requests.get(url, headers={'User-Agent': USER_AGENT})
        if res.status_code != 200:
            return []
            
        soup = BeautifulSoup(res.text, 'html.parser')
        content_div = soup.find('div', {'class': 'mw-parser-output'})
        if not content_div:
            return []

        guide_steps = []
        
        # Iterate all ULs in document order
        all_uls = content_div.find_all('ul')
        
        for ul in all_uls:
            # 1. Section Logic (Stop at Rewards)
            # Find the immediately preceding H2
            prev_h2 = ul.find_previous('h2')
            if prev_h2:
                h2_text = prev_h2.get_text().strip().lower()
                # Stop processing if we are in these sections
                if any(x in h2_text for x in ["rewards", "required for completing", "navigation menu", "see also", "references", "external links"]):
                    continue

            # 2. Parent Logic (Exclude Tables, TOC, Navboxes)
            is_bad_parent = False
            for p in ul.parents:
                if p.name == 'table': # Steps should rarely be in tables for Quick Guides
                    is_bad_parent = True
                    break
                if p.name == 'div':
                    classes = p.get('class', [])
                    if any(c in classes for c in ['toc', 'navbox', 'infobox', 'questdetails']):
                        is_bad_parent = True
                        break
            
            if is_bad_parent:
                continue

            # Process items
            for li in ul.find_all('li', recursive=False): # Only direct children
                text = li.get_text(" ", strip=True)
                if not text: continue
                
                lower_text = text.lower()
                
                # 3. Content Heuristics
                # Explicitly ignore "None"
                if lower_text == "none": continue
                # Ignore self-ref title (often in navbox lists that slipped through)
                if lower_text == title.lower(): continue
                # Ignore "Title None" pattern
                if lower_text == f"{title.lower()} none": continue
                
                # Checkbox lists often have "check all" / "uncheck all"
                if "check all" in lower_text: continue
                if "uncheck all" in lower_text: continue
                
                # Metadata leakage
                if "quest points" in lower_text and "lamp" in lower_text: continue 
                if "start point" in lower_text and "speak to" not in lower_text: continue 

                guide_steps.append(text)

        # Deduplicate
        clean_steps = []
        if guide_steps:
             clean_steps.append(guide_steps[0])
             for i in range(1, len(guide_steps)):
                 if guide_steps[i] != guide_steps[i-1]:
                     clean_steps.append(guide_steps[i])

        return clean_steps[:75]
        
    except Exception as e:
        print(f"Error scraping guide {title}: {e}")
        return []

def main():
    quests = load_data()
    print(f"Loaded {len(quests)} quests.")
    
    count = 0
    FORCED_REFRESH_TITLES = [
        "Plague's End", 
        "Remains of the Necrolord", 
        "Requiem for a Dragon", 
        "The Great Brain Robbery", 
        "The Spirit of War", 
        "Tomes of the Warlock"
    ]

    for q in quests:
        # Check for garbage in guide
        has_garbage_guide = False
        if "guide" in q and len(q["guide"]) > 0:
            first_step = q["guide"][0]
            if "Rocking Out The Great" in first_step or len(first_step) > 500: # Heuristic for dumping requirement tree
                has_garbage_guide = True
            # New heuristic: Check for title in first step (common scraper fail) or "None"
            if q["title"] in first_step and "None" in first_step:
                has_garbage_guide = True
            if f"{q['title']} None" in first_step: # specific bad pattern [Title] None
                has_garbage_guide = True
            if first_step == "None" or first_step == q["title"]:
                has_garbage_guide = True
            if "Quest complete!" in first_step: # If the first step is completion, it's broken
                has_garbage_guide = True
            
            # Check for requirement dump pattern (list of quests in first step)
            # e.g. "Quest A Quest B Quest C"
            if len(first_step) > 100 and q['title'] in first_step and "Ability to" in first_step:
                 has_garbage_guide = True

        force_refresh = False 
        if q['title'] in FORCED_REFRESH_TITLES:
            force_refresh = True

        needs_reqs = (len(q.get("skillReqs", [])) == 0 and len(q.get("questReqs", [])) == 0)
        needs_items = "itemReqs" not in q or len(q.get("itemReqs", [])) == 0
        
        needs_guide = "guide" not in q or len(q["guide"]) == 0 or has_garbage_guide or force_refresh
        
        if not needs_reqs and not needs_guide and not needs_items and not force_refresh:
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
