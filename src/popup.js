document.addEventListener('DOMContentLoaded', () => {
  const urlPatternInput = document.getElementById('urlPattern');
  const settingsNameInput = document.getElementById('settingsName');
  const selectorsInput = document.getElementById('selectors');
  const formatInput = document.getElementById('format');
  const settingsSelect = document.getElementById('settingsSelect');
  const presetRadios = document.getElementsByName('preset');
  const setCurrentUrlButton = document.getElementById('setCurrentUrl');
  const checkPatternButton = document.getElementById('checkPattern');
  const patternResult = document.getElementById('patternResult');
  const copiedMessage = document.getElementById('copiedMessage');
  const savedMessage = document.getElementById('savedMessage');
  const saveSettingsButton = document.getElementById('saveSettings');
  const selectorsGroup = document.getElementById('selectorsGroup');
  let currentSettingsId = null;
  let originalSettings = {};

  const generateId = () => {
    return '_' + Math.random().toString(36).substr(2, 9);
  };

  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const loadSettings = (currentUrl) => {
    chrome.storage.sync.get(null, (items) => {
      const matchedSettings = [];
      for (const [id, setting] of Object.entries(items)) {
        if (new RegExp(setting.pattern.replace(/\*/g, '.*')).test(currentUrl)) {
          matchedSettings.push({ id, setting });
        }
      }

      settingsSelect.innerHTML = '';
      matchedSettings.forEach((setting, index) => {
        const option = document.createElement('option');
        option.value = setting.id;
        option.text = `${setting.setting.pattern} - ${setting.setting.name}`;
        settingsSelect.appendChild(option);
      });

      if (matchedSettings.length > 0) {
        const selectedSetting = matchedSettings[0];
        currentSettingsId = selectedSetting.id;
        urlPatternInput.value = selectedSetting.setting.pattern;
        settingsNameInput.value = selectedSetting.setting.name;
        selectorsInput.value = selectedSetting.setting.selectors.join('\n');
        formatInput.value = selectedSetting.setting.format;
        originalSettings = { ...selectedSetting.setting };
        document.getElementById('presetCustom').checked = true;
        toggleCustomFields(true);
      } else {
        originalSettings = {};
        document.getElementById('presetDefault').checked = true;
        toggleCustomFields(false);
      }

      settingsSelect.addEventListener('change', () => {
        const selectedSetting = matchedSettings.find(setting => setting.id === settingsSelect.value);
        currentSettingsId = selectedSetting.id;
        urlPatternInput.value = selectedSetting.setting.pattern;
        settingsNameInput.value = selectedSetting.setting.name;
        selectorsInput.value = selectedSetting.setting.selectors.join('\n');
        formatInput.value = selectedSetting.setting.format;
        originalSettings = { ...selectedSetting.setting };
        document.getElementById('presetCustom').checked = true;
        toggleCustomFields(true);
      });
    });
  };

  const saveSettings = () => {
    const urlPattern = urlPatternInput.value.trim();
    const name = settingsNameInput.value.trim();
    const selectors = selectorsInput.value.split('\n').map(s => s.trim());
    const format = formatInput.value.trim();

    if (urlPattern && name && format) {
      const newSettings = { pattern: urlPattern, name, selectors, format };
      const id = currentSettingsId || generateId();
      chrome.storage.sync.set({
        [id]: newSettings
      }, () => {
        showSavedMessage();
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          loadSettings(tabs[0].url);
        });
      });
    } else {
      alert('Please fill in URL pattern, name, and format fields.');
    }
  };

  const setCurrentUrl = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentUrl = tabs[0].url;
      urlPatternInput.value = escapeRegExp(currentUrl);
    });
  };

  const checkPattern = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentUrl = tabs[0].url;
      const pattern = urlPatternInput.value.trim();
      if (new RegExp(pattern.replace(/\*/g, '.*')).test(currentUrl)) {
        patternResult.className = 'result-icon success';
      } else {
        patternResult.className = 'result-icon fail';
      }
    });
  };

  const markUnsavedChanges = () => {
    document.body.style.borderColor = 'red';
  };

  const clearUnsavedChanges = () => {
    document.body.style.borderColor = '';
  };

  const showSavedMessage = () => {
    savedMessage.style.display = 'block';
    setTimeout(() => {
      savedMessage.style.display = 'none';
    }, 2000);
  };

  const showCopiedMessage = () => {
    copiedMessage.style.display = 'block';
    setTimeout(() => {
      copiedMessage.style.display = 'none';
    }, 2000);
  };

  const toggleCustomFields = (isCustom) => {
    const elementsToToggle = [settingsSelect, settingsNameInput, selectorsInput, formatInput, saveSettingsButton, urlPatternInput, setCurrentUrlButton, checkPatternButton, selectorsGroup];
    elementsToToggle.forEach(element => {
      element.style.display = isCustom ? 'block' : 'none';
    });
    document.querySelector('.button-row').style.display = isCustom ? 'flex' : 'none';
    document.getElementById('urlPatternGroup').style.display = isCustom ? 'block' : 'none';
  };

  presetRadios.forEach(radio => {
    radio.addEventListener('change', (event) => {
      const isCustom = event.target.value === 'custom';
      toggleCustomFields(isCustom);
      if (!isCustom) {
        formatInput.value = event.target.value;
      }
      updatePreview();
    });
  });

  const updatePreview = () => {
    const format = formatInput.value.trim();
    const selectors = selectorsInput.value.trim() ? selectorsInput.value.split('\n').map(s => s.trim()) : [];
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
  };

  document.getElementById('previewButton').addEventListener('click', () => {
    updatePreview();
  });

  document.getElementById('copy').addEventListener('click', () => {
    const selectors = selectorsInput.value.trim() ? selectorsInput.value.split('\n').map(s => s.trim()) : [];
    const format = formatInput.value.trim();
    if (!selectors.length && !format) {
      // If both selectors and format are empty, copy {Title}\n{URL}
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const title = tabs[0].title;
        const url = tabs[0].url;
        const text = `${title}\n${url}`;
        navigator.clipboard.writeText(text).then(() => {
          showCopiedMessage();
        }).catch(err => {
          console.error('Failed to copy text: ', err);
        });
      });
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          console.error('Error querying tabs:', chrome.runtime.lastError);
          return;
        }
        chrome.tabs.sendMessage(tabs[0].id, { selectors, format, preview: false }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error sending message:', chrome.runtime.lastError);
            showPreview('Error: Could not establish connection to content script.');
            return;
          }
          showCopiedMessage();
        });
      });
    }
  });

  const sendMessageToContentScript = (preview) => {
    const selectors = selectorsInput.value.split('\n').map(s => s.trim());
    const format = formatInput.value.trim();
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        console.error('Error querying tabs:', chrome.runtime.lastError);
        return;
      }
      chrome.tabs.sendMessage(tabs[0].id, { selectors, format, preview }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending message:', chrome.runtime.lastError);
          showPreview('Error: Could not establish connection to content script.');
          return;
        }
        showPreview(response);
      });
    });
  };

  const showPreview = (text) => {
    document.getElementById('preview').innerText = text;
  };

  // Load settings for current URL
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    loadSettings(tabs[0].url);
  });
});

