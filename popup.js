// Function to open all business links
function openAllBizLinks() {
    console.log('openAll called!');
    const links = document.getElementsByClassName('biz-link');
    console.log('a links:', links);
    console.log('a links.length:', links.length);
    for (let i = 0; i < links.length; i++) {
        let link = links[i];
        console.log('opening in newtab:', link);
        chrome.tabs.create({url: link.href});
    }
}

// Populate html with results
function populateHtmlFromResponse(response) {
    console.log("populateHtmlFromResponse, got response:", response);
    var numReviews = response.numReviews;

    // Still working
    if (response.status === 'working') {
        var numDone = response.numDone;
        
        document.body.innerHTML = "Still working...\n";
        document.body.innerHTML += numDone + "/" + numReviews + " reviews are done processing...";
        return;
    }
        
    // All reviews are alive!
    var results = response.data;
    if (results.length == 0) {
        document.body.innerHTML = "All " + numReviews + " reviews are alive! :)";
        return;
    }

    // Show graveyarded reviews
    document.body.innerHTML = "Graveyarded reviews:<ul id='results'></ul>";
    for (let i = 0; i < results.length; i++) {
        let result = results[i];
        let bizName = result.bizName;
        let bizHref = result.bizHref;

        let liElem = document.createElement('li');
        liElem.innerHTML = '<a class="biz-link" target="_blank" href=https://www.yelp.com' + bizHref + '>' + result.bizName + '</a>';

        console.log('popup.html appending elem:', liElem);

        //document.body.appendChild(liElem); 
        document.getElementById('results').appendChild(liElem);
    }

    // Create a 'open all links in new tab' button
    let clickAllElem = document.createElement('span');
    clickAllElem.innerHTML='<a id="click-all" href="#" onclick="clickAll();">Open all in new tabs</a>';
    document.body.appendChild(clickAllElem);
    document.getElementById('click-all').addEventListener('click', openAllBizLinks);
}

// Run when this popup.html opens
chrome.tabs.query({'active': true, 'currentWindow':true}, function(tab){
    console.log('popup.html sending message to tab id:', tab[0].id);
    chrome.tabs.sendMessage(tab[0].id, "stuff", populateHtmlFromResponse);
});

// If popup is open, and results finished
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
    console.log('main.js finished; received message...', message);
    populateHtmlFromResponse(message);
});
