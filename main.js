// Make an HTTP GET request, with a callback that takes in the responseText
function httpRequest(url, callback) {
    const request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) {
            callback(request.responseText);
        }
    }
    request.open('GET', url);
    request.send();
}

// Get element of entire HTML page from provided URL
function getDocFromHref(url, callback) {
    const request = new XMLHttpRequest();
    request.withCredentials = false;
    var httpResponseText;
    request.open('GET', url, false); // Make a synchronous request
    request.send();

    if (request.status == 200) {
        httpResponseText = request.responseText;
    } else {
        console.log('Got status code', request.status, 'from request!');
    }
    
    // Wrap raw HTML to a large div element to be parsed
    var wrapper = document.createElement('div');
    wrapper.innerHTML = httpResponseText;
    return wrapper;
}

// Get all the reviews from this user, as an array with elements: 0-biz name, 1-href
function getUserReviewsList() {
    var result = [];
    var reviewsPage = getReviewsPageElement();
    
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

    // Get reviews for current page
    result = result.concat(getUserReviewsSinglePage(reviewsPage));

    // Iterate next pages and do the same
    for (let i = 0; i < pageLinks.length; i++) {
        let reviewsPage = getDocFromHref(pageLinks[i]);
        result = result.concat(getUserReviewsSinglePage(reviewsPage));
    }
    
    // Verify by checking user's number of reviews
    var numReviews = parseInt(document.querySelector('.review-count strong').innerText);
    if (numReviews != result.length) {
        throw 'Length of result of getUserReviewsList() != user number of reviews';
    }

    console.log('getUserReviewsList() returning:', result);

    return result;
}

// Return page number where user's review is found, -1 otherwise (means not recommended)
function getPageNumberOfUserReview(businessHref, username, yelpingSince) {
    var pageNumber = -1; // Return value
    var currHref = businessHref + '?sort_by=date_desc'; // Sort reviews by newest first

    // Continue iterating until no 'next'
    var currPage = getDocFromHref(businessHref);
    var currPageNumber = 1;
    while (currPageNumber == 1 || currPage.querySelector('.next.pagination-links_anchor')) {
        currPage = getDocFromHref(businessHref);
        let usernames = getUserNamesFromReviewPage(currPage);
        console.log('For', currHref, 'got usernames:', usernames);

        // Found the username!
        if (usernames.includes(username)) {
            console.log('getPageNumberOfUserReview() - Found username!');
            pageNumber = currPageNumber;
            break;
        } else if (getDateOfBottomReview(currPage) < yelpingSince) {
            // Reached dates before this yelp account was created
            console.log('getPageNumberOfUserReview() - By date, reached last page.');
            break;
        }

        currHref = currPage.querySelector('.next').querySelector('a').getAttribute('href') + '?sort_by=date_desc';
        currPageNumber++;
    }

    console.log('getPageNumberOfUserReview() returning:', pageNumber);

    return pageNumber;
}

// The main function called to an array of reviews, each elem is: 0-business name, 1-business href, 2-page this user appears on
function getReviewsRanked() {
    // Get user's name to compare against alive reviews later
    var username = getUserName();

    // Get user's yelping since date to narrow down search time later
    var yelpingSince = getUserYelpingSince();

    // Get user's review pages as an array (each item is [name, href])
    var reviews = getUserReviewsList();

    // Check each business to see if user's review is in not recommended
    for (let i = 0; i < reviews.length; i++) {
        var pageNumber = getPageNumberOfUserReview(reviews[i][1], username, yelpingSince);
        reviews[i].push(pageNumber);
    }

    console.log('getReviewsRanked() returning:', reviews);
    return reviews;
}

function main() {
    console.log('Page loaded!');

    var reviews = getReviewsRanked();
}

window.onload = main;
