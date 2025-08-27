// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const createWindow = () => {
  const win = new BrowserWindow({
    width: 900,
    height: 1400,
    webPreferences: {
      // The preload script is the secure bridge between Node.js and your React app
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // Essential security measure
      nodeIntegration: false, // Essential security measure
    },
  });

  // Load your index.html. Assumes your build process (Vite) generates files in a 'dist' folder.
  win.loadFile(path.join(__dirname, 'dist', 'index.html'));

  // Optional: Open DevTools
  // win.webContents.openDevTools();
};

// Handle the secure request for the API key from the renderer process
ipcMain.handle('get-api-key', () => {
    return process.env.API_KEY;
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
