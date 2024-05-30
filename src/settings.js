document.addEventListener('DOMContentLoaded', () => {
  const settingsList = document.getElementById('settingsList');
  const exportSettingsButton = document.getElementById('exportSettings');
  const importFileButton = document.getElementById('importFileButton');
  const importFileInput = document.getElementById('importFile');
  const importPasteButton = document.getElementById('importPasteButton');
  const importTextArea = document.getElementById('importTextArea');

  const loadSettings = () => {
    chrome.storage.sync.get(null, (items) => {
      settingsList.innerHTML = '';
      for (const [id, setting] of Object.entries(items)) {
        const div = document.createElement('div');
        div.className = 'setting-item';
        div.innerHTML = `
          <div>
            <strong>Pattern:</strong> ${setting.pattern}<br>
            <strong>Name:</strong> ${setting.name}<br>
            <strong>Selectors:</strong><br> ${setting.selectors.join('<br>')}<br>
            <strong>Format:</strong> ${setting.format}<br>
            <button data-id="${id}" class="delete">Delete</button>
          </div>
        `;
        settingsList.appendChild(div);
      }

      document.querySelectorAll('.delete').forEach(button => {
        button.addEventListener('click', (event) => {
          const id = event.target.getAttribute('data-id');
          chrome.storage.sync.remove(id, loadSettings);
        });
      });
    });
  };

  const exportSettings = () => {
    chrome.storage.sync.get(null, (items) => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "settings.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    });
  };

  const importSettings = (json, mode) => {
    const importedSettings = JSON.parse(json);
    chrome.storage.sync.get(null, (currentSettings) => {
      const mergedSettings = { ...currentSettings };
      for (const [id, setting] of Object.entries(importedSettings)) {
        if (mergedSettings[id]) {
          if (mode === 'overwrite') {
            mergedSettings[id] = setting;
          } else if (mode === 'newId') {
            mergedSettings[generateId()] = setting;
          }
        } else {
          mergedSettings[id] = setting;
        }
      }
      chrome.storage.sync.set(mergedSettings, () => {
        alert('Settings imported!');
        loadSettings();
      });
    });
  };

  const generateId = () => {
    return '_' + Math.random().toString(36).substr(2, 9);
  };

  exportSettingsButton.addEventListener('click', exportSettings);

  importFileButton.addEventListener('click', () => {
    importFileInput.click();
  });

  importFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const json = e.target.result;
      const mode = prompt("Enter import mode: 'overwrite', 'newId', or 'ignore'");
      if (['overwrite', 'newId', 'ignore'].includes(mode)) {
        importSettings(json, mode);
      } else {
        alert('Invalid mode');
      }
    };
    reader.readAsText(file);
  });

  importPasteButton.addEventListener('click', () => {
    importTextArea.style.display = 'block';
    importTextArea.addEventListener('change', (event) => {
      const json = event.target.value;
      const mode = prompt("Enter import mode: 'overwrite', 'newId', or 'ignore'");
      if (['overwrite', 'newId', 'ignore'].includes(mode)) {
        importSettings(json, mode);
      } else {
        alert('Invalid mode');
      }
    });
  });

  loadSettings();
});

