chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    const { selectors, format, preview } = message;
    
    // Get values for {Title} and {URL}
    const specialValues = {
      '{Title}': document.title,
      '{URL}': window.location.href
    };

    // Capture values based on selectors
    const values = selectors.map(selector => {
      const element = document.querySelector(selector);
      return element ? element.innerText || element.textContent : '';
    });

    // Replace {0}, {1}, etc. with captured values
    let formattedString = format.replace(/{(\d+)}/g, (match, number) => {
      return typeof values[number] !== 'undefined' ? values[number] : match;
    });

    // Replace {Title} and {URL} with their actual values
    formattedString = formattedString.replace(/{Title}|{URL}/g, (match) => {
      return specialValues[match] || match;
    });

    sendResponse(formattedString);
  } catch (error) {
    console.error('Error processing message:', error);
    sendResponse('Error processing request');
  }
});

