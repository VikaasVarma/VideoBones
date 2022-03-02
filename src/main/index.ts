import { app, BrowserWindow } from 'electron';
import { close, listen } from './render/integratedServer';
import { startHandler, stopHandler } from './render/ipcHandler';
import { join } from 'path';
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
    },
    title: 'Video Bones'
  });
  try {
    projects.createProject('', 'testing').then(handle => {
      config.openProject(handle).then(() => {
        startHandler();
        listen();
        const path = app.isPackaged ? join('..', 'renderer', 'index.html') : join(__dirname, '..', 'renderer', 'index.html');
        mainWindow.loadFile(path);
        //mainWindow.webContents.openDevTools()
      });
    });
  } catch (err) {
    config.openProject(projects.getTrackedProjects()[0]).then(() => {
      startHandler();
      listen();
      const path = app.isPackaged ? join('..', 'renderer', 'index.html') : join(__dirname, '..', 'renderer', 'index.html');
      mainWindow.loadFile(path);
      //mainWindow.webContents.openDevTools()
    });
  }

  listen();
  const path = app.isPackaged ? join('..', 'renderer', 'index.html') : join(__dirname, '..', 'renderer', 'index.html');
  mainWindow.loadFile(path);
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
