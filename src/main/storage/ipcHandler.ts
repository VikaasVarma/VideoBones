import { ipcMain } from 'electron';

import * as projects from '../storage/projects'
import * as config from '../storage/config'

export function startStorageHandlers() {
  ipcMain.addListener('create-project', (event, parentDirectory:string, projectName:string) => {
    return  projects.createProject(parentDirectory, projectName)
  })

  ipcMain.addListener('get-projects', event => {
    return projects.getTrackedProjects()
  })

  ipcMain.addListener('open-project', (event, projectHandle:projects.ProjectHandle) => {
    return config.openProject(projectHandle)
  })

  ipcMain.addListener('close-project', event => {
    return config.closeProject()
  })

  ipcMain.addListener('get-recordings', (event) => {
    return config.getRecordingsList()
  })

  ipcMain.addListener('add-recording', (event, recordingName:string) => {
    return config.addRecording(recordingName)
  })

  ipcMain.addListener('remove-recording', (event, index:number) => {
    config.removeRecording(index)
  })

  ipcMain.addListener('set-option', (event, optionName:string, optionValue:string) => {
    config.setOption(optionName, optionValue)
  })

  ipcMain.addListener('get-option', (event, optionName:string) => {
    config.getOption(optionName)
  })

  ipcMain.addListener('remove-option', (event, optionName) => {
    config.removeOption(optionName)
  })

  ipcMain.addListener('get-temp-directory', event => {
    return config.getTempDirectory()
  })
}