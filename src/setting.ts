class Setting {
  id: string;
  name: string;
  urlPattern: string;
  selectors: string[];
  format: string;

  constructor(id: string, name: string, urlPattern: string, selectors: string[], format: string) {
    this.id = id;
    this.name = name;
    this.urlPattern = urlPattern;
    this.selectors = selectors;
    this.format = format;
  }

  static createNew() {
    const id = crypto.randomUUID();
    return new Setting(id, '', '', [], '');
  }

  isUrlMatched(url: string) {
    return new RegExp(this.urlPattern.replace(/\*/g, '.*')).test(url);
  }
}

export { Setting };
