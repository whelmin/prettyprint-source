const contentTypeMap: Map<number, string> = new Map();

/**
 * Source Content Type
 */
// collect content-type
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const header of (details.responseHeaders || [])) {
      if (
        header.name.toLowerCase() === 'content-type'
        && details.tabId
        && header.value
      ) {
        contentTypeMap.set(details.tabId, header.value);
        return;
      }
    }
  },
  {
    urls: ['<all_urls>'],
    types: ['main_frame'],
  },
  ['responseHeaders'],
);

// get content-type
function getContentType(
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void,
) {
  const contentType = sender.tab?.id ? contentTypeMap.get(sender.tab.id) : undefined;
  sendResponse(contentType);
}

/**
 * Listen to message from the content script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const actions: Record<string, Function> = {
    getContentType,
  };
  if (message.action) {
    actions[message.action]?.(message, sender, sendResponse);
  }
});

export {};
