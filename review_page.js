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

