/**
 * page-sections.js — Community section rewrites that REPLACE the static
 * AI-drafted content by default once approved.
 *
 * Modeled on how a wiki (e.g. Wikipedia) edits a section, not on a
 * "suggestion box" bolted next to the content — with one deliberate
 * difference in labeling: the control reads "[suggest edit]", not "[edit]",
 * because unlike Wikipedia this doesn't publish immediately. Calling it
 * "edit" would imply the click itself changes the page; it doesn't — a
 * moderator has to approve it first. The label says what actually happens.
 *   - One [suggest edit] control per section (a whole combo walkthrough, a
 *     whole Strengths list) — not one per bullet/sentence.
 *   - Clicking it turns the section itself into an editable textarea in
 *     place, with a live preview — you're editing what's there, not writing
 *     a separate blurb next to it.
 *   - No permanent "edited by X" byline sitting under the content forever;
 *     that lives behind an on-demand [history] control instead (version
 *     list with author/date — not a true line diff, that's a future step).
 *   - Pre-publish moderation is intentionally kept (unlike Wikipedia's
 *     live-then-revert model): this site's whole problem was unreviewed
 *     content, and swapping "unreviewed AI" for "unreviewed anyone" doesn't
 *     fix that. See scripts/sql/009_page_sections.sql for the approval gate.
 *
 * Usage: wrap a whole contributable block (not individual bullets) in a
 * <div class="cms-section" data-section-key="...">, then call
 * initPageSections(archetypeName) ONCE per page — it auto-discovers every
 * .cms-section on the page.
 *
 *   <div class="cms-section" data-section-key="strengths">
 *     <ul>...existing AI-drafted bullets...</ul>
 *   </div>
 *   <script>
 *     document.addEventListener('DOMContentLoaded', () => {
 *       initPageSections('Drytron');
 *     });
 *   </script>
 *
 * The section-key granularity is a per-page authoring choice: wrap a whole
 * combo walkthrough as one section (narrative continuity across steps
 * matters), a whole Strengths/Weaknesses list as one section each (matches
 * how a reader thinks about "the pros" as one thing, not N independent
 * sentences) — never an individual bullet or sentence.
 *
 * Content format is a small custom markdown-lite, not raw HTML or a full
 * markdown library: **bold**, [[Card Name]] (renders as the site's existing
 * accent-highlighted card-name style), and lines starting with "- " for
 * bullets. Text is HTML-escaped BEFORE those tokens are applied, so
 * submitted text can never inject markup.
 *
 * Requires: supabase-config.js, auth.js loaded first.
 * Schema/RLS/approve_pagesection(): scripts/sql/009_page_sections.sql.
 */

if (typeof window.escapeHtml !== 'function') {
    window.escapeHtml = function (str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };
}

function _pcsInjectStyle() {
    if (document.getElementById('page-sections-style')) return;
    const style = document.createElement('style');
    style.id = 'page-sections-style';
    style.textContent = `
        .pcs-toolbar {
            display: flex; align-items: center; justify-content: flex-start; gap: 0.5rem; min-height: 1.1rem;
            margin: -0.35rem 0 0.35rem; font-size: 0.68rem;
            opacity: 0.45; transition: opacity 0.15s ease;
        }
        /* Combo-walkthrough sections center their content (see the intro
           paragraph's text-center above them); a left-stuck toolbar there
           reads as disconnected floating text instead of belonging to the
           centered card column below it. */
        .pcs-toolbar-center { justify-content: center; }
        .cms-section:hover .pcs-toolbar, .cms-section:focus-within .pcs-toolbar { opacity: 1; }
        .pcs-toolbar-link {
            background: none; border: none; color: #9ca3af; font-size: 0.68rem;
            font-weight: 500; cursor: pointer; font-family: inherit; padding: 0;
        }
        .pcs-toolbar-link:hover, .pcs-toolbar-link:focus { color: #f59e0b; text-decoration: underline; outline: none; }
        .pcs-toolbar-note { color: #4ade80; font-size: 0.68rem; }
        .pcs-muted { color: #a3a3a3; font-size: 0.8rem; margin: 0 0 0.5rem; }
        .pcs-policy {
            font-size: 0.78rem; color: #d4d4d4; margin: 0 0 0.75rem;
            padding: 0.5rem 0.7rem; border-left: 2px solid #f59e0b;
            background: rgba(245,158,11,0.06); max-width: 34rem;
        }
        .pcs-policy i { color: #f59e0b; margin-right: 0.3rem; }
        .pcs-policy a { color: #f59e0b; font-weight: 600; text-decoration: none; }
        .pcs-policy a:hover { text-decoration: underline; }
        .pcs-content ul { margin: 0; }
        .pcs-content textarea, .pcs-content .pcs-preview { max-width: 34rem; }
        .pcs-combo-tabbar {
            display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem;
            margin-bottom: 1rem;
        }
        .pcs-combo-tab {
            background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.12);
            color: #a3a3a3; font-size: 0.8rem; font-weight: 600; font-family: inherit;
            padding: 0.4rem 0.9rem; border-radius: 999px; cursor: pointer;
        }
        .pcs-combo-tab:hover { background: rgba(255,255,255,0.08); color: #e5e5e5; }
        .pcs-combo-tab.active {
            background: rgba(245,158,11,0.15); border-color: rgba(245,158,11,0.4); color: #f59e0b;
        }
        .pcs-combo-tab-add { border-style: dashed; }
        .pcs-tab-ai-icon { color: #9ca3af; font-size: 0.72rem; }
        .pcs-combo-tab.active .pcs-tab-ai-icon { color: rgba(245,158,11,0.6); }
        .pcs-label { display: block; font-size: 0.72rem; color: #737373; margin-bottom: 0.3rem; }
        .pcs-combo-title-input {
            width: 100%; max-width: 34rem; box-sizing: border-box; background: rgba(0,0,0,0.25);
            border: 1px solid rgba(255,255,255,0.15); color: #e5e5e5;
            border-radius: 0.5rem; padding: 0.5rem 0.65rem; font-size: 0.82rem;
            font-family: inherit; margin-bottom: 0.75rem;
        }
        textarea#pcs-body-input, .pcs-content textarea {
            width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.25);
            border: 1px solid rgba(255,255,255,0.15); color: #e5e5e5;
            border-radius: 0.5rem; padding: 0.5rem 0.65rem; font-size: 0.82rem;
            font-family: inherit; margin-bottom: 0.5rem; resize: vertical;
        }
        .pcs-step-editor {
            border: 1px solid rgba(255,255,255,0.1); border-radius: 0.6rem;
            padding: 0.75rem 0.9rem; margin-bottom: 0.75rem; background: rgba(255,255,255,0.02);
            max-width: 34rem;
        }
        .pcs-step-editor-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
        .pcs-step-editor-num {
            display: inline-flex; align-items: center; justify-content: center;
            width: 1.4rem; height: 1.4rem; border-radius: 999px;
            background: #1e293b; color: #e5e5e5; font-size: 0.72rem; font-weight: 700;
        }
        .pcs-step-remove {
            background: none; border: none; color: #737373; font-size: 1.1rem; line-height: 1;
            cursor: pointer; padding: 0.15rem 0.4rem;
        }
        .pcs-step-remove:hover { color: #f87171; }
        .pcs-step-editor input[type="text"], .pcs-step-editor textarea {
            width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.25);
            border: 1px solid rgba(255,255,255,0.15); color: #e5e5e5;
            border-radius: 0.5rem; padding: 0.4rem 0.6rem; font-size: 0.8rem;
            font-family: inherit; margin-bottom: 0.55rem; resize: vertical;
        }
        .pcs-cardname-wrap { position: relative; }
        .pcs-cardname-status {
            position: absolute; right: 0.6rem; top: 0.4rem; font-size: 0.8rem; font-weight: 700;
        }
        .pcs-cardname-status.ok { color: #4ade80; }
        .pcs-cardname-status.warn { color: #f59e0b; }
        .pcs-cardname-suggestions {
            position: absolute; z-index: 5; left: 0; right: 0; top: 100%;
            background: #171717; border: 1px solid rgba(255,255,255,0.15); border-radius: 0.5rem;
            margin-top: 0.2rem; overflow: hidden;
        }
        .pcs-cardname-option { padding: 0.4rem 0.6rem; font-size: 0.8rem; color: #e5e5e5; cursor: pointer; }
        .pcs-cardname-option:hover { background: rgba(245,158,11,0.15); }
        .pcs-step-add {
            background: rgba(255,255,255,0.04); border: 1px dashed rgba(255,255,255,0.2);
            color: #a3a3a3; font-size: 0.8rem; font-weight: 600; font-family: inherit;
            padding: 0.45rem 0.9rem; border-radius: 0.5rem; cursor: pointer; margin-bottom: 0.75rem;
        }
        .pcs-step-add:hover { color: #e5e5e5; border-color: rgba(255,255,255,0.35); }
        .pcs-preview-label { font-size: 0.7rem; color: #737373; margin-bottom: 0.3rem; text-transform: uppercase; letter-spacing: 0.03em; }
        .pcs-preview {
            padding: 0.6rem 0.7rem; border-radius: 0.5rem; background: rgba(255,255,255,0.02);
            border: 1px dashed rgba(255,255,255,0.15); color: #d4d4d4; margin-bottom: 0.6rem;
            font-size: 0.85rem; line-height: 1.5;
        }
        .pcs-preview p { margin: 0 0 0.5rem; }
        .pcs-preview p:last-child { margin-bottom: 0; }
        .pcs-actions { display: flex; align-items: center; gap: 0.6rem; }
        .pcs-submit {
            background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.4);
            color: #f59e0b; font-weight: 700; font-size: 0.8rem;
            padding: 0.45rem 1rem; border-radius: 0.5rem; cursor: pointer; font-family: inherit;
        }
        .pcs-submit:disabled { opacity: 0.5; cursor: default; }
        .pcs-cancel { color: #737373; font-size: 0.78rem; cursor: pointer; background: none; border: none; font-family: inherit; }
        .pcs-msg { font-size: 0.78rem; margin-top: 0.5rem; }
        .pcs-msg.error { color: #f87171; }
        .pcs-msg.ok { color: #4ade80; }
        .pcs-login-btns { display: flex; gap: 0.5rem; margin-top: 0.5rem; margin-bottom: 0.5rem; }
        .pcs-login-btns button {
            display: inline-flex; align-items: center; gap: 0.4rem;
            background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15);
            color: #e5e5e5; font-size: 0.78rem; font-weight: 600;
            padding: 0.4rem 0.8rem; border-radius: 0.5rem; cursor: pointer; font-family: inherit;
        }
        .pcs-hist-item {
            padding: 0.6rem 0.7rem; border-radius: 0.5rem; background: rgba(255,255,255,0.02);
            border: 1px solid rgba(255,255,255,0.08); margin-bottom: 0.5rem; font-size: 0.82rem;
        }
        .pcs-hist-meta { font-size: 0.72rem; color: #a3a3a3; margin-bottom: 0.35rem; }
        .pcs-hist-live { color: #4ade80; margin-left: 0.4rem; font-weight: 700; }
        .pcs-hist-body { color: #d4d4d4; }
        .pcs-hist-body p { margin: 0 0 0.4rem; }
    `;
    document.head.appendChild(style);
}

