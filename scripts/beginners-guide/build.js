// Builds pages/Beginners-Guide.html from the files in this folder:
//   head.html    <head> with the page's base styles ({{STYLE}} and {{LD}} markers)
//   style.css    the rest of the page's styles (widgets, folding, finder, cheat sheet...)
//   body.html    the page body (<!--GLOSSARY--> marks where the glossary goes)
//   script.html  the page script
//   glossary.js  the 125 glossary words and their HTML
// Usage: node scripts/beginners-guide/build.js [output file]
// Edit these sources rather than the built page, then rebuild.
const fs = require('fs');
const path = require('path');
const glossary = require('./glossary.js');

const OUT = process.argv[2] || path.join(__dirname, '../../pages/Beginners-Guide.html');
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8').replace(/\r\n/g, '\n');
const must = (s, sub, what) => { if (!s.includes(sub)) throw new Error('missing: ' + what); return s; };

let head = read('head.html');
const css = read('style.css');
let body = read('body.html');
const script = read('script.html');
const frag = glossary.html;

// Function replacements: a "$" pattern in the inserted text must stay literal.
must(body, '<!--GLOSSARY-->\n', 'glossary marker');
body = body.replace('<!--GLOSSARY-->\n', () => frag);
const termCount = (frag.match(/<details class="term"/g) || []).length;
body = body.split('{{TERM_COUNT}}').join(String(termCount));
if (body.includes('{{')) throw new Error('unfilled placeholder');

head = must(head, '/*{{STYLE}}*/', 'style marker').replace('/*{{STYLE}}*/', () => css);

// Structured data, generated from the same glossary (one-line summaries) and FAQ the page shows.
const URL_ = 'https://archetypesnexus.com/pages/Beginners-Guide.html';
const decode = s => s.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&#39;|&rsquo;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const terms = [...frag.matchAll(/<details class="term" id="term-([^"]+)"[\s\S]*?<h4 class="term__name">([\s\S]*?)<\/h4>[\s\S]*?<span class="term__short">([\s\S]*?)<\/span>/g)]
    .map(m => ({ id: m[1], name: decode(m[2]), def: decode(m[3]) }));
if (terms.length !== termCount) throw new Error(`structured data found ${terms.length} of ${termCount} terms`);
const faqHtml = body.slice(body.indexOf('<section class="nb-section" id="faq">'), body.indexOf('</section>', body.indexOf('id="faq"')));
const faqs = [...faqHtml.matchAll(/<details>\s*<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g)]
    .map(m => ({ q: decode(m[1]), a: decode(m[2]) }));
if (faqs.length < 5) throw new Error('structured data found only ' + faqs.length + ' FAQ entries');
const ld = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'WebPage', '@id': URL_ + '#webpage', url: URL_,
            name: "Yu-Gi-Oh! Beginner's Guide: Jargon, Rules and Where to Start",
            description: 'Every piece of Yu-Gi-Oh! player jargon explained in plain English, plus the basic rules, your first deck and where to play.',
            inLanguage: 'en', datePublished: '2026-09-26', dateModified: '2026-10-05',
            image: 'https://archetypesnexus.com/assets/images/share/beginners-guide.jpg',
            isPartOf: { '@type': 'WebSite', name: 'Archetype Nexus', url: 'https://archetypesnexus.com/' },
            breadcrumb: {
                '@type': 'BreadcrumbList', itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Archetype Nexus', item: 'https://archetypesnexus.com/' },
                    { '@type': 'ListItem', position: 2, name: "Beginner's Guide", item: URL_ }
                ]
            }
        },
        {
            '@type': 'FAQPage', '@id': URL_ + '#faq', isPartOf: { '@id': URL_ + '#webpage' },
            mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
        },
        {
            '@type': 'DefinedTermSet', '@id': URL_ + '#glossary', name: 'Yu-Gi-Oh! player jargon glossary',
            isPartOf: { '@id': URL_ + '#webpage' },
            hasDefinedTerm: terms.map(t => ({ '@type': 'DefinedTerm', name: t.name, description: t.def, url: URL_ + '#term-' + t.id }))
        }
    ]
};
// "<" escaped so nothing in the text can close the script element early.
const ldTag = '    <script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>\n';
head = must(head, '<!--{{LD}}-->', 'ld marker').replace('<!--{{LD}}-->', () => ldTag);

const out = head + '\n\n' + body + '\n' + script;
fs.writeFileSync(OUT, out.replace(/\r?\n/g, '\r\n'));
console.log('written', path.relative(process.cwd(), OUT), '-', out.split('\n').length, 'lines,', Math.round(out.length / 1024), 'KB,', termCount, 'terms');
