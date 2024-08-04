chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    isAutoRefreshEnabled: false,
    darkModeEnabled: false,
    defaultInterval: 15,
  });
});
