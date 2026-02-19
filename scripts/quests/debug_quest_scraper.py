import requests
from bs4 import BeautifulSoup
import re

USER_AGENT = "RS3HubQuestDebugger/1.0"

def get_quest_data(title):
    # 1. Main Page for Requirements
    url = f"https://runescape.wiki/w/{title.replace(' ', '_')}"
    print(f"Fetching {url}...")
    res = requests.get(url, headers={'User-Agent': USER_AGENT})
    if res.status_code != 200:
        print(f"Failed to fetch {url}")
        return

    soup = BeautifulSoup(res.text, 'html.parser')
    
    # Debug Infobox
    infobox = soup.find('table', {'class': 'infobox-quest'}) # RS3 Wiki uses infobox-quest often
    if not infobox:
        infobox = soup.find('table', {'class': 'infobox'})
    
    if infobox:
        print("Found Infobox.")
        # Print headings
        for th in infobox.find_all('th'):
            print(f"Header: {th.get_text(strip=True)}")
    else:
        print("No Infobox found.")

    # 2. Quick Guide
    qg_url = f"https://runescape.wiki/w/{title.replace(' ', '_')}/Quick_guide"
    print(f"Fetching {qg_url}...")
    res_qg = requests.get(qg_url, headers={'User-Agent': USER_AGENT})
    if res_qg.status_code == 200:
         soup_qg = BeautifulSoup(res_qg.text, 'html.parser')
         # Find the content
         content = soup_qg.find('div', {'class': 'mw-parser-output'})
         if content:
             print("Found Quick Guide Content.")
             # Check for lists
             ul = content.find('ul')
             if ul:
                 print("Found UL in Quick Guide.")
                 for li in ul.find_all('li')[:3]:
                     print(f"  - {li.get_text(strip=True)}")
    else:
        print("No Quick Guide found.")

if __name__ == "__main__":
    get_quest_data("The World Wakes")
    print("-" * 20)
    get_quest_data("Dragon Slayer")
