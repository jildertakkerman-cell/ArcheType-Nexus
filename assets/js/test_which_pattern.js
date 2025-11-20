
const description = "2 Level 3 monsters\nMonsters this card points to cannot be destroyed by card effects.";

const patterns = [
    { name: "Pattern 12", regex: /^(\d+(?:\s*\+\s*\d+)?\s*[\w\s"]+monsters?)/i },
    { name: "Link Pattern", regex: /^(\d+(?:\s*\+\s*)?\s*(?:[\w \t\-]+?)?monsters?(?:\r?\n(?![A-Z]).*)*)/im },
];

patterns.forEach(({ name, regex }) => {
    const match = description.match(regex);
    if (match) {
        console.log(`${name} matched: "${match[1]}"`);
    } else {
        console.log(`${name}: No match`);
    }
});
