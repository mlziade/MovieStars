chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension Installed");
});

function handleTabUpdate(tabId, changeInfo, tab) {
    if (changeInfo.url) {
        processTab(tab);
    }
}

function handleTabActivated(activeInfo) {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        processTab(tab);
    });
}

function processTab(activeTab) {
    // Ensure we have a valid tab
    if (activeTab && activeTab.url) {
        const domain = extractDomain(activeTab.url);

        const url = activeTab.url;
        console.log("URL: " + url);

        switch (domain) {
            case 'play.max.com':
                console.log("HBO Max");
                if (url.includes('/show/')) {
                    const urlSplit = url.split('/');
                    const length = urlSplit.length;
                    // const seriesId = urlSplit[length - 1];
                    chrome.scripting.executeScript({
                        target: { tabId: activeTab.id },
                        func: () => {
                            const htmlContent = document.documentElement.innerHTML;
                            const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
                            const button = doc.querySelector('button[data-testid="myList_button"]');
                            return button ? button.getAttribute('aria-label') : null;
                        }
                    }, (results) => {
                        const seriesTitle = results && results[0] ? extractHboMaxNameFromButton(results[0].result) : null;
                        chrome.storage.local.set({ seriesTitle: seriesTitle }, () => { });
                        return seriesTitle;
                    });
                } else if (url.includes('/watch/')) {
                    chrome.scripting.executeScript({
                        target: { tabId: activeTab.id },
                        func: () => {
                            const htmlContent = document.documentElement.innerHTML;
                            const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
                            const titleElement = doc.querySelector('span[data-testid="player-ux-asset-title"]');
                            return titleElement ? titleElement.textContent.trim() : null;
                        }
                    }, (results) => {
                        const seriesTitle = results && results[0] ? results[0].result : null;
                        console.log("HBO Max seriesTitle: ", seriesTitle);
                        chrome.storage.local.set({ seriesTitle: seriesTitle }, () => { });
                        return seriesTitle;
                    });
                }
                break;
            case 'www.netflix.com':
                console.log("Netflix");
                chrome.storage.local.set({ seriesTitle: "" }, () => { });
                break;
            case 'www.crunchyroll.com':
                console.log("Crunchyroll");

                // Extract series from Crunchyroll series page
                if (url.includes('/series')) {
                    const urlSplit = url.split('/');
                    if (urlSplit.includes('series')) {
                        const length = urlSplit.length;
                        const normalizedTitle = normalizeNameCrunchyroll(urlSplit[length - 1]);
                        chrome.storage.local.set({ seriesTitle: normalizedTitle }, () => {
                            // console.log("Updated seriesTitle:", normalizedTitle);
                        });
                        return normalizedTitle;
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
                        if (results && results[0] && results[0].result) {
                            const normalizedTitle = normalizeNameCrunchyroll(results[0].result);
                            chrome.storage.local.set({ seriesTitle: normalizedTitle }, () => {
                                // console.log("Updated seriesTitle:", normalizedTitle);
                            });
                            return normalizedTitle;
                        }
                    });
                }
                break;
            default:
                chrome.storage.local.set({ seriesTitle: "" }, () => { });
                break;
        }
    }
    return;
}

chrome.tabs.onActivated.addListener(handleTabActivated);

chrome.tabs.onUpdated.addListener(handleTabUpdate);

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
    // console.log("Normalizing: " + name);
    return name
        .replace(/-/g, ' ') // Replace hyphens with spaces
        .replace(/\b\w/g, char => char.toUpperCase()) // Capitalize the first letter of each word
        .trim(); // Trim any leading/trailing spaces
}

function extractHboMaxNameFromButton(text) {
    return text.split('Adicionar ')[1].split(' aos Meus itens')[0];
}