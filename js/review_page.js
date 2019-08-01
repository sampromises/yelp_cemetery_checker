// Get a list (0 - name, 1 - href) of the user's reviews for a given reviews page doc
function getUserReviewsSinglePage(reviewsPageDoc) {
    // Get all reviews
    var reviewsElementList = reviewsPageDoc.getElementsByClassName('biz-name');

    if (reviewsElementList.length == 0) {
        return []; // No reviews on this page
    }

    var results = [];
    for (let i = 0; i < reviewsElementList.length; i++) {
        let bizName = reviewsElementList[i].getElementsByTagName('span')[0].innerText;
        let bizHref = reviewsElementList[i].getAttribute('href');
        let result = {bizName:bizName, bizHref:bizHref};

        results.push(result);
    }
    // DEBUG && console.log('getUserReviewsSinglePage returning', results);
    return results;
}

// Get a list of user names from this review page
function getUserNamesFromReviewPage(reviewPageDoc) {
    var reviewsElemList = reviewPageDoc.getElementsByClassName('reviews')[0];
    var userNamesElementList = reviewsElemList.getElementsByClassName('review');
    var result = [];
    for (let i = 0; i < userNamesElementList.length; i++) {
        let elem = userNamesElementList[i];

        // Skip over 'Create Review' widget if logged in
        let classNames = elem.className.split(' ');
        if (classNames.includes('war-widget--compose')) continue;

        let usernameElem = elem.getElementsByClassName('user-name')[0]; 
        result.push(usernameElem.innerText.trim());
    }
    return result;
}

// Get the date of the earliest review on this page (ASSUMED TO BE SORTED BY DATE DESCENDING)
function getDateOfBottomReview(page) {
    // console.log('getDateOfBottomReview called for:', page);
    // Get the most-bottom review on this page (sorted by most recent, so bottom is earliest date)
    try {
        var reviews = page.querySelector('ul.ylist.ylist-bordered.reviews').querySelectorAll('.review');
    } catch (error) {
        console.log('crashed on page: ', page);
        console.error(error);
    }
    if (reviews.length == 1) { // No reviews on this page
        return Date.parse('July 2004'); // Return when Yelp was created
    }

    var lastReview = reviews[reviews.length-1];
    var dateText = lastReview.querySelector('.rating-qualifier').innerText;

    return Date.parse(dateText)
}

function getDateOfBottomReviewApple(page) {
    // Get the most-bottom review on this page (sorted by most recent, so bottom is earliest date)
    try {
        var reviews = page.querySelector('div~div~.lemon--ul__373c0__1_cxs.undefined.list__373c0__2G8oH').querySelectorAll('li');
        console.log('apple got reviews: ', reviews);
    } catch (error) {
        console.log('crashed on page: ', page);
        console.error(error);
    }
    if (reviews.length == 1) { // No reviews on this page
        console.log('apple returning: ', Date.parse('July 2004'));
        return Date.parse('July 2004'); // Return when Yelp was created
    }

    var lastReview = reviews[reviews.length-1];
    console.log('apple lastReview: ', lastReview);
    var dateText = lastReview.querySelector('.lemon--span__373c0__3997G.text__373c0__2pB8f.text-color--mid__373c0__3G312.text-align--left__373c0__2pnx_').innerText;
    console.log('apple dateText: ', dateText);

    console.log('apple returning: ', Date.parse(dateText));
    return Date.parse(dateText)
}