// Escapes first, THEN applies markup tokens — the escape step neutralizes any
// '<'/'>'/'&' the user typed, so what these replacements match/insert can
// never contain live markup from the input, only these trusted templates.
//
// Returns { html, cardMap }. cardMap is {containerId: cardName} for any real
// card images referenced (combo-walkthrough steps only) — rendering only
// produces placeholder boxes; the caller must pass cardMap to
// window.CardLoader.loadCards(...) AFTER inserting html into the live DOM
// (CardLoader looks containers up by id, so they have to exist first) to
// actually fetch and swap in the images, exactly like the original
// AI-authored steps already do via their own loadCards() call.
//
// opts.tone ('pro'|'con') and opts.ordered are set per section-key (see
// _pcsSectionStyle below) so a rewritten Strengths/Weaknesses list keeps the
// same icon + colored "Label:" treatment as the original AI-drafted bullets,
// and a rewritten combo walkthrough can reproduce the same numbered
// card-per-step layout — without requiring the contributor to hand-write any
// HTML/CSS for it.
function _pcsRenderBody(text, opts) {
    opts = opts || {};
    let out = window.escapeHtml(text);
    out = out.replace(/\[\[([^\[\]]{1,80})\]\]/g, '<strong class="text-accent font-bold">$1</strong>');
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // "## Step Title | Card Name" lines opt a combo-walkthrough submission
    // into the full step-card layout (numbered circle, real card image,
    // title, body) instead of a plain numbered list. Parsed from the RAW
    // text (not `out`, which is already escaped) — _pcsRenderStepsHtml does
    // its own per-field escaping, so card names stay genuinely raw for the
    // CardLoader lookup instead of needing an escape/unescape round-trip.
    if (opts.ordered && /^##\s+/m.test(text)) {
        return _pcsRenderStepsHtml(_pcsParseSteps(text));
    }

    const toneClass = opts.tone === 'pro' ? 'text-green-400' : opts.tone === 'con' ? 'text-red-400' : null;
    const toneIcon = opts.tone === 'pro'
        ? '<span class="pro-icon"><i class="fas fa-check-circle"></i></span> '
        : opts.tone === 'con'
            ? '<span class="con-icon"><i class="fas fa-exclamation-triangle"></i></span> '
            : '';

    // "Short Label: rest of the sentence" -> auto-bolded/colored label,
    // matching every existing bullet shape on these pages: green/red for
    // pro/con bullets, and the site's general amber accent for neutral ones
    // (e.g. "Omni-Negation:" on the Endboard cards). Anything past the first
    // colon (or with no colon at all) is left as plain text.
    const labelClass = toneClass || 'text-accent';
    function formatListItem(item) {
        const m = item.match(/^([^:]{1,40}):\s*(.*)$/);
        if (m) return `${toneIcon}<strong class="${labelClass} font-bold">${m[1]}:</strong> ${m[2]}`;
        return toneIcon + item;
    }

    // Group consecutive "- " lines into a list (<ol> for combo walkthroughs,
    // <ul> otherwise); blank-line-separated runs of other text become <p>.
    const blocks = [];
    let listBuf = [];
    let paraBuf = [];
    const flushList = () => {
        if (listBuf.length) {
            const tag = opts.ordered ? 'ol' : 'ul';
            const listClass = opts.ordered ? 'list-decimal list-inside space-y-2' : 'list-disc list-inside space-y-2';
            blocks.push(`<${tag} class="${listClass}">${listBuf.map(i => `<li>${formatListItem(i)}</li>`).join('')}</${tag}>`);
        }
        listBuf = [];
    };
    const flushPara = () => {
        if (paraBuf.length) blocks.push(`<p>${paraBuf.join('<br>')}</p>`);
        paraBuf = [];
    };
    for (const rawLine of out.split('\n')) {
        const line = rawLine.trim();
        if (line.startsWith('- ')) { flushPara(); listBuf.push(line.slice(2).trim()); }
        else if (line === '') { flushList(); flushPara(); }
        else { flushList(); paraBuf.push(line); }
    }
    flushList();
    flushPara();
    return { html: blocks.join(''), cardMap: {} };
}

// Escapes a single raw string and applies the same [[Card Name]]/**bold**
// tokens as _pcsRenderBody's top-level pass — used wherever text needs that
// treatment applied per-field rather than on one big blob (step titles/
// bodies, since those come from parsed structured data, not one flat string).
function _pcsInlineFormat(rawText) {
    let out = window.escapeHtml(rawText);
    out = out.replace(/\[\[([^\[\]]{1,80})\]\]/g, '<strong class="text-accent font-bold">$1</strong>');
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    return out;
}

