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
