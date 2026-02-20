import requests
from bs4 import BeautifulSoup
import json
import re
import os

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

def parse_level_range(text):
    min_level = 1
    max_level = 99
    # Match "1-20", "20+", "Level 50"
    range_match = re.search(r'(\d+)(?:-(\d+))?', text)
    if range_match:
        min_level = int(range_match.group(1))
        if range_match.group(2):
            max_level = int(range_match.group(2))
        elif '+' in text:
            max_level = 99
    return min_level, max_level

def scrape_firemaking_p2p():
    url = "https://runescape.wiki/w/Pay-to-play_Firemaking_training"
    methods = []
    
    try:
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        target_table = None
        
        # Look for the Overview table which has cleaner XP rates
        # It usually has 'Level', 'XP/hr' and 'Logs' in headers
        tables = soup.find_all('table', {'class': 'wikitable'})
        
        for table in tables:
            headers = [th.get_text(strip=True).lower() for th in table.find_all('th')]
            if any('level' in h for h in headers) and any('xp/hr' in h for h in headers) and any('logs' in h for h in headers):
                 target_table = table
                 break
        
        if not target_table:
            # Fallback: Look for "Overview" specifically first, then "Levels 1-110"
            for section_id in ["Overview", "Levels_1-110"]:
                header = soup.find(id=section_id)
                if header:
                    elem = header.parent
                    while elem:
                        elem = elem.next_sibling
                        if elem and elem.name == 'table':
                            if len(elem.find_all('tr')) > 2 and ("xp" in elem.get_text().lower() or "experience" in elem.get_text().lower()):
                                target_table = elem
                                break
                        if elem and elem.name == 'div':
                             tbl = elem.find('table')
                             if tbl and len(tbl.find_all('tr')) > 2 and ("xp" in tbl.get_text().lower() or "experience" in tbl.get_text().lower()):
                                  target_table = tbl
                                  break
                    if target_table: 
                        break # Found one
        
        if target_table:
            # Determine column indices dynamically
            headers = [th.get_text(strip=True).lower() for th in target_table.find_all('th')]
            
            xp_hr_idx = -1
            logs_hr_idx = -1
            xp_log_idx = -1
            method_idx = 1 # Default
            level_idx = 0 # Default

            for i, h in enumerate(headers):
                h_clean = h.lower().strip()
                if 'xp/hr' in h_clean or 'experience per hour' in h_clean:
                    xp_hr_idx = i
                elif 'logs/hr' in h_clean or 'logs per hour' in h_clean:
                    logs_hr_idx = i
                elif 'xp/log' in h_clean or 'experience per log' in h_clean:
                    xp_log_idx = i
                elif h_clean == 'log' or h_clean == 'logs' or h_clean == 'method' or h_clean == 'item' or h_clean == 'tree': 
                    method_idx = i
                elif 'level' in h_clean:
                    level_idx = i
            
            # HARD FIX for known bad detection on Overview table
            # If we suspect column 2 is actually the method (common on wiki), force it if detection put it on a number column
            # Or if headers were empty/image-only
            
            # Sanity check on method_idx
            # If detecting method column yielded a column that looks numeric in the first data row, shift left
            
            rows = target_table.find_all('tr')[1:] 
            print(f"Scraping {len(rows)} rows from table found in {target_table.name} with {len(target_table.find_all('tr'))} total rows")
            
            if rows:
                first_row_cols = rows[0].find_all(['td', 'th'])
                if method_idx < len(first_row_cols):
                    sample_txt = first_row_cols[method_idx].get_text(strip=True)
                    # If sample is numeric and there is a previous column that is text, swap
                    if re.match(r'^[\d,.]+$', sample_txt) and method_idx > 0:
                         # Try left
                         if method_idx >= 1:
                             prev_txt = first_row_cols[method_idx-1].get_text(strip=True)
                             if not re.match(r'^[\d,.]+$', prev_txt) and len(prev_txt) > 2:
                                 method_idx = method_idx - 1
                
                # Check for XP/Hr column fallback (Overview table usually has XP/Hr at index 5)
                if xp_hr_idx == -1 and len(first_row_cols) >= 6:
                     # Check col 5 for large number
                     possible_xp = first_row_cols[5].get_text(strip=True).replace(',', '')
                     if re.match(r'^\d+$', possible_xp) and int(possible_xp) > 10000:
                          xp_hr_idx = 5
                          # And often method is at 2 if XP is at 5
                          if method_idx != 2 and len(first_row_cols[2].get_text(strip=True)) > 2:
                               method_idx = 2
                          # And Level at 0
                          level_idx = 0

            current_level = "1"
            
            for row in rows:
                cols = row.find_all(['td', 'th'])
                if not cols:
                     print(f"Skipping row with no cols: {row}")
                     continue
                if len(cols) < 2: 
                     print(f"Skipping row with only {len(cols)} cols: {cols}")
                     continue 
                
                try:
                    first_txt = cols[0].get_text(strip=True)
                    
                    # Heuristic for Level column presence
                    is_level_row = False
                    # If first text looks like level range "1-99", "75", "90-100"
                    if re.match(r'^[\d–-]+$', first_txt):
                        is_level_row = True
                        current_level = first_txt
                    
                    # Determine shift
                    # If typical row has N cols, and this has N-1, and isn't a level row, shift = -1
                    # But headers length might be larger than typical row cols if there are extra headers
                    shift = 0
                    if not is_level_row and len(cols) < len(headers):
                         # If level_idx was 0, and it's missing, everything shifts left by 1 relative to headers
                         shift = -1
    
                    level_text = current_level
    
                    # Get Method
                    # method_idx comes from headers (e.g. 1 or 2)
                    # effective index = method_idx + shift
                    eff_method_idx = method_idx + shift
                    
                    method_text = ""
                    if 0 <= eff_method_idx < len(cols):
                         method_text = cols[eff_method_idx].get_text(strip=True)
                    
                    # Helper to get text from shifted index
                    def get_col(idx):
                        # Special handling for Overview table (assumed if xp_hr_idx is 5)
                        # If row is missing level, and we are in Overview, table structure might not just shift linearly
                        # Or maybe it does.
                        # Overview: Levl | Img | Method | Cost | XP/Log | XP/Hr
                        # If Level missing: Img | Method | Cost | XP/Log | XP/Hr ?
                        # Or Method | Cost ...
                        
                        eff = idx + shift
                        if 0 <= eff < len(cols):
                            val = cols[eff].get_text(strip=True)
                            
                            # Clean negative numbers/cost
                            if "−" in val or "-" in val or "–" in val: 
                                # If it's a cost column, might be negative. XP shouldn't be negative.
                                # Unless it's a range "250-300".
                                if idx == xp_hr_idx and not re.search(r'\d+[\-–]\d+', val): 
                                     if val.startswith('-') or val.startswith('−') or val.startswith('–'):
                                          return "" 
                            return val
                        return ""
    
                    xp_rate_text = "Varies"
                    
                    # Try explicit XP/HR
                    if xp_hr_idx == -1 and len(cols) >= 6:
                         # Dynamic detection or fallback
                         # Check col 5
                         possible_xp = get_col(5).replace(',', '')
                         if re.match(r'^\d+$', possible_xp) and int(possible_xp) > 10000:
                              xp_hr_idx = 5
                    
                    if xp_hr_idx != -1:
                        val = get_col(xp_hr_idx)
                        # XP rate: Digits maybe with separators/range. Not time.
                        if re.search(r'\d', val) and not any(unit in val.lower() for unit in ['hours', 'seconds', 'minutes', 'hr', 'log']):
                             if not val.startswith("−") and not val.startswith("-") and not val.startswith("–"):
                                 xp_rate_text = val

                    # If still fails and we are in Overview...
                    if xp_hr_idx != -1 and (xp_rate_text == "Varies" or not re.search(r'\d', xp_rate_text)):
                         # Try index 5 or 6?
                         # Often if method is shifted, columns are messy.
                         # Try to find the numeric column > 10000 that isn't cost (negative)
                         pass
    
                    # Fallback calculation
                    if (xp_rate_text == "Varies" or not re.search(r'\d', xp_rate_text)):
                         if logs_hr_idx != -1 and xp_log_idx != -1:
                              l_hr_txt = get_col(logs_hr_idx)
                              x_log_txt = get_col(xp_log_idx)
                              
                              l_hr = float(re.sub(r'[^\d.]', '', l_hr_txt) or 0)
                              x_log = float(re.sub(r'[^\d.]', '', x_log_txt) or 0)
                              if l_hr and x_log:
                                  xp_rate_text = f"{int(l_hr * x_log):,}"
                    
                    # Extra fallback for specific table structures if dynamic failed
                    if (xp_rate_text == "Varies" or not re.search(r'\d', xp_rate_text)):
                         # Try to find largest number in row that looks like XP rate?
                         # Dangerous.
                         pass
    
                    # Method text empty? Try index 2 explicitly if method_idx was 1?
                    if not method_text or len(method_text) < 2:
                         # If default was 1 and it failed, maybe method is at 2?
                         if method_idx == 1 and len(cols) > 2:
                              method_text = cols[2].get_text(strip=True)
                              if not method_text: 
                                   # Maybe at 0? (If shift happened but we missed it)
                                   method_text = cols[0].get_text(strip=True)

                    if not method_text or len(method_text) < 2: 
                         print(f"Skipping empty method row: {cols}")
                         continue
                    if method_text.isdigit(): continue # Skip if method is just a number (bad column detection)



                    # Filter out negative rates explicitly
                    if '-' in xp_rate_text and not re.search(r'\d+-\d+', xp_rate_text): 
                         if re.search(r'-\d+', xp_rate_text): # Starts with minus
                              xp_rate_text = "See Description"

                    min_lvl, max_lvl = parse_level_range(level_text)
                    
                    # Fallback Logic: Try to calculate XP/Hr from row data if fields look like Total XP and Time
                    if (xp_rate_text == "Varies" or not re.search(r'\d', xp_rate_text)):
                         # Find "Time" column with "hours" or "minutes"
                         time_val = None
                         xp_total_val = None
                         
                         for col in cols:
                              txt = col.get_text(strip=True)
                              if 'hour' in txt or 'minute' in txt or 'second' in txt:
                                   # Parse time to hours
                                   try:
                                        t_clean = re.sub(r'[^\d.]', '', txt)
                                        if t_clean:
                                             val = float(t_clean)
                                             if 'minute' in txt: val /= 60
                                             elif 'second' in txt: val /= 3600
                                             time_val = val
                                   except: pass
                              elif re.match(r'^[\d,]+$', txt):
                                   # Candidate for Total XP or Logs
                                   try:
                                        val = float(txt.replace(',', ''))
                                        if val > 100000: # Total XP usually large
                                             xp_total_val = val
                                   except: pass
                         
                         if time_val and xp_total_val and time_val > 0:
                              calc_xp = int(xp_total_val / time_val)
                              if 40000 < calc_xp < 2000000: # Sanity check for firemaking
                                   xp_rate_text = f"{calc_xp:,}"

                    # Improve Method detection for shifted rows
                    # If method_text looks numeric, try shifting left more?
                    # Or try index 0 explicitly if we suspect shift
                    if re.match(r'^[\d,.]+$', method_text) and len(method_text) < 10:
                        # Try index 0
                        potential_method = cols[0].get_text(strip=True)
                        if not re.match(r'^[\d,.]+$', potential_method) and len(potential_method) > 2:
                             method_text = potential_method
                             # Adjust XP index assumptions if method was at 0
                             # And we thought it was at 1 (eff=1)
                             # So we effectively shift everything left by 1 more
                    
                    method_name = re.sub(r'\[.*?\]', '', method_text).strip()
                    method_name = re.sub(r'\s+', ' ', method_name)
                    

                    # Debug print
                    print(f"Checking row: level={level_text}, method={method_text}, xp={xp_rate_text}")

                    if not method_name or method_name.lower() in ["xp per hour", "experience per hour", "time", "cost", "logs needed", "method", "level"]:
                        print(f"Skipping bad method name: {method_name}")
                        continue

                    methods.append({
                        "levels": level_text,
                        "min_level": min_lvl,
                        "max_level": max_lvl,
                        "method": method_name,
                        "xp_rate_raw": xp_rate_text,
                        "notes": "Standard P2P training method",
                        "category": "Main",
                        "type": "p2p"
                    })
                except Exception as e:
                    print(f"Skipping row: {e}")

    except Exception as e:
        print(f"Error scraping Firemaking P2P: {e}")

    output_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'client', 'src', 'data', 'guides', 'firemaking', 'firemakingP2P.json')
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump({"methods": methods}, f, indent=4)
    print(f"Saved {len(methods)} methods to {output_path}")

if __name__ == "__main__":
    scrape_firemaking_p2p()
