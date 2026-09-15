// One-time backfill: copies each archetype's icon SVG from
// assets/js/archetypes-data.js into the new archetypes.iconsvg column
// (see scripts/sql/001_synergy_tags_schema.sql).
//
// Run once, after applying the SQL migration:
//   SUPABASE_SERVICE_ROLE_KEY=xxxxx node scripts/backfill-archetype-icons.js
//
// Requires the SERVICE ROLE key (not the anon key) since it writes across
// every row and RLS only allows moderator updates. Never commit that key —
// pass it as an environment variable only.

const path = require('path');
const archetypes = require(path.join(__dirname, '..', 'assets', 'js', 'archetypes-data.js'));

const SUPABASE_URL = 'https://pdvrdrmmykbznmojacwp.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Aborting.');
    process.exit(1);
}

async function backfillOne(archetype) {
    const url = `${SUPABASE_URL}/rest/v1/archetypes?archetypename=ilike.${encodeURIComponent(archetype.name)}`;
    const res = await fetch(url, {
        method: 'PATCH',
        headers: {
            apikey: SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
        },
        body: JSON.stringify({ iconsvg: archetype.icon }),
    });

    const body = await res.json().catch(() => null);

    if (!res.ok) {
        return { name: archetype.name, ok: false, reason: `HTTP ${res.status}: ${JSON.stringify(body)}` };
    }
    if (!Array.isArray(body) || body.length === 0) {
        return { name: archetype.name, ok: false, reason: 'no matching archetypes row (name mismatch)' };
    }
    return { name: archetype.name, ok: true };
}

async function main() {
    console.log(`Backfilling iconsvg for ${archetypes.length} archetypes...`);
    let updated = 0;
    const misses = [];

    for (const archetype of archetypes) {
        const result = await backfillOne(archetype);
        if (result.ok) {
            updated++;
        } else {
            misses.push(result);
        }
    }

    console.log(`\nUpdated: ${updated} / ${archetypes.length}`);
    if (misses.length) {
        console.log(`\nNo match or error (${misses.length}) — check these names against the archetypes table by hand:`);
        misses.forEach((m) => console.log(`  - ${m.name}: ${m.reason}`));
    }
}

main().catch((err) => {
    console.error('Backfill failed:', err);
    process.exit(1);
});
