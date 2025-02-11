chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension Installed");
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        console.log("Page loaded with URL:", changeInfo.url);
    }

    const domain = extractDomain(changeInfo.url);
    console.log("Domain:", domain);

    switch (domain) {
        case 'play.max.com':
            console.log("HBO Max");
            break;
        case 'www.netflix.com':
            console.log("Netflix");
            break;
        case 'www.crunchyroll.com':
            console.log("Crunchyroll");
            break;
        default:
            break;
    }
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