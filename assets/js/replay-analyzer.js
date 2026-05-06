/* ==========================================================================
   Replay Analyzer — Page Logic
   Extracted from pages/Replay-Analyzer.html
   ========================================================================== */

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const loadingState = document.getElementById('loadingState');
const errorMessage = document.getElementById('errorMessage');
const analysisContainer = document.getElementById('analysisContainer');

let chartInstance = null;
let tempoChartInstance = null;
let currentAnalysisData = null;
let currentReplayBrowser = null;

// Initialize CardLoader
document.addEventListener('DOMContentLoaded', () => {
    if (window.CardLoader) {
        window.CardLoader.init();
    }
});

// Drag and drop handlers
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
        handleFile(fileInput.files[0]);
    }
});

// Reset button
document.getElementById('resetBtn').addEventListener('click', () => {
    analysisContainer.classList.remove('visible');
    dropZone.style.display = 'block';
    errorMessage.style.display = 'none';
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
    if (tempoChartInstance) {
        tempoChartInstance.destroy();
        tempoChartInstance = null;
    }
    if (currentReplayBrowser) {
        currentReplayBrowser.destroy();
        currentReplayBrowser = null;
    }
    document.getElementById('replayBrowserSection').style.display = 'none';
    fileInput.value = '';
});

// Download button
document.getElementById('downloadBtn').addEventListener('click', () => {
    if (!currentAnalysisData) return;
    const blob = new Blob([JSON.stringify(currentAnalysisData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'replay-analysis.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

async function handleFile(file) {
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.yrpx')) {
        showError('Please upload a valid .yrpx or .yrpX replay file');
        return;
    }

    // Show loading state
    dropZone.style.display = 'none';
    loadingState.style.display = 'block';
    errorMessage.style.display = 'none';
    analysisContainer.classList.remove('visible');

    try {
        // Prepare headers based on contribution opt-in
        const headers = { 'Content-Type': 'application/octet-stream' };
        const contributeCheckbox = document.getElementById('contribute-checkbox');

        if (contributeCheckbox && contributeCheckbox.checked) {
            headers['x-save-replay'] = 'true';
            // Sanitize filename just in case, though backend usually handles it
            headers['x-filename'] = file.name;
        }

        // Using the specific API endpoint
        const response = await fetch('https://yrp-10714964039.europe-west1.run.app/analyze', {
            method: 'POST',
            headers: headers,
            body: file
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Analysis failed');
            throw new Error(errorText || 'Analysis failed');
        }

        const data = await response.json();
        console.log('Analysis data:', data);
        currentAnalysisData = data;
        await displayAnalysis(data);
    } catch (error) {
        console.error('Analysis error:', error);

        let msg = error.message;
        // "Failed to fetch" is the generic browser error for network/CORS issues
        // This happens if the backend doesn't whitelist x-save-replay header
        if (msg === 'Failed to fetch' || msg.includes('NetworkError')) {
            msg = 'Network or Server Error.<br><br>' +
                '<span style="font-size:0.9em; color:var(--text-muted)">' +
                'If "Share with community" is checked, unchecking it might fix CORS/Permission issues.<br>' +
                'Your backend may not allow the custom headers yet.</span>';
        }

        showError(msg);
        dropZone.style.display = 'block';
    } finally {
        loadingState.style.display = 'none';
    }
}

function showError(message) {
    errorMessage.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    errorMessage.style.display = 'block';
}

async function displayAnalysis(data) {
    const { resourceAnalysis, chainAnalysis, playerNames } = data;

    // Safety check for resourceAnalysis
    if (!resourceAnalysis || !resourceAnalysis.summary) {
        showError("Invalid analysis data returned from server (missing resource analysis).");
        return;
    }

    const { snapshots, summary } = resourceAnalysis;

    // Update player names
    const p1Name = playerNames?.[0] || 'Player 1';
    const p2Name = playerNames?.[1] || 'Player 2';

    if (playerNames && playerNames.length >= 2) {
        document.getElementById('player1Name').textContent = p1Name;
        document.getElementById('player2Name').textContent = p2Name;
    }

    // Update resource stats
    const peakAdvEl = document.getElementById('peakAdvantage');
    const peakValue = summary.peakAdvantagePlayer === 1 ? summary.maxDelta : summary.minDelta;
    peakAdvEl.textContent = peakValue >= 0 ? `+${peakValue}` : peakValue;
    peakAdvEl.className = `stat-value ${peakValue > 0 ? 'positive' : peakValue < 0 ? 'negative' : 'neutral'}`;

    const finalDeltaEl = document.getElementById('finalDelta');
    finalDeltaEl.textContent = summary.finalDelta >= 0 ? `+${summary.finalDelta}` : summary.finalDelta;
    finalDeltaEl.className = `stat-value ${summary.finalDelta > 0 ? 'positive' : summary.finalDelta < 0 ? 'negative' : 'neutral'}`;

    document.getElementById('totalTurns').textContent = snapshots ? snapshots.length : 0;

    // Update Chain Analysis
    updateChainAnalysis(chainAnalysis);

    // Update hand analysis (Brick Meter)
    if (data.handAnalysis) {
        const handCard = document.getElementById('handAnalysisCard');
        const { player1Hand, player2Hand } = data.handAnalysis;

        if (player1Hand || player2Hand) {
            handCard.style.display = 'block';

            // Helper to get verdict styling
            const getVerdictClass = (verdict) => {
                switch (verdict) {
                    case 'god_hand': return 'positive';
                    case 'good': return 'positive';
                    case 'average': return 'neutral';
                    case 'brick': return 'negative';
                    case 'unplayable': return 'negative';
                    default: return 'neutral';
                }
            };

            const getVerdictHTML = (verdict) => {
                const iconBase = '../assets/icons/replay-icons.svg';
                switch (verdict) {
                    case 'god_hand': return `<svg class="icon-verdict"><use href="${iconBase}#icon-godhand"></use></svg> GOD HAND`;
                    case 'good': return `<svg class="icon-verdict"><use href="${iconBase}#icon-good"></use></svg> Good`;
                    case 'average': return `<svg class="icon-verdict"><use href="${iconBase}#icon-average"></use></svg> Average`;
                    case 'brick': return `<svg class="icon-verdict"><use href="${iconBase}#icon-brick"></use></svg> BRICK`;
                    case 'unplayable': return `<svg class="icon-verdict"><use href="${iconBase}#icon-unplayable"></use></svg> Unplayable`;
                    default: return verdict;
                }
            };

            // Player 1 hand
            document.getElementById('p1HandName').textContent = p1Name;
            if (player1Hand) {
                const p1VerdictEl = document.getElementById('p1Verdict');
                p1VerdictEl.innerHTML = getVerdictHTML(player1Hand.verdict);
                p1VerdictEl.className = `stat-value ${getVerdictClass(player1Hand.verdict)}`;
                document.getElementById('p1VerdictText').textContent = player1Hand.verdictExplanation || 'No explanation';
                document.getElementById('p1QualityScore').textContent = `${player1Hand.handQualityScore}/100`;
                document.getElementById('p1HandTraps').textContent = player1Hand.handTrapsInHand;
                document.getElementById('p1Percentile').textContent = `${player1Hand.percentile}%`;

                // New Fields
                document.getElementById('p1Garnets').textContent = player1Hand.garnetsInHand || 0;
                document.getElementById('p1ArchetypeCards').textContent = player1Hand.archetypeCardsInHand ?? '-';
                document.getElementById('p1ArchetypeDensity').textContent = player1Hand.archetypeDensity !== undefined ? `${player1Hand.archetypeDensity}%` : '-';

                // Turn Order Label
                const p1TurnEl = document.getElementById('p1TurnLabel');
                p1TurnEl.textContent = player1Hand.isGoingFirst ? '1st' : '2nd';
                p1TurnEl.style.display = 'inline-block';

                // Archetypes List
                const p1Archetypes = player1Hand.archetypesIdentified;
                document.getElementById('p1Archetypes').textContent = p1Archetypes?.length > 0 ? `Deck: ${p1Archetypes.join(', ')}` : '';

                // Tag Statistics
                if (player1Hand.tagsAvailable !== false) {
                    document.getElementById('p1TagsContainer').style.display = 'flex';
                    document.getElementById('p1TagsUnavailable').style.display = 'none';
                    document.getElementById('p1Starters').textContent = player1Hand.startersInHand ?? 0;
                    document.getElementById('p1Extenders').textContent = player1Hand.extendersInHand ?? 0;
                    document.getElementById('p1Searchers').textContent = player1Hand.searchersInHand ?? 0;
                    document.getElementById('p1BoardBreakers').textContent = player1Hand.boardBreakersInHand ?? 0;

                    // Define cardsByTag first
                    const p1CardsByTag = player1Hand.cardsByTag || {};

                    // Bind events to main stats
                    bindTagHighlight('p1StarterStat', 'p1HandCards', getCardsForCategory('Starter', p1CardsByTag));
                    bindTagHighlight('p1ExtenderStat', 'p1HandCards', getCardsForCategory('Extender', p1CardsByTag));
                    bindTagHighlight('p1SearcherStat', 'p1HandCards', getCardsForCategory('Searcher', p1CardsByTag));
                    bindTagHighlight('p1BreakerStat', 'p1HandCards', getCardsForCategory('Board Breaker', p1CardsByTag));

                    // Render tag breakdown with CATEGORIES
                    const p1TagBreakdown = player1Hand.tagBreakdown || {};
                    renderCategorizedTags('p1TagBreakdown', p1TagBreakdown, p1CardsByTag, 'p1');
                } else {
                    document.getElementById('p1TagsContainer').style.display = 'none';
                    document.getElementById('p1TagsUnavailable').style.display = 'block';
                    document.getElementById('p1TagBreakdown').innerHTML = '';
                }

                // Render opening hand card images
                await renderHandCards('p1HandCards', player1Hand.openingHand);
            } else {
                // Clear if no data but card is shown
                document.getElementById('p1Verdict').textContent = '-';
                document.getElementById('p1HandCards').innerHTML = '';
            }

            // Player 2 hand
            document.getElementById('p2HandName').textContent = p2Name;
            if (player2Hand) {
                const p2VerdictEl = document.getElementById('p2Verdict');
                p2VerdictEl.innerHTML = getVerdictHTML(player2Hand.verdict);
                p2VerdictEl.className = `stat-value ${getVerdictClass(player2Hand.verdict)}`;
                document.getElementById('p2VerdictText').textContent = player2Hand.verdictExplanation || 'No explanation';
                document.getElementById('p2QualityScore').textContent = `${player2Hand.handQualityScore}/100`;
                document.getElementById('p2HandTraps').textContent = player2Hand.handTrapsInHand;
                document.getElementById('p2Percentile').textContent = `${player2Hand.percentile}%`;

                // New Fields
                document.getElementById('p2Garnets').textContent = player2Hand.garnetsInHand || 0;
                document.getElementById('p2ArchetypeCards').textContent = player2Hand.archetypeCardsInHand ?? '-';
                document.getElementById('p2ArchetypeDensity').textContent = player2Hand.archetypeDensity !== undefined ? `${player2Hand.archetypeDensity}%` : '-';

                // Turn Order Label
                const p2TurnEl = document.getElementById('p2TurnLabel');
                p2TurnEl.textContent = player2Hand.isGoingFirst ? '1st' : '2nd';
                p2TurnEl.style.display = 'inline-block';

                // Archetypes List
                const p2Archetypes = player2Hand.archetypesIdentified;
                document.getElementById('p2Archetypes').textContent = p2Archetypes?.length > 0 ? `Deck: ${p2Archetypes.join(', ')}` : '';

                // Tag Statistics
                if (player2Hand.tagsAvailable !== false) {
                    document.getElementById('p2TagsContainer').style.display = 'flex';
                    document.getElementById('p2TagsUnavailable').style.display = 'none';
                    document.getElementById('p2Starters').textContent = player2Hand.startersInHand ?? 0;
                    document.getElementById('p2Extenders').textContent = player2Hand.extendersInHand ?? 0;
                    document.getElementById('p2Searchers').textContent = player2Hand.searchersInHand ?? 0;
                    document.getElementById('p2BoardBreakers').textContent = player2Hand.boardBreakersInHand ?? 0;

                    // Define cardsByTag first
                    const p2CardsByTag = player2Hand.cardsByTag || {};

                    // Bind events to main stats
                    bindTagHighlight('p2StarterStat', 'p2HandCards', getCardsForCategory('Starter', p2CardsByTag));
                    bindTagHighlight('p2ExtenderStat', 'p2HandCards', getCardsForCategory('Extender', p2CardsByTag));
                    bindTagHighlight('p2SearcherStat', 'p2HandCards', getCardsForCategory('Searcher', p2CardsByTag));
                    bindTagHighlight('p2BreakerStat', 'p2HandCards', getCardsForCategory('Board Breaker', p2CardsByTag));

                    // Render tag breakdown with CATEGORIES
                    const p2TagBreakdown = player2Hand.tagBreakdown || {};
                    renderCategorizedTags('p2TagBreakdown', p2TagBreakdown, p2CardsByTag, 'p2');
                } else {
                    document.getElementById('p2TagsContainer').style.display = 'none';
                    document.getElementById('p2TagsUnavailable').style.display = 'block';
                    document.getElementById('p2TagBreakdown').innerHTML = '';
                }

                // Render opening hand card images
                await renderHandCards('p2HandCards', player2Hand.openingHand);
            } else {
                document.getElementById('p2Verdict').textContent = '-';
                document.getElementById('p2HandCards').innerHTML = '';
            }
        } else {
            handCard.style.display = 'none';
        }
    }

    // Update tempo & speed metrics
    if (data.tempoAnalysis) {
        const { summary, perTurnMetrics, winner } = data.tempoAnalysis;

        if (summary) {
            // Update summary stats
            document.getElementById('avgActionsPerTurn').textContent = summary.averageActionsPerTurn.toFixed(1);
            document.getElementById('maxActionsPerTurn').textContent = summary.maxActionsInSingleTurn;
            document.getElementById('totalSpecialSummons').textContent = summary.totalSpecialSummons;
            document.getElementById('totalEffectActivations').textContent = summary.totalEffectActivations;

            // Update Per-Player Tempo Stats
            if (summary.player1) {
                document.getElementById('p1TempoName').textContent = p1Name;
                document.getElementById('p1SpecialSummons').textContent = summary.player1.specialSummons || 0;
                document.getElementById('p1NormalSummons').textContent = summary.player1.normalSummons || 0;
                document.getElementById('p1EffectActivations').textContent = summary.player1.effectActivations || 0;
                document.getElementById('p1TotalActions').textContent = summary.player1.totalActions || 0;
            }
            if (summary.player2) {
                document.getElementById('p2TempoName').textContent = p2Name;
                document.getElementById('p2SpecialSummons').textContent = summary.player2.specialSummons || 0;
                document.getElementById('p2NormalSummons').textContent = summary.player2.normalSummons || 0;
                document.getElementById('p2EffectActivations').textContent = summary.player2.effectActivations || 0;
                document.getElementById('p2TotalActions').textContent = summary.player2.totalActions || 0;
            }
        }

        // Show winner info if available
        if (winner && winner.turnsToWin) {
            const winnerInfoEl = document.getElementById('winnerInfo');
            winnerInfoEl.style.display = 'block';
            document.getElementById('winnerName').textContent = winner.playerName;
            document.getElementById('winnerDetails').textContent = `Won in ${winner.turnsToWin} turn${winner.turnsToWin > 1 ? 's' : ''}`;

            if (winner.isOTK) {
                document.getElementById('otkBadge').style.display = 'block';
            } else {
                document.getElementById('otkBadge').style.display = 'none';
            }
        }

        // Create tempo chart
        createTempoChart(perTurnMetrics, playerNames);
    }

    // Display technical tags
    if (data.technicalTags && data.technicalTags.length > 0) {
        displayTechnicalTags(data.technicalTags);
    } else {
        document.getElementById('technicalTagsCard').style.display = 'none';
    }

    // Display deck lists
    if (data.decks && data.decks.length >= 2) {
        const deckListsCard = document.getElementById('deckListsCard');
        deckListsCard.style.display = 'block';

        document.getElementById('p1DeckTitle').textContent = `${p1Name}'s Deck`;
        document.getElementById('p2DeckTitle').textContent = `${p2Name}'s Deck`;

        const deck1 = data.decks[0];
        const deck2 = data.decks[1];

        // 1. Gather all unique IDs to fetch metadata for sorting
        const allCardIds = [
            ...(deck1.main || []),
            ...(deck1.extra || []),
            ...(deck2.main || []),
            ...(deck2.extra || [])
        ];

        // 2. Fetch metadata (async)
        if (allCardIds.length > 0) {
            await fetchCardMetadata(allCardIds);
        }

        // 3. Sort decks
        const p1MainSorted = sortCardsByType(deck1.main || [], false);
        const p1ExtraSorted = sortCardsByType(deck1.extra || [], true);
        const p2MainSorted = sortCardsByType(deck2.main || [], false);
        const p2ExtraSorted = sortCardsByType(deck2.extra || [], true);

        // Player 1 deck
        document.getElementById('p1MainDeckCount').textContent = deck1.main?.length || 0;
        document.getElementById('p1ExtraDeckCount').textContent = deck1.extra?.length || 0;
        renderDeckCards('p1MainDeck', p1MainSorted);
        renderDeckCards('p1ExtraDeck', p1ExtraSorted);

        // Player 2 deck
        document.getElementById('p2MainDeckCount').textContent = deck2.main?.length || 0;
        document.getElementById('p2ExtraDeckCount').textContent = deck2.extra?.length || 0;
        renderDeckCards('p2MainDeck', p2MainSorted);
        renderDeckCards('p2ExtraDeck', p2ExtraSorted);
    } else {
        document.getElementById('deckListsCard').style.display = 'none';
    }

    // Create Advantage chart
    createChart(snapshots, playerNames);

    // Replay Browser
    if (currentReplayBrowser) {
        currentReplayBrowser.destroy();
        currentReplayBrowser = null;
    }
    if (data.moveLog && data.moveLog.length > 0) {
        document.getElementById('replayBrowserSection').style.display = '';
        currentReplayBrowser = new ReplayBrowser('replayBrowserContainer', data.moveLog, [p1Name, p2Name]);
        currentReplayBrowser.buildUI();
        currentReplayBrowser.wireFullscreenButtons();
    } else {
        document.getElementById('replayBrowserSection').style.display = 'none';
    }

    // Show analysis container
    analysisContainer.classList.add('visible');
}

// Enhanced Technical Tags Display with Explanation
function displayTechnicalTags(tags) {
    const container = document.getElementById('technicalTagsContainer');
    const card = document.getElementById('technicalTagsCard');

    if (!tags || tags.length === 0) {
        card.style.display = 'none';
        return;
    }

    container.innerHTML = '';
    card.style.display = 'block';

    tags.forEach(tag => {
        const badge = document.createElement('div');
        badge.style.cssText = `
            display: inline-flex;
            align-items: center;
            padding: 0.5rem 0.75rem;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: help;
            background: ${getSeverityColor(tag.severity)};
            border: 1px solid ${getSeverityBorderColor(tag.severity)};
            transition: transform 0.2s;
        `;
        badge.onmouseenter = () => badge.style.transform = 'scale(1.05)';
        badge.onmouseleave = () => badge.style.transform = 'scale(1)';
        badge.title = `${tag.description}\nTurn ${tag.turn} - ${tag.playerName}`;

        const icon = getSeverityIcon(tag.severity);
        badge.innerHTML = `
            <span style="margin-right: 0.5rem;">${icon}</span>
            <span>${tag.name}</span>
            <span style="margin-left: 0.5rem; opacity: 0.7; font-size: 0.75rem;">T${tag.turn}</span>
        `;

        container.appendChild(badge);
    });

    // Dynamically build explanation
    buildTagExplanation(tags);
}

function buildTagExplanation(tags) {
    // Tag definitions with severity and description
    const tagDefinitions = {
        'Full Combo': { severity: 'info', description: '15+ uninterrupted actions' },
        'Turn 1 End Board': { severity: 'info', description: 'Strong opening setup (3+ monsters, 2+ set cards)' },
        'Resource Commitment': { severity: 'info', description: 'Heavy investment (10+ cards used)' },
        'Grind Game': { severity: 'info', description: 'Match lasted 10+ turns' },
        'Nibiru Check': { severity: 'warning', description: '5+ summons before Battle Phase (Nibiru vulnerable)' },
        'Overextension': { severity: 'warning', description: '8+ summons while opponent holds 3+ cards (board wipe risk)' },
        'Missed Lethal': { severity: 'critical', description: "Had enough ATK to win but didn't attack (game-losing mistake)" }
    };

    // Group tags by severity to only show relevant explanations
    const tagsBySeverity = {
        info: new Set(),
        warning: new Set(),
        critical: new Set()
    };

    tags.forEach(tag => {
        if (tagsBySeverity[tag.severity]) {
            tagsBySeverity[tag.severity].add(tag.name);
        }
    });

    // Build explanation HTML
    let explanationHTML = `
        <div style="margin-bottom: 0.75rem;">
            <strong style="color: var(--text-primary); font-size: 0.9rem;">About Technical Tags</strong>
        </div>
        <div style="margin-bottom: 0.5rem;">
            These tags automatically detect notable gameplay patterns. Hover to see specifics.
        </div>
        <div style="display: grid; gap: 0.5rem; margin-top: 1rem;">
    `;

    // Add Info tags if any found
    if (tagsBySeverity.info.size > 0) {
        explanationHTML += `
            <div>
                <span style="color: #38bdf8; font-weight: 600;">ℹ️ Info Tags</span> — Notable plays:
                <div style="margin-left: 1.5rem; margin-top: 0.25rem; line-height: 1.6;">
        `;
        tagsBySeverity.info.forEach(tagName => {
            const def = tagDefinitions[tagName];
            if (def) explanationHTML += `• <strong>${tagName}</strong>: ${def.description}<br>`;
        });
        explanationHTML += `</div></div>`;
    }

    // Add Warning tags if any found
    if (tagsBySeverity.warning.size > 0) {
        explanationHTML += `
            <div>
                <span style="color: #fbbf24; font-weight: 600;">⚠️ Warning Tags</span> — Risky plays:
                <div style="margin-left: 1.5rem; margin-top: 0.25rem; line-height: 1.6;">
        `;
        tagsBySeverity.warning.forEach(tagName => {
            const def = tagDefinitions[tagName];
            if (def) explanationHTML += `• <strong>${tagName}</strong>: ${def.description}<br>`;
        });
        explanationHTML += `</div></div>`;
    }

    // Add Critical tags if any found
    if (tagsBySeverity.critical.size > 0) {
        explanationHTML += `
            <div>
                <span style="color: #f87171; font-weight: 600;">🔥 Critical Tags</span> — Potential mistakes:
                <div style="margin-left: 1.5rem; margin-top: 0.25rem; line-height: 1.6;">
        `;
        tagsBySeverity.critical.forEach(tagName => {
            const def = tagDefinitions[tagName];
            if (def) explanationHTML += `• <strong>${tagName}</strong>: ${def.description}<br>`;
        });
        explanationHTML += `</div></div>`;
    }

    explanationHTML += `</div>`;

    // Update the explanation section
    const explanationSection = document.querySelector('#technicalTagsCard > div:last-child');
    if (explanationSection) {
        explanationSection.innerHTML = explanationHTML;
    }
}

function switchDeckTab(playerIndex) {
    const tabP1 = document.getElementById('tabP1');
    const tabP2 = document.getElementById('tabP2');
    const p1Container = document.getElementById('p1DeckContainer');
    const p2Container = document.getElementById('p2DeckContainer');

    if (playerIndex === 0) {
        // Show P1
        tabP1.classList.add('active');
        tabP2.classList.remove('active', 'active-p2');
        p1Container.style.display = 'block';
        p2Container.style.display = 'none';
    } else {
        // Show P2
        tabP1.classList.remove('active');
        tabP2.classList.add('active-p2'); // Use amber accent for P2
        p1Container.style.display = 'none';
        p2Container.style.display = 'block';
    }
}

// Cache for card metadata (type, race, level, etc.) to avoid repeated fetches
const cardMetadataCache = {};

// Passcode type helpers
function isOmegaCard(code) {
    const s = String(code);
    return s.length === 9 && (s.startsWith('511') || s.startsWith('810'));
}

const PLACEHOLDER_OMEGA = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 421 614'%3E%3Crect width='421' height='614' fill='%234338ca'/%3E%3Crect x='8' y='8' width='405' height='598' rx='6' fill='none' stroke='%23818cf8' stroke-width='6' stroke-dasharray='16,8'/%3E%3Ctext x='210' y='340' fill='%23c7d2fe' font-family='serif' font-size='240' text-anchor='middle' dominant-baseline='middle'%3E%CE%A9%3C/text%3E%3C/svg%3E";
const PLACEHOLDER_ALT_ART = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 421 614'%3E%3Crect width='421' height='614' fill='%231a1a2e'/%3E%3Ctext x='210' y='290' fill='%2394a3b8' font-family='Arial' font-size='22' text-anchor='middle'%3EAlt. Art%3C/text%3E%3Ctext x='210' y='325' fill='%2394a3b8' font-family='Arial' font-size='22' text-anchor='middle'%3E%2F No Image%3C/text%3E%3Ctext x='210' y='375' fill='%2364748b' font-family='Arial' font-size='16' text-anchor='middle'%3EOCG Only%3C/text%3E%3C/svg%3E";

function makeCardImage(code, altText) {
    const img = document.createElement('img');
    img.alt = altText || `Card ${code}`;
    img.loading = 'lazy';

    if (isOmegaCard(code)) {
        img.src = PLACEHOLDER_OMEGA;
        img.dataset.cardType = 'omega';
        return img;
    }

    const gcsUrl = `https://storage.googleapis.com/yugioh-card-images-archetype-nexus/cards/${code}.png`;
    const ygoUrl = cardMetadataCache[code]?.ygoImageUrl || `https://images.ygoprodeck.com/images/cards/${code}.jpg`;

    img.src = gcsUrl;
    img.onerror = function () {
        if (!this.dataset.fallback) {
            this.dataset.fallback = 'ygo';
            this.src = ygoUrl;
        } else {
            this.onerror = null;
            this.src = PLACEHOLDER_ALT_ART;
        }
    };
    return img;
}

// Fetch a list of IDs (single or batch) from YGOProDeck and store results.
// Returns true on success. On failure marks single-ID misses with null so
// they are not retried on subsequent calls.
async function fetchAndStoreCards(ids) {
    try {
        const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${ids.join(',')}`;
        const response = await fetch(url);
        if (!response.ok) {
            if (ids.length === 1) cardMetadataCache[ids[0]] = null;
            console.warn(`[DeckSort] API miss (${response.status}) for`, ids);
            return false;
        }
        const json = await response.json();
        if (json?.data) {
            json.data.forEach(card => {
                const meta = {
                    id: card.id,
                    name: card.name,
                    type: card.type,
                    race: card.race,
                    level: card.level,
                    rank: card.rank,
                    linkval: card.linkval,
                    atk: card.atk,
                    def: card.def,
                    desc: card.desc || "",
                    card_prices: card.card_prices,
                    card_sets: card.card_sets,
                    misc_info: card.misc_info,
                    ygoImageUrl: card.card_images?.[0]?.image_url || null
                };
                cardMetadataCache[card.id] = meta;

                // Index every art variant by its own passcode so alt art
                // passcodes resolve to the correct image URL directly
                if (card.card_images) {
                    card.card_images.forEach(variant => {
                        if (!(variant.id in cardMetadataCache)) {
                            cardMetadataCache[variant.id] = { ...meta, id: variant.id };
                        }
                        cardMetadataCache[variant.id].ygoImageUrl = variant.image_url;
                    });
                }

                if (window.CardLoader?.cardDataCache) {
                    window.CardLoader.cardDataCache[card.name] = cardMetadataCache[card.id];
                }
            });
        }
        return true;
    } catch (e) {
        console.error('[DeckSort] fetchAndStoreCards error', e);
        return false;
    }
}

async function fetchCardMetadata(cardIds) {
    // !(id in cardMetadataCache) treats null sentinels as "already tried, skip"
    const uniqueIds = [...new Set(cardIds)].filter(id => id > 0 && !isOmegaCard(id) && !(id in cardMetadataCache));
    if (uniqueIds.length === 0) return;

    const chunkSize = 20;
    console.log(`[DeckSort] Fetching metadata for ${uniqueIds.length} cards...`);

    for (let i = 0; i < uniqueIds.length; i += chunkSize) {
        const chunk = uniqueIds.slice(i, i + chunkSize);
        const ok = await fetchAndStoreCards(chunk);
        // YGOProDeck 400s the whole batch if any ID is unknown.
        // Retry individually so normal cards in the same chunk still get cached.
        if (!ok && chunk.length > 1) {
            for (const id of chunk) {
                if (!(id in cardMetadataCache)) {
                    await fetchAndStoreCards([id]);
                }
            }
        }
    }
}

function sortCardsByType(cardCodes, isExtraDeck = false) {
    return [...cardCodes].sort((a, b) => {
        const cardA = cardMetadataCache[a];
        const cardB = cardMetadataCache[b];

        // Move unknown cards to the end
        if (!cardA && !cardB) return a - b;
        if (!cardA) return 1;
        if (!cardB) return -1;

        if (isExtraDeck) {
            // Extra Deck Sort Order: Fusion > Synchro > Xyz > Link
            const typePriority = {
                'Fusion Monster': 1,
                'Synchro Monster': 2,
                'Synchro Tuner Monster': 2,
                'XYZ Monster': 3,
                'XYZ Pendulum Effect Monster': 3,
                'Link Monster': 4
            };

            const typeA = typePriority[cardA.type] || 99;
            const typeB = typePriority[cardB.type] || 99;

            if (typeA !== typeB) return typeA - typeB;

            // Secondary sort: Level/Rank/Link (High to Low)
            const levelA = cardA.level || cardA.rank || cardA.linkval || 0;
            const levelB = cardB.level || cardB.rank || cardB.linkval || 0;
            if (levelA !== levelB) return levelB - levelA;

        } else {
            // Main Deck Sort Order: Monster > Spell > Trap
            const getCategory = (type) => {
                if (type.includes('Spell')) return 2;
                if (type.includes('Trap')) return 3;
                if (type.includes('Monster')) return 1;
                return 4; // Unknown
            };

            const catA = getCategory(cardA.type);
            const catB = getCategory(cardB.type);

            if (catA !== catB) return catA - catB;

            // Within Monsters: Level High to Low
            if (catA === 1) {
                const levelA = cardA.level || 0;
                const levelB = cardB.level || 0;
                if (levelA !== levelB) return levelB - levelA;
            }
        }

        // Tiebreaker: Name
        return cardA.name.localeCompare(cardB.name);
    });
}

function renderDeckCards(containerId, cardCodes) {
    const container = document.getElementById(containerId);
    if (!container || !cardCodes || cardCodes.length === 0) {
        if (container) container.innerHTML = '<span style="color: var(--text-muted); font-size: 0.7rem;">No cards</span>';
        return;
    }
    container.innerHTML = '';

    cardCodes.forEach((code, index) => {
        if (!code || code <= 0) return;

        const uniqueId = `${containerId}-card-${index}-${code}`;
        const cardDiv = document.createElement('div');
        cardDiv.className = 'deck-card';
        cardDiv.id = uniqueId;

        // Use fetched metadata if available
        const cardData = cardMetadataCache[code];

        if (cardData && window.CardLoader) {
            // Optimized: Render directly using cached data
            const img = makeCardImage(code, cardData.name);
            img.className = 'yugioh-card';

            cardDiv.appendChild(img);
            cardDiv.style.cursor = 'pointer';

            const triggerPopup = (e) => {
                e.stopPropagation();
                if (window.CardLoader && window.CardLoader.cardDataCache) {
                    if (!window.CardLoader.cardDataCache[cardData.name]) {
                        window.CardLoader.cardDataCache[cardData.name] = cardData;
                    }
                    window.CardLoader.showPopup(e, cardData.name);
                }
            };

            cardDiv.addEventListener('click', triggerPopup);

        } else {
            // Fallback: no cached metadata
            const img = makeCardImage(code);
            cardDiv.appendChild(img);
        }

        container.appendChild(cardDiv);
    });
}

function getSeverityColor(severity) {
    switch (severity) {
        case 'info': return 'rgba(56, 189, 248, 0.15)';
        case 'warning': return 'rgba(251, 191, 36, 0.15)';
        case 'critical': return 'rgba(248, 113, 113, 0.15)';
        default: return 'rgba(148, 163, 184, 0.15)';
    }
}

function getSeverityBorderColor(severity) {
    switch (severity) {
        case 'info': return 'rgba(56, 189, 248, 0.3)';
        case 'warning': return 'rgba(251, 191, 36, 0.3)';
        case 'critical': return 'rgba(248, 113, 113, 0.3)';
        default: return 'rgba(148, 163, 184, 0.3)';
    }
}

function getSeverityIcon(severity) {
    switch (severity) {
        case 'info': return 'ℹ️';
        case 'warning': return '⚠️';
        case 'critical': return '🔥';
        default: return '❓';
    }
}

// Known hand traps for visual highlighting
const KNOWN_HAND_TRAPS = new Set([
    23434538,   // Ash Blossom & Joyous Spring
    14558127,   // Maxx "C"
    10045474,   // Infinite Impermanence
    59438930,   // Ghost Belle & Haunted Mansion
    73642296,   // Ghost Ogre & Snow Rabbit
    52038441,   // Effect Veiler
    15693423,   // Droll & Lock Bird
    94145021,   // D.D. Crow
    97268402,   // Nibiru, the Primal Being
    43898403,   // PSY-Framegear Gamma
    49036338,   // Artifact Lancea
    50078509,   // Ghost Mourner & Moonlit Chill
]);

function highlightHandCards(containerId, cardIds) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const cards = container.querySelectorAll('.hand-card');
    const targetIds = new Set(cardIds.map(Number));

    cards.forEach(card => {
        const cardId = Number(card.dataset.cardId);
        if (targetIds.has(cardId)) {
            card.classList.add('highlight');
            card.classList.remove('dim');
        } else {
            card.classList.add('dim');
            card.classList.remove('highlight');
        }
    });
}

function resetHandCards(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const cards = container.querySelectorAll('.hand-card');
    cards.forEach(card => {
        card.classList.remove('highlight', 'dim');
    });
}

// Helper to bind highlight events
function bindTagHighlight(elementId, containerId, cardIds) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.style.cursor = 'pointer';
    el.onmouseenter = () => highlightHandCards(containerId, cardIds);
    el.onmouseleave = () => resetHandCards(containerId);
}

function getCardsForCategory(category, cardsByTag) {
    let ids = new Set();

    // Mapping of UI Category -> Backend Tags
    const mappings = {
        'Starter': ['Starter'],
        'Extender': ['Extender'],
        'Searcher': ['Searcher', 'Search'],
        'Board Breaker': ['Board Breaker', 'Destruction', 'Removal', 'Banish', 'Kaiju', 'Lava Golem']
    };

    const targetTags = mappings[category] || [category];

    targetTags.forEach(tag => {
        if (cardsByTag[tag]) {
            cardsByTag[tag].forEach(id => ids.add(id));
        }
    });

    return Array.from(ids);
}

async function renderHandCards(containerId, cardCodes) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    if (!cardCodes || cardCodes.length === 0) {
        container.innerHTML = '<span style="color: var(--text-muted); font-size: 0.75rem;">No hand data available</span>';
        return;
    }

    // Fetch metadata for hand cards first (ensures popup has data)
    const validCodes = cardCodes.slice(0, 7).filter(code => code && code > 0);
    if (validCodes.length > 0) {
        await fetchCardMetadata(validCodes);
    }

    validCodes.forEach((code, index) => {
        const uniqueId = `${containerId}-card-${index}-${code}`;
        const cardDiv = document.createElement('div');
        cardDiv.className = 'hand-card';
        cardDiv.id = uniqueId;
        cardDiv.dataset.cardId = code;

        // Add hand-trap class for visual highlighting
        if (KNOWN_HAND_TRAPS.has(code)) {
            cardDiv.classList.add('hand-trap');
        }

        // Use fetched metadata if available
        const cardData = cardMetadataCache[code];

        const img = makeCardImage(code, cardData ? cardData.name : `Card ${code}`);
        cardDiv.appendChild(img);

        cardDiv.style.cursor = 'pointer';

        if (cardData && window.CardLoader) {
            const triggerPopup = (e) => {
                e.stopPropagation();
                if (window.CardLoader.cardDataCache) {
                    if (!window.CardLoader.cardDataCache[cardData.name]) {
                        window.CardLoader.cardDataCache[cardData.name] = cardData;
                    }
                    window.CardLoader.showPopup(e, cardData.name);
                }
            };
            cardDiv.addEventListener('click', triggerPopup);
        } else {
            cardDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                console.warn('Card data not available for popup. ID:', code);
            });
        }

        container.appendChild(cardDiv);
    });
}

// Render categorized tags with collapsible support
function renderCategorizedTags(containerId, tagBreakdown, cardsByTag, prefix) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!tagBreakdown || Object.keys(tagBreakdown).length === 0) {
        container.innerHTML = '';
        return;
    }

    // Get utils from CardLoader
    let utils = {};
    if (window.CardLoader && window.CardLoader._getUtils) {
        utils = window.CardLoader._getUtils();
    }

    // Fallbacks
    const KNOWN_CATEGORIES = utils.KNOWN_TAG_CATEGORIES || {};
    const CATEGORY_COLORS = utils.TAG_CATEGORY_COLORS || {};
    const PRIORITY = utils.CATEGORY_PRIORITY || {};

    // Group tags
    const grouped = {};
    Object.entries(tagBreakdown).forEach(([tag, count]) => {
        const cat = KNOWN_CATEGORIES[tag] || 'default';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push({ tag, count });
    });

    // Sort categories
    const sortedCategories = Object.keys(grouped).sort((a, b) => {
        const pA = PRIORITY[a] || 99;
        const pB = PRIORITY[b] || 99;
        return pA - pB;
    });

    // Build HTML
    let html = '';
    sortedCategories.forEach(cat => {
        const tags = grouped[cat].sort((a, b) => b.count - a.count);
        const colorData = CATEGORY_COLORS[cat] || CATEGORY_COLORS['default'] || { bg: 'bg-gray-700', text: 'text-gray-300', border: 'border-gray-600' };

        // Capitalize category name
        const catName = cat.charAt(0).toUpperCase() + cat.slice(1);

        // High priority categories open by default
        const isOpen = (PRIORITY[cat] || 99) <= 3 ? 'open' : '';

        html += `<details class="group mb-2 border border-white/5 rounded-lg bg-white/5 overflow-hidden transition-all duration-200" ${isOpen}>
            <summary class="flex items-center justify-between p-2 cursor-pointer select-none list-none text-[0.65rem] font-bold uppercase tracking-wider ${colorData.text} bg-black/20 hover:bg-black/40 transition-colors">
                <span class="flex items-center gap-2">
                    <span>${catName}</span>
                    <span class="bg-black/30 px-1.5 rounded text-[0.6rem] opacity-70 border border-white/5 shadow-inner">${tags.length}</span>
                </span>
                <i class="fas fa-chevron-down transform group-open:rotate-180 transition-transform duration-200 opacity-50 text-[0.6rem]"></i>
            </summary>
            <div class="flex flex-wrap gap-2 p-3 pt-2 bg-black/10 border-t border-white/5">`;

        tags.forEach(({ tag, count }) => {
            const cardIds = cardsByTag[tag] || [];
            const idsString = JSON.stringify(cardIds);

            html += `<div class="tag-pill ${colorData.bg} ${colorData.text} ${colorData.border} border border-opacity-40 hover:bg-opacity-30 cursor-help"
                    style="padding: 2px 8px; border-radius: 9999px; font-size: 0.75rem; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s;"
                    onmouseenter='highlightHandCards("${prefix}HandCards", ${idsString})'
                    onmouseleave='resetHandCards("${prefix}HandCards")'>
                    <span class="tag-name font-medium">${tag}</span>
                    <span class="tag-count opacity-75 text-[0.65rem] bg-black/20 px-1.5 py-0.5 rounded-full min-w-[1.2em] text-center shadow-sm">${count}</span>
                </div>`;
        });

        html += `</div></details>`;
    });

    container.innerHTML = html;
}

function createTempoChart(perTurnMetrics, playerNames) {
    const ctx = document.getElementById('tempoChart').getContext('2d');

    if (tempoChartInstance) {
        tempoChartInstance.destroy();
    }

    if (!perTurnMetrics || perTurnMetrics.length === 0) {
        return;
    }

    const p1Name = playerNames?.[0] || 'Player 1';
    const p2Name = playerNames?.[1] || 'Player 2';

    const labels = perTurnMetrics.map(t => `Turn ${t.turn}`);
    const p1TotalActions = perTurnMetrics.map(t => t.player1?.totalActions || 0);
    const p2TotalActions = perTurnMetrics.map(t => t.player2?.totalActions || 0);

    tempoChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: p1Name,
                    data: p1TotalActions,
                    backgroundColor: 'rgba(56, 189, 248, 0.8)',
                    borderColor: 'rgb(56, 189, 248)',
                    borderWidth: 2
                },
                {
                    label: p2Name,
                    data: p2TotalActions,
                    backgroundColor: 'rgba(244, 114, 182, 0.8)',
                    borderColor: 'rgb(244, 114, 182)',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8' }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#94a3b8' },
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Actions',
                        color: '#94a3b8'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#e2e8f0' },
                    position: 'top'
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#e2e8f0',
                    bodyColor: '#e2e8f0',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    callbacks: {
                        afterLabel: function (context) {
                            const index = context.dataIndex;
                            const turn = perTurnMetrics[index];
                            const isPlayer1 = context.datasetIndex === 0;
                            const playerData = isPlayer1 ? turn.player1 : turn.player2;

                            if (!playerData) return '';

                            const lines = [];
                            if (playerData.normalSummons > 0) lines.push(`NS: ${playerData.normalSummons}`);
                            if (playerData.specialSummons > 0) lines.push(`SS: ${playerData.specialSummons}`);
                            if (playerData.effectActivations > 0) lines.push(`FX: ${playerData.effectActivations}`);
                            return lines.join(', ');
                        }
                    }
                }
            }
        }
    });
}

const verticalLinePlugin = {
    id: 'verticalLine',
    afterDraw: chart => {
        if (chart.activeSnapshotIndex !== undefined && chart.activeSnapshotIndex >= 0) {
            const ctx = chart.ctx;
            const x = chart.scales.x.getPixelForValue(chart.activeSnapshotIndex);
            const topY = chart.scales.y.top;
            const bottomY = chart.scales.y.bottom;

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x, topY);
            ctx.lineTo(x, bottomY);
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.restore();
        }
    }
};

function updateChartHighlight(turn, phase) {
    if (!chartInstance || !currentAnalysisData?.resourceAnalysis?.snapshots) return;
    
    const snapshots = currentAnalysisData.resourceAnalysis.snapshots;
    let targetIndex = -1;
    
    const safePhase = phase ? String(phase).trim().toLowerCase() : '';
    
    // Find the exact matching snapshot
    for (let i = 0; i < snapshots.length; i++) {
        const s = snapshots[i];
        const sPhase = s.phase ? String(s.phase).trim().toLowerCase() : '';
        if (s.turn === turn && sPhase === safePhase) {
            targetIndex = i;
            break;
        }
    }

    // Fallback: If no exact phase match, just use the first/last snapshot of this turn
    if (targetIndex === -1 && turn !== undefined) {
        for (let i = 0; i < snapshots.length; i++) {
            if (snapshots[i].turn === turn) {
                targetIndex = i;
                // Keep searching to find the latest phase in this turn that is <= current state? 
                // Just breaking on the first one is fine as a fallback.
            }
        }
    }
    
    if (targetIndex !== -1 && chartInstance.activeSnapshotIndex !== targetIndex) {
        chartInstance.activeSnapshotIndex = targetIndex;
        chartInstance.update('none'); // Update without animation
    }
}

function createChart(snapshots, playerNames) {
    const ctx = document.getElementById('advantageChart').getContext('2d');

    if (chartInstance) {
        chartInstance.destroy();
    }

    if (!snapshots || snapshots.length === 0) return;

    // Prepare data
    const labels = snapshots.map(s => `T${s.turn} ${s.phase}`);
    const player1Data = snapshots.map(s => s.player1.total);
    const player2Data = snapshots.map(s => s.player2.total);
    const deltaData = snapshots.map(s => s.delta);

    chartInstance = new Chart(ctx, {
        type: 'line',
        plugins: [verticalLinePlugin],
        data: {
            labels,
            datasets: [
                {
                    label: playerNames?.[0] || 'Player 1',
                    data: player1Data,
                    borderColor: '#38bdf8',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: playerNames?.[1] || 'Player 2',
                    data: player2Data,
                    borderColor: '#f472b6',
                    backgroundColor: 'rgba(244, 114, 182, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Delta (P1 - P2)',
                    data: deltaData,
                    borderColor: '#a78bfa',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0.3,
                    pointRadius: 0,
                    yAxisID: 'delta'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            onClick: (e, activeElements) => {
                if (!activeElements || activeElements.length === 0 || !currentReplayBrowser) return;
                const index = activeElements[0].index;
                const snapshot = snapshots[index];
                if (!snapshot) return;

                // Jump the replay browser to the start of this turn/phase
                const targetTurn = snapshot.turn;
                const targetPhase = snapshot.phase;

                let targetStepIndex = -1;
                for (let i = 0; i < currentReplayBrowser.moveLog.length; i++) {
                    const step = currentReplayBrowser.moveLog[i];
                    if (step.turn === targetTurn && step.phase === targetPhase) {
                        targetStepIndex = i;
                        break;
                    }
                }

                if (targetStepIndex !== -1) {
                    if (currentReplayBrowser.isPlaying) currentReplayBrowser.togglePlay();
                    currentReplayBrowser._rebuildTo(targetStepIndex);
                    currentReplayBrowser.currentIndex = targetStepIndex;
                    // Auto-scroll to the replay browser for convenience
                    document.getElementById('replayBrowserSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#94a3b8',
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#e2e8f0',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function (context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            if (context.datasetIndex === 2) {
                                return `${label}: ${value >= 0 ? '+' : ''}${value}`;
                            }
                            return `${label}: ${value} cards`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: {
                        color: '#64748b',
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Total Resources (Hand + Field)',
                        color: '#94a3b8'
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#64748b' },
                    beginAtZero: true
                },
                delta: {
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Advantage Delta',
                        color: '#a78bfa'
                    },
                    grid: { drawOnChartArea: false },
                    ticks: { color: '#a78bfa' }
                }
            }
        }
    });
}

// Function to update Chain Analysis UI
function updateChainAnalysis(chainData) {
    const section = document.getElementById('chainAnalysisSection');

    if (!chainData || !chainData.summary) {
        section.classList.add('hidden');
        return;
    }

    const s = chainData.summary;

    // Show section
    section.classList.remove('hidden');

    // Match Stats
    document.getElementById('totalInteractions').textContent = s.totalInteractions || 0;
    document.getElementById('totalNegates').textContent = s.totalNegates || 0;
    document.getElementById('negateSuccessRate').textContent = (s.negateSuccessRate || 0) + '%';
    document.getElementById('baitsForced').textContent = s.baitsForced || 0;

    // Helper to render bars
    const renderBar = (idPrefix, val, max = 100) => {
        const elVal = document.getElementById(idPrefix + 'Val');
        const elBar = document.getElementById(idPrefix + 'Bar');
        if (elVal) elVal.textContent = (val || 0) + '%';
        if (elBar) elBar.style.width = Math.min(val || 0, 100) + '%';
    };

    // Player 1 Stats
    if (s.player1Stats) {
        const p1 = s.player1Stats;
        renderBar('p1DefEff', p1.defensiveEfficiency);
        renderBar('p1OffRes', p1.offensiveResilience);
        renderBar('p1ChainWin', p1.chainWinRate);
        document.getElementById('p1EffectsUsed').textContent = p1.effectsActivated || 0;
        document.getElementById('p1ChainsWon').textContent = p1.chainsWon || 0;
    }

    // Player 2 Stats
    if (s.player2Stats) {
        const p2 = s.player2Stats;
        renderBar('p2DefEff', p2.defensiveEfficiency);
        renderBar('p2OffRes', p2.offensiveResilience);
        renderBar('p2ChainWin', p2.chainWinRate);
        document.getElementById('p2EffectsUsed').textContent = p2.effectsActivated || 0;
        document.getElementById('p2ChainsWon').textContent = p2.chainsWon || 0;
    }
}
