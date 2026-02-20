import requests
import json
import sys

def investigate(username):
    url = f"https://apps.runescape.com/runemetrics/quests?user={username}"
    print(f"\n--- Investigating {username} ---")
    try:
        response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
        if response.status_code != 200:
            print(f"Error fetching data ({response.status_code})")
            return

        try:
            data = response.json()
        except:
             print("Error parsing JSON")
             return

        quests = data.get("quests", [])
        print(f"Found {len(quests)} quests.")

        suspicious_quests = []
        
        for q in quests:
            # Let's check "Devious Minds" specifically as it was suspicious
            if q["title"] == "Devious Minds":
                print("\nFull JSON for Devious Minds:")
                print(json.dumps(q, indent=2))
            
            if q["status"] == "COMPLETED" and q["userEligible"] is False:
                suspicious_quests.append(q)

        print(f"\nTotal suspicious quests (COMPLETED but ineligible): {len(suspicious_quests)}")
        for q in suspicious_quests:
            print(f"- {q['title']}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    investigate("B0aty")
