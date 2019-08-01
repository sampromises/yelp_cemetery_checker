// Get promise for a single business result (recursive)
function checkPageOfBizReview(bizName, href, pageNum, username, yelpingSince) {
    var promise = fetchPageRequest(href)
    .then(page => {
        console.log('page title: ', bizName);
        
        if (bizName.includes('Apple Store')) {
            console.log('Page title include Apple Store');
            var earliestDate = getDateOfBottomReviewApple(page);
        } else {
            console.log('Page title does not include Apple Store');
            var earliestDate = getDateOfBottomReview(page);
        }
        let usernames = getUserNamesFromReviewPage(page);


        if (usernames.includes(username)) { // Base case: Success
            DEBUG && console.log('checkPageOfBizReview() - BC: Found username!');

            // Update numDone to show user progress in popup
            FINAL_RESULTS.numDone = FINAL_RESULTS.numDone + 1;
            chrome.runtime.sendMessage(FINAL_RESULTS);

            return {bizName: bizName, bizHref: href.split('?')[0], result: pageNum};
        } else if (usernames.length == 0 || earliestDate < yelpingSince) {
            // Base case: Failure (end of reviews, or earlier than possible)
            DEBUG && console.log('checkPageOfBizReview() - BC: Username not found');
            DEBUG && console.log('\tfor', href, 'got usernames:', usernames);
            DEBUG && console.log('\tearliestDate:', earliestDate);
            DEBUG && console.log('\tyelpingSince:', yelpingSince);

            // Update numDone to show user progress in popup
            FINAL_RESULTS.numDone = FINAL_RESULTS.numDone + 1;
            chrome.runtime.sendMessage(FINAL_RESULTS);

            return {bizName: bizName, bizHref: href.split('?')[0], result: -1};
        } else { // Try the next page
            href = href.split('?')[0];
            href = href + '?start=' + ((pageNum-1)*usernames.length).toString() + '&sort_by=date_desc';
            DEBUG && console.log('checkPageOfBizReview() - recursive, going to:', href);
            return checkPageOfBizReview(bizName, href, pageNum+1, username, yelpingSince);
        }
    });

    return promise;
}
