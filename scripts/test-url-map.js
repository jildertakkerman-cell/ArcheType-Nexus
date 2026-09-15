const fs = require('fs');

const content = fs.readFileSync('assets/js/archetypes-data.js', 'utf8');
const map = {};
const blocks = content.split('name:');

for (let i = 1; i < blocks.length; i++) {
    const nameMatch = blocks[i].match(/^\s*['"]([^'"]+)['"]/);
    const pathMatch = blocks[i].match(/filepath:\s*['"](?:pages\/)?([^'"]+)['"]/);
    if (nameMatch && pathMatch) {
        map[nameMatch[1]] = pathMatch[1].replace('pages/', '');
    }
}

console.log(Object.keys(map).length);
console.log('Maliss:', map['Maliss']);
console.log('Cyberse:', map['Cyberse']);
console.log('@Ignister:', map['@Ignister']);

fs.writeFileSync('scripts/url-map-dump.json', JSON.stringify(map, null, 2), 'utf8');
