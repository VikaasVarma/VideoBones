import { app, BrowserWindow } from 'electron';
import { close, listen } from './render/integratedServer';
import { startHandler, stopHandler } from './render/ipcHandler';
import path from 'path';
import { startStorageHandlers } from './storage/ipcHandler';
import * as config from '../main/storage/config';
import * as projects from '../main/storage/projects';

function createWindow () {

  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      // preload: path.join(__dirname, 'preload.ts')
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  try {
    projects.createProject('', 'testing').then(handle => {
      config.openProject(handle).then(() => {
        startHandler();
        listen();
        mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
        //mainWindow.webContents.openDevTools()
      });
    });
  } catch (err) {
    config.openProject(projects.getTrackedProjects()[0]).then(() => {
      startHandler();
      listen();
      mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
      //mainWindow.webContents.openDevTools()
    });
  }

  listen();
  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  //mainWindow.webContents.openDevTools()
}
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', function () {
  stopHandler();
  app.quit();
  close();
});
