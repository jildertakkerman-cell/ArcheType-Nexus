const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '..', 'pages');
let modifiedCount = 0;
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

for (const filename of files) {
    const filepath = path.join(pagesDir, filename);
    let content = fs.readFileSync(filepath, 'utf8');

    let modified = false;
    if (content.includes('<span>&#128279; Pairs Well With</span>')) {
        content = content.replace('<span>&#128279; Pairs Well With</span>', '<span>&#128279; Synergies</span>');
        modified = true;
    }
    if (content.includes('<span class="synergy-popover-title">Pairs Well With</span>')) {
        content = content.replace('<span class="synergy-popover-title">Pairs Well With</span>', '<span class="synergy-popover-title">Synergies</span>');
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(filepath, content, 'utf8');
        modifiedCount++;
    }
}

console.log(`Modified ${modifiedCount} files.`);
