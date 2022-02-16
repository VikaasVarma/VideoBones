import { existsSync, readFileSync } from 'fs'
import * as fs from 'fs/promises'

import path from 'path'

import { ProjectHandle } from './projects'
import { internal_Config as Config, internal_isConfig as isConfig } from './config'

/**
 * Constant specifying the project subdirectory to create for recordings.
 */
export const recordingsDirectoryName = 'recordings'

/**
 * Get path to a project's recordings directory.
 *
 * All recordings made within the project should be stored here by convention.
 */
export function getProjectRecordingsDirectory(projectHandle: ProjectHandle) {
  return path.join(projectHandle.projectPath, recordingsDirectoryName)
}

/**
 * Asynchronously writes a full project config to a directory, overwriting if present.
 *
 * @param directory The directory to write this config to
 * @param cfg The config object to write
 * @returns A promise which resolves when the write is complete
 */
export function writeDirectoryConfig(directory: string, cfg: Config): Promise<void> {
  return fs.writeFile(path.join(directory, '.bones'), JSON.stringify(cfg)).catch(reason => {
    throw Error(`Failed to write project config, reason: ${reason}`)
  })
}

/**
 * Asynchronously writes a full project config to project directory, overwriting if present.
 *
 * @param projectHandle The project to write this config to
 * @param cfg The config object to write
 * @returns A promise which resolves when the write is complete
 */
export function writeProjectConfig(projectHandle: ProjectHandle, cfg: Config): Promise<void> {
  return writeDirectoryConfig(projectHandle.projectPath, cfg).catch(reason => {
    throw Error(`Error writing config in project ${projectHandle.projectName}, reason: ${reason}`)
  })
}

/**
 * Read in a config file from a directory.
 *
 * @param project The directory to read the config from
 * @returns A promise which resolves to an object representing the config
 */
export function readDirectoryConfig(directory: string): Promise<Config> {
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
 * @returns A promise which resolves to an object representing the project config
 */
export function readProjectConfig(projectHandle: ProjectHandle): Promise<Config> {
  return readDirectoryConfig(projectHandle.projectPath).catch(reason => {
    throw Error(`Error reading config in project ${projectHandle.projectName}, reason: ${reason}`)
  })
}
