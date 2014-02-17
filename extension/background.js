function abbreviatedUrl(tab) {
  return tab.url.length > 30 ? tab.url.match(/^.{15}|.{15}$/g).join(" [...] ") : tab.url;
}

function findDuplicates(tabId, change, tab) {
  if (!tab.url || tab.url === "") return;
  
  chrome.tabs.getAllInWindow(tab.windowId, function(tabs) {
    var duplicates = tabs.filter(function(t) {
      return t.url === tab.url && t.id !== tabId;
    });
    if (duplicates.length) handleDuplicate(tab, duplicates);
  });
}

function handleDuplicate(tab, duplicates)
{
	chrome.tabs.highlight( { windowId : tab.windowId, tabs : duplicates[0].id } , function(){/* mandatory callback */}); // select original tab
	chrome.tabs.update( duplicates[0].id, { active: true, selected : true, highlighted : true } );

	if(typeof webkitNotifications !== "undefined")
	{
		var notification = webkitNotifications.createNotification(
			"",
			"Found " + duplicates.length + " duplicate " + (duplicates.length > 1 ? "tabs" : "tab") + " for " + abbreviatedUrl(tab),
			"The original tab just got reactivated for you.\
			The new one will get closed shortly.\
			(Click this notification to cancel)"
		);
		notification.onclick = function() {
			window.cancelTimeout( timeout );
			notification.close();
			return false;
		};

		var timeout = window.setTimeout( function(){
			// remove new duplicate tab:
			chrome.tabs.remove( tab.id );
			console.log("removed duplicate");
		}, 5000 );
		notification.show();
	}
	else
	{
		// remove new duplicate tab:
		chrome.tabs.remove( tab.id );
		console.log("removed duplicate");
	}
}

chrome.tabs.onUpdated.addListener( findDuplicates );