// UNUSED - Return whether current user profile page is the current user (i.e. logged in)
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

    DEBUG && console.log('getUserName() returning:', name);
    return name;
}

// Get the date that this user started Yelping
function getUserYelpingSince() {
    var rawLines = document.documentElement.innerHTML.split('\n');
    var index = rawLines.indexOf('            <h4>Yelping Since</h4>') + 1;

    var dateText = rawLines[index].trim();
    dateText = dateText.substring(3, dateText.length);
    dateText = dateText.substring(0, dateText.indexOf('<'));

    DEBUG && console.log('getUserYelpingSince() found:', dateText);
    return Date.parse(dateText);
}

// Get how many reviews this user has
function getUserReviewCount() {
    var numReviews = parseInt(document.querySelector('.review-count strong').innerText);
    return numReviews;
}

// Get user's 'Reviews' page as a JS element
function getReviewsPageHref() {
    var url = document.URL;
    var userId = url.substring(url.indexOf('?userid'), url.length);

    return '/user_details_reviews_self' + userId;
}

// Get the date of the earliest review on this page, assuming sorted by date descending
function getDateOfBottomReview(page) {
    // Get the most-bottom review on this page (sorted by most recent, so bottom is earliest date)
    var reviews = page.querySelector('ul.ylist.ylist-bordered.reviews').querySelectorAll('.review');
    var lastReview = reviews[reviews.length-1];
    var earliestDate = Date.parse(lastReview.querySelector('.rating-qualifier').innerText);

    return earliestDate;
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
