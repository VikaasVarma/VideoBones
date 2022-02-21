import { FileHandle } from 'fs/promises'
import path from 'path'
import { ProjectHandle } from './projects'

import { getProjectRecordingsDirectory, readProjectConfig, writeDirectoryConfig, writeProjectConfig, cleanProjectTempDirectory, getProjectTempDirectory, createProjectRecordingFile } from './storage'

/**
 * Holds data from .bones project config files.
 */
interface Config {
  /**
   * Holds a simple version tag for the project config.
   *
   * Am keeping this in case we need to do versioning on configs down the line,
   * can use this to do things like update the .bones file structure from earlier versions.
   */
  version: number;

  projectName: string;

  /**
   * Relative paths to recordings from project root.
   */
  recordings: Array<string>;

  /**
   * Object storing arbitrary options for any system.
   *
   * Basically a key-value store for any data the project might need to store.
   * Please make sure whatever goes in here is JSON.stringify-able (basically no BigInt's or cyclic objects).
   */
  options: Record<string, unknown>;
}

/**
 * User-defined type guard for Config type.
 *
 * Narrows type of o to Config if true.
 *
 * @returns True if o is a valid Config object
 */
function isConfig(o: any): o is Config {
  return  'projectName' in o && typeof o.projectName === 'string'
          && 'version' in o && typeof o.version === 'number'
          && 'recordings' in o && typeof o.recordings === typeof []
          && 'options' in o && o.options.constructor === Object
}

class ConfigBuilder {
  private readonly _config: Config

  // ctor sets required members of Config
  constructor(projectName: string) {
    this._config = {
      version: 1,
      projectName: projectName,

      // set defaults
      recordings: [],
      options: {}
    }
  }

  // setters for default set members
  recordings(recordings: Array<string>): ConfigBuilder {
    this._config.recordings = recordings
    return this
  }

  options(options: Record<string, unknown>): ConfigBuilder {
    this._config.options = options
    return this
  }

  /**
   * Returns the resulting Config object
   */
  build(): Config {
    return this._config
  }
}

/**
 * Keeps track of a currently open project.
 */
class OpenProjectData {
  /**
   * Keeps track of the last promise made on a config file.
   *
   * This is a really simple way to do this which doesn't account for different config files,
   * but as there's only 1 per project this is fine.
   */
  currentConfigWritePromise: Promise<void> = Promise.resolve()

  projectHandle: ProjectHandle
  projectConfig: Config

  constructor(projectHandle: ProjectHandle, projectConfig: Config) {
    this.projectHandle = projectHandle
    this.projectConfig = projectConfig
  }

  addRecording(recordingRelativePath: string): void {
    this.projectConfig.recordings.push(recordingRelativePath)

    this.writeConfig()
  }

  removeRecording(recordingIndex: number): void {
    this.projectConfig.recordings.splice(recordingIndex, 1)

    this.writeConfig()
  }

  getConfigOption(option: string): any{
    return option in this.projectConfig.options ? this.projectConfig.options[option] : null
  }

  setConfigOption(option: string, value: any): void {
    this.projectConfig.options[option] = value

    this.writeConfig()
  }

  removeConfigOption(option: string): void {
    delete this.projectConfig.options[option]

    this.writeConfig()
  }

  /**
   * Asynchronously writes the open project config to file.
   *
   * @returns A promise which resolves when the write is complete
   */
  private writeConfig(): Promise<void> {
    return writeProjectConfig(this.projectHandle, this.projectConfig)
  }

  close(): Promise<void> {
    return this.currentConfigWritePromise.then(() => {
      return
    })
  }
}

let currentOpenProject: OpenProjectData | null = null

/**
 * Writes an initial config to a new project file.
 *
 * Used internally by projects module, not for public use.
 *
 * @param projectDirectory The directory to write to
 * @param projectName The name of the new project
 * @returns A promise which resolves when the write has completed
 */
function initialiseProjectConfig(projectDirectory: string, projectName: string): Promise<void> {
  const config = new ConfigBuilder(projectName).build()

  return writeDirectoryConfig(projectDirectory, config)
}

/**
 * Initialises the config module to work on a project.
 *
 * A project which is 'open' can have writes happening to it at any time, so use closeProject() before quitting pls.
 * Closes a current open project if there is one.
 *
 * @param projectHandle The project to open
 * @returns A promise which resolves when the project has been opened for this module.
 */
function openProject(projectHandle: ProjectHandle): Promise<void> {
  const closePromise = closeProject()

  const configPromise = closePromise.then(() => { 
    return readProjectConfig(projectHandle)
  })

  return configPromise.then(config => {
    currentOpenProject = new OpenProjectData(projectHandle, config)

    tempCleanupLoop(projectHandle, 60000, Promise.resolve())
  })
}

/**
 * Ensures the open project is closed safely, finishing all pending writes.
 *
 * @returns A promise which resolves when the project is closed.
 */
