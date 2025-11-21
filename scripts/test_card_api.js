const https = require('https');

function fetchCard(cardName) {
    const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(cardName)}`;
    console.log(`Fetching ${url}...`);
    
    https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            if (res.statusCode === 200) {
                try {
                    const json = JSON.parse(data);
                    if (json.data && json.data.length > 0) {
                        const card = json.data[0];
                        console.log(`[SUCCESS] ${cardName}: ID=${card.id}`);
                        console.log(`Image URL: https://storage.googleapis.com/yugioh-card-images-archetype-nexus/cards/${card.id}.png`);
                    } else {
                        console.log(`[FAILED] ${cardName}: No data found`);
                    }
                } catch (e) {
                    console.log(`[ERROR] ${cardName}: Invalid JSON`);
                }
            } else {
                console.log(`[FAILED] ${cardName}: Status Code ${res.statusCode}`);
                console.log(data);
            }
        });
    }).on('error', (err) => {
        console.log(`[ERROR] ${cardName}: ${err.message}`);
    });
}

fetchCard('Number 39: Utopia Double');
fetchCard('Abyss Dweller');
