import requests
import json

def get_quest_data(username):
    url = f"https://apps.runescape.com/runemetrics/quests?user={username}"
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        response.raise_for_status()
        data = response.json()
        return data.get('quests', [])
    except Exception as e:
        print(f"Error fetching data: {e}")
        return []

def main():
    username = "Maikeru" # Assuming Zezima has completed it
    print(f"Fetching quests for {username}...")
    quests = get_quest_data(username)
    
    print(f"Total quests found: {len(quests)}")
    
    dod_quests = [q for q in quests if "Dimension of Disaster" in q['title']]
    
    print(f"Found {len(dod_quests)} quests matching 'Dimension of Disaster':")
    for q in dod_quests:
        print(f"- {q['title']} (Status: {q['status']})")

    # Also check Recipe for Disaster just for comparison
    rfd_quests = [q for q in quests if "Recipe for Disaster" in q['title']]
    print(f"\nFound {len(rfd_quests)} quests matching 'Recipe for Disaster':")
    for q in rfd_quests:
        print(f"- {q['title']} (Status: {q['status']})")

if __name__ == "__main__":
    main()
