var delay = 5000;

function abbreviatedUrl(tab) {
  return tab.url.length > 30 ? tab.url.match(/^.{15}|.{15}$/g).join('...') : tab.url;
}

function onCompleted(details) {
  if (details.frameId == 0 && details.url && details.url != '' && !details.url.match(/^chrome:\/\//)) {
    chrome.tabs.get(details.tabId, function(tab) {
      if (typeof tab == 'undefined') return null;

      chrome.tabs.getAllInWindow(tab.windowId, function(tabs) {
        var duplicates = tabs.filter(function(t) {
          return t.url == details.url && t.id != tab.id && !t.pinned && t.status == 'complete';
        });
        if (duplicates.length) {
          removeDuplicates(tab, duplicates);
        }
      });

    });
  }
}

function removeDuplicates(tab, duplicates) {
  var tab_or_tabs = duplicates.length > 1 ? "tabs" : "tab",
  notification = webkitNotifications.createNotification(
    'icon48.png',
    "Found " + duplicates.length + " duplicate " + tab_or_tabs + ".",
    "" + duplicates.length + " " + tab_or_tabs + " containing " + abbreviatedUrl(tab) + " will be closed. (Click this notification to cancel.)"
  ),
  removeTabs = function() {
    chrome.tabs.get(tab.id, function(t) {
      // only close tabs if triggering tab still open
      if (typeof t == 'undefined')  return null;

      // remove individual tabs because passing array that includes closed tabs fails silently
      duplicates.forEach(function(duplicate) {
        chrome.tabs.remove(duplicate.id);
      });
    });
    notification.cancel();
  },
  removeTabsTimer = window.setTimeout(removeTabs.bind(this), delay);
  notification.onclick = function() {
    window.clearTimeout(removeTabsTimer);
    notification.cancel();
    return false;
  }
  notification.show();
}

chrome.webNavigation.onCompleted.addListener(onCompleted);
