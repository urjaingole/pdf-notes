document.getElementById('open-library').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});

document.getElementById('open-settings').addEventListener('click', () => {
  const scheme = navigator.userAgent.includes('Edg/') ? 'edge' : 'chrome';
  chrome.tabs.create({ url: scheme + '://extensions/?id=' + chrome.runtime.id });
});