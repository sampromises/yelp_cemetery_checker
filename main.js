// Get element of entire HTML page from provided URL
function getDocFromHref(url) {
    const request = new XMLHttpRequest();
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

// Get the user's name on this yelp page
function getUserName() {
    var name = document.querySelector('#wrap > div.main-content-wrap.main-content-wrap--full > div.top-shelf.top-shelf-grey > div > div.user-profile_container > div.user-profile_content-wrapper.arrange.arrange--bottom.arrange--30 > div.user-profile_info.arrange_unit > h1').innerHTML;

    if (name.includes('\'')) {
        var first_name = name.substring(0, name.indexOf(' '));
        var last_name = name.substring(name.lastIndexOf(' ')+1);
        name = first_name + ' ' + last_name;
    }

    console.log('getUserName() returning:', name);
    return name;
}

// Get user's 'Reviews' page as a JS element
function getReviewsDocElement() {
    var href = document.querySelector('#super-container > div > div.column.column-alpha.user-details_sidebar > div > div > div.titled-nav_menus > div.titled-nav_menu > ul > li:nth-child(3) > a').getAttribute('href');

    console.log('href:', href);

    return getDocFromHref(href);
}

// Get a list (0 - name, 1 - href) of the user's reviews for a given reviews page doc
function getReviewsList(reviewsPageDoc) {
    // Get all reviews
    var reviewsElementList = reviewsPageDoc.getElementsByClassName('biz-name');
    var result = [];
    for (let i = 0; i < reviewsElementList.length; i++) {
        result.push([]);
        result[i].push(reviewsElementList[i].getElementsByTagName('span')[0].innerText);
        result[i].push(reviewsElementList[i].getAttribute('href'));
    }
    console.log('Got result:', result);
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

// Main function to check a single business for cemetery'd reviews
function checkBusinessPage(username, reviewHref) {
    // Sort reviews by newest first
    reviewHref = reviewHref + "?sort_by=date_desc";

    var doc = getDocFromHref(reviewHref);
    var usernames = getUserNamesFromReviewPage(doc);
    console.log('For', reviewHref, 'got usernames:', usernames);
}

function main() {
    console.log('Window loaded!');
    var name = getUserName();
    var reviewsPageDoc = getReviewsDocElement();
    var reviewsList = getReviewsList(reviewsPageDoc);
    for (let i = 0; i < reviewsList.length; i++) {
        checkBusinessPage(reviewsList[i][1]);
    }
}

window.onload = main;
