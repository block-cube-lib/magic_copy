import { Setting, createNewSetting } from './setting.js';

const DefaultSetting = new Setting("defaultSetting", "Default (Title and URL on separate lines)", "*", [], "{Title}\n{URL}");
const TitleAndURLSetting = new Setting("titleAndURLSetting", "Title and URL", "*", [], "{Title} {URL}");
const MarkdownSetting = new Setting("markdownSetting", "Markdown", "*", [], "[{Title}]({URL})");

const PresetSettings = [DefaultSetting, TitleAndURLSetting, MarkdownSetting];

const CustomSettingRadioId = 'customSettingRadio';

export class App {
  onContentLoaded() {
    this.customSettingView = document.getElementById('customSetting');
    this.preview = document.getElementById('preview');

    this.updatePreviewButton = document.getElementById('updatePreviewButton');
    this.updatePreviewButton.addEventListener('click', () => this.updatePreview());

    const settingSelector = document.getElementById('settingSelector');
    settingSelector.addEventListener('change', (event) => this.onSelectedSettingChanged(event.target.value));

    const defaultSettingOption = this.addSettingSelector(DefaultSetting.id, DefaultSetting.name);
    defaultSettingOption.selected = true;
    this.addSettingSelector(TitleAndURLSetting.id, TitleAndURLSetting.name);
    this.addSettingSelector(MarkdownSetting.id, MarkdownSetting.name);
    this.addSettingSelector(CustomSettingRadioId, "Custom");

    const copyButton = document.getElementById('copyButton');
    copyButton.addEventListener('click', () => this.copyToClipboard());

    this.settingNameInput = document.getElementById('settingsName');

    this.saveSettingButton = document.getElementById('saveSettingButton');
    this.saveSettingButton.addEventListener('click', () => this.saveSetting());

    this.selectorsInput = document.getElementById('selectors');
    this.selectorsInput.addEventListener('input', (e) => this.currentSetting.selectors = e.target.value.split('\n'));

    this.formatInput = document.getElementById('format');
    this.formatInput.addEventListener('input', (e) => this.currentSetting.format = e.target.value);

    //defaultSettingRadio.checked = true;
    this.onSelectedSettingChanged(DefaultSetting.id);
  }

  addSettingSelector(id, name) {
    const settingSelector = document.getElementById('settingSelector');
    const option = document.createElement('option');
    option.value = id;
    option.innerText = name;
    settingSelector.appendChild(option);
    return option;
  }

  onSelectedSettingChanged(id) {
    this.currentSetting = PresetSettings.find(setting => setting.id === id);
    const isCustomSetting = this.currentSetting === undefined;
    if (isCustomSetting) {
        this.currentSetting = createNewSetting();
    }
    this.customSettingView.style.display = isCustomSetting ? 'block' : 'none';
    this.selectorsInput.readOnly = !isCustomSetting;
    this.formatInput.readOnly = !isCustomSetting;
    this.selectorsInput.innerText = this.currentSetting.selectors.join('\n');
    this.formatInput.innerText = this.currentSetting.format;
    this.settingNameInput.style.display = isCustomSetting ? 'block' : 'none';
    this.saveSettingButton.style.display = isCustomSetting ? 'block' : 'none';
    this.updatePreviewButton.style.display = isCustomSetting ? 'block' : 'none';

    this.updatePreview();
  }

  async copyToClipboard() {
    const text = await this.getText();
    this.preview.innerText = text;
    navigator.clipboard.writeText(text).then(() => {
      const copiedMessage = document.getElementById('copiedMessage');
      this.showMessage(copiedMessage);
    });
  }

  saveSetting() {
    console.log(`save setting. setting: ${this.currentSetting}`);
    const savedMessage = document.getElementById('savedMessage');
    this.showMessage(savedMessage);
  }

  async saveSelectedSettingId() {
    const message = { name: 'getUrl' };
    const response = await this.sendMessageToTab(message);
    if (response.isSucceeded) {
      const currentUrl = response.url;
      await saveEditingSetting(setting, currentUrl);
      console.log(`save editing setting. setting: ${setting}, url: ${url}`);
    }
  }

  async saveEditingSetting(setting) {
    const message = { name: 'getUrl' };
    const response = await this.sendMessageToTab(message);
    if (response.isSucceeded) {
      const currentUrl = response.url;
      await saveEditingSetting(setting, currentUrl);
      console.log(`save editing setting. setting: ${setting}, url: ${url}`);
    }
  }

  showMessage(message) {
    message.style.display = 'block';
    setTimeout(() => {
      message.style.display = 'none';
    }, 1500);
  }

  async updatePreview() {
    const text = await this.getText();
    this.preview.innerText = text;
  }

  async getText() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const message = {
      name: 'getText',
      setting: this.currentSetting,
    };
    const response = await this.sendMessageToTab(message);
    if (response.isSucceeded) {
      return response.text;
    }
    else {
      return '';
    }
  }

  async sendMessageToTab(message) {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tabs[0].id, message);

    if (chrome.runtime.lastError) {
      console.error('Error querying tabs:', chrome.runtime.lastError);
      return;
    }
    else if (response.errorMessage) {
      console.error(`Error: ${response.errorMessage}`);
      return;
    }
    response.isSucceeded = !chrome.runtime.lastError && !response.errorMessage;

    return response;
    }
}
