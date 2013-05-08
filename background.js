var delay = 5000;

function abbreviatedUrl(tab) {
  return tab.url.length > 30 ? tab.url.match(/^.{15}|.{15}$/g).join('...') : tab.url;
}

function findDuplicates(tabId, changeInfo, tab) {
  if (!(changeInfo.status == 'complete' && tab.url && tab.url != '')) return;
  
  chrome.tabs.getAllInWindow(tab.windowId, function(tabs) {
    var duplicates = tabs.filter(function(t) {
      return t.url == tab.url && t.id != tabId && !t.pinned && t.status == 'complete';
    });
    if (duplicates.length) removeDuplicates(tab, duplicates);
  });
}

function removeDuplicates(tab, duplicates) {
  var tab_or_tabs = duplicates.length > 1 ? "tabs" : "tab",
  notification = webkitNotifications.createNotification(
    '',
    "Found " + duplicates.length + " duplicate " + tab_or_tabs + ".",
    "" + duplicates.length + " " + tab_or_tabs + " containing " + abbreviatedUrl(tab) + " will be closed. (Or, click to cancel.)"
  ),
  removeTabs = function() {
    chrome.tabs.remove(duplicates.map(function(t) { return t.id; }));
    notification.close();
  },
  removeTabsTimer = window.setTimeout(removeTabs, delay);
  notification.onclick = function() {
    window.clearTimeout(removeTabsTimer);
    notification.close();
    return false;
  }
  notification.show();
}

chrome.tabs.onUpdated.addListener(findDuplicates);
