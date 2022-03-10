import { ipcMain } from 'electron';
import * as config from '../storage/config';
import * as projects from '../storage/projects';


// Defines a bunch of ipc handlers for all the storage stuff

export function startStorageHandlers() {
  ipcMain.addListener('create-project', (event, parentDirectory: string, projectName: string) => {
    return  projects.createProject(parentDirectory, projectName);
  });

  ipcMain.addListener('track-project', (event, directory: string) => {
    projects.trackProject(directory);
  });

  ipcMain.addListener('untrack-project', (event, handle: projects.ProjectHandle) => {
    projects.untrackProject(handle);
  });

  ipcMain.addListener('get-projects', () => {
    return projects.getTrackedProjects();
  });

  ipcMain.addListener('open-project', (event, projectHandle: projects.ProjectHandle) => {
    return config.openProject(projectHandle);
  });

  ipcMain.addListener('close-project', () => {
    return config.closeProject();
  });

  ipcMain.handle('get-recordings', () => {
    return JSON.stringify(config.getRecordingsList());
  });

  ipcMain.handle('get-recordings-directory', () => {
    return config.getRecordingsDirectory();
  });

  ipcMain.handle('add-recording', (event, recordingName: string) => {
    return config.addRecording(recordingName);
  });

  ipcMain.addListener('remove-recording', (event, index: number) => {
    const track = config.getRecordingsList()[index];
    let videos = config.getOption('videoTracks');
    let audios = config.getOption('audioTracks');

    if (Array.isArray(videos) && videos.includes(track)) {
      videos = videos.splice(videos.indexOf(track));
      config.setOption('videoTracks', videos);
    } else if (Array.isArray(audios) && audios.includes(track)) {
      audios = audios.splice(audios.indexOf(track));
      config.setOption('audioTracks', audios);
    }

    config.removeRecording(index);
  });

  ipcMain.addListener('set-option', (event, optionName: string, optionValue: string) => {
    config.setOption(optionName, optionValue);
  });

  ipcMain.handle('get-option', (event, optionName: string) => {
    return JSON.stringify(config.getOption(optionName));
  });

  ipcMain.addListener('remove-option', (event, optionName) => {
    config.removeOption(optionName);
  });

  ipcMain.handle('get-temp-directory', () => {
    return config.getTempDirectory();
  });
}
