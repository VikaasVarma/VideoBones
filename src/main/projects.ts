import { app } from 'electron'

import { existsSync, read, readFileSync } from 'fs'
import * as fs from 'fs/promises'

import path from 'path'

import { Config, ConfigBuilder, isConfig } from './config'

/**
 * Module constant specifying the project subdirectory for recordings.
 */
const recordingsDirectoryName = 'recordings'

/**
 * Holds information on a project the app currently knows about / tracks.
 */
class ProjectHandle {
  projectPath: string
  projectName: string

  constructor(projectPath: string, projectName: string) {
    this.projectPath = projectPath
    this.projectName = projectName
  }

  static copy(other: ProjectHandle) {
    return new ProjectHandle(other.projectPath, other.projectName)
  }

  equals(other: ProjectHandle): boolean {
    return this.projectPath === other.projectPath
  }

  /**
   * User-defined type guard for project handles.
   */
  static isProjectHandle(h: any): h is ProjectHandle {
    return 'projectPath' in h && typeof h.projectPath === 'string'
    && 'projectName' in h && typeof h.projectName === 'string'
  }
}

/**
 * The file in which project handles are persisted.
 */
const projectHandlesFile = path.join(app.getPath('userData'), 'handles.json')

// TODO: find out if promises resolve before exit,
//        or find out how to make sure they do (so we dont lose a write on exit if still unresolved)
/**
 * Keeps track of the last write promise active on the handles file.
 *
 * Allows us to chain future writes to the handles file after this promise is resolved.
 */
let currentHandlesFileWritePromise: Promise<void> = Promise.resolve()

// TODO: find a better way to init this
/**
 * Holds the list of handles in memory.
 *
 * Is just a wrapper for a JSON array of handles, with automatic writeback on update.
 * Read in at startup (or initialised to empty list if file not present).
 */
const handles = {
  array: existsSync(projectHandlesFile)
    ? (() => {
      const json = JSON.parse(readFileSync(projectHandlesFile).toString())
      const out: Array<ProjectHandle> = []
      json.forEach((e: any) => {
        if (ProjectHandle.isProjectHandle(e)) {
          out.push(ProjectHandle.copy(e))
        } else {
          console.log(`Found malformed project handle: ${e}`)
        }
      })
      return out
    })()
    : [],
  write: function () {
    const doWrite = () => {
      return fs.writeFile(projectHandlesFile, JSON.stringify(this.array))
    }
    currentHandlesFileWritePromise = currentHandlesFileWritePromise.then(
      doWrite,
      reason => {
        console.log(`Previous handles write failed, reason: ${reason}`)
        return doWrite()
      }
    )
  },
  push: function(handle: ProjectHandle) {
    this.array.push(handle)
    this.write()
  },
  remove: function(handle: ProjectHandle) {
    const indexToRemove = this.array.findIndex((e: any) => {
      if (ProjectHandle.isProjectHandle(e)) {
        return handle.equals(e)
      } else {
        // there is a malformed entry, ignore it
        return false
      }
    })

    if (indexToRemove === -1) return

    // remove the handle from the handles array
    this.array.splice(indexToRemove, 1)

    this.write()
  }
}

/**
 * Creates resources for a new project.
 *
 * Makes project directory structure, adds project to tracked projects, writes an initial config.
 *
 * @param parentDirectory The parent directory for the project
 * @param projectName The name of the project
 * @returns A promise which resolves to the new project's handle
 */
function createProject(parentDirectory: string, projectName: string): Promise<ProjectHandle> {
  const projectDirectoryPromise = createProjectDirectory(parentDirectory, projectName)

  const config = new ConfigBuilder(projectName).value(10).build()

  const projectHandlePromise = projectDirectoryPromise.then(projectDir => {
    return writeDirectoryConfig(projectDir, config)
      .then(() => {
        return trackProject(projectDir)
      }, reason => {
        throw Error(`Failed to write initial config, reason: ${reason}`)
      })
      .catch(reason => {
        throw Error(`Failed to track new project, reason: ${reason}`)
      })
  })

  return projectHandlePromise
}

/**
 * Sets up the folders for a new project.
 *
 * @param parentDirectory The parent of the new project directory
 * @param projectName The name of the new project
 *
 * @returns A promise which resolves to the full project path once the directories have been created.
 */
function createProjectDirectory(parentDirectory: string, projectName: string): Promise<string> {

  const projectDirectory = path.format({ dir: parentDirectory, base: projectName })

  if (existsSync(projectDirectory)) {
    throw Error(`Project directory already exists: ${projectDirectory}`)
  }

  // create project directory structure
  // chain promises so subdirs are only created once their parents are avaliable
  return fs.mkdir(projectDirectory)
    .then(() => {
      return fs.mkdir(path.join(projectDirectory, recordingsDirectoryName))
    })
    .then(() => {
      return projectDirectory
    })
    .catch(reason => {
      throw new Error(`Failed to create project directory, reason: ${reason}`)
    })
}

