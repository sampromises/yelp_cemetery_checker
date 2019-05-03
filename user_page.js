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

    return name;
}

// Get the date that this user started Yelping
function getUserYelpingSince() {
    var rawLines = document.documentElement.innerHTML.split('\n');
    var index = rawLines.indexOf('            <h4>Yelping Since</h4>') + 1;

    var dateText = rawLines[index].trim();
    dateText = dateText.substring(3, dateText.length);
    dateText = dateText.substring(0, dateText.indexOf('<'));

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
