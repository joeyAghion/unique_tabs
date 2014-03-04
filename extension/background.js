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

	if(chrome.notifications) chrome.notifications.create(
		"UniqueTabs_"+tab.id,
		{
			"type" : "basic",
			"iconUrl" : "icon48.png",
			"title" : "Duplicate " + (duplicates.length === 1 ? "tab" : "tabs") + " found for " + abbreviatedUrl(tab),
			"message" : "The original tab just got reactivated for you.\nThe new one will get closed shortly.\n(Click this notification to cancel)",
			"isClickable" : true
		},
		function (id){ window.setTimeout(function(){ this.close(); }, 5000); }
	);	
	else
	{
		// remove new duplicate tab:
		chrome.tabs.remove( tab.id );
		console.log("UniqueTabs: duplicate removed");
	}
}

chrome.tabs.onUpdated.addListener( findDuplicates );
if(chrome.notifications)
{
	chrome.notifications.onClosed.addListener( function (id, byUser){
		if(id.indexOf("UniqueTabs") === -1) return;

		chrome.tabs.remove( parseInt( id.split("_")[1] ) );
		console.log("UniqueTabs: duplicate removed");
	});
	chrome.notifications.onClicked.addListener( function (id){
		if(id.indexOf("UniqueTabs") > -1) console.log("UniqueTabs: user canceled duplicate removal");
	});
}