/**
 * Google Analytics (gtag.js) Module with Consent Mode v2
 * Measurement ID: G-JPHE7Q4MVW
 * 
 * This script initializes Google Analytics tracking with GDPR-compliant consent mode.
 * Works in conjunction with the cookie consent banner.
 * Include this file in the <head> section of your HTML pages.
 */

(function () {
    // Initialize dataLayer and gtag function FIRST (before loading gtag.js)
    window.dataLayer = window.dataLayer || [];
    function gtag() {
        dataLayer.push(arguments);
    }
    window.gtag = gtag;

    // Set default consent state (denied until user accepts)
    // This MUST be called before loading gtag.js
    gtag('consent', 'default', {
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied',
        'analytics_storage': 'granted', // Analytics is marked as required in config
        'wait_for_update': 500 // Wait for consent banner to load
    });

    // Create and inject the async gtag.js script
    const gtagScript = document.createElement('script');
    gtagScript.async = true;
    gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-JPHE7Q4MVW';
    document.head.appendChild(gtagScript);

    // Initialize gtag with timestamp and config
    gtag('js', new Date());
    gtag('config', 'G-JPHE7Q4MVW', {
        'anonymize_ip': true // Additional privacy protection
    });
})();
