DEBUG = 0;


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


// JSON of final results to send to popup.html
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
