// Make a fetch request and return Promise for 'div' element of entire page
function fetchPageRequest(url, callback) {
    return fetch(url).then(function(response) {
        let text = response.text();
        return text;
    }).then(function(string) {
        // Wrap raw HTML to a large div element to be parsed
        var divWrapper = document.createElement('div');
        divWrapper.innerHTML = string;

        return divWrapper;
    });
}

// Get all the reviews from this user, as an array with elements: 0-biz name, 1-href
function getUserReviewsList(reviewsPage) {
    // Get links to next pages of reviews
    var pageLinks = [];
    var pageLinkElems = reviewsPage.getElementsByClassName('arrange_unit page-option');
    for (let i = 0; i < pageLinkElems.length; i++) {
        let elem = pageLinkElems[i];

        // Skip over 'current'
        let classNames = elem.className.split(' ');
        if (classNames.includes('current')) continue;

        pageLinks.push(elem.getElementsByTagName('a')[0].getAttribute('href'));
    }

    // Return a list of promises
    var firstPageReviews = getUserReviewsSinglePage(reviewsPage);
    var firstPromise = Promise.resolve(firstPageReviews);
    var promises = [firstPromise];
    for (let i = 0; i < pageLinks.length; i++) {
        let promise = fetchPageRequest(pageLinks[i])
        .then(page => getUserReviewsSinglePage(page));

        promises.push(promise);
    }

    // Flatten all page result arrays into a single array
    return Promise.all(promises).then(arr => arr.flat());
}

// Get promise for a single business result (recursive)
function checkPageOfBizReview(bizName, href, pageNum, username, yelpingSince) {
    var promise = fetchPageRequest(href)
    .then(page => {
        let earliestDate = getDateOfBottomReview(page);
        let usernames = getUserNamesFromReviewPage(page);

        if (usernames.length == 0 || earliestDate > yelpingSince) {
            // Base case: Failure (end of reviews, or earlier than possible)
            return {bizName: bizName, bizHref: href.split('?')[0], result: -1};
        } else if (usernames.includes(username)) { // Base case: Success
            return {bizName: bizName, bizHref: href.split('?')[0], result: pageNum};
        } else { // Try the next page
            href = href.split('?')[0];
            href = href + '?start=' + ((pageNum-1)*usernames.length).toString() + '&sort_by=date_desc';
            return checkPageOfBizReview(bizName, href, pageNum+1, username, yelpingSince);
        }
    })
    .then(result => {
        // Update numDone to show user progress in popup
        FINAL_RESULTS.numDone = FINAL_RESULTS.numDone + 1;
        chrome.runtime.sendMessage(FINAL_RESULTS);

        return result;
    });

    return promise;
}

// The main function called to an array of reviews
function getReviewsRanked(reviews, username, yelpingSince) {
    var promises = [];

    // Check each business to see if user's review is in not recommended
    for (let i = 0; i < reviews.length; i++) {
        let bizName = reviews[i].bizName;
        let bizHref = reviews[i].bizHref + '?sort_by=date_desc';
        let promise = checkPageOfBizReview(bizName, bizHref, 1, username, yelpingSince);

        promises.push(promise);
    }

    return Promise.all(promises);
}

// Extract graveyarded reviews from results
function getGraveyardedReviews(rankedReviews) {
    var results = [];
    for (let i = 0; i < rankedReviews.length; i++) {
        let rankedReview = rankedReviews[i];
        if (rankedReview.result === -1) {
            results.push(rankedReview);
        }
    }
    return results;
}

function main() {
    var startTime = performance.now();

    var username = getUserName();
    var yelpingSince = getUserYelpingSince();

    // Wait for results
    var expectedLength = getUserReviewCount();

    // Fetch user's Reviews page
    fetchPageRequest(getReviewsPageHref())
    .then(reviewsPage => {
        // Get list of reviews (name, href) from reviews page
        return getUserReviewsList(reviewsPage);
    })
    .then(reviewsList => {
        FINAL_RESULTS.numReviews = expectedLength;
        chrome.runtime.sendMessage(FINAL_RESULTS);

        // Check each review to see if user's review still exists
        return getReviewsRanked(reviewsList, username, yelpingSince);
    })
    .then(rankedReviews => {
        var runTimeMs = performance.now() - startTime;

        var graveyardedReviews = getGraveyardedReviews(rankedReviews);

        FINAL_RESULTS.status = 'done';
        FINAL_RESULTS.data = graveyardedReviews;
        FINAL_RESULTS.time = runTimeMs;

        // Send results to the popup
        chrome.runtime.sendMessage(FINAL_RESULTS);
    });
}


var FINAL_RESULTS = {
    status: 'working',
    numDone: 0,
    numReviews: 0,
    data: null,
    time: null
};

// Start collect results immediately
window.onload = main;

// Give results if popup asks
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
    sendResponse(FINAL_RESULTS);
});
