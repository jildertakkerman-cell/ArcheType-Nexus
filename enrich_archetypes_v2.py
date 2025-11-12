import json
import json5
import requests
import time
from datetime import datetime
from typing import Dict, List, Optional
import re
import ast

class ArchetypeEnricher:
    def __init__(self):
        self.api_base = "https://db.ygoprodeck.com/api/v7"
        self.cache = {}
        
    def fetch_archetype_cards(self, archetype_name: str) -> Optional[List[Dict]]:
        """Fetch all cards for a specific archetype from YGOProDeck API"""
        if archetype_name in self.cache:
            return self.cache[archetype_name]
        
        try:
            url = f"{self.api_base}/cardinfo.php"
            params = {"archetype": archetype_name}
            
            print(f"Fetching cards for archetype: {archetype_name}")
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                cards = data.get("data", [])
                self.cache[archetype_name] = cards
                time.sleep(0.1)  # Rate limiting
                return cards
            else:
                print(f"  ⚠ No data found for {archetype_name} (Status: {response.status_code})")
                return None
                
        except Exception as e:
            print(f"  ✗ Error fetching {archetype_name}: {str(e)}")
            return None
    
    def extract_dates(self, cards: List[Dict]) -> tuple:
        """Extract first release and latest support dates from card list"""
        dates = []
        
        for card in cards:
            # Check misc_info for TCG date
            misc_info = card.get("misc_info", [{}])
            if misc_info and len(misc_info) > 0:
                tcg_date = misc_info[0].get("tcg_date")
                if tcg_date:
                    dates.append(tcg_date)
        
        if not dates:
            return None, None
        
        # Parse dates and find min/max
        parsed_dates = []
        for date_str in dates:
            try:
                parsed = datetime.strptime(date_str, "%Y-%m-%d")
                parsed_dates.append(parsed)
            except:
                continue
        
        if not parsed_dates:
            return None, None
        
        first_date = min(parsed_dates).strftime("%Y-%m-%d")
        latest_date = max(parsed_dates).strftime("%Y-%m-%d")
        
        return first_date, latest_date
    
    def enrich_archetype(self, archetype: Dict) -> Dict:
        """Enrich a single archetype entry with dates"""
        archetype_name = archetype.get("name") or archetype.get("archetype")
        
        if not archetype_name:
            print("  ⚠ Archetype entry missing name field")
            return archetype
        
        cards = self.fetch_archetype_cards(archetype_name)
        
        if cards:
            first_date, latest_date = self.extract_dates(cards)
            archetype["firstReleaseDate"] = first_date
            archetype["latestReleaseDate"] = latest_date
            archetype["totalCards"] = len(cards)
            
            print(f"  ✓ {archetype_name}: {first_date} to {latest_date} ({len(cards)} cards)")
        else:
            archetype["firstReleaseDate"] = None
            archetype["latestReleaseDate"] = None
            archetype["totalCards"] = 0
        
        return archetype
    
    def parse_archetypes(self, js_text):
        # Extract the archetypes array
        match = re.search(r'const archetypes = (\[.*?\]);', js_text, re.DOTALL)
        if not match:
            raise ValueError("Could not find archetypes array")
        array_text = match.group(1)
        # Escape " in icons
        array_text = re.sub(r'`([^`]*)`', lambda m: '`' + m.group(1).replace('"', '\\"') + '`', array_text)
        # Convert JS to JSON5: replace ` with ", replace ' with "
        array_text = array_text.replace('`', '"')
        array_text = array_text.replace("'", '"')
        # Use json5 to parse
        return json5.loads(array_text)
    
    def inject_dates(self, js_text, enriched_archetypes):
        # Replace the archetypes array
        new_array_text = json.dumps(enriched_archetypes, indent=4)
        return re.sub(r'const archetypes = (\[.*?\]);', f'const archetypes = {new_array_text};', js_text, flags=re.DOTALL)
    
    def process_file(self, input_file: str, output_file: str):
        """Process the entire archetype data file"""
        print(f"\n{'='*60}")
        print(f"Starting YuGiOh Archetype Data Enrichment")
        print(f"{'='*60}\n")
        
        # Read input file
        try:
            with open(input_file, 'r', encoding='utf-8') as f:
                js_text = f.read()
        except Exception as e:
            print(f"✗ Error reading input file: {str(e)}")
            return
        
        archetypes = self.parse_archetypes(js_text)
        
        if not archetypes:
            print("✗ No archetypes found in input file")
            return
        
        print(f"Found {len(archetypes)} archetypes to process\n")
        
        # Process each archetype
        enriched = []
        for idx, archetype in enumerate(archetypes, 1):
            print(f"[{idx}/{len(archetypes)}]", end=" ")
            enriched_archetype = self.enrich_archetype(archetype)
            enriched.append(enriched_archetype)
        
        # Save output
        new_js_text = self.inject_dates(js_text, enriched)
        
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(new_js_text)
            print(f"\n{'='*60}")
            print(f"✓ Successfully enriched data saved to: {output_file}")
            print(f"{'='*60}\n")
        except Exception as e:
            print(f"\n✗ Error saving output file: {str(e)}")


def main():
    # Configuration
    INPUT_FILE = "assets/js/archetypes-data.js"  # Change this to your input file path
    OUTPUT_FILE = "assets/js/archetypes-data.js"  # Output file path
    
    enricher = ArchetypeEnricher()
    enricher.process_file(INPUT_FILE, OUTPUT_FILE)


if __name__ == "__main__":
    main()