function closeProject(): Promise<void> {
  if (currentOpenProject === null) {
    return Promise.resolve()
  }

  const closePromise = currentOpenProject.close()

  return closePromise.then(() => {
    return
  })
}

/**
 * Starts an async loop which cleans the temp directory repeatedly after set timeouts.
 * 
 * Stops on the iteration after the project is closed (or a different one is opened).
 * 
 * @param projectHandle The project to clean the temp directory of
 * @param timeout The timeout between cleanups
 * @param prevPromise The promise from the previous cleanup
 */
function tempCleanupLoop(projectHandle: ProjectHandle, timeout: number, prevPromise: Promise<void>) {
  if (currentOpenProject === null || !projectHandle.equals(currentOpenProject.projectHandle)) {
    return
  }

  console.log(`*** Starting project temp direcory cleanup ***`)

  const prom = prevPromise.then(() => { return cleanProjectTempDirectory(projectHandle) } ).then(() => console.log(`*** Finished project temp direcory cleanup ***`))

  setTimeout(tempCleanupLoop, timeout, projectHandle, timeout, prom)
}

/**
 * Get the path of the temp directory for the currently open project.
 * 
 * This directory is auto cleaned on a timer, with any files which are unused being deleted.
 */
function getTempDirectory() {
  if (currentOpenProject === null) {
    throw Error("No open project when calling getTempDirectory.");
  }

  return getProjectTempDirectory(currentOpenProject.projectHandle)
}

/**
 * Get the full path to the open projects recordings directory.
 *
 * All project recordings should be stored here by convention.
 */
function getRecordingsDirectory() {
  if (currentOpenProject === null) {
    throw Error('No open project when calling getRecordingsDirectory.')
  }

  return getProjectRecordingsDirectory(currentOpenProject.projectHandle)
}

/**
 * Get a readonly list of all the recordings associated with the currently open project.
 */
function getRecordingsList(): Readonly<Array<string>> {
  if (currentOpenProject === null) {
    throw Error('No open project when calling getRecordingsList.')
  }

  return currentOpenProject.projectConfig.recordings
}

/**
 * Creates a file for a recording and adds it to the list of files used in the current open project.
 *
 * @param recordingName The name of the new recording file
 * @returns An fs.FileHandle to the new recording file
 */
function addRecording(recordingName: string): Promise<FileHandle> {
  if (currentOpenProject === null) {
    throw Error('No open project when calling addRecording.')
  }

  currentOpenProject.addRecording(recordingName)

  return createProjectRecordingFile(currentOpenProject.projectHandle, recordingName)
  .catch(reason => {
    // if making the file fails, don't actually add to project
    if (currentOpenProject !== null) {
      const index = getRecordingsList().findIndex(v => { return v === recordingName })
      if (index !== null) {
        removeRecording(index)
      }
    }

    throw Error(reason)
  })
}

/**
 * Remove a recording file from the list of files used in the current open project.
 *
 * Note this does not delete the underlying file, it simply makes the project 'forget' about it.
 * Maybe this should be done here, not really sure.
 *
 * @param recordingIndex The index of the recording file to remove
 */
function removeRecording(recordingIndex: number): void {
  if (currentOpenProject === null) {
    throw Error('No open project when calling removeRecording.')
  }

  currentOpenProject.removeRecording(recordingIndex)
}

/**
 * Gets a named option from the config file of the currently open project.
 *
 * Do your own type checking on the result.
 *
 * @param option The name of the option to get
 * @returns The value of the option in the project, or null if the option doesn't exist
 */
function getOption(option: string): any {
  if (currentOpenProject === null) {
    throw Error('No open project when calling getOption.')
  }

  return currentOpenProject.getConfigOption(option)
}

/**
 * Set a named option in the config file of the currently open project.
 *
 * Only use JSON.stringify-able values here (no BigInt or cyclic objects).
 *
 * @param option The name of the option to check
 * @param value The value to set the option
 */
function setOption(option: string, value: any): void {
  if (currentOpenProject === null) {
    throw Error('No open project when calling setOption.')
  }

  currentOpenProject.setConfigOption(option, value)
}

/**
 * Remove a named option in the config file of the currently open project.
 *
 * Note: this deletes the mapping for this option in the config completely, so on next get it will return null.
 * Be careful.
 *
 * @param option The name of the option to remove
 */
function removeOption(option: string): void {
  if (currentOpenProject === null) {
    throw Error('No open project when calling removeOption.')
  }

  currentOpenProject.removeConfigOption(option)
}

export {
  // renamed to emphasise that shouldnt be used outside of projects module
  initialiseProjectConfig as internal_initialiseProjectConfig,
  Config as internal_Config, isConfig as internal_isConfig,

  openProject, closeProject,
  getTempDirectory,
  getRecordingsDirectory, getRecordingsList, addRecording, removeRecording,
  getOption, setOption, removeOption
}
