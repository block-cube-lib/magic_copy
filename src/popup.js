document.addEventListener('DOMContentLoaded', () => {
  // Load saved settings
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = new URL(tabs[0].url);
    const domain = url.hostname;
    chrome.storage.sync.get([domain], (result) => {
      if (result[domain]) {
        document.getElementById('selectors').value = result[domain].selectors.join('\n');
        document.getElementById('format').value = result[domain].format;
      }
    });
  });

  // Save settings on change
  const saveSettings = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = new URL(tabs[0].url);
      const domain = url.hostname;
      const selectors = document.getElementById('selectors').value.split('\n').map(s => s.trim()).filter(s => s);
      const format = document.getElementById('format').value;
      chrome.storage.sync.set({ [domain]: { selectors, format } });
    });
  };

  document.getElementById('selectors').addEventListener('input', saveSettings);
  document.getElementById('format').addEventListener('input', saveSettings);

  const showPreview = (text) => {
    document.getElementById('preview').innerText = text;
  };

  document.getElementById('previewButton').addEventListener('click', () => {
    const selectors = document.getElementById('selectors').value.split('\n').map(s => s.trim()).filter(s => s);
    const format = document.getElementById('format').value;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        console.error('Error querying tabs:', chrome.runtime.lastError);
        return;
      }
      chrome.tabs.sendMessage(tabs[0].id, { selectors, format, preview: true }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending message:', chrome.runtime.lastError);
          showPreview('Error: Could not establish connection to content script.');
          return;
        }
        showPreview(response);
      });
    });
  });

  document.getElementById('copy').addEventListener('click', () => {
    const selectors = document.getElementById('selectors').value.split('\n').map(s => s.trim()).filter(s => s);
    const format = document.getElementById('format').value;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        console.error('Error querying tabs:', chrome.runtime.lastError);
        return;
      }
      chrome.tabs.sendMessage(tabs[0].id, { selectors, format, preview: false }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending message:', chrome.runtime.lastError);
          return;
        }
        navigator.clipboard.writeText(response).then(() => {
          alert('Copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
          });
      });
    });
  });
});

