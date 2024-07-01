import { App } from './app.js';

const app = new App();
document.addEventListener('DOMContentLoaded', () => {
  app.onContentLoaded();
});
