import { app } from 'electron'

import fs from 'fs'
import path from 'path'

import { Config, ConfigBuilder } from './config'

/**
 * Holds information on a project the app currently knows about / tracks.
 */
class Project {
  /**
   * Holds a simple version tag for the project.
   *
   * Am keeping this in case we need to do versioning on configs down the line,
   * can use this to do things like update the .bones file structure from earlier versions.
   */
  version = 1

  projectName: string
  projectPath: string

  constructor(projectName:string, projectPath: string) {
    this.projectName = projectName
    this.projectPath = projectPath
  }
}

export function createProject(parentDirectory: string, projectName: string) {
  const projectDirectory = createProjectDirectory(parentDirectory, projectName)

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

  if (fs.existsSync(projectDirectory)) throw new Error(`Project directory already exists: ${projectDirectory}`)

  // create top-level project dir
  fs.mkdirSync(projectDirectory)

  // create project recordings dir
  //fs.mkdirSync(path.join(projectDirectory, "recordings"));

  const config = new ConfigBuilder(projectName).value(10).build()

  return projectDirectory
}

function writeProjectConfig(project: Project, cfg: Config) {
  if (fs.existsSync(path.join(project.projectPath, ".bones")) {

  }
}

function readProjectConfig(project: Project): Config {
  const configPath = path.join(project.projectPath, ".bones")

  if (!fs.existsSync(configPath) {
    throw Error(`No existing config in project ${project.projectName} at ${project.projectPath}.`)
  }

  var cfg = fs.readFileSync(configPath)

  
}

/**
 * Adds a new project to the list of projects we know about.
 *
 * @param projectDirectory The directory of the project to add.
 */
function trackProject(projectDirectory: string) {

}
