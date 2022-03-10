import path from 'node:path';
import { existsSync } from 'node:fs';
import * as fs from 'node:fs/promises';


import { ProjectHandle } from './projects';
import { internal_Config as Config, internal_isConfig as isConfig } from './config';

/**
 * How long in milliseconds since last modification or access should temp files be cleaned.
 */
const tempDeathTimeMs = 60000;

/**
 * Regex to prevent certain files in temp from being removed.
 *
 * Any file in the temp folder with a name matching this regex will never be cleaned up.
 */
const tempDeathExclusionRegex = /^.*$/;  // currently matches nothing

/**
 * Constant specifying the project subdirectory to create for recordings.
 */
export const recordingsDirectoryName = 'recordings';

/**
 * Get path to a project's recordings directory.
 *
 * All recordings made within the project should be stored here by convention.
 */
export function getProjectRecordingsDirectory(projectHandle: ProjectHandle) {
  return path.join(projectHandle.projectPath, recordingsDirectoryName);
}

/**
 * Constant specifying the project subdirectory to create for temp files.
 */
export const tempDirectoryName = 'tmp';


export function getProjectTempDirectory(projectHandle: ProjectHandle) {
  return path.join(projectHandle.projectPath, tempDirectoryName);
}

/**
 * Removes all files from project temp directory if they are too old.
 *
 * @param projectHandle Project to clean tmp files from
 * @returns A promise which resolves when cleanup is done
 */
export function cleanProjectTempDirectory(projectHandle: ProjectHandle): Promise<void> {
  const tmp = getProjectTempDirectory(projectHandle);

  const tempFilesPromise = fs.readdir(tmp);

  return tempFilesPromise.then(files => {
    let prom = Promise.resolve();

    for (const file of files) {
      // test for death exclusion
      if (tempDeathExclusionRegex.test(file)){
        continue;
      }

      const fullPath = path.join(tmp, file);
      prom = prom.then(() => {
        return fs.stat(fullPath);
      })
        .then(stats => {
          const lastAccessed = stats.atime;
          const lastModified = stats.mtime;

          const elapsed = Math.min(Date.now() - lastAccessed.getTime(), Date.now() - lastModified.getTime());

          if (elapsed > tempDeathTimeMs) {
            console.log(`Removing ${file}.`);
            return fs.rm(fullPath);
          }
        })
        .catch((error: Error) => {
          console.log(`Failed to cleanup temp file '${file}', reason: ${error}`);
        });
    }

    return prom;
  })
    .catch((error: Error) => {
      console.log(`Failed to cleanup temp files, reason: ${error}`);
    });
}

/**
 * Asynchronously writes a full project config to a directory, overwriting if present.
 *
 * @param directory The directory to write this config to
 * @param cfg The config object to write
 * @returns A promise which resolves when the write is complete
 */
export function writeDirectoryConfig(directory: string, cfg: Config): Promise<void> {
  const file = path.join(directory, '.bones');
  const cfgString = JSON.stringify(cfg);

  return fs.writeFile(file, cfgString)
    .catch((error: Error) => {
      throw new Error(`Failed to write directory config, reason: ${error}`);
    });
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
    throw Error(`Error writing config in project ${projectHandle.projectName}, reason: ${reason}`);
  });
}

/**
 * Read in a config file from a directory.
 *
 * @param project The directory to read the config from
 * @returns A promise which resolves to an object representing the config
 */
export function readDirectoryConfig(directory: string): Promise<Config> {
  const configPath = path.join(directory, '.bones');

  // just check the config file exists first
  if (!existsSync(configPath)) {
    throw Error(`No existing config in directory ${directory}.`);
  }

  // async read the config file in
  return fs.readFile(configPath)
    .then(buf => {
      const cfg: Config = JSON.parse(buf.toString());

      // ensure the config is properly formatted
      if (isConfig(cfg)) {
        return cfg;
      } else {
        throw Error(`Config is not correctly formatted: ${cfg}.`);
      }

      // TODO: add config version check and version updating if needed
    });
}

/**
 * Read in the config file from a project.
 *
 * @param project The project to read the config from
 * @returns A promise which resolves to an object representing the project config
 */
export function readProjectConfig(projectHandle: ProjectHandle): Promise<Config> {
  return readDirectoryConfig(projectHandle.projectPath).catch((error: Error) => {
    throw new Error(`Error reading config in project ${projectHandle.projectName}, reason: ${error}`);
  });
}

/**
 * Creates a new file for a recording inside the project.
 *
 * @param projectHandle The project to create the recording in
 * @param name The name of the recording file
 * @returns TODO: Storage pls fix
 */
export function createProjectRecordingFile(projectHandle: ProjectHandle, name: string): string {
  return path.join(getProjectRecordingsDirectory(projectHandle), name);
}
