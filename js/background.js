// Show page action when URL matches
function checkForValidUrl(tabId, changeInfo, tab) {
    if (tab.url.includes('yelp.com/user_details?')) {
        chrome.pageAction.show(tabId);
    }
};

// Listen for any changes to the URL of any tab.
chrome.tabs.onUpdated.addListener(checkForValidUrl);
