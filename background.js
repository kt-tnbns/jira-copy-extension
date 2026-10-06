// Injects the copy logic into the active tab when the toolbar button is clicked.
// activeTab grants temporary access to whatever tab the user clicked on,
// so no broad host permissions are needed.
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url || !tab.url.includes('.atlassian.net')) {
    return;
  }
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['adf.js', 'content.js'],
  });
});
