DEBUG = 1;


 //Make a fetch request and return Promise for 'div' element of entire page
function fetchPageRequest(url, callback) {
    DEBUG && console.log('fetchPageRequest called for url:', url);
    return fetch(url).then(function(response) {
        let text = response.text();
        return text;
    }).then(string => {
        // Wrap raw HTML to a large div element to be parsed
        var divWrapper = document.createElement('div');
        divWrapper.innerHTML = string;

        return divWrapper;
    }).catch(error => {
        console.log('fetchPageRequest error:', error)
    });
}


// Get all the reviews from this user
function getUserReviewsList(href) {
    DEBUG && console.log('getUserReviewsList() called for href =', href);
    return fetchPageRequest(href)
    .then(page => {
        let reviews = getUserReviewsSinglePage(page);

        try { // Could fail if only 1 review page
            let pageLinkElems = page.getElementsByClassName('pagination-links arrange_unit')[0].getElementsByClassName('arrange_unit');
            let nextLinkElem = pageLinkElems[pageLinkElems.length-1].getElementsByClassName('u-decoration-none')[0];

            if (!nextLinkElem) { // Base case, no more review pages
                DEBUG && console.log('getUserReviewsList() BC: no next');
                return reviews;
            } else {
                href = nextLinkElem.href;
                return getUserReviewsList(href).
                then(results => {
                    return reviews.concat(results);
                });
            }
        } catch(error) {
            DEBUG && console.log('getUserReviewsList() - error, returning reviews');
            return reviews;
        }
    });
}


// Get promise for a single business result (recursive)
function checkPageOfBizReview(bizName, href, pageNum, username, yelpingSince) {
    var promise = fetchPageRequest(href)
    .then(page => {
        let earliestDate = getDateOfBottomReview(page);
        let usernames = getUserNamesFromReviewPage(page);


        if (usernames.includes(username)) { // Base case: Success
            DEBUG && console.log('checkPageOfBizReview() - BC: Found username!');

            // Update numDone to show user progress in popup
            FINAL_RESULTS.numDone = FINAL_RESULTS.numDone + 1;
            chrome.runtime.sendMessage(FINAL_RESULTS);

            return {bizName: bizName, bizHref: href.split('?')[0], result: pageNum};
        } else if (usernames.length == 0 || earliestDate < yelpingSince) {
            // Base case: Failure (end of reviews, or earlier than possible)
            DEBUG && console.log('checkPageOfBizReview() - BC: Username not found');
            DEBUG && console.log('\tfor', href, 'got usernames:', usernames);
            DEBUG && console.log('\tearliestDate:', earliestDate);
            DEBUG && console.log('\tyelpingSince:', yelpingSince);

            // Update numDone to show user progress in popup
            FINAL_RESULTS.numDone = FINAL_RESULTS.numDone + 1;
            chrome.runtime.sendMessage(FINAL_RESULTS);

            return {bizName: bizName, bizHref: href.split('?')[0], result: -1};
        } else { // Try the next page
            href = href.split('?')[0];
            href = href + '?start=' + ((pageNum-1)*usernames.length).toString() + '&sort_by=date_desc';
            DEBUG && console.log('checkPageOfBizReview() - recursive, going to:', href);
            return checkPageOfBizReview(bizName, href, pageNum+1, username, yelpingSince);
        }
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
    DEBUG && console.log('Page loaded!');
    var startTime = performance.now();

    var username = getUserName();
    var yelpingSince = getUserYelpingSince();

    // Wait for results
    var expectedLength = getUserReviewCount();

    getUserReviewsList(getReviewsPageHref())
    .then(reviewsList => {
        DEBUG && console.log('main() - got reviewsList:', reviewsList);

        FINAL_RESULTS.numReviews = expectedLength;
        chrome.runtime.sendMessage(FINAL_RESULTS);

        //reviewsList.push({bizName:'Test', bizHref:'/biz/entropy-pittsburgh'});
        //reviewsList = [];
        //reviewsList.push({bizName:'Test', bizHref:'biz/m-and-ms-world-new-york'});

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
