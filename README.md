# 🔮 Yu-Gi-Oh! Archetype Nexus

<div align="center">

[![Website](https://img.shields.io/badge/Live_Site-archetypesnexus.com-3b82f6?style=for-the-badge&logo=google-chrome&logoColor=white)](https://archetypesnexus.com/)
[![Weekly Data Update](https://img.shields.io/github/actions/workflow/status/jildertakkerman-cell/ArcheType-Nexus/weekly-data-update.yml?branch=main&label=Weekly%20Data%20Sync&style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/jildertakkerman-cell/ArcheType-Nexus/actions/workflows/weekly-data-update.yml)
[![Database](https://img.shields.io/badge/Database-500%2B%20Archetypes-8b5cf6?style=for-the-badge&logo=databricks&logoColor=white)](https://archetypesnexus.com/)
[![Discord](https://img.shields.io/badge/Community-Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.com/channels/1462487236233924731/)
[![License](https://img.shields.io/badge/License-ISC-10b981?style=for-the-badge)](LICENSE)

**The definitive database, strategy hub, and interactive toolkit for 500+ Yu-Gi-Oh! archetypes, combo paths, release timelines, and cross-engine synergies.**

[Explore Archetypes](https://archetypesnexus.com/) • [Beginner's Guide](https://archetypesnexus.com/pages/Beginners-Guide.html) • [Banlist & Genesys](https://archetypesnexus.com/pages/Banlist.html) • [Replay Tools](https://archetypesnexus.com/pages/Replay-Analyzer.html) • [Join Discord](https://discord.com/channels/1462487236233924731/)

</div>

---

## 📖 Overview

With over two decades of card releases across dozens of sets and formats, navigating Yu-Gi-Oh!'s expansive card pool is notoriously difficult. Whether tracking tier-1 meta engines (*Snake-Eye*, *Fiendsmith*, *Maliss*, *Branded*) or looking up legacy strategies (*Ancient Gear*, *Bujin*, *Crystal Beast*, *Toon*), players often have to stitch together information from disjointed wikis, tournament reports, and combo videos.

**Yu-Gi-Oh! Archetype Nexus** brings everything into a single, high-performance web platform:
- Detailed tactical breakdowns for over **500+ archetypes and series**.
- Release chronology tracking that surfaces **newest legacy support** waves.
- **Interactive combo diagrams**, sound cues, and community submissions.
- **Deck Dock** with curated decklists validated automatically against active banlists.
- **Replay analysis tools**, lore storytelling reels, and format trackers.

---

## ✨ Key Features

### 🗂️ 500+ Archetype & Series Breakdowns
Every archetype features an individual deep-dive page detailing:
- **Core Gameplan & Win Conditions**: How the deck wins, preferred turn-1 endboards, and turn-2 board-breaking strategy.
- **Starter & Extender Breakdown**: Detailed evaluations of primary normal summons, special summon extenders, searchers, and recursive resource loops.
- **TCG vs. OCG Nuances**: Important format differences, unreleased cards, and cross-format considerations.

### ⏱️ Multi-Dimensional Filtering & Timeline Search
- **Support (Newest)**: Identifies older archetypes that have recently picked up legacy support in the latest booster sets.
- **Release Date / Year**: Filter by debut era (from 2002 DM classics to modern Series 12 releases).
- **A-Z Index & Instant Search**: Real-time filtering across 500+ archetypes with zero latency.
- **Random Archetype**: Instant dice roll to explore forgotten archetypes and obscure series.

### ⚡ Interactive Combo Guide System
- **Step-by-Step Sequences**: Visual card-by-card breakdown of turn-1 openers.
- **Sound Effects & Cues**: Integrated audio feedback when stepping through combos.
- **Community Submissions**: Submit new combo routes or optimization lines directly on any archetype page via the integrated suggestion modal.

### 🃏 Deck Dock & Curated Test Decks
- **In-Browser Deck Drawer**: View and copy test decklists directly from archetype pages without opening third-party deck builders.
- **Automatic Extra Deck Packages**: Automatically pulls and assembles popular Extra Deck staples based on current weekly play trends.
- **Banlist Safety Checks**: All decklists are continuously validated by our automated pipeline against the current TCG/OCG banlist.

### 📜 Lore Reels & Atmospheric Music
- **Story Reels**: Cinematic, card-art-driven stories detailing the lore behind archetypes (*Duel Terminal*, *World Legacy*, *Branded/Abyss*, *Visas Starfrost*, etc.).
- **Dynamic Background Tracks**: Curated audio themes with smooth fades tailored to the mood of each lore universe.

### 📊 Competitive Tools & Replay Utilities
- **Replay Analyzer** (`pages/Replay-Analyzer.html`): Inspect YGOPro and Master Duel replays, analyze play frequency, disruption counts, and match timelines.
- **Replay-to-PDF Converter** (`pages/Replay-Converter.html`): Turn match replays into printable or shareable PDF play sheets.
- **My Replays & Accounts** (`pages/My-Replays.html`): Supabase-powered authentication for bookmarking followed archetypes and managing saved replays.

### ⚖️ Banlist & Genesys Format Tracker
- Real-time updates for official TCG and OCG Forbidden & Limited card lists.
- Integrated **Genesys Format** point values tracking deck construction limits.

### 🎓 Beginner's Guide & Jargon Dictionary
- Comprehensive onboarding for new and returning players: summoning mechanics (Fusion, Synchro, Xyz, Pendulum, Link), priority, timing, and competitive terminology (*hand traps*, *floodgates*, *one-card starters*, *board breakers*).

---

## 🏗️ Repository Structure

```
ArcheType-Nexus/
├── index.html                   # Main application entry point & search/filter UI
├── input.css                    # Tailwind CSS input directives
├── output.css                   # Compiled, production-ready stylesheet
├── netlify.toml                 # Netlify edge deployment rules, headers & redirects
├── package.json                 # Project dependencies & maintenance scripts
│
├── pages/                       # 500+ archetype analyses, tools, and guide pages
│   ├── Beginners-Guide.html     # Comprehensive player onboarding guide
│   ├── Banlist.html             # Live banlist viewer & Genesys format tracker
│   ├── Replay-Analyzer.html     # Replay file analyzer & statistics dashboard
│   ├── Replay-Converter.html    # Replay-to-PDF conversion tool
│   ├── My-Replays.html          # User account & saved replay dashboard
│   ├── Admin.html               # Administration portal
│   ├── Updates.html             # Platform news and patch timeline
│   └── [500+ Deck Analyses]    # Comprehensive archetype deep dives
│
├── assets/
│   ├── css/                     # Component stylesheets (styles.css, cookie-consent, etc.)
│   ├── js/                      # Modular client engines:
│   │   ├── card-loader.js       # Dynamic card hovering, tooltips & API integration
│   │   ├── card-browser.js      # Card database lookup interface
│   │   ├── combo-system.js      # Step-by-step combo sequence engine
│   │   ├── combo-sounds.js      # Interactive combo audio engine
│   │   ├── deck-dock.js         # Slide-out deck drawer component
│   │   ├── decklist.js          # Deck parsing, rendering & export utilities
│   │   ├── lore-reel.js         # Cinematic lore story visualizer
│   │   ├── lore-music.js        # Dynamic audio engine with smooth fades
│   │   ├── synergy-tags.js      # Cross-engine tag mapping
│   │   ├── auth.js              # Supabase authentication integration
│   │   └── replay-analyzer.js   # In-browser match replay parser
│   ├── data/                    # Central JSON data storage:
│   │   ├── banlist.json         # Current TCG & OCG banlists
│   │   ├── genesys_points.json  # Genesys format card point values
│   │   ├── decklists/           # Curated test deck JSON profiles
│   │   ├── combos/              # Archetype combo datasets
│   │   ├── glossary-hints.json  # In-text glossary tooltips
│   │   └── updates.json         # Changelog and feature update data
│   ├── icons/                   # Custom SVG archetype emblem icons
│   └── images/                  # Platform artwork, banners & previews
│
├── scripts/                     # Automation, validation & maintenance tooling
│   ├── update-genesys-points.js # Synchronizes banlist & Genesys points from API
│   ├── build-extra-packages.js  # Rebuilds Extra Deck packages based on weekly trends
│   ├── check-decklists.js       # Validates test decks against active banlists
│   ├── generate-sitemap.js      # Regenerates sitemap.xml for SEO indexing
│   └── smoke-test-pages.js      # Automated Playwright page smoke tests
│
├── .github/workflows/
│   └── weekly-data-update.yml   # Scheduled GitHub Actions automated data pipeline
│
└── docs/                        # Development history & refactoring documentation
    ├── README.md                # Documentation index
    ├── development/             # Technical architecture & optimization logs
    └── scripts-README.md        # Script documentation
```

---

## 🤖 Automated CI/CD Data Pipeline

Data stays fresh without manual intervention through our GitHub Actions workflow ([`.github/workflows/weekly-data-update.yml`](.github/workflows/weekly-data-update.yml)):

```mermaid
graph TD
    A[Schedule: Sundays at 03:00 UTC] --> B[Fetch Latest Banlist & Genesys Points]
    B --> C[Rebuild Extra Deck Packages from YGOProDeck trends]
    C --> D[Validate All Test Decks check-decklists.js]
    D --> E{Any Data Changes?}
    E -- Yes --> F[Commit Changes with [skip ci] & Rebase Push]
    E -- No --> G[No Action Needed]
```

1. **Banlist & Genesys Update** (`scripts/update-genesys-points.js`):
   - Queries the YGOPRODeck API v7 for the latest forbidden/limited status and Genesys point adjustments.
   - Automatically handles card aliases and regional title variations.
2. **Extra Deck Trend Analysis** (`scripts/build-extra-packages.js`):
   - Generates dynamic Extra Deck packages ordered by weekly popularity to keep "auto-fill" test decks aligned with the current meta.
3. **Decklist Sanity Check** (`scripts/check-decklists.js`):
   - Verifies card legality, card limits, deck sizes, and unreleased TCG cards across all test decks.
   - Generates an audit report (`assets/data/decklists/report.json`).
4. **Git Synchronization**:
   - Commits changes with `[skip ci]` and pushes back to `main`.

---

## 🚀 Getting Started & Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- `npm` (bundled with Node.js)

### Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/jildertakkerman-cell/ArcheType-Nexus.git
   cd ArcheType-Nexus
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Compile or watch styles (Tailwind CSS):**
   ```bash
   # Build minified production CSS:
   npm run build:css

   # Or watch for changes during development:
   npm run watch:css
   ```

4. **Serve the project locally:**
   Because Archetype Nexus is a modular static web application with client-side fetch calls for JSON data, serve it using any local web server:
   ```bash
   npx serve .
   # or with Python:
   python -m http.server 8080
   ```
   Open `http://localhost:3000` (or `http://localhost:8080`) in your browser.

---

## 🛠️ Maintenance & Pipeline Commands

| Command | Description |
| :--- | :--- |
| `npm run build:css` | Compiles `input.css` to `output.css` using Tailwind CSS with minification. |
| `npm run watch:css` | Watches HTML and JavaScript files for Tailwind class changes and rebuilds CSS on the fly. |
| `npm run update-data` | Runs `scripts/update-genesys-points.js` to refresh banlists and Genesys point data from YGOPRODeck. |
| `npm run build-packages` | Runs `scripts/build-extra-packages.js` to regenerate dynamic Extra Deck packages. |
| `npm run check-decks` | Runs `scripts/check-decklists.js` to validate all curated decklists against the banlist. |
| `node scripts/smoke-test-pages.js` | Runs headless browser smoke tests across archetype pages using Playwright. |
| `node scripts/generate-sitemap.js` | Rebuilds `sitemap.xml` for all pages. |

---

## 🔒 Security & Deployment

The application is deployed on [Netlify](https://www.netlify.com/) with high-security configuration in [`netlify.toml`](netlify.toml):
- **Security Headers**: Enforces strict `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection`, and `Referrer-Policy`.
- **Protected Routing**: Explicit 404 redirects block access to `.git`, environment files, `node_modules`, maintenance scripts (`scripts/`), and internal development folders (`dev/`, `word/`).
- **Cache Management**: Configured for instant invalidation on new asset deployments while caching static media.

---

## 🤝 Contributing

Contributions from the community are warmly welcome! Whether you are adding a missing archetype, expanding combo lines, or submitting an updated decklist:

1. Fork the repository and create your branch:
   ```bash
   git checkout -b feature/new-archetype
   ```
2. Make your additions following the structure of existing pages in `pages/`.
3. If modifying decklists in `assets/data/decklists/`, run validation:
   ```bash
   npm run check-decks
   ```
4. Commit your changes and open a Pull Request.

For detailed guidelines, see [`pages/Contributing.html`](pages/Contributing.html) or join our [Discord](https://discord.com/channels/1462487236233924731/).

---

## 📄 License & Disclaimer

- **License**: ISC License.
- **Disclaimer**: *Yu-Gi-Oh! Archetype Nexus* is an unofficial fan project and is not affiliated with, endorsed by, or sponsored by Konami Digital Entertainment, Shueisha, or Studio Dice. All Yu-Gi-Oh! card names, artwork, and trademarks belong to their respective copyright holders. Card data and images are powered by the [YGOPRODeck API](https://db.ygoprodeck.com/api-guide/).
