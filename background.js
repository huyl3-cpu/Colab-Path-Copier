// background.js - Service worker for Colab Path Copier

// No context menus needed - content script handles everything via custom overlay
chrome.runtime.onInstalled.addListener(() => {
    console.log('Colab Path Copier installed');
});