// Raw text -> [{title, cardName, body}], all fields still raw/unescaped.
// This is the single source of truth for the "## Title | Card Name" syntax —
// used both to render a combo walkthrough and to seed the structured step
// editor (_pcsBuildStepsEditor) when opening one for editing.
function _pcsParseSteps(text) {
    const steps = [];
    let current = null;
    for (const rawLine of text.split('\n')) {
        const headerMatch = rawLine.trim().match(/^##\s+(.*)$/);
        if (headerMatch) {
            if (current) steps.push(current);
            const headerText = headerMatch[1];
            const pipeIdx = headerText.indexOf('|');
            current = {
                title: (pipeIdx === -1 ? headerText : headerText.slice(0, pipeIdx)).trim(),
                cardName: pipeIdx === -1 ? '' : headerText.slice(pipeIdx + 1).trim(),
                body: [],
            };
        } else if (current) {
            const trimmed = rawLine.trim();
            if (trimmed) current.body.push(trimmed);
        }
    }
    if (current) steps.push(current);
    return steps.map(s => ({ title: s.title, cardName: s.cardName, body: s.body.join('\n') }));
}

// [{title, cardName, body}] -> the "## Title | Card Name\nbody" text blob
// stored in pagesections.body — the inverse of _pcsParseSteps, so the
// structured editor round-trips through the exact same storage format
// everything else already reads.
function _pcsStepsToText(steps) {
    return steps
        .map(s => `## ${s.title.trim()}${s.cardName.trim() ? ` | ${s.cardName.trim()}` : ''}\n${s.body.trim()}`)
        .join('\n\n');
}

let _pcsStepUid = 0;

// steps: raw (unescaped) [{title, cardName, body}] — see _pcsParseSteps.
function _pcsRenderStepsHtml(steps) {
    const cardMap = {};
    const cardsHtml = steps.map((step, i) => {
        const bodyHtml = step.body.split('\n').map(_pcsInlineFormat).join('<br>');
        let imgHtml = '';
        if (step.cardName) {
            const imgId = `pcs-step-img-${Date.now()}-${_pcsStepUid++}`;
            cardMap[imgId] = step.cardName; // already raw — no escape/unescape round-trip needed
            // Inline size constraint, not just the class — .card-image-container's
            // width comes from assets/css/shared-archetype.css, which not every
            // page links (Bystial doesn't). CardLoader's <img> renders at
            // width:100% of whatever this wrapper resolves to, so without an
            // explicit cap here it inherits the image's native size instead —
            // that's what blew up huge in the editor preview.
            imgHtml = `<div id="${imgId}" class="card-image-container flex-shrink-0 card-placeholder" style="max-width:120px;min-height:175px;">${window.escapeHtml(step.cardName)}</div>`;
        }
        const arrow = i < steps.length - 1
            ? `<div class="w-full flex justify-center"><i class="fas fa-arrow-down text-3xl my-4 arrow-color animate-fadeIn"></i></div>`
            : '';
        return `
            <div class="card p-6 combo-step-card w-full max-w-lg">
                <div class="flex flex-col md:flex-row items-center md:items-start gap-4">
                    ${imgHtml}
                    <div>
                        <div class="flex items-center mb-2">
                            <span class="bg-[#1e293b] text-white rounded-full h-8 w-8 flex items-center justify-center font-bold mr-3">${i + 1}</span>
                            <h3 class="text-lg font-bold">${window.escapeHtml(step.title)}</h3>
                        </div>
                        <p class="text-slate-300">${bodyHtml}</p>
                    </div>
                </div>
            </div>${arrow}`;
    }).join('');

    return { html: `<div class="flex flex-col items-center gap-6">${cardsHtml}</div>`, cardMap };
}

// Searches the same `cards` table CardLoader itself reads from (via the
// caller's Supabase client, no separate API/backend needed) — powers the
// card-name autocomplete in the structured step editor.
async function _pcsSearchCards(client, query) {
    if (!query || query.trim().length < 3) return [];
    try {
        const { data, error } = await client
            .from('cards')
            .select('cardname')
            .ilike('cardname', `%${query.trim()}%`)
            .limit(6);
        if (error || !data) return [];
        return data.map(r => r.cardname);
    } catch {
        return [];
    }
}

function _pcsLoadCardImages(cardMap) {
    if (cardMap && Object.keys(cardMap).length && window.CardLoader?.loadCards) {
        window.CardLoader.loadCards(cardMap);
    }
}

// Maps a section-key to how _pcsRenderBody should style its bullets. Keyed
// on the same naming convention pages already use ('strengths', 'weaknesses',
// 'combo-*') rather than a new per-page config, so it works without any
// extra markup as long as pages keep using those keys.
function _pcsSectionStyle(sectionKey) {
    if (sectionKey === 'strengths') return { tone: 'pro' };
    if (sectionKey === 'weaknesses') return { tone: 'con' };
    if (sectionKey.startsWith('combo')) return { ordered: true };
    return {};
}

// Best-effort HTML -> draft-text, used to seed the editor the first time
// someone edits AI-drafted markup rather than an existing plain-text
// submission. Round-trips structure back into the syntax _pcsRenderBody
// understands, so the first-time editor sees a working example of the
// syntax instead of a flattened wall of text:
//   - .combo-step-card -> "## Title | Card Name" + body (card name read from
//     the image's alt text if it already loaded, or the placeholder text if
//     not — either way it's the same name CardLoader was given originally).
//   - <li> items -> "- " lines; <p> -> its own paragraph. Walked together in
//     document order (not "if there's any <li>, treat everything as one
//     flat list") so a card shaped like intro-paragraph + numbered-combo +
//     result-paragraph keeps all three parts instead of silently losing the
//     paragraphs — that was a real bug caught on a card shaped exactly like
//     that (Branded's "Core Combo Lines").
function _pcsHtmlToDraft(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;

    const stepCards = tmp.querySelectorAll('.combo-step-card');
    if (stepCards.length) {
        return [...stepCards].map(card => {
            const title = card.querySelector('h3, h4')?.textContent.replace(/\s+/g, ' ').trim() || '';
            const body = card.querySelector('p')?.textContent.replace(/\s+/g, ' ').trim() || '';
            // Some pages give the image slot NEITHER a recognizable class NOR
            // any text — just an empty div with an id, populated entirely by
            // a separate id->name map elsewhere in the page's own <script>
            // that this function has no access to (e.g. Arcana Force's
            // <div id="light-barrier-img-container" class="w-32 ..."></div>).
            // IMAGE_CONTAINER_SELECTOR covers that id-suffix convention too.
            const imgContainer = card.querySelector(IMAGE_CONTAINER_SELECTOR);
            let cardName = imgContainer?.querySelector('img')?.alt
                || imgContainer?.textContent.replace(/\s+/g, ' ').trim()
                || '';
            const firstStrong = card.querySelector('p strong')?.textContent.replace(/\s+/g, ' ').trim() || '';
            if (!cardName) {
                // No placeholder text to go on at all — the body's first
                // bolded name is, in every observed case, the card this step
                // centers on ("Activate **Light Barrier**...", "Summon
                // **Arcana Force XIV - Temperance**...").
                cardName = firstStrong;
            } else if (firstStrong.length > cardName.length && firstStrong.toLowerCase().startsWith(cardName.toLowerCase())) {
                // The placeholder's own text is sometimes a shortened form of
                // the real card name (e.g. "Diamond Core" vs "Diamond Core of
                // Koa'ki Meiru") — CardLoader needs the real one to match.
                cardName = firstStrong;
            }
            return `${cardName ? `## ${title} | ${cardName}` : `## ${title}`}\n${body}`;
        }).join('\n\n');
    }

    const lines = [];
    (function walk(node) {
        for (const child of node.children) {
            const tag = child.tagName;
            if (tag === 'LI') {
                lines.push('- ' + child.textContent.replace(/\s+/g, ' ').trim());
            } else if (tag === 'P') {
                const text = child.textContent.replace(/\s+/g, ' ').trim();
                if (text) lines.push('', text, '');
            } else {
                walk(child); // recurse into UL/OL and generic wrapper divs alike
            }
        }
    })(tmp);

    const draft = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    return draft || tmp.textContent.replace(/\s+/g, ' ').trim();
}

function _pcsFormatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function _pcsSlugify(text) {
    return (text || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 60) || 'section';
}

// Collects the "body" of a card, given its heading. Two strategies,
// broadest-safe-option first:
//
// 1. Heading is a DIRECT CHILD of the card (common — h3/h4 right at the top
//    of a simple card): take every following sibling EXCEPT one that is or
//    contains a .card-image-container (art stays static, same as
//    everywhere else in this file) as the body, regardless of how many
//    paragraphs/lists it is or what they're wrapped in. This is what
//    correctly handles a card shaped like "intro paragraph + numbered combo
//    line + result paragraph" (Branded's "Core Combo Lines") without a
//    special case — it's a strict superset of the single-<p>/<ul> cards
//    this already handled.
// 2. Heading is nested deeper (e.g. inside an icon+title flex row, itself
//    inside another wrapper alongside the description — Branded's "Extra
//    Deck Toolbox" cards): fall back to the narrower rule — exactly one <p>
//    or exactly one <ul> anywhere in the card. Safer default when the
//    structure is less predictable; ambiguous shapes are skipped rather
//    than guessed at.
// [class*="..."] matches ANY class token containing that substring, not just
// an exact one — needed because "this is where a card image goes" shows up
// under at least four different conventions across pages: exact
// .card-image-container, bare .card-placeholder, size-suffixed variants like
// .card-image-container-sm (Slifer the Sky Dragon), and — when there's no
// recognizable class at all — an empty div identified only by an
// [id$="-img-container"] suffix (Arcana Force). All four are folded into one
// selector here so every caller gets all four for free instead of each
// needing its own patched-together list.
const IMAGE_CONTAINER_SELECTOR = '[class*="card-image-container"], [class*="card-placeholder"], [id$="-img-container"]';

function _pcsCollectBody(card, heading) {
    if (heading.parentElement === card) {
        const nodes = [];
        for (let n = heading.nextSibling; n; n = n.nextSibling) {
            if (n.nodeType === Node.ELEMENT_NODE) {
                // Two different naming conventions for "this is where a card
                // image goes" show up across pages (card-image-container on
                // Drytron/Azamina/Branded, bare card-placeholder on
                // Speedroid) — recognize both, or a page using the second
                // convention with the image AFTER the heading would get its
                // art wrapped into the editable text.
                if (n.matches(IMAGE_CONTAINER_SELECTOR) || n.querySelector(IMAGE_CONTAINER_SELECTOR)) continue;
                nodes.push(n);
            } else if (n.nodeType === Node.TEXT_NODE && n.textContent.trim()) {
                nodes.push(n);
            }
        }
        return nodes.length ? nodes : null;
    }

    const paras = card.querySelectorAll('p');
    const lists = card.querySelectorAll('ul');
    if (paras.length === 1 && lists.length === 0) return [paras[0]];
    if (lists.length === 1 && paras.length === 0) return [lists[0]];
    return null;
}

// Signature of a walkthrough STEP (as opposed to an independent description
// card): a small numbered circle badge near the heading — the "1", "2", "3"
// on Drytron's/Buster Blader's/Vision HERO's combo walkthroughs. A card
// carrying this is part of a sequence, not a standalone fact.
function _pcsIsSequenceStep(card) {
    return [...card.querySelectorAll('span')].some(span =>
        span.classList.contains('rounded-full') && /^\d{1,2}$/.test(span.textContent.trim())
    );
}

// Walks backward through document order (previous siblings at each ancestor
// level, then up) to find the nearest heading above el — used to name a
// discovered sequence after its actual title (e.g. "The Buster Lock
// Blueprint") instead of a generic placeholder. Matches h1-h4, not just
// h1/h2: some pages put multiple combo lines under one shared h2 (e.g.
// Snake-Eyes' "Foundational Combo Lines" containing both "One-Card Starter:
// Snake-Eye Ash" and "Alternative Starter: WANTED Engine" as their own h3s)
// — stopping at h1/h2 only would give both sequences the same generic name
// instead of their own specific one.
function _pcsFindPrecedingHeading(el) {
    for (let node = el; node; node = node.parentElement) {
        for (let sib = node.previousElementSibling; sib; sib = sib.previousElementSibling) {
            const h = sib.matches('h1, h2, h3, h4') ? sib : sib.querySelector('h1, h2, h3, h4');
            if (h) return h;
        }
    }
    return null;
}

// Groups numbered walkthrough steps that share a parent into ONE section
// (the whole parent container — steps, arrows, and all — moves in as a
// single unit, so its own flex/gap layout stays intact, same as the
// hand-wrapped Drytron/Azamina combo walkthroughs). Requires 2+ steps under
// the same parent before treating it as a real sequence — a single
// badge-carrying card on its own falls through to the per-card pass instead,
// in case the numbered-circle signature is a false positive.
function _pcsGroupSequences(reserveKey) {
    const stepsByParent = new Map();
    document.querySelectorAll('.combo-step-card').forEach(card => {
        if (card.closest('.cms-section')) return;
        if (!_pcsIsSequenceStep(card)) return;
        const parent = card.parentElement;
        if (!stepsByParent.has(parent)) stepsByParent.set(parent, []);
        stepsByParent.get(parent).push(card);
    });

    stepsByParent.forEach((steps, parent) => {
        if (steps.length < 2) return;
        const heading = _pcsFindPrecedingHeading(parent);
        const key = reserveKey('combo-', heading ? heading.textContent : 'walkthrough');

        // Mark `parent` itself as the section — do NOT wrap it in a new
        // outer div. Some pages (Abyss Actor's "Extras"/"Director"/"Shifter"
        // combo tabs) implement their own native tab switcher by toggling a
        // hide/show class (e.g. "active") directly on this exact element. A
        // new wrapper around it would put the toolbar/tab-family controls
        // OUTSIDE the element that class targets — the step cards correctly
        // hide when their tab is inactive, but the controls don't, because
        // they're not inside what the page's own CSS is hiding. Confirmed
        // as the cause of duplicated "Main Line"/"+ Add a combo" bars
        // stacking for every combo group at once regardless of which tab
        // was active. Reusing parent directly keeps the toolbar exactly as
        // subject to that class as the content it's attached to.
        parent.classList.add('cms-section');
        parent.dataset.sectionKey = key;
    });
}

// Auto-discovers blocks that were never hand-marked with class="cms-section"
// and wires them up the same as a manually-marked one, deriving a section
// key from the block's own heading (e.g. "Drytron Alpha Thuban" ->
// "card-drytron-alpha-thuban") instead of requiring someone to invent and
// hand-place a key. This is what makes rollout to more blocks/pages a
// one-line addition here rather than a markup edit on every page.
//
// Matches .card AND .combo-step-card (some pages only put the latter on
// inner description cards, without also carrying .card — Branded's "Primary
// Starters" cards are like this, Drytron's aren't; both need to match).
//
// Runs a grouping pass FIRST for numbered walkthrough sequences (see
// _pcsGroupSequences) so a step never gets caught individually by the
// per-card pass below it — narrative continuity across steps matters the
// same way it does for the hand-wrapped Drytron/Azamina combo walkthroughs;
// treating each step as its own independent block (which is exactly right
// for a "Core Engine"-style set of unrelated card descriptions) would be
// wrong here.
function _pcsAutoDiscoverBlocks() {
    const seenKeys = new Set();
    document.querySelectorAll('.cms-section[data-section-key]').forEach(el => seenKeys.add(el.dataset.sectionKey));

    function reserveKey(prefix, text) {
        let key = `${prefix}${_pcsSlugify(text)}`;
        let n = 2;
        while (seenKeys.has(key)) key = `${prefix}${_pcsSlugify(text)}-${n++}`;
        seenKeys.add(key);
        return key;
    }

    _pcsGroupSequences(reserveKey);

    document.querySelectorAll('.card, .combo-step-card').forEach(card => {
        if (card.classList.contains('cms-section')) return;
        if (card.closest('.cms-section')) return; // nested inside an already-handled section
        if (card.querySelector('.cms-section')) return; // contains one rather than being one
        // Anything with its own nested cards, tabs, or interactive controls
        // is a different shape that needs its own deliberate handling, not
        // a guess. This also naturally excludes grouping wrappers like the
        // outer "Core Engine" card, which contains further nested cards.
        if (card.querySelector('.card, .combo-step-card, .combo-tab-btn, button, input, textarea, select')) return;

        const heading = card.querySelector('h3, h4');
        if (!heading) return;

        const bodyNodes = _pcsCollectBody(card, heading);
        if (!bodyNodes) return;

        const key = reserveKey('card-', heading.textContent);

        // Wrap just the body, not the heading or any image container — same
        // convention as everywhere else: the card's title/art stays static,
        // only the explanatory text is editable.
        const wrapper = document.createElement('div');
        wrapper.className = 'cms-section';
        wrapper.dataset.sectionKey = key;
        bodyNodes[0].parentNode.insertBefore(wrapper, bodyNodes[0]);
        bodyNodes.forEach(node => wrapper.appendChild(node));
    });
}

async function initPageSections(archetypeName) {
    const client = window.Auth?._getClient?.();
    if (!client) return;

    _pcsAutoDiscoverBlocks();

    const containers = [...document.querySelectorAll('.cms-section[data-section-key]')];
    if (!containers.length) return;

    _pcsInjectStyle();

    const { data: archetypeRow } = await client
        .from('archetypes')
        .select('archetypeid')
        .ilike('archetypename', archetypeName)
        .single();
    if (!archetypeRow) return;
    const archetypeId = archetypeRow.archetypeid;

    const keys = containers.map(c => c.dataset.sectionKey);
    const { data: approvedRows } = await client
        .from('pagesections')
        .select('sectionid, sectionkey, body, createdon')
        .eq('archetypeid', archetypeId)
        .eq('status', 'approved')
        .in('sectionkey', keys);

    const approvedByKey = new Map((approvedRows || []).map(r => [r.sectionkey, r]));
    const session = await window.Auth.getSession();

    containers.forEach(container => _pcsSetupContainer(container, {
        client, archetypeId, session,
        approved: approvedByKey.get(container.dataset.sectionKey),
    }));
}

// Moves (not clones) host's existing children into a detached holder —
// CardLoader looks up its image containers by id and keeps a reference to
// that exact node across an async fetch, so relocating the live node instead
// of serializing/re-parsing it keeps any in-flight or already-completed
// image load working no matter how many times the pane switches between
// view/edit/history afterward. Returns null if there's nothing to move
// (used for combo tabs that only exist as an approved addition — no static
// fallback content to preserve).
//
// The holder also inherits host's OWN original classes (minus cms-section
// itself). This matters when host is an element that was reused in place
// rather than freshly created — _pcsGroupSequences marks an existing
// flex/gap-styled container as the section directly instead of wrapping it,
// so once toolbar+contentSlot become its only direct children, that
// flex/gap styling would otherwise apply to THEM instead of to the step
// cards it was meant for. Copying it onto the holder means the step cards
// get it back once the holder is reinserted into contentSlot.
//
// That class copy is also why a page like Abyss Actor's Extras/Director/
// Shifter combo tabs needs an extra safeguard: those combo containers are
// exactly the "reused in place" host described above, and the page's own
// switchCombo() shows/hides them by toggling a plain "active" class on
// `host` itself (looked up fresh by id every click). Once holder inherits
// host's full class list, it carries that SAME "active"-gated visibility
// class — but frozen at whatever state host happened to be in at extraction
// time, and never updated again once holder is a nested descendant (nothing
// re-applies "active" to it; switchCombo only ever touches elements it can
// find by id). Tabs that weren't active at setup end up with their content
// stuck invisible forever, regardless of which tab is actually selected. An
// inline style always wins over a class-based rule, so pin holder's display
// straight from host's own unconditional Tailwind "flex" utility (never
// itself a state class) — that neutralizes whatever the copied toggle class
// says, while an inactive ANCESTOR (the outer host, still hidden via that
// same class) correctly keeps the whole thing hidden regardless.
function _pcsExtractNodes(host) {
    if (!host.firstChild) return null;
    const holder = document.createElement('div');
    holder.className = host.className.replace(/\bcms-section\b/, '').trim();
    if (host.classList.contains('flex')) holder.style.display = 'flex';
    while (host.firstChild) holder.appendChild(host.firstChild);
    return holder;
}

// Builds one self-contained pane (toolbar + view/edit/history content)
// directly into `host`. This is the whole single-section experience used
// everywhere — a plain section calls it once; a combo-walkthrough's tab
// family (_pcsSetupComboFamily) calls it once per tab, each with its own key
// and its own ctx.approved, into a shared pane host that only one tab
// occupies at a time.
function _pcsBuildPane(host, key, ctx, style, originalSlot) {
    const originalHTML = originalSlot ? originalSlot.innerHTML : ''; // read-only snapshot — only used for draft-seeding text and the history view, never re-inserted as live content (see showOriginal() below)

    const toolbar = document.createElement('div');
    toolbar.className = style.ordered ? 'pcs-toolbar pcs-toolbar-center' : 'pcs-toolbar';
    const contentSlot = document.createElement('div');
    contentSlot.className = 'pcs-content';

    host.appendChild(toolbar);
    host.appendChild(contentSlot);

    function showOriginal() {
        contentSlot.innerHTML = '';
        if (originalSlot) contentSlot.appendChild(originalSlot); // re-attaches the SAME nodes, not a fresh copy
    }

    let mode = 'view'; // 'view' | 'edit' | 'history'

    function renderToolbar() {
        toolbar.innerHTML = `
            <button type="button" class="pcs-toolbar-link" id="pcs-edit-${key}">[${mode === 'edit' ? 'cancel' : 'suggest edit'}]</button>
            <button type="button" class="pcs-toolbar-link" id="pcs-hist-${key}">[${mode === 'history' ? 'close history' : 'history'}]</button>
            ${ctx.approved ? `<span class="pcs-toolbar-note">community version</span>` : ''}`;

        toolbar.querySelector(`#pcs-edit-${key}`).addEventListener('click', () => {
            mode = mode === 'edit' ? 'view' : 'edit';
            renderToolbar();
            renderContent();
        });
        toolbar.querySelector(`#pcs-hist-${key}`).addEventListener('click', () => {
            mode = mode === 'history' ? 'view' : 'history';
            renderToolbar();
            renderContent();
        });
    }

    function backToView() {
        mode = 'view';
        renderToolbar();
        renderContent();
    }

    async function renderContent() {
        if (mode === 'view') {
            if (ctx.approved) {
                const rendered = _pcsRenderBody(ctx.approved.body, style);
                contentSlot.innerHTML = rendered.html;
                _pcsLoadCardImages(rendered.cardMap);
            } else {
                showOriginal();
            }
        } else if (mode === 'edit') {
            await _pcsRenderEditor(contentSlot, ctx, originalHTML, key, style, backToView);
        } else if (mode === 'history') {
            await _pcsRenderHistory(contentSlot, ctx, key, style, originalHTML);
        }
    }

    renderToolbar();
    renderContent();
}

// Combo-walkthrough sections get a tab family instead of a single pane: the
// original content as "Main Line", plus any approved "add a combo"
// submissions (sectionkey LIKE '<primaryKey>-alt-%') as further tabs, plus a
// persistent "+ Add a combo" control. Each tab is a fully independent
// _pcsBuildPane — its own suggest-edit/history, its own moderation lifecycle
// — the tab bar just decides which one is visible.
// NOT async, deliberately: node extraction (_pcsExtractNodes) briefly
// detaches the original content from the live document, and re-attaching it
// (via renderActivePane -> _pcsBuildPane -> showOriginal) has to happen
// synchronously right after, with no `await` in between. A page's own
// static <script> block calls CardLoader.loadCards({...}) with its own
// timing (often after its own awaited fetches resolve) and looks its image
// containers up via document.getElementById, which can't find a detached
// node — if that lookup happens to land during the gap, the image silently
// fails with no retry. An earlier version awaited the alt-combo fetch
// before redisplaying the original content, which opened exactly that gap
// (confirmed on Labrynth's page, where the timing lined up wrong). Fetching
// the alt combos in the background AFTER the primary is already back on
// screen closes it — nothing here is ever detached across an await.
function _pcsSetupComboFamily(container, primaryKey, ctx, style) {
    const originalSlot = _pcsExtractNodes(container);

    const tabs = [{ key: primaryKey, label: 'Main Line', originalSlot, approved: ctx.approved }];

    const tabBar = document.createElement('div');
    tabBar.className = 'pcs-combo-tabbar';
    const paneHost = document.createElement('div');
    paneHost.className = 'pcs-content'; // shared textarea/preview/msg styling is scoped to this class — _pcsBuildPane's own contentSlot carries it too
    container.appendChild(tabBar);
    container.appendChild(paneHost);

    let activeIndex = 0;
    let addingNew = false;

    function renderTabBar() {
        tabBar.innerHTML = tabs.map((t, i) => {
            // Only the primary tab, and only while nobody's suggested edit
            // has been approved for it yet, is still purely AI-drafted —
            // alt combos are community-authored from the moment they exist,
            // and the moment Main Line gets an approved edit it's no longer
            // solely AI's work either. The badge reflects that automatically
            // via the same t.approved flag the toolbar itself already uses.
            const isAiDraft = i === 0 && !t.approved;
            const badge = isAiDraft ? '<i class="fas fa-robot pcs-tab-ai-icon"></i> ' : '';
            // title on the whole button, not just the icon — a 0.72rem glyph
            // is too small a target for a native tooltip's hover-and-hold to
            // reliably land on.
            const titleAttr = isAiDraft ? ' title="AI-drafted — not yet edited by a duelist"' : '';
            return `<button type="button" class="pcs-combo-tab${!addingNew && i === activeIndex ? ' active' : ''}" data-i="${i}"${titleAttr}>${badge}${window.escapeHtml(t.label)}</button>`;
        }).join('') + `<button type="button" class="pcs-combo-tab pcs-combo-tab-add${addingNew ? ' active' : ''}" id="pcs-combo-add-btn"><i class="fas fa-plus"></i> Add a combo</button>`;

        tabBar.querySelectorAll('.pcs-combo-tab[data-i]').forEach(btn => {
            btn.addEventListener('click', () => {
                activeIndex = parseInt(btn.dataset.i, 10);
                addingNew = false;
                renderTabBar();
                renderActivePane();
            });
        });
        tabBar.querySelector('#pcs-combo-add-btn').addEventListener('click', () => {
            addingNew = true;
            renderTabBar();
            renderActivePane();
        });
    }

    function renderActivePane() {
        paneHost.innerHTML = '';
        if (addingNew) {
            _pcsBuildNewComboForm(paneHost, primaryKey, ctx, style, () => {
                // A submission doesn't go live until approved, so there's no
                // new tab to show yet — just land back on Main Line.
                addingNew = false;
                activeIndex = 0;
                renderTabBar();
                renderActivePane();
            });
            return;
        }
        const tab = tabs[activeIndex];
        _pcsBuildPane(paneHost, tab.key, { ...ctx, approved: tab.approved }, style, tab.originalSlot);
    }

    renderTabBar();
    renderActivePane(); // synchronous — Main Line is back on screen before any network round-trip starts, closing the detached-node window entirely

    // Alt combos are a progressive enhancement, fetched only now that the
    // primary is safely redisplayed. Only touches the tab bar, never the
    // active pane, so it can't clobber an edit/history view the visitor
    // already switched into by the time this resolves.
    ctx.client
        .from('pagesections')
        .select('sectionid, sectionkey, title, body, createdon')
        .eq('archetypeid', ctx.archetypeId)
        .eq('status', 'approved')
        .like('sectionkey', `${primaryKey}-alt-%`)
        .then(({ data }) => {
            if (!data || !data.length) return;
            data.forEach(r => tabs.push({ key: r.sectionkey, label: r.title || 'Alternate Line', originalSlot: null, approved: r }));
            renderTabBar();
        });
}

function _pcsSetupContainer(container, ctx) {
    const sectionKey = container.dataset.sectionKey;
    const style = _pcsSectionStyle(sectionKey);

    if (style.ordered) {
        _pcsSetupComboFamily(container, sectionKey, ctx, style);
        return;
    }

    const originalSlot = _pcsExtractNodes(container);
    _pcsBuildPane(container, sectionKey, ctx, style, originalSlot);
}

async function _pcsRenderEditor(slot, ctx, originalHTML, sectionKey, style, onDone) {
    // Combo walkthroughs get the structured step-by-step editor instead of a
    // raw "## Title | Card Name" textarea — same underlying storage format
    // (_pcsStepsToText / _pcsParseSteps round-trip through it), just a form
    // instead of markup someone has to remember correctly.
    if (style.ordered) {
        const draft = ctx.approved ? ctx.approved.body : _pcsHtmlToDraft(originalHTML);
        let initialSteps = _pcsParseSteps(draft);
        // Draft wasn't in "## " format at all (e.g. an older submission made
        // via the plain textarea before this existed) — keep the text
        // instead of silently discarding it; it lands in one step's body,
        // editable and re-splittable from there.
        if (!initialSteps.length) initialSteps = [{ title: '', cardName: '', body: draft }];

        await _pcsRenderComboEditor(slot, ctx, {
            initialSteps,
            showTitleField: false,
            onCancel: onDone,
            onSubmit: async (steps, title, uid) => {
                const { error } = await ctx.client.from('pagesections').insert({
                    archetypeid: ctx.archetypeId,
                    sectionkey: sectionKey,
                    body: _pcsStepsToText(steps),
                    userid: ctx.session.user.id,
                });
                if (error) throw error;
                slot.innerHTML = `<p class="pcs-msg ok" style="display:block;"><i class="fas fa-check-circle"></i> Thanks — your suggested edit is in the review queue.</p>
                    <button type="button" class="pcs-cancel" id="pcs-combo-done-${uid}">Back</button>`;
                slot.querySelector(`#pcs-combo-done-${uid}`).addEventListener('click', onDone);
            },
        });
        return;
    }

    if (!ctx.session) {
        slot.innerHTML = `
            <p class="pcs-muted">Sign in to suggest an edit for this section.</p>
            <div class="pcs-login-btns">
                <button onclick="window.Auth.signInWithDiscord()"><i class="fab fa-discord"></i> Discord</button>
                <button onclick="window.Auth.signInWithGoogle()"><i class="fab fa-google"></i> Google</button>
            </div>
            <button type="button" class="pcs-cancel" id="pcs-cancel-${sectionKey}">Cancel</button>`;
        slot.querySelector(`#pcs-cancel-${sectionKey}`).addEventListener('click', onDone);
        return;
    }

    const draft = ctx.approved ? ctx.approved.body : _pcsHtmlToDraft(originalHTML);

    // Help text matches what the renderer actually does for this section, so
    // the instructions never promise styling it can't produce.
    const helpBits = [
        'Start a line with "- " for a bullet.',
        'Start a bullet with "Short Label:" and it\'s automatically bolded and colored, matching the rest of this list — no need to format it yourself.',
        '**bold** and [[Card Name]] (accent-highlighted) also work.',
        "A moderator reviews this before it goes live — approved suggestions replace what's shown here for everyone.",
    ];

    slot.innerHTML = `
        <p class="pcs-muted">${helpBits.join(' ')}</p>
        <p class="pcs-policy"><i class="fas fa-shield-alt"></i> Suggestions are reviewed for spam and vandalism only, not for whether the reviewer agrees with them — if you play this deck, you know it better than the page does. <a href="../pages/Contributing.html" target="_blank" rel="noopener">Full review policy &rarr;</a></p>
        <textarea id="pcs-body-${sectionKey}" rows="6" maxlength="4000">${window.escapeHtml(draft)}</textarea>
        <div class="pcs-preview-label">Preview</div>
        <div class="pcs-preview" id="pcs-preview-${sectionKey}"></div>
        <div class="pcs-actions">
            <button type="button" class="pcs-submit" id="pcs-submit-${sectionKey}">Submit suggestion</button>
            <button type="button" class="pcs-cancel" id="pcs-cancel-${sectionKey}">Cancel</button>
        </div>
        <div class="pcs-msg" id="pcs-msg-${sectionKey}" style="display:none;"></div>`;

    const textarea = slot.querySelector(`#pcs-body-${sectionKey}`);
    const preview = slot.querySelector(`#pcs-preview-${sectionKey}`);
    let imageLoadTimer = null;
    const updatePreview = () => {
        const rendered = _pcsRenderBody(textarea.value, style);
        preview.innerHTML = rendered.html;
        // Text formatting updates instantly, but card images hit the network
        // — debounce so typing a card name letter-by-letter doesn't fire a
        // fetch per keystroke.
        clearTimeout(imageLoadTimer);
        imageLoadTimer = setTimeout(() => _pcsLoadCardImages(rendered.cardMap), 500);
    };
    updatePreview();
    textarea.addEventListener('input', updatePreview);
    textarea.focus();

    slot.querySelector(`#pcs-cancel-${sectionKey}`).addEventListener('click', onDone);

    slot.querySelector(`#pcs-submit-${sectionKey}`).addEventListener('click', async () => {
        const body = textarea.value.trim();
        const msgEl = slot.querySelector(`#pcs-msg-${sectionKey}`);
        const showMsg = (text, cls) => {
            msgEl.textContent = text;
            msgEl.className = `pcs-msg ${cls}`;
            msgEl.style.display = '';
        };
        if (body.length < 10) {
            showMsg('Please write a bit more (10+ characters).', 'error');
            return;
        }

        const btn = slot.querySelector(`#pcs-submit-${sectionKey}`);
        btn.disabled = true;
        btn.textContent = 'Submitting…';

        try {
            const { error } = await ctx.client.from('pagesections').insert({
                archetypeid: ctx.archetypeId,
                sectionkey: sectionKey,
                body,
                userid: ctx.session.user.id,
            });
            if (error) throw error;
            slot.innerHTML = `<p class="pcs-msg ok" style="display:block;"><i class="fas fa-check-circle"></i> Thanks — your suggested edit is in the review queue.</p>
                <button type="button" class="pcs-cancel" id="pcs-done-${sectionKey}">Back</button>`;
            slot.querySelector(`#pcs-done-${sectionKey}`).addEventListener('click', onDone);
        } catch (e) {
            btn.disabled = false;
            btn.textContent = 'Submit suggestion';
            showMsg(e.message || 'Something went wrong submitting your suggestion.', 'error');
        }
    });
}

// The "+ Add a combo" form. Submitting inserts a NEW row under a fresh key
// ('<primaryKey>-alt-<slug of the name>') rather than the primary section's
// own key, so it can never compete with or overwrite the existing combo —
// it only starts showing up as a tab once a moderator approves it.
async function _pcsBuildNewComboForm(host, primaryKey, ctx, style, onDone) {
    await _pcsRenderComboEditor(host, ctx, {
        initialSteps: [{ title: '', cardName: '', body: '' }],
        showTitleField: true,
        onCancel: onDone,
        onSubmit: async (steps, title, uid) => {
            const key = `${primaryKey}-alt-${_pcsSlugify(title)}`;
            const { error } = await ctx.client.from('pagesections').insert({
                archetypeid: ctx.archetypeId,
                sectionkey: key,
                title,
                body: _pcsStepsToText(steps),
                userid: ctx.session.user.id,
            });
            if (error) throw error;
            host.innerHTML = `<p class="pcs-msg ok" style="display:block;"><i class="fas fa-check-circle"></i> Thanks — your new combo is in the review queue. It'll show up as its own tab once approved.</p>
                <button type="button" class="pcs-cancel" id="pcs-combo-done-${uid}">Back</button>`;
            host.querySelector(`#pcs-combo-done-${uid}`).addEventListener('click', onDone);
        },
    });
}

// Shared structured-editor shell used by both _pcsRenderEditor (editing an
// existing combo) and _pcsBuildNewComboForm (adding a new one). Handles
// sign-in gating, the optional "combo name" field (add-new only), the
// repeatable step list + live preview, and submit/cancel/validation — the
// caller only supplies the initial data and what an insert actually looks
// like (opts.onSubmit), since "replace this section" vs "add a fresh
// section" need different sectionkey/title handling.
let _pcsComboEditorUid = 0;

async function _pcsRenderComboEditor(host, ctx, opts) {
    // Every id here carries this suffix — host.querySelector calls would
    // work fine even with duplicate ids elsewhere in the document (they're
    // scoped to the subtree), but <label for="..."> resolves against the
    // WHOLE document, not just its own host — without this, two combo
    // sections opened for editing at once would both bind their label to
    // whichever "pcs-combo-title" appears first in the DOM.
    const uid = _pcsComboEditorUid++;

    if (!ctx.session) {
        host.innerHTML = `
            <p class="pcs-muted">Sign in to ${opts.showTitleField ? 'add a new combo' : 'suggest an edit'}.</p>
            <div class="pcs-login-btns">
                <button onclick="window.Auth.signInWithDiscord()"><i class="fab fa-discord"></i> Discord</button>
                <button onclick="window.Auth.signInWithGoogle()"><i class="fab fa-google"></i> Google</button>
            </div>
            <button type="button" class="pcs-cancel" id="pcs-combo-editor-cancel-${uid}">Cancel</button>`;
        host.querySelector(`#pcs-combo-editor-cancel-${uid}`).addEventListener('click', opts.onCancel);
        return;
    }

    const introText = opts.showTitleField
        ? "Add an alternate line — this doesn't replace the existing one, it becomes its own tab once approved."
        : "Editing this combo directly — approved suggestions replace what's shown here for everyone.";

    host.innerHTML = `
        <p class="pcs-muted">${introText} Fill in each step's title, card, and what happens — use "+ Add step" for more.</p>
        <p class="pcs-policy"><i class="fas fa-shield-alt"></i> Suggestions are reviewed for spam and vandalism only, not for whether the reviewer agrees with them — if you play this deck, you know it better than the page does. <a href="../pages/Contributing.html" target="_blank" rel="noopener">Full review policy &rarr;</a></p>
        ${opts.showTitleField ? `
        <label class="pcs-label" for="pcs-combo-title-${uid}">Combo name (shown as the tab label)</label>
        <input type="text" id="pcs-combo-title-${uid}" class="pcs-combo-title-input" maxlength="60" placeholder="e.g. Going Second Line">` : ''}
        <div id="pcs-steps-host-${uid}"></div>
        <div class="pcs-preview-label">Preview</div>
        <div class="pcs-preview" id="pcs-combo-preview-${uid}"></div>
        <div class="pcs-actions">
            <button type="button" class="pcs-submit" id="pcs-combo-submit-${uid}">Submit suggestion</button>
            <button type="button" class="pcs-cancel" id="pcs-combo-cancel-${uid}">Cancel</button>
        </div>
        <div class="pcs-msg" id="pcs-combo-msg-${uid}" style="display:none;"></div>`;

    const preview = host.querySelector(`#pcs-combo-preview-${uid}`);
    let imageLoadTimer = null;
    const stepsCtrl = _pcsBuildStepsEditor(host.querySelector(`#pcs-steps-host-${uid}`), opts.initialSteps, ctx, (steps) => {
        const rendered = _pcsRenderStepsHtml(steps);
        preview.innerHTML = rendered.html;
        clearTimeout(imageLoadTimer);
        imageLoadTimer = setTimeout(() => _pcsLoadCardImages(rendered.cardMap), 500);
    });

    host.querySelector(`#pcs-combo-cancel-${uid}`).addEventListener('click', opts.onCancel);

    const msgEl = host.querySelector(`#pcs-combo-msg-${uid}`);
    const showMsg = (text, cls) => {
        msgEl.textContent = text;
        msgEl.className = `pcs-msg ${cls}`;
        msgEl.style.display = '';
    };

    host.querySelector(`#pcs-combo-submit-${uid}`).addEventListener('click', async () => {
        const steps = stepsCtrl.getSteps()
            .map(s => ({ title: s.title.trim(), cardName: s.cardName.trim(), body: s.body.trim() }))
            .filter(s => s.title || s.body);
        if (!steps.length) {
            showMsg('Add at least one step.', 'error');
            return;
        }
        let title = '';
        if (opts.showTitleField) {
            title = host.querySelector(`#pcs-combo-title-${uid}`).value.trim();
            if (title.length < 3) {
                showMsg('Give this combo a short name (3+ characters).', 'error');
                return;
            }
        }

        const btn = host.querySelector(`#pcs-combo-submit-${uid}`);
        btn.disabled = true;
        btn.textContent = 'Submitting…';

        try {
            await opts.onSubmit(steps, title, uid);
        } catch (e) {
            btn.disabled = false;
            btn.textContent = 'Submit suggestion';
            showMsg(e.message || 'Something went wrong submitting your suggestion.', 'error');
        }
    });
}

// Repeatable step-by-step form: title / card name (with live autocomplete
// against the same `cards` table CardLoader itself reads from) / description
// per step, plus add/remove controls. Calls onChange(steps) on every field
// edit so the caller can keep a live preview in sync; returns { getSteps() }
// for the caller to read final state on submit.
function _pcsBuildStepsEditor(host, initialSteps, ctx, onChange) {
    const steps = (initialSteps && initialSteps.length ? initialSteps : [{ title: '', cardName: '', body: '' }])
        .map(s => ({ title: s.title || '', cardName: s.cardName || '', body: s.body || '' }));

    function emit() { onChange(steps); }

    function renderStep(step, i) {
        const wrap = document.createElement('div');
        wrap.className = 'pcs-step-editor';
        wrap.innerHTML = `
            <div class="pcs-step-editor-head">
                <span class="pcs-step-editor-num">${i + 1}</span>
                ${steps.length > 1 ? `<button type="button" class="pcs-step-remove" title="Remove step">&times;</button>` : ''}
            </div>
            <label class="pcs-label">Step title</label>
            <input type="text" class="pcs-step-title" maxlength="60" value="${window.escapeHtml(step.title)}" placeholder="e.g. Initiate the Search">
            <label class="pcs-label">Card name</label>
            <div class="pcs-cardname-wrap">
                <input type="text" class="pcs-step-cardname" maxlength="80" value="${window.escapeHtml(step.cardName)}" placeholder="e.g. Drytron Alpha Thuban" autocomplete="off">
                <span class="pcs-cardname-status"></span>
                <div class="pcs-cardname-suggestions"></div>
            </div>
            <label class="pcs-label">What happens in this step</label>
            <textarea class="pcs-step-body" rows="3" maxlength="600" placeholder="Activate ... to ...">${window.escapeHtml(step.body)}</textarea>`;

        wrap.querySelector('.pcs-step-title').addEventListener('input', e => { step.title = e.target.value; emit(); });
        wrap.querySelector('.pcs-step-body').addEventListener('input', e => { step.body = e.target.value; emit(); });

        const cardInput = wrap.querySelector('.pcs-step-cardname');
        const statusEl = wrap.querySelector('.pcs-cardname-status');
        const suggestEl = wrap.querySelector('.pcs-cardname-suggestions');
        let searchTimer = null;

        function setStatus(cls, glyph) {
            statusEl.className = `pcs-cardname-status${cls ? ' ' + cls : ''}`;
            statusEl.textContent = glyph || '';
        }

        cardInput.addEventListener('input', () => {
            step.cardName = cardInput.value;
            setStatus('', '');
            emit();
            clearTimeout(searchTimer);
            const q = cardInput.value.trim();
            if (q.length < 3) { suggestEl.innerHTML = ''; return; }
            searchTimer = setTimeout(async () => {
                const matches = await _pcsSearchCards(ctx.client, q);
                if (matches.some(m => m.toLowerCase() === q.toLowerCase())) {
                    setStatus('ok', '✓');
                    suggestEl.innerHTML = '';
                    return;
                }
                if (matches.length) {
                    setStatus('', '');
                    suggestEl.innerHTML = matches.map(m => `<div class="pcs-cardname-option">${window.escapeHtml(m)}</div>`).join('');
                    suggestEl.querySelectorAll('.pcs-cardname-option').forEach(opt => {
                        opt.addEventListener('mousedown', ev => {
                            ev.preventDefault(); // fires before the input's blur, so the click isn't lost
                            cardInput.value = opt.textContent;
                            step.cardName = opt.textContent;
                            setStatus('ok', '✓');
                            suggestEl.innerHTML = '';
                            emit();
                        });
                    });
                } else {
                    setStatus('warn', '?');
                    suggestEl.innerHTML = '';
                }
            }, 350);
        });
        cardInput.addEventListener('blur', () => {
            setTimeout(() => { suggestEl.innerHTML = ''; }, 200);
        });

        const removeBtn = wrap.querySelector('.pcs-step-remove');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                const idx = steps.indexOf(step);
                if (idx !== -1) steps.splice(idx, 1);
                renderAll();
                emit();
            });
        }

        return wrap;
    }

    function renderAll() {
        host.innerHTML = '';
        steps.forEach((step, i) => host.appendChild(renderStep(step, i)));
        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'pcs-step-add';
        addBtn.innerHTML = '<i class="fas fa-plus"></i> Add step';
        addBtn.addEventListener('click', () => {
            steps.push({ title: '', cardName: '', body: '' });
            renderAll();
            emit();
        });
        host.appendChild(addBtn);
    }

    renderAll();
    emit(); // paint the preview immediately, same as the old textarea editor's updatePreview() did on open — otherwise it stays blank until the first keystroke
    return { getSteps: () => steps };
}

