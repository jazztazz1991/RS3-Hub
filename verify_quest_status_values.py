import requests
import json
import sys

def verify_quest_statuses(username):
    url = f"https://apps.runescape.com/runemetrics/quests?user={username}"
    print(f"Fetching quest data for {username} from {url}...")
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        
        if "quests" not in data:
            print(f"No 'quests' key found in response for {username}")
            return False
            
        quests = data["quests"]
        if not quests:
            print(f"Quest list is empty for {username}")
            return False
            
        print(f"Total quests found: {len(quests)}")
        
        unique_statuses = set()
        status_counts = {}
        miniquest_candidates = []
        
        print("\n--- Unique Status Values ---")
        
        for quest in quests:
            status = quest.get('status', 'UNKNOWN')
            unique_statuses.add(status)
            status_counts[status] = status_counts.get(status, 0) + 1
            
            title = quest.get('title', '')
            
            # Simple heuristic for miniquests or subquests
            # Many miniquests are just listed as quests in RS3 API, 
            # but usually they are distinct. 
            # Let's look for "Recipe for Disaster" or "Dimension of Disaster" subparts
            if "Recipe for Disaster:" in title or "Dimension of Disaster:" in title or "Sins of the Father" in title: # Sins of the father is a miniquest in OSRS, checking for RS3 equivalents
                 miniquest_candidates.append(quest)

        for status in unique_statuses:
            print(f"Status: '{status}' (Count: {status_counts[status]})")
            
        print("\n--- Status Variations Check ---")
        variations = ["Started", "Not Started", "started", "not started", "Completed", "completed"]
        found_variations = [s for s in unique_statuses if s in variations]
        if found_variations:
            print(f"Found variations: {found_variations}")
        else:
            print("No variations like 'Started' or 'Not Started' found (case sensitive check).")

        print("\n--- Miniquest/Subquest Check (Sample) ---")
        if miniquest_candidates:
            print(f"Found {len(miniquest_candidates)} potential miniquests/subquests:")
            for mq in miniquest_candidates[:5]:
                print(f"Title: {mq.get('title')}, Status: {mq.get('status')}, QP: {mq.get('questPoints')}, Ref: {mq.get('userQuestStatus') if 'userQuestStatus' in mq else 'N/A'}")
        else:
            print("No obvious miniquests (by title filter) found.")

        # Print a few random quests with COMPLETED status to see if they look like miniquests
        print("\n--- Sample of COMPLETED quests (checking for 0 Quest Points which often indicates miniquests) ---")
        completed_0_qp = [q for q in quests if q.get('status') == 'COMPLETED' and q.get('questPoints') == 0]
        if completed_0_qp:
            print(f"Found {len(completed_0_qp)} COMPLETED quests with 0 Quest Points:")
            for q in completed_0_qp[:10]:
                 print(f"Title: {q.get('title')}")
        else:
             print("No COMPLETED quests with 0 Quest Points found.")

        # Check for NOT_STARTED vs Not Started
        not_started = [q for q in quests if 'NOT_STARTED' in q.get('status', '')]
        print(f"\n'NOT_STARTED' count: {len(not_started)}")
        
        other_started = [q for q in quests if 'STARTED' in q.get('status', '')]
        print(f"'STARTED' count: {len(other_started)}")

        return True

    except Exception as e:
        print(f"Error: {e}")
        return False

# Try Woox first, if fails try Zezima
if not verify_quest_statuses("Woox"):
    print("\nRetrying with 'Zezima'...")
    verify_quest_statuses("Zezima")
