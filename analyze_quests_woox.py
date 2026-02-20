import requests
import json
import difflib

def analyze_quests(username):
    url = f"https://apps.runescape.com/runemetrics/quests?user={username}"
    print(f"Fetching quest data for {username}...")
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        
        if "quests" not in data:
            print("Error: 'quests' key not found in response.")
            return

        quests = data["quests"]
        print(f"Total quests found: {len(quests)}")

        miniquest_candidates = []
        weird_eligible_status = []
        completed_quests = []
        not_started_quests = []

        print("\n--- Analyzing Quest Data ---")
        
        for quest in quests:
            title = quest.get('title', 'Unknown')
            status = quest.get('status', 'UNKNOWN')
            eligible = quest.get('userEligible', None)
            
            # 1. Check for "miniquest" or subquest-like titles
            if "miniquest" in title.lower() or "subquest" in title.lower():
                miniquest_candidates.append(quest)

            # 2. Check for userEligible: false but status: "COMPLETED"
            # Note: status is usually an expected string like "COMPLETED", "STARTED", "NOT_STARTED"
            if status == "COMPLETED" and eligible is False:
                weird_eligible_status.append(quest)

            # Separate for similarity check
            if status == "COMPLETED":
                completed_quests.append(title)
            elif status == "NOT_STARTED":
                not_started_quests.append(title)
        
        # Report 1: Miniquest/Subquest titles
        if miniquest_candidates:
            print(f"\n[!] Possible Miniquests/Subquests found ({len(miniquest_candidates)}):")
            for q in miniquest_candidates:
                print(f"  - {q['title']} (Status: {q['status']})")
        else:
             print("\n[OK] No explicit 'miniquest' titles found.")

        # Report 2: Weird Eligibility
        if weird_eligible_status:
            print(f"\n[!] Quests INVALIDLY marked as COMPLETED but Not Eligible ({len(weird_eligible_status)}):")
            for q in weird_eligible_status:
                print(f"  - {q['title']}")
        else:
            print("\n[OK] No completed quests with userEligible: false found.")

        # Report 3: Similar Names (Not Started vs Completed)
        print(f"\n--- Checking for similar names between Not Started ({len(not_started_quests)}) and Completed ({len(completed_quests)}) quests ---")
        found_similar = False
        for ns_title in not_started_quests:
            # simple cutoff for similarity
            matches = difflib.get_close_matches(ns_title, completed_quests, n=3, cutoff=0.85)
            if matches:
                found_similar = True
                print(f"[?] '{ns_title}' (Not Started) is very similar to:")
                for m in matches:
                    print(f"    -> '{m}' (Completed)")
        
        if not found_similar:
             print("[OK] No suspicious execution of similar quest names found.")

    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
    except json.JSONDecodeError:
        print("Error decoding JSON response")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    analyze_quests("Woox")
