class Setting
{
  constructor(id, name, urlPattern, selectors, format)
  {
    this.id = id;
    this.name = name;
    this.urlPattern = urlPattern;
    this.selectors = selectors;
    this.format = format;
  }

  isMatched(url) {
    return new RegExp(this.urlPattern.replace(/\*/g, '.*')).test(url);
  }
}

const StorageKey = 'settings';
let Settings = LoadSettings();

async function LoadSettings() {
  const result = await chrome.storage.sync.get([StorageKey]);
  const settings = result[StorageKey];
  if (settings === undefined) {
    return [];
  }
  return settings.map(s => new Setting(s.id, s.name, s.urlPattern, s.selectors, s.format));
}

async function saveSettings(setting) {
  if(Settings.find(s => s.id === setting.id)) {
    Settings = Settings.map(s => s.id === setting.id ? setting : s);
  }
  else {
    Settings.push(setting);
  }
  await chrome.storage.sync.set({ StorageKey: Settings });
}

async function saveEditingSetting(setting, url) {
  await chrome.storage.local.set({ url: setting });
}

async function loadEditingSettingByUrl(url) {
  const result = await chrome.storage.local.get([url]);
  const setting = result[url];
  return new Setting(setting.id, setting.name, setting.urlPattern, setting.selectors, setting.format);
}

async function removeEditingSetting(url) {
  await chrome.storage.local.remove([url]);
}

const createNewSetting = function() {
  const id = Math.random().toString(36).slice(-8);
  return new Setting(id, "", "", [], "");
}

function getSettingsByURLPattern(currentUrl) {
  const matchedSettings = [];
  for (const setting of Settings) {
    if (setting.isMatched(currentUrl)) {
      matchedSettings.push(setting);
    }
  }
  // order by urlPattern length
  matchedSettings.sort((a, b) => b.urlPattern.length - a.urlPattern.length);
  return matchedSettings;
}

const GetSettingById = function(settings, id) {
  return Settings.find(setting => setting.id === id);
}

export { Setting, saveSettings, createNewSetting, getSettingsByURLPattern };
