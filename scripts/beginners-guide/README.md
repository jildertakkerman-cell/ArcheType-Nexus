# Beginner's Guide sources

`pages/Beginners-Guide.html` is built from the files in this folder. Edit these, then rebuild:

```
node scripts/beginners-guide/build.js
```

| File | What it holds |
| --- | --- |
| `head.html` | `<head>` and the page's base styles (`{{STYLE}}` and `{{LD}}` are filled in by the build) |
| `style.css` | Widget styles: field, quizzes, reading paths, deck finder, cheat sheet print view |
| `body.html` | The page body; `<!--GLOSSARY-->` marks where the glossary goes |
| `script.html` | The page script (all widgets) |
| `glossary.js` | The 125 glossary words, their one-line summaries and the glossary HTML |
| `build.js` | Puts the page together and adds the structured data (FAQ, glossary) |
| `combo-line.js` | Writes `assets/data/combos/beginners-guide-combos.json`, the annotated Swordsoul turn (also used by the Swordsoul page) |
| `share-image.js` | Renders `assets/images/share/beginners-guide.jpg` (needs Playwright) |
| `build-glossary-hints.js` | Writes `assets/data/glossary-hints.json` for the word hints on deck pages |

## Word hints on deck pages

`assets/js/glossary-hints.js` (loaded by `card-loader.js` on every `* Deck Analysis.html` page) underlines glossary words and shows their definition on hover, focus or tap. The list of words that may become hints is `FORMS` in `build-glossary-hints.js`; after changing it or the glossary, run:

```
node scripts/beginners-guide/build-glossary-hints.js
```

It runs on every deck page (`ALL_PAGES` in `glossary-hints.js`; set it to `false` to fall back to the `PILOT` list, which any deck page can still preview with `?hints=on`). Readers turn hints on and off with the "Aa Hints" button the script adds to the deck page dock, the "Hide word hints" button on the definition card, or the guide's glossary toolbar; the choice is stored in `localStorage` (`nexus-word-hints`).

## Tests

Playwright tests (they start their own local server):

```
node scripts/beginners-guide/tests/widgets.test.js
node scripts/beginners-guide/tests/reading-paths.test.js
node scripts/beginners-guide/tests/turn-finder-sheet.test.js
node scripts/beginners-guide/tests/quiz-banlist-cookie.test.js
node scripts/beginners-guide/tests/word-hints.test.js
```

Card facts on the page (banlist statuses, combo lines, deck finder blurbs) were checked against the YGOProDeck API; recheck them there when you change them.
