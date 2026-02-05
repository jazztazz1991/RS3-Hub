import requests
from bs4 import BeautifulSoup

def main():
    url = 'https://runescape.wiki/w/Cooking'
    try:
        response = requests.get(url)
        response.raise_for_status()
    except Exception as e:
        print(f"Error fetching: {e}")
        return

    soup = BeautifulSoup(response.text, 'html.parser')
    tables = soup.find_all('table', {'class': 'wikitable'})
    
    print(f"Found {len(tables)} tables.")
    
    for i, table in enumerate(tables):
        headers = [th.get_text(strip=True) for th in table.find_all('th')]
        print(f"Table {i} Headers: {headers}")

if __name__ == '__main__':
    main()
