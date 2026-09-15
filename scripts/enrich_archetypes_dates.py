import re
import requests

ARCHETYPES_FILE = 'assets/js/archetypes-data.js'
OUTPUT_FILE = 'assets/js/archetypes-data.js'

def get_all_set_dates():
    url = 'https://db.ygoprodeck.com/api/v7/cardsets.php'
    try:
        response = requests.get(url)
        if response.status_code != 200:
            return {}
        data = response.json()
        dates = {}
        for set_info in data:
            if 'set_code' in set_info and 'tcg_date' in set_info:
                dates[set_info['set_code']] = set_info['tcg_date']
        return dates
    except Exception as e:
        print(f"Error fetching set dates: {e}")
        return {}

def get_card_set_dates(archetype_name, set_dates):
    url = f'https://db.ygoprodeck.com/api/v7/cardinfo.php?archetype={archetype_name.replace(" ", "%20")}'
    try:
        response = requests.get(url)
        if response.status_code != 200:
            return []
        data = response.json()
        if 'data' not in data:
            return []
        dates = []
        for card in data['data']:
            if 'card_sets' in card:
                for card_set in card['card_sets']:
                    if 'set_code' in card_set and card_set['set_code'] in set_dates:
                        dates.append(set_dates[card_set['set_code']])
        return dates
    except Exception as e:
        print(f"Error fetching {archetype_name}: {e}")
        return []

def get_archetype_names(js_text):
    return re.findall(r"name: '([^']+)'", js_text)

def add_dates_to_archetype(js_text, name, first_date, latest_date):
    # Replace the None with the dates
    first = first_date if first_date is not None else 'null'
    latest = latest_date if latest_date is not None else 'null'
    pattern = rf"(name: '{re.escape(name)}'.*?firstReleaseDate: )null"
    replacement = rf"\1{first}"
    js_text = re.sub(pattern, replacement, js_text, flags=re.DOTALL)
    pattern = rf"(name: '{re.escape(name)}'.*?latestReleaseDate: )null"
    replacement = rf"\1{latest}"
    js_text = re.sub(pattern, replacement, js_text, flags=re.DOTALL)
    return js_text

def main():
    print("Fetching all set release dates...")
    set_dates = get_all_set_dates()
    print(f"Fetched {len(set_dates)} set dates.")

    with open(ARCHETYPES_FILE, 'r', encoding='utf-8') as f:
        js_text = f.read()

    names = get_archetype_names(js_text)

    for name in names:
        dates = get_card_set_dates(name, set_dates)
        if dates:
            dates.sort()
            first_date = dates[0]
            latest_date = dates[-1]
        else:
            first_date = None
            latest_date = None
        js_text = add_dates_to_archetype(js_text, name, first_date, latest_date)
        print(f"Processed: {name}")

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(js_text)

    print(f'Enriched archetypes written to {OUTPUT_FILE}')

if __name__ == '__main__':
    main()

if __name__ == '__main__':
    main()