/**
 * Cookie Consent Configuration
 * This file configures the cookie banner for Archetype Nexus
 * Compatible with silktideCookieBannerManager API
 */

silktideCookieBannerManager.updateCookieBannerConfig({
    background: {
        showBackground: true
    },
    cookieIcon: {
        position: "bottomLeft"
    },
    cookieTypes: [
        {
            id: "necessary",
            name: "Necessary",
            description: "<p>These cookies are necessary for the website to function properly and cannot be switched off. They help with things like logging in and setting your privacy preferences.</p>",
            required: true,
            onAccept: function () {
                console.log('Necessary cookies accepted');
            }
        },
        {
            id: "analytics",
            name: "Analytics",
            description: "<p>These cookies help us improve the site by tracking which pages are most popular and how visitors move around the site.</p>",
            required: false,
            onAccept: function () {
                console.log('Analytics cookies accepted');
                if (typeof gtag === 'function') {
                    gtag('consent', 'update', {
                        'analytics_storage': 'granted'
                    });
                }
            },
            onReject: function () {
                if (typeof gtag === 'function') {
                    gtag('consent', 'update', {
                        'analytics_storage': 'denied'
                    });
                }
            }
        },
        {
            id: "advertising",
            name: "Advertising",
            description: "<p>These cookies provide extra features and personalization to improve your experience. They may be set by us or by partners whose services we use.</p>",
            required: false,
            onAccept: function () {
                if (typeof gtag === 'function') {
                    gtag('consent', 'update', {
                        'ad_storage': 'granted',
                        'ad_user_data': 'granted',
                        'ad_personalization': 'granted'
                    });
                }
                if (typeof dataLayer !== 'undefined') {
                    dataLayer.push({
                        'event': 'consent_accepted_advertising'
                    });
                }
            },
            onReject: function () {
                if (typeof gtag === 'function') {
                    gtag('consent', 'update', {
                        'ad_storage': 'denied',
                        'ad_user_data': 'denied',
                        'ad_personalization': 'denied'
                    });
                }
            }
        }
    ],
    text: {
        banner: {
            description: "<p>We use cookies on our site to enhance your user experience, provide personalized content, and analyze our traffic. <a href=\"https://archetypesnexus.com/cookie_policy.html\" target=\"_blank\">Cookie Policy.</a></p>",
            acceptAllButtonText: "Accept all",
            acceptAllButtonAccessibleLabel: "Accept all cookies",
            rejectNonEssentialButtonText: "Reject non-essential",
            rejectNonEssentialButtonAccessibleLabel: "Reject non-essential",
            preferencesButtonText: "Preferences",
            preferencesButtonAccessibleLabel: "Toggle preferences"
        },
        preferences: {
            title: "Customize your cookie preferences",
            description: "<p>We respect your right to privacy. You can choose not to allow some types of cookies. Your cookie preferences will apply across our website.</p>",
            creditLinkText: "Cookie Policy",
            creditLinkAccessibleLabel: "View our cookie policy"
        }
    }
});
