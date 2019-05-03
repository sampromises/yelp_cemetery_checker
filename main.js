// Make a fetch request and return Promise for 'div' element of entire page
function fetchPageRequest(url, callback) {
    console.log('fetchPageRequest called for url:', url);
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

// Get result for a single business (recursively)
function checkPageOfBizReview(bizName, href, pageNum, username, yelpingSince) {

    var promise = fetchPageRequest(href)
    .then(page => {
        let earliestDate = getDateOfBottomReview(page);
        let usernames = getUserNamesFromReviewPage(page);
        console.log('For', href, 'got usernames:', usernames);


        if (usernames.length == 0 || earliestDate > yelpingSince) { // Base case: Failure (end of reviews, or earlier than user yelping since)
            console.log('getPageNumberOfUserReview() - BC: Username not found');
            return {bizName: bizName, result: -1};
        } else if (usernames.includes(username)) { // Base case: Success
            console.log('getPageNumberOfUserReview() - BC: Found username!');
            return {bizName: bizName, result: pageNum};
        } else { // Try the next page
            href = href.split('?')[0];
            href = href + '?start=' + ((pageNum-1)*usernames.length).toString() + '&sort_by=date_desc';
            return checkPageOfBizReview(bizName, href, pageNum+1, username, yelpingSince);
        }
    });

    return promise;
}

// The main function called to an array of reviews, each elem is: 0-business name, 1-business href, 2-page this user appears on
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

function main() {
    console.log('Page loaded!');
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
        console.log('main() - got reviewsList:', reviewsList);

        //reviewsList = [];
        //reviewsList.push({bizName:'Test', bizHref:'/biz/crescent-kitchen-long-island-city'});

        // Check each review to see if user's review still exists
        return getReviewsRanked(reviewsList, username, yelpingSince);
    })
    .then(rankedReviews => {
        console.log('main() - Final result:', rankedReviews);

        var runTimeMs = performance.now() - startTime;
        console.log('Total main execution time (ms):', runTimeMs);
    });
}

window.onload = main;