async function _pcsRenderHistory(slot, ctx, sectionKey, style, originalHTML) {
    slot.innerHTML = `<p class="pcs-muted">Loading history…</p>`;

    const { data, error } = await ctx.client
        .from('pagesections')
        .select(`
            sectionid, body, status, createdon,
            profiles!pagesections_userid_fkey ( displayname )
        `)
        .eq('archetypeid', ctx.archetypeId)
        .eq('sectionkey', sectionKey)
        .in('status', ['approved', 'superseded'])
        .order('createdon', { ascending: false });

    if (error) {
        slot.innerHTML = `<p class="pcs-msg error" style="display:block;">Could not load history: ${window.escapeHtml(error.message)}</p>`;
        return;
    }

    const rows = data || [];
    const mergedCardMap = {};
    const rowsHtml = rows.map(r => {
        const rendered = _pcsRenderBody(r.body, style);
        Object.assign(mergedCardMap, rendered.cardMap);
        return `
        <div class="pcs-hist-item">
            <div class="pcs-hist-meta">
                <strong>${window.escapeHtml(r.profiles?.displayname || 'a duelist')}</strong> &middot; ${_pcsFormatDate(r.createdon)}
                ${r.status === 'approved' ? '<span class="pcs-hist-live">current</span>' : ''}
            </div>
            <div class="pcs-hist-body">${rendered.html}</div>
        </div>`;
    }).join('');

    slot.innerHTML = `
        ${rowsHtml || '<p class="pcs-muted">No community edits yet — still showing the original AI draft below.</p>'}
        <div class="pcs-hist-item">
            <div class="pcs-hist-meta"><strong>Original AI draft</strong>${rows.length ? '' : ' <span class="pcs-hist-live">current</span>'}</div>
            <div class="pcs-hist-body">${originalHTML}</div>
        </div>`;
    _pcsLoadCardImages(mergedCardMap);
}
