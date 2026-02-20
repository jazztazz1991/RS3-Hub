import requests
import json
import sys

def check_quests(username):
    url = f"https://apps.runescape.com/runemetrics/quests?user={username}"
    print(f"Fetching {url}...")
    try:
        response = requests.get(url)
        response.raise_for_status()
        
        try:
            data = response.json()
        except json.JSONDecodeError:
            print(f"Failed to decode JSON for {username}")
            print(response.text[:200])
            return False

        if "quests" not in data:
            print(f"No 'quests' key found in response for {username}")
            print(data.keys())
            return False

        quests = data["quests"]
        if not quests:
            print(f"Quest list is empty for {username}")
            return False

        print(f"\nSuccessfully fetched quests for {username}")
        print(f"Total quests found: {len(quests)}")
        
        print("\n--- First 3 Quests ---")
        for i, quest in enumerate(quests[:3]):
            print(f"Quest {i+1}:")
            print(json.dumps(quest, indent=2))
        
        # filters for completed status
        print("\n--- Searching for a COMPLETED quest to verify status value ---")
        for quest in quests:
            # Check for common status fields
            if 'status' in quest:
                if 'COMPLETED' in str(quest['status']).upper():
                    print("Found a completed quest (checking 'status'):")
                    print(json.dumps(quest, indent=2))
                    return True
            
            if 'userQuestStatus' in quest:
                 if 'COMPLETED' in str(quest['userQuestStatus']).upper():
                    print("Found a completed quest (checking 'userQuestStatus'):")
                    print(json.dumps(quest, indent=2))
                    return True

        print("Could not find a quest that looked explicitly completed to verify the value.")
        return True

    except requests.exceptions.RequestException as e:
        print(f"Error fetching data for {username}: {e}")
        return False

usernames = ['Zezima', 'Woox', 'B0aty', 'S U  O  M I', 'le me', 'Drumgun']

for user in usernames:
    if check_quests(user):
        break
    print("\n-------------------\n")
