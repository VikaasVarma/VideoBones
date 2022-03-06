import * as config from '../main/storage/config';
import * as projects from '../main/storage/projects';

import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { startIntegratedServer, stopIntegratedServer } from './render/integratedServer';
import { join } from 'path';
import { startStorageHandlers } from './storage/ipcHandler';
import { startHandler, stopHandler } from './render/ipcHandler';

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

  const serverPort = startIntegratedServer();
  if (serverPort === -1) {
    dialog.showErrorBox('Error', 'Failed to start integrated server');
    app.quit();
    return;
  }
  const path = app.isPackaged ? join('..', 'renderer', 'index.html') : join(__dirname, '..', 'renderer', 'index.html');
  mainWindow.loadFile(path);
  mainWindow.webContents.openDevTools();
  startStorageHandlers();

  mainWindow.maximize();
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
  stopIntegratedServer();
});

// Code to open the project when the FOLDER ICON on the
// "OnOpenPage" gets pressed

ipcMain.handle('open-project-clicked', async() => {
  let current_projects:any;

  async function employFileSelector() {
    current_projects = projects.getTrackedProjects();
    return await dialog.showOpenDialog({ properties: [ 'openDirectory' ] });
  }

  const selected_attr = await employFileSelector();
  if (selected_attr.canceled) {
    return { failed: true, alert: false, output: '' };
  }
  const possible_projects = await current_projects.filter((item:any) => item.projectPath == selected_attr.filePaths[0]);

  if (possible_projects.length <= 0) {
    try {
      const handle = await projects.trackProject(selected_attr.filePaths[0]);
      await config.openProject(handle);
    } catch {
      return { failed: true, alert: true, output: 'Please select a Project file' };
    }
  } else {
    await config.openProject(possible_projects[0]);
  }
  return { failed: false, alert: false, output: '' };

});

ipcMain.handle('create-project-clicked', async(event, projectName) => {
  try {
    await projects.createProject(app.getAppPath(), projectName)
      .then(async handle => {
        await config.openProject(handle);
        config.setOption('audioTracks', []);
      });
    return { failed: false, alert: false, output: '' };

  } catch (err:any) {
    if (err.message.startsWith('Project directory already exists:')) {
      return { failed: true, alert: true, output: 'That project already exists.' };
    }
    return err;
  }
});
