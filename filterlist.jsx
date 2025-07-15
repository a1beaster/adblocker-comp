import axios from 'axios';

// Example filter list (could be loaded from a file or URL)
const filterList = [
    'ads.example.com',
    'track.example.net',
    '/api/ads',
];

// Network interceptor for API-based ads
export function setupNetworkInterceptor(window, filterList) {
    if (!window.fetch) return;

    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const url = args[0];
        if (filterList.some(pattern => url.includes(pattern))) {
            // Block the request
            return Promise.resolve(new Response(null, { status: 403, statusText: 'Blocked by AdBlocker' }));
        }
        return originalFetch.apply(this, args);
    };
}

// DOM blocker for preloaded ads
export function blockAdElements(document, filterList) {
    filterList.forEach(pattern => {
        // Block by src attribute
        const adElements = document.querySelectorAll(`[src*="${pattern}"], [href*="${pattern}"]`);
        adElements.forEach(el => el.remove());

        // Block by id or class name
        const adContainers = document.querySelectorAll(`[id*="ad"], [class*="ad"]`);
        adContainers.forEach(el => el.remove());
    });
}

// Main function to load filter list and apply blocking
export async function initAdBlocker(window, document, filterListUrl, usesApiAds = false) {
    let filters = filterList;
    if (filterListUrl) {
        try {
            const res = await axios.get(filterListUrl);
            filters = res.data.split('\n').filter(Boolean);
        } catch (e) {
            // fallback to default filterList
        }
    }

    if (usesApiAds) {
        setupNetworkInterceptor(window, filters);
    } else {
        blockAdElements(document, filters);
        // Optionally, observe DOM changes for dynamically loaded ads
        const observer = new MutationObserver(() => blockAdElements(document, filters));
        observer.observe(document.body, { childList: true, subtree: true });
    }
}