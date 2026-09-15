const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '..', 'pages');
let modifiedCount = 0;
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

const targetStr = 'class="flex flex-wrap items-center justify-center gap-4 p-3 rounded-2xl bg-[#0f172a]/80 backdrop-blur-md border border-indigo-500/30 shadow-[0_8px_30px_rgb(0,0,0,0.4)]"';
const replaceStr = 'class="relative z-50 flex flex-wrap items-center justify-center gap-4 p-3 rounded-2xl bg-[#0f172a]/80 backdrop-blur-md border border-indigo-500/30 shadow-[0_8px_30px_rgb(0,0,0,0.4)]"';

for (const filename of files) {
    const filepath = path.join(pagesDir, filename);
    let content = fs.readFileSync(filepath, 'utf8');

    // Handle possible newlines inside the class string by matching parts if needed
    // But since it's just a string match, let's normalize spaces for checking
    if (content.includes(targetStr)) {
        content = content.replace(targetStr, replaceStr);
        fs.writeFileSync(filepath, content, 'utf8');
        modifiedCount++;
    } else {
        // Try regex for cases with newlines
        const regex = /class="flex flex-wrap items-center justify-center gap-4 p-3 rounded-2xl bg-\[#0f172a\]\/80\s*backdrop-blur-md border border-indigo-500\/30 shadow-\[0_8px_30px_rgb\(0,0,0,0\.4\)\]"/g;
        if (regex.test(content)) {
            content = content.replace(regex, replaceStr);
            fs.writeFileSync(filepath, content, 'utf8');
            modifiedCount++;
        }
    }
}

console.log(`Modified ${modifiedCount} files.`);
