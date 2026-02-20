import requests
import json

def investigate(username):
    url = f"https://apps.runescape.com/runemetrics/quests?user={username}"
    print(f"Fetching from: {url}")
    try:
        response = requests.get(url)
        if response.status_code != 200:
            print(f"Error fetching data: {response.status_code}")
            return

        data = response.json()
        if "quests" not in data:
            print("No 'quests' field in response.")
            return

        quests = data["quests"]
        print(f"Found {len(quests)} quests for {username}.")

        inconsistencies_found = 0
        completed_count = 0
        statuses_seen = set()

        for quest in quests:
            title = quest.get("title", "Unknown")
            status = quest.get("status", "UNKNOWN")
            statuses_seen.add(status)

            if status == "COMPLETED":
                completed_count += 1
                
                # Check for suspicious fields
                started = quest.get("started")
                userEligible = quest.get("userEligible")
                # 'completed' field might not exist, but let's check
                completed_field = quest.get("completed") 

                is_suspicious = False
                reasons = []

                if started is False:
                    is_suspicious = True
                    reasons.append("started is False")
                
                # It is possible for userEligible to be false if they no longer meet reqs due to an update? 
                # Or maybe it just means "can you start it?" which is false if completed.
                # But user asked to check it.
                if userEligible is False:
                    # Let's verify if completed quests usually have userEligible: false
                    pass 

                if completed_field is False:
                    is_suspicious = True
                    reasons.append("completed field is False")

                if is_suspicious:
                    inconsistencies_found += 1
                    print(f"\n[SUSPICIOUS] Quest: {title}")
                    print(f"  Status: {status}")
                    print(f"  Reasons: {', '.join(reasons)}")
                    print(f"  Full Data: {json.dumps(quest, indent=2)}")

        print(f"\nTotal completed quests: {completed_count}")
        print(f"Total inconsistencies found: {inconsistencies_found}")
        print(f"Statuses seen: {statuses_seen}")

        # Print one normal COMPLETED quest for reference
        print("\n--- Sample COMPLETED Quest ---")
        for quest in quests:
            if quest.get("status") == "COMPLETED":
                print(json.dumps(quest, indent=2))
                break

        # Print one QUEST that is STARTED but NOT COMPLETED for reference
        print("\n--- Sample STARTED Quest ---")
        for quest in quests:
            if quest.get("status") == "STARTED":
                print(json.dumps(quest, indent=2))
                break

        # Print one NOT STARTED quest
        print("\n--- Sample NOT_STARTED Quest ---")
        for quest in quests:
            if quest.get("status") == "NOT_STARTED":
                print(json.dumps(quest, indent=2))
                break

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    investigate("B0aty")
    # investigate("Zezima") # Backup
