const fs = require('fs');
const path = require('path');
const dirs = ['./pages', './word', '.'];

let changed = 0;

for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
    for (const f of files) {
        const p = path.join(dir, f);
        let content = fs.readFileSync(p, 'utf8');
        
        // Find tailwind link
        const twRegex = /<link\s+href="\.\.\/output\.css"\s+rel="stylesheet">\r?\n?/g;
        const twRegexRoot = /<link\s+href="\.\/output\.css"\s+rel="stylesheet">\r?\n?/g;
        
        let hasTw = content.match(twRegex) || content.match(twRegexRoot);
        if (!hasTw) continue;
        
        let linkStr = hasTw[0].trim();
        
        // Remove it from its current position
        content = content.replace(twRegex, '').replace(twRegexRoot, '');
        
        // Find font-awesome link
        const faLink = '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">';
        
        if (content.includes(faLink)) {
            content = content.replace(faLink, faLink + '\n    ' + linkStr);
            fs.writeFileSync(p, content);
            changed++;
        } else {
            // Just append to the end of <head> if faLink isn't there
            content = content.replace('</head>', '    ' + linkStr + '\n</head>');
            fs.writeFileSync(p, content);
            changed++;
        }
    }
}
console.log('Changed ' + changed + ' files.');
