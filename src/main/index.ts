import { app, BrowserWindow, ipcMain, dialog } from 'electron';
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
  startHandler();
  listen();
  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  mainWindow.webContents.openDevTools()
  startStorageHandlers()

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

ipcMain.handle("open-project-clicked", async() => {

  var current_projects:any

  async function employFileSelector() {
    current_projects = projects.getTrackedProjects()
    return await dialog.showOpenDialog({ properties: ['openDirectory'] })
  }

  var selected_attr = await employFileSelector()
  if (selected_attr.canceled) { return }
  var possible_projects = await current_projects.filter((item:any) => item.projectPath == selected_attr.filePaths)

  if (possible_projects.length <= 0) {
    return false
  } else {
    await config.openProject(possible_projects[0])
  }
  return await possible_projects[0]

})