/**
 * Asynchronously writes a full project config to a directory, overwriting if present.
 *
 * @param directory The directory to write this config to
 * @param cfg The config object to write
 */
function writeDirectoryConfig(directory: string, cfg: Config): Promise<void> {
  return fs.writeFile(path.join(directory, '.bones'), JSON.stringify(cfg))
    .catch(reason => {
      throw Error(`Failed to write project config, reason: ${reason}`)
    })
}

/**
 * Asynchronously writes a full project config, overwritting if present.
 *
 * @param project The project to write this config to
 * @param cfg The config object to write
 */
function writeProjectConfig(project: ProjectHandle, cfg: Config): Promise<void> {
  return writeDirectoryConfig(project.projectPath, cfg)
}

/**
 * Read in a config file from a directory.
 *
 * @param project The directory to read the config from
 * @returns An promise which resolves to an object representing the config
 */
function readDirectoryConfig(directory: string): Promise<Config> {
  const configPath = path.join(directory, '.bones')

  // just check the config file exists first
  if (!existsSync(configPath)) {
    throw Error(`No existing config in directory ${directory}.`)
  }

  // async read the config file in
  return fs.readFile(configPath)
    .then(buf => {
      const cfg: Config = JSON.parse(buf.toString())

      // ensure the config is properly formatted
      if (isConfig(cfg)) {
        return cfg
      } else {
        throw Error(`Config is not correctly formatted: ${cfg}.`)
      }

      // TODO: add config version check and version updating if needed
    })
}

/**
 * Read in the config file from a project.
 *
 * @param project The project to read the config from
 * @returns An promise which resolves to an object representing the project config
 */
function readProjectConfig(project: ProjectHandle): Promise<Config> {
  return readDirectoryConfig(project.projectPath).catch(reason => {
    throw Error(`Error reading config in project ${project.projectName}: ${e}`)
  })
}

/**
 * Adds a new project to the list of projects we know about, and creates a project handle for it  .
 *
 * @param projectDirectory The directory of the project to add
 * @returns The project handle for the newly tracked project
 */
function trackProject(projectDirectory: string): Promise<ProjectHandle> {

  const cfgPromise = readDirectoryConfig(projectDirectory)

  return cfgPromise.then(config => {
    const projectHandle = new ProjectHandle(projectDirectory, config.projectName)
    handles.push(projectHandle)
    return projectHandle
  })
}

/**
 * Removes a project handle from the list of projects we know about.
 *
 * @param projectHandle The handle to remove
 */
function untrackProject(projectHandle: ProjectHandle): void {
  handles.remove(projectHandle)
}

/**
 * Get a readonly view of the tracked project handles list.
 */
function getTrackedProjects(): Readonly<Array<ProjectHandle>> {
  return handles.array
}

/**
 * Get path to the project's recordings directory.
 *
 * All recordings made within the project should be stored here, then added to the project with addProjectRecording.
 */
function getProjectRecordingsDirectory(projectHandle: ProjectHandle) {
  return path.join(projectHandle.projectPath, recordingsDirectoryName)
}

/**
 * Adds a recording file path to the list of files used in the project.
 *
 * Creation of recordings should be handled elsewhere,
 * and resulting files stored in the directory returned by getProjectRecordingsDirectory.
 *
 * @param projectHandle The project to add the file to
 * @param recordingRelativePath The path to the recording, relative to project root
 */
function addProjectRecording(projectHandle: ProjectHandle, recordingRelativePath: string): void {
  readProjectConfig(projectHandle)
    .then(config => {
      if (typeof config.recordings === 'undefined') {
        config.recordings = []
      }

      config.recordings.push(recordingRelativePath)

      return writeProjectConfig(projectHandle, config).catch(reason => {
        throw Error(`Failed to write config after adding recording, reason: ${reason}`)
      })
    })
}

/**
 * Remove a recording file from the list of files used in the project.
 *
 * Note this does not delete the underlying file, it simply makes the project 'forget' about it.
 * File deletion should be handled elsewhere.
 *
 * @param projectHandle The project to remove the file from
 * @param recordingIndex The index of the recodring file to remove
 */
function removeProjectRecording(projectHandle: ProjectHandle, recordingIndex: number): void {
  readProjectConfig(projectHandle)
    .then(config => {
      if (typeof config.recordings === 'undefined') {
        return
      }

      config.recordings.splice(recordingIndex, 1)

      return writeProjectConfig(projectHandle, config).catch(reason => {
        throw Error(`Failed to write config after removing recording, reason: ${reason}`)
      })
    })
}

export {
  ProjectHandle, createProject,
  trackProject, untrackProject, getTrackedProjects,
  writeProjectConfig, readProjectConfig,
  getProjectRecordingsDirectory, addProjectRecording, removeProjectRecording
}
