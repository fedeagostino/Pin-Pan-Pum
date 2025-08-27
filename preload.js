// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // We are creating a function `getApiKey` that your React app can call
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
});
