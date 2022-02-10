import { throws } from 'assert'
import exp from 'constants'
import { app } from 'electron'

import { existsSync, readFileSync } from 'fs'
import * as fs from 'fs/promises'

import path from 'path'
import { json } from 'stream/consumers'

import { Config, ConfigBuilder, isConfig } from './config'


/**
 * The file in which project handles are persisted.
 */
const projectHandlesFile = path.join(app.getPath("userData"), "handles.json")

// TODO: find a better way to init this
//        also, find out if promises resolve before exit, or find out how to make sure they do (so we dont lose a write on exit if still trying)
/**
 * Initially load the handles, or empty list if not present.
 */
var handles = existsSync(projectHandlesFile) ? JSON.parse(readFileSync(projectHandlesFile).toString()) :
                                                  []

/**
 * Keeps track of the last write promise active on the handles file.
 * 
 * Allows us to chain future writes to the handles file after this promise is resolved.
 */
var currentHandlesFileWritePromise: Promise<void> = Promise.resolve();

/**
 * Holds information on a project the app currently knows about / tracks.
 */
class ProjectHandle {
  projectPath: string

  getProjectName(): string {
    return path.basename(this.projectPath)
  }

  constructor(projectPath: string) {
    this.projectPath = projectPath
  }

  equals(other: ProjectHandle): boolean {
    return this.projectPath == other.projectPath
  }
}

/**
 * Creates resources for a new project.
 * 
 * Makes project directory structure, adds project to tracked projects, writes an initial config.
 * 
 * @param parentDirectory The parent directory for the project
 * @param projectName The name of the project
 * @returns The project handle
 */
export function createProject(parentDirectory: string, projectName: string): ProjectHandle {
  const projectDirectory = createProjectDirectory(parentDirectory, projectName)

  const project = trackProject(projectDirectory)

  const config = new ConfigBuilder(projectName).value(10).build()

  writeProjectConfig(project, config)

  return project
}

/**
 * Sets up the folders for a new project.
 *
 * @param parentDirectory The parent of the new project directory
 * @param projectName The name of the new project
 *
 * @returns The full path to the project directory
 */
function createProjectDirectory(parentDirectory: string, projectName: string): string {

  const projectDirectory = path.format({ dir: parentDirectory, base: projectName })

  if (existsSync(projectDirectory)) throw new Error(`Project directory already exists: ${projectDirectory}`)

  // create project directory structure
  fs.mkdir(projectDirectory)
  .then(() => { return fs.mkdir(path.join(projectDirectory, "recordings"))})
  .catch(reason => {throw new Error(`Failed to create project directory, reason: ${reason}`)})

  return projectDirectory
}

/**
 * Async writes a full project config, overwritting if present.
 * 
 * @param project The project to write this config to
 * @param cfg The config object to write
 */
function writeProjectConfig(project: ProjectHandle, cfg: Config): void {
  fs.writeFile(path.join(project.projectPath, ".bones"), JSON.stringify(cfg))
  .catch(reason => {throw new Error(`Failed to write project config, reason: ${reason}`)})
}

/**
 * Async read in the config file from a project.
 * 
 * @param project The project to read the config from
 * @returns An promise which resolves to an object representing the project config
 */
function readProjectConfig(project: ProjectHandle): Promise<Config> {
  const configPath = path.join(project.projectPath, ".bones")

  // just check the config file exists first
  if (!existsSync(configPath)) { throw Error(`No existing config in project ${project.getProjectName()} at ${project.projectPath}.`) }

  // async read the config fiel in
  return fs.readFile(configPath)
  .then(buf => {
    var cfg: Config = JSON.parse(buf.toString())

    if (isConfig(cfg)) {
      return Promise.resolve(cfg)
    } else {
      return Promise.reject(`Config is not correctly formatted: ${cfg}.`)
    }
  })
}

/**
 * Adds a new project to the list of projects we know about.
 * 
 * @param projectDirectory The directory of the project to add
 * @returns The project handle for the newly tracked project
 */
function trackProject(projectDirectory: string): ProjectHandle {
  var projectHandle = new ProjectHandle(projectDirectory);

  handles.push(projectHandle)

  // write this update to file, chaining it to previous promises
  var doWrite = () => fs.writeFile(projectHandlesFile, handles)
  currentHandlesFileWritePromise = currentHandlesFileWritePromise.then(doWrite, doWrite)

  return projectHandle
}

/**
 * Removes a project handle from the list of projects we know about.
 * 
 * @param projectHandle The handle to remove
 */
function untrackProject(projectHandle: ProjectHandle): void {
  var indexToRemove = handles.findIndex(e => projectHandle.equals(e))

  if (indexToRemove == -1) return

  // remove the handle from the handles array
  handles.splice(indexToRemove, 1)

  // write this update to file, chaining it to previous promises
  var doWrite = () => fs.writeFile(projectHandlesFile, handles)
  currentHandlesFileWritePromise = currentHandlesFileWritePromise.then(doWrite, doWrite)
}
