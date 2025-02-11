chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension Installed");
});

chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (activeTab) => {
        // Ensure we have a valid tab
        if (activeTab && activeTab.url) {
            const domain = extractDomain(activeTab.url);
            // console.log("Domain: " + domain);

            switch (domain) {
                case 'play.max.com':
                    console.log("HBO Max");
                    break;
                case 'www.netflix.com':
                    console.log("Netflix");
                    break;
                case 'www.crunchyroll.com':
                    console.log("Crunchyroll");

                    const url = activeTab.url;
                    // console.log("URL: " + url);

                    // Extract series from Crunchyroll series page
                    if (url.includes('/series')) {
                        const urlSplit = url.split('/');
                        if (urlSplit.includes('series')) {
                            const length = urlSplit.length;
                            return normalizeNameCrunchyroll(urlSplit[length - 1]);
                        }
                        // Extract series from Crunchyroll watch page
                    } else if (url.includes('/watch')) {
                        // Run the extraction code in the tab context where DOMParser is defined.
                        chrome.scripting.executeScript({
                            target: { tabId: activeTab.id },
                            func: () => {
                                // console.log("Extracting series from /watch page");
                                const htmlContent = document.documentElement.innerHTML;
                                const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
                                const currentMediaParentRef = doc.querySelector("div.current-media-parent-ref");
                                const seriesTitle = currentMediaParentRef ? currentMediaParentRef.querySelector("a.show-title-link h4") : null;
                                return seriesTitle ? seriesTitle.textContent.trim() : null;
                            }
                        }, (results) => {
                            if (results && results[0]) {
                                // console.log("Series /watch: " + results[0].result);
                            }
                        });
                    }
                    break;
                default:
                    break;
            }
        }
    });
});

function extractDomain(url) {
    if (!url) return null;  // Handle undefined or null URLs

    if (url.startsWith('chrome://')) return 'chrome';  // Handle chrome URLs

    let domain;
    //find & remove protocol (http, ftp, etc.) and get domain
    if (url.indexOf("://") > -1) {
        domain = url.split('/')[2];
    } else {
        domain = url.split('/')[0];
    }

    //find & remove port number
    domain = domain.split(':')[0];

    return domain;
}

function normalizeNameCrunchyroll(name) {
    console.log("Normalizing: " + name);
    return name
        .replace(/-/g, ' ') // Replace hyphens with spaces
        .replace(/\b\w/g, char => char.toUpperCase()) // Capitalize the first letter of each word
        .trim(); // Trim any leading/trailing spaces
}