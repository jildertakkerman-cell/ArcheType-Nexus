/**
 * Cookie Consent Manager
 * Compatible with silktideCookieBannerManager API
 * Integrates with Google Analytics Consent Mode v2
 */

(function () {
    'use strict';

    const COOKIE_NAME = 'cookie_consent';
    const COOKIE_EXPIRY_DAYS = 365;

    // Default configuration
    let config = {
        background: {
            showBackground: true
        },
        cookieIcon: {
            position: 'bottomLeft'
        },
        cookieTypes: [],
        text: {
            banner: {
                description: '<p>We use cookies to enhance your experience.</p>',
                acceptAllButtonText: 'Accept all',
                acceptAllButtonAccessibleLabel: 'Accept all cookies',
                rejectNonEssentialButtonText: 'Reject non-essential',
                rejectNonEssentialButtonAccessibleLabel: 'Reject non-essential cookies',
                preferencesButtonText: 'Preferences',
                preferencesButtonAccessibleLabel: 'Toggle preferences'
            },
            preferences: {
                title: 'Cookie Preferences',
                description: '<p>Choose which cookies you want to accept.</p>',
                creditLinkText: 'Cookie Policy',
                creditLinkAccessibleLabel: 'View cookie policy'
            }
        }
    };

    // State
    let consentState = {};
    let bannerElement = null;
    let preferencesElement = null;
    let overlayElement = null;
    let iconButton = null;

    /**
     * Cookie utilities
     */
    function setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = 'expires=' + date.toUTCString();
        document.cookie = name + '=' + encodeURIComponent(JSON.stringify(value)) + ';' + expires + ';path=/;SameSite=Lax';
    }

    function getCookie(name) {
        const nameEQ = name + '=';
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i].trim();
            if (c.indexOf(nameEQ) === 0) {
                try {
                    return JSON.parse(decodeURIComponent(c.substring(nameEQ.length)));
                } catch (e) {
                    return null;
                }
            }
        }
        return null;
    }

    /**
     * Initialize default consent state for Google Analytics
     */
    function initializeDefaultConsent() {
        if (typeof gtag === 'function') {
            gtag('consent', 'default', {
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'analytics_storage': 'granted' // Analytics is required per config
            });
        }
    }

    /**
     * Create the cookie icon button
     */
    function createIconButton() {
        iconButton = document.createElement('button');
        iconButton.className = 'cc-icon-btn ' + config.cookieIcon.position;
        iconButton.setAttribute('aria-label', 'Cookie settings');
        iconButton.innerHTML = `
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
        `;
        iconButton.addEventListener('click', showBanner);
        document.body.appendChild(iconButton);
    }

    /**
     * Create the overlay
     */
    function createOverlay() {
        overlayElement = document.createElement('div');
        overlayElement.className = 'cc-overlay';
        overlayElement.addEventListener('click', function (e) {
            if (e.target === overlayElement && preferencesElement.classList.contains('visible')) {
                hidePreferences();
            }
        });
        document.body.appendChild(overlayElement);
    }

    /**
     * Create the main banner
     */
    function createBanner() {
        bannerElement = document.createElement('div');
        bannerElement.className = 'cc-banner';
        bannerElement.setAttribute('role', 'dialog');
        bannerElement.setAttribute('aria-label', 'Cookie consent');

        bannerElement.innerHTML = `
            <div class="cc-banner-inner">
                <div class="cc-banner-text">
                    ${config.text.banner.description}
                </div>
                <div class="cc-banner-buttons">
                    <button class="cc-btn cc-btn-primary cc-accept-all" aria-label="${config.text.banner.acceptAllButtonAccessibleLabel}">
                        ${config.text.banner.acceptAllButtonText}
                    </button>
                    <button class="cc-btn cc-btn-secondary cc-reject-nonessential" aria-label="${config.text.banner.rejectNonEssentialButtonAccessibleLabel}">
                        ${config.text.banner.rejectNonEssentialButtonText}
                    </button>
                    <button class="cc-btn cc-btn-link cc-show-preferences" aria-label="${config.text.banner.preferencesButtonAccessibleLabel}">
                        ${config.text.banner.preferencesButtonText}
                    </button>
                </div>
            </div>
        `;

        // Event listeners
        bannerElement.querySelector('.cc-accept-all').addEventListener('click', acceptAll);
        bannerElement.querySelector('.cc-reject-nonessential').addEventListener('click', rejectNonEssential);
        bannerElement.querySelector('.cc-show-preferences').addEventListener('click', showPreferences);

        document.body.appendChild(bannerElement);
    }

    /**
     * Create the preferences modal
     */
    function createPreferences() {
        preferencesElement = document.createElement('div');
        preferencesElement.className = 'cc-preferences';
        preferencesElement.setAttribute('role', 'dialog');
        preferencesElement.setAttribute('aria-label', 'Cookie preferences');

        let cookieTypesHTML = '';
        config.cookieTypes.forEach(type => {
            const isChecked = type.required || consentState[type.id];
            cookieTypesHTML += `
                <div class="cc-cookie-type" data-type-id="${type.id}">
                    <div class="cc-cookie-type-header">
                        <span class="cc-cookie-type-name">${type.name}</span>
                        <div style="display: flex; align-items: center;">
                            <label class="cc-toggle">
                                <input type="checkbox" 
                                       ${isChecked ? 'checked' : ''} 
                                       ${type.required ? 'disabled' : ''}
                                       data-cookie-type="${type.id}">
                                <span class="cc-toggle-slider"></span>
                            </label>
                            ${type.required ? '<span class="cc-toggle-required">Required</span>' : ''}
                        </div>
                    </div>
                    <div class="cc-cookie-type-description">${type.description}</div>
                </div>
            `;
        });

        preferencesElement.innerHTML = `
            <div class="cc-preferences-header">
                <h2 class="cc-preferences-title">${config.text.preferences.title}</h2>
                <div class="cc-preferences-description">${config.text.preferences.description}</div>
            </div>
            <div class="cc-preferences-body">
                ${cookieTypesHTML}
            </div>
            <div class="cc-preferences-footer">
                <a href="#" class="cc-credit-link" aria-label="${config.text.preferences.creditLinkAccessibleLabel}">
                    ${config.text.preferences.creditLinkText}
                </a>
                <div class="cc-preferences-actions">
                    <button class="cc-btn cc-btn-secondary cc-save-preferences">
                        Save preferences
                    </button>
                    <button class="cc-btn cc-btn-primary cc-accept-all-prefs">
                        Accept all
                    </button>
                </div>
            </div>
        `;

        preferencesElement.querySelector('.cc-save-preferences').addEventListener('click', savePreferences);
        preferencesElement.querySelector('.cc-accept-all-prefs').addEventListener('click', acceptAll);

        document.body.appendChild(preferencesElement);
    }

    /**
     * Show the banner
     */
    function showBanner() {
        if (bannerElement) {
            bannerElement.classList.add('visible');
            if (config.background.showBackground) {
                overlayElement.classList.add('visible');
            }
            iconButton.classList.remove('visible');
        }
    }

    /**
     * Hide the banner
     */
    function hideBanner() {
        if (bannerElement) {
            bannerElement.classList.remove('visible');
            overlayElement.classList.remove('visible');
            iconButton.classList.add('visible');
        }
    }

    /**
     * Show preferences modal
     */
    function showPreferences() {
        if (preferencesElement) {
            preferencesElement.classList.add('visible');
            overlayElement.classList.add('visible');
        }
    }

    /**
     * Hide preferences modal
     */
    function hidePreferences() {
        if (preferencesElement) {
            preferencesElement.classList.remove('visible');
            if (!bannerElement.classList.contains('visible')) {
                overlayElement.classList.remove('visible');
            }
        }
    }

    /**
     * Accept all cookies
     */
    function acceptAll() {
        config.cookieTypes.forEach(type => {
            consentState[type.id] = true;
            if (type.onAccept) {
                type.onAccept();
            }
        });

        setCookie(COOKIE_NAME, consentState, COOKIE_EXPIRY_DAYS);
        hideBanner();
        hidePreferences();
    }

    /**
     * Reject non-essential cookies
     */
    function rejectNonEssential() {
        config.cookieTypes.forEach(type => {
            if (type.required) {
                consentState[type.id] = true;
                if (type.onAccept) {
                    type.onAccept();
                }
            } else {
                consentState[type.id] = false;
                if (type.onReject) {
                    type.onReject();
                }
            }
        });

        setCookie(COOKIE_NAME, consentState, COOKIE_EXPIRY_DAYS);
        hideBanner();
        hidePreferences();
    }

    /**
     * Save preferences from modal
     */
    function savePreferences() {
        const checkboxes = preferencesElement.querySelectorAll('input[data-cookie-type]');

        checkboxes.forEach(checkbox => {
            const typeId = checkbox.dataset.cookieType;
            const type = config.cookieTypes.find(t => t.id === typeId);

            if (type) {
                if (checkbox.checked) {
                    consentState[typeId] = true;
                    if (type.onAccept) {
                        type.onAccept();
                    }
                } else {
                    consentState[typeId] = false;
                    if (type.onReject) {
                        type.onReject();
                    }
                }
            }
        });

        setCookie(COOKIE_NAME, consentState, COOKIE_EXPIRY_DAYS);
        hideBanner();
        hidePreferences();
    }

    /**
     * Check if consent has been given
     */
    function hasConsent() {
        return getCookie(COOKIE_NAME) !== null;
    }

    /**
     * Apply saved consent
     */
    function applySavedConsent() {
        const saved = getCookie(COOKIE_NAME);
        if (saved) {
            consentState = saved;
            config.cookieTypes.forEach(type => {
                if (consentState[type.id]) {
                    if (type.onAccept) {
                        type.onAccept();
                    }
                } else if (!type.required) {
                    if (type.onReject) {
                        type.onReject();
                    }
                }
            });
        }
    }

    /**
     * Initialize the consent manager
     */
    function init() {
        // Initialize default consent for GCM
        initializeDefaultConsent();

        // Create UI elements
        createOverlay();
        createBanner();
        createPreferences();
        createIconButton();

        // Check for existing consent
        if (hasConsent()) {
            applySavedConsent();
            iconButton.classList.add('visible');
        } else {
            // Show banner after a short delay
            setTimeout(showBanner, 500);
        }
    }

    /**
     * Update configuration
     */
    function updateConfig(newConfig) {
        // Deep merge configuration
        function deepMerge(target, source) {
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (!target[key]) target[key] = {};
                    deepMerge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
            return target;
        }

        deepMerge(config, newConfig);
    }

    // Expose the API globally (silktide-compatible)
    window.silktideCookieBannerManager = {
        updateCookieBannerConfig: function (newConfig) {
            updateConfig(newConfig);
        },
        showBanner: showBanner,
        hideBanner: hideBanner,
        showPreferences: showPreferences,
        hidePreferences: hidePreferences,
        hasConsent: hasConsent,
        getConsentState: function () { return consentState; }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // Small delay to allow config to be set
        setTimeout(init, 10);
    }
})();
