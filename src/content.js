chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (message.name == 'getText') {
      const text = getText(message.setting);
      sendResponse({ text: text });
    }
    else if (message.name == 'getUrl') {
      sendResponse({ url: window.location.href });
    }
    else if (message.name == 'saveSelectedSetting') {
      const url = window.location.href;
      const id = message.id;
      sendResponse({ url: window.location.href, id: id });
    }
    else {
      sendResponse({ errorMessage: 'Invalid message'} );
    }
  } catch (error) {
    const errorMessage = `Error processing message: ${error}\nmessage: ${message}`;
    console.error(errorMessage);
    const responseMessage = { errorMessage: errorMessage, message: message };
    sendResponse(responseMessage);
  }

  return true;
});

function getText(setting) {
  const values = setting.selectors
  .map(selector => {
    if (selector.trim() === '') {
      return '';
    }
    // if selector includes '@', it is an attribute
    else if (selector.includes('@')) {
      const [valueSelector, attribute] = selector.split('@');
      const element = document.querySelector(valueSelector);
      if (element === null || element === undefined) {
        return '';
      }
      else if (element.hasAttribute(attribute)) {
        return element.getAttribute(attribute);
      }
      return element;
    }
    else {
      const element = document.querySelector(selector);
      return element ? element.innerText || element.textContent : '';
    }
  });

  // Replace {0}, {1}, etc. with captured values
  let formattedString = setting.format.replace(/{(\d+)}/g, (match, number) => {
    return typeof values[number] !== 'undefined' ? values[number] : match;
  });

  const specialValues = {
    '{Title}': document.title,
    '{URL}': window.location.href,
  };
  // Replace {Title} and {URL} with their actual values
  formattedString = formattedString.replace(/{Title}|{URL}/g, (match) => {
    return specialValues[match] || match;
  });

  return formattedString;
}
