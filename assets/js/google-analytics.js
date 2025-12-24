/**
 * Google Analytics (gtag.js) Module
 * Measurement ID: G-JPHE7Q4MVW
 * 
 * This script initializes Google Analytics tracking.
 * Include this file in the <head> section of your HTML pages.
 */

(function () {
    // Create and inject the async gtag.js script
    const gtagScript = document.createElement('script');
    gtagScript.async = true;
    gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-JPHE7Q4MVW';
    document.head.appendChild(gtagScript);

    // Initialize dataLayer and gtag function
    window.dataLayer = window.dataLayer || [];
    function gtag() {
        dataLayer.push(arguments);
    }
    window.gtag = gtag;

    // Initialize gtag with timestamp and config
    gtag('js', new Date());
    gtag('config', 'G-JPHE7Q4MVW');
})();
