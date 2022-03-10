import { join } from 'node:path';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import * as config from '../main/storage/config';
import * as projects from '../main/storage/projects';

import { startHandler, stopHandler } from './render/ipcHandler';
import { startIntegratedServer, stopIntegratedServer } from './render/integratedServer';
import { startStorageHandlers } from './storage/ipcHandler';


let mainWindow: BrowserWindow | null = null;

/**
 * Creates a new Electron browser instance, which is a new renderer process.
 *
 * Additionally, spins up the integrated server.
 */
async function createWindow() {
  mainWindow = new BrowserWindow({
    height: 1080,
    title: 'Video Bones',
    webPreferences: {
      // preload: path.join(__dirname, 'preload.ts')
      contextIsolation: false,
      nodeIntegration: true
    },
    width: 1920
  });

  const serverPort = await startIntegratedServer();
  if (serverPort === -1) {
    dialog.showErrorBox('Error', 'Failed to start integrated server');
    app.quit();
    return;
  }
  startHandler(serverPort);
  const path = app.isPackaged ? join('..', 'renderer', 'index.html') : join(__dirname, '..', 'renderer', 'index.html');
  mainWindow.loadFile(path);
  !app.isPackaged && mainWindow.webContents.openDevTools();
  startStorageHandlers();

  mainWindow.maximize();
}

/**
 * Waits for Electron to be ready before starting the main window.
 */
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function() {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', function() {
  mainWindow = null;
  stopHandler();
  app.quit();
  stopIntegratedServer();
});


/**
 * Creates a folder selection dialog.
 */
ipcMain.handle('browse-directory-clicked', async () => {
  const selected = await dialog.showOpenDialog({ properties: [ 'createDirectory', 'openDirectory' ] });
  return selected.filePaths[0];
});

/**
 * The user is attempting to open an exiting project.
 *
 * Create a folder seletion dialog, and then attempt to open the project in the selelcted folder.
 * If the user selected an invalid folder (i.e one that doesnt contain a project), displays an error dialog.
 */
ipcMain.handle('open-project-clicked', async () => {
  const curr_projects = projects.getTrackedProjects();
  const selected_attr = await dialog.showOpenDialog({ properties: [ 'openDirectory' ] });

  if (selected_attr.canceled) {
    return { alert: false, failed: true, output: '' };
  }
  const possible_projects = curr_projects?.filter((item: projects.ProjectHandle) =>
    item.projectPath === selected_attr.filePaths[0]);

  if (!possible_projects || possible_projects.length <= 0) {
    try {
      const handle = await projects.trackProject(selected_attr.filePaths[0]);
      await config.openProject(handle);
      mainWindow?.setTitle(`${handle.projectName} - Video Bones`);
    } catch {
      return { alert: true, failed: true, output: 'Please select a Project file' };
    }
  } else {
    await config.openProject(possible_projects[0]);
    mainWindow?.setTitle(`${possible_projects[0].projectName} - Video Bones`);
  }
  return { alert: false, failed: false, output: '' };

});

ipcMain.handle('get-default-project-directory', async () => {
  return join(app.getPath('documents'), 'VideoBones');
});

/**
 * The user wants to create a new project.
 *
 * Sets up the new projects files using the projects module.
 * Sets additional project options.
 * Opens the project in the main editor when creation is succesful.
 *
 * Notifies the user of any errors (duplicate projects, failed to open directories, etc.)
 */
ipcMain.handle('create-project-clicked', async (event, projectName, projectLocation) => {
  try {
    await projects.createProject(projectLocation.replace(projectName, '') ?? join(app.getPath('documents'), 'VideoBones'), projectName)
      .then(async handle => {
        await config.openProject(handle);
        config.setOption('audioTracks', []);
        config.setOption('videoTracks', []);
      });

    mainWindow?.setTitle(`${projectName} - Video Bones`);

    return { alert: false, failed: false, output: '' };

  } catch (error) {
    if ((error as Error).message.startsWith('Project directory already exists:')) {
      return { alert: true, failed: true, output: 'That project already exists.' };
    }
    return error;
  }
});
