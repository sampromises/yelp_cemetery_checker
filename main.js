// Get element of entire HTML page from provided URL
function getDocFromHref(url) {
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

// Return whether current user profile page is the current user (i.e. logged in)
function isCurrentUser() {
    return Boolean(document.querySelector('.ysection.view-stats'));
}

// Get the user's name on this yelp page
function getUserName() {
    var name = document.querySelector('#wrap > div.main-content-wrap.main-content-wrap--full > div.top-shelf.top-shelf-grey > div > div.user-profile_container > div.user-profile_content-wrapper.arrange.arrange--bottom.arrange--30 > div.user-profile_info.arrange_unit > h1').innerHTML;

    if (name.includes('\"')) {
        var first_name = name.substring(0, name.indexOf(' '));
        var last_name = name.substring(name.lastIndexOf(' ')+1);
        name = first_name + ' ' + last_name;
    }

    console.log('getUserName() returning:', name);
    return name;
}

// Get the date that this user started Yelping
function getUserYelpingSince() {
    if (isCurrentUser()) {
        console.log('getUserYelpingSince() - is current user');
        var text = document.querySelector('#super-container > div > div.column.column-beta > div > div.user-details-overview_sidebar > div:nth-child(6) > ul > li:nth-child(2) > p').innerText;
    } else {
        console.log('getUserYelpingSince() - is not current user');
        var text = document.querySelector('#super-container > div > div.column.column-beta > div > div.user-details-overview_sidebar > div:nth-child(5) > ul > li:nth-child(2) > p').innerText;
    }
    console.log('getUserYelpingSince() found:', text);
    var date = Date.parse(text);
    return date;
}

// Get user's 'Reviews' page as a JS element
function getReviewsPageElement() {
    var href = document.querySelector('#super-container > div > div.column.column-alpha.user-details_sidebar > div > div > div.titled-nav_menus > div.titled-nav_menu > ul > li:nth-child(3) > a').getAttribute('href');

    console.log('href:', href);

    return getDocFromHref(href);
}

// Get a list (0 - name, 1 - href) of the user's reviews for a given reviews page doc
function getUserReviewsSinglePage(reviewsPageDoc) {
    // Get all reviews
    var reviewsElementList = reviewsPageDoc.getElementsByClassName('biz-name');
    var result = [];
    for (let i = 0; i < reviewsElementList.length; i++) {
        result.push([]);
        result[i].push(reviewsElementList[i].getElementsByTagName('span')[0].innerText);
        result[i].push(reviewsElementList[i].getAttribute('href'));
    }
    // console.log('getUserReviewsSinglePage returning', result);
    return result;
}

// Get all the reviews from this user, as an array with elements: 0-biz name, 1-href
function getUserReviews() {
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
        throw 'Length of result of getUserReviews() != user number of reviews';
    }

    console.log('getUserReviews() returning:', result);

    return result;
}

// Get a list of user names from this review page
function getUserNamesFromReviewPage(reviewPageDoc) {
    var reviewsElemList = reviewPageDoc.getElementsByClassName('reviews')[0];
    var userNamesElementList = reviewsElemList.getElementsByClassName('user-name');
    var result = [];
    for (let i = 0; i < userNamesElementList.length; i++) {
        result.push(userNamesElementList[i].innerText.trim());
    }
    return result;
}

// Get the date of the earliest review on this page (ASSUMED TO BE SORTED BY DATE DESCENDING)
function getDateOfBottomReview(page) {
    // Get the most-bottom review on this page (sorted by most recent, so bottom is earliest date)
    var reviews = page.querySelector('ul.ylist.ylist-bordered.reviews').querySelectorAll('.review');
    var lastReview = reviews[reviews.length-1];
    var earliestDate = Date.parse(lastReview.querySelector('.rating-qualifier').innerText);

    console.log('getDateOfBottomReview() returning', earliestDate);

    return earliestDate;
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
    var reviews = getUserReviews();

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

    var notRecommendedReviews = getReviewsRanked();
}

window.onload = main;
