// Function to open all business links
function openAllBizLinks() {
    const links = document.getElementsByClassName('biz-link');
    for (let i = 0; i < links.length; i++) {
        let link = links[i];
        chrome.tabs.create({url: link.href});
    }
}

// Populate html with results
function populateHtmlFromResponse(response) {
    var numReviews = response.numReviews;

    // Still working
    if (response.status === 'working') {
        var numDone = response.numDone;
        
        document.body.innerHTML = "<h3>Still working...</h3>\n";
        document.body.innerHTML += numDone + "/" + numReviews + " reviews are done processing...";
        return;
    }
        
    // All reviews are alive!
    var results = response.data;
    if (results.length == 0) {
        document.body.innerHTML = "<h3>All " + numReviews + " reviews are alive! :)</h3>";
        return;
    }

    // Show graveyarded reviews
    document.body.innerHTML = "<h3>Graveyarded reviews:</h3><ul id='results'></ul>";
    for (let i = 0; i < results.length; i++) {
        let result = results[i];
        let bizName = result.bizName;
        let bizHref = result.bizHref;

        let liElem = document.createElement('li');
        liElem.innerHTML = '<a class="biz-link" target="_blank" href=https://www.yelp.com' + bizHref + '>' + result.bizName + '</a>';


        //document.body.appendChild(liElem); 
        document.getElementById('results').appendChild(liElem);
    }

    // Create a 'open all links in new tab' button
    let clickAllElem = document.createElement('span');
    clickAllElem.innerHTML='<h4><a id="click-all" href="#" onclick="clickAll();">Open all in new tabs</a></h4>';
    document.body.appendChild(clickAllElem);
    document.getElementById('click-all').addEventListener('click', openAllBizLinks);
}

// Run when this popup.html opens
chrome.tabs.query({'active': true, 'currentWindow':true}, function(tab){
    chrome.tabs.sendMessage(tab[0].id, "stuff", populateHtmlFromResponse);
});

// If popup is open, and results finished
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
    populateHtmlFromResponse(message);
});
