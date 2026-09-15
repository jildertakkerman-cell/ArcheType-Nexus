import re

def add_dates(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern to add after icon: `,
    pattern = r'(icon: `[^`]*`,\n)'

    replacement = r'\1        firstReleaseDate: null,\n        latestReleaseDate: null,\n'

    new_content = re.sub(pattern, replacement, content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print("Added date properties to all archetypes.")

if __name__ == '__main__':
    add_dates('assets/js/archetypes-data.js')