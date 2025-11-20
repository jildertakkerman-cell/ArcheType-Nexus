// Comprehensive test of all three Dinomorphia/Dream Mirror cards

const cards = [
    {
        name: "Dinomorphia Rexterm",
        desc: `1 "Dinomorphia" Fusion Monster + 1 "Dinomorphia" monster
Your opponent cannot activate the effects of monsters they control that have ATK greater than or equal to your LP.`,
        expected: '1 "Dinomorphia" Fusion Monster + 1 "Dinomorphia" monster'
    },
    {
        name: "Dinomorphia Kentregina",
        desc: `2 "Dinomorphia" monsters with different names\r\r\nLoses ATK equal to your LP.`,
        expected: '2 "Dinomorphia" monsters with different names'
    },
    {
        name: "Oneiros, the Dream Mirror Tormentor",
        desc: `2 "Dream Mirror" monsters with different Attributes\r\r\nWhile face-up on the field, this card is also LIGHT-Attribute.`,
        expected: '2 "Dream Mirror" monsters with different Attributes'
    }
];

function extractSummoningMaterials(description) {
    const patterns = [
        /^(\d+(?:\s*\+\s*\d+)?\s*[\w\s"]+monsters?,\s*except\s*[^\r\n]*)/i,
        /^(\d+\s*[\w\s"]+\s*\+\s*\d+\s*[\w\s"]+?monsters?(?:\s*\+\s*\d+\s*[\w\s"]+?monsters?)*)/i,
        /^(\d+\s*[\w\s"]+monsters?(?:\s*\+\s*(?:\d+\s*)?[\w\s"]+)*)/i,
    ];

    for (const pattern of patterns) {
        const match = description.match(pattern);
        if (match && match[1]) {
            let materials = match[1].trim();
            const lookaheadStart = description.indexOf(match[1]) + match[1].length;
            const lookahead = description.slice(lookaheadStart);

            if (/^\s*(?:You|If|When|Once|During|For|Unless|While|Then|In the|When your|If that|If this|If a|If an|If any|When a|When an|When you|While your|Any|Each|All|Must|This|Gains)\b/i.test(lookahead)) {
                return materials;
            }

            const commaCont = lookahead.match(/^\s*(?:,|\u2013|\u2014|\*|\u2022|•|-)?\s*(?:including|including a|such as|or|and|excluding|except|with|without|but|among|specifically)\b[^\r\n]*/im);
            if (commaCont && commaCont[0]) {
                const combined = match[1] + commaCont[0];
                if (combined.length < 200) return combined;
            }

            return materials;
        }
    }
    return null;
}

console.log("═══════════════════════════════════════════");
console.log("  TESTING MATERIALS EXTRACTION");
console.log("═══════════════════════════════════════════\n");

let allPassed = true;

for (const card of cards) {
    const result = extractSummoningMaterials(card.desc);
    const passed = result === card.expected;

    console.log(`${passed ? '✅' : '❌'} ${card.name}`);
    console.log(`   Expected: "${card.expected}"`);
    console.log(`   Got:      "${result}"`);

    if (!passed) {
        allPassed = false;
        console.log(`   ⚠️  MISMATCH!`);
    }
    console.log();
}

console.log("═══════════════════════════════════════════");
if (allPassed) {
    console.log("✅ ALL TESTS PASSED!");
} else {
    console.log("❌ SOME TESTS FAILED!");
}
console.log("═══════════════════════════════════════════");
