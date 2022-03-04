import { app } from 'electron';

import { existsSync, readFileSync } from 'fs';
import * as fs from 'fs/promises';

import path from 'path';

import { readDirectoryConfig, recordingsDirectoryName, tempDirectoryName } from './storage';
import { internal_initialiseProjectConfig as initialiseProjectConfig } from './config';

/**
 * Holds information on a project the app currently knows about / tracks.
 */
class ProjectHandle {
  projectPath: string;
  projectName: string;

  constructor(projectPath: string, projectName: string) {
    this.projectPath = projectPath;
    this.projectName = projectName;
  }

  static copy(other: ProjectHandle) {
    return new ProjectHandle(other.projectPath, other.projectName);
  }

  equals(other: ProjectHandle): boolean {
    return this.projectPath === other.projectPath;
  }

  /**
   * User-defined type guard for project handles.
   */
  static isProjectHandle(h: any): h is ProjectHandle {
    return 'projectPath' in h && typeof h.projectPath === 'string'
    && 'projectName' in h && typeof h.projectName === 'string';
  }
}

/**
 * The file in which project handles are persisted.
 */
const projectHandlesFile = path.join(app.getPath('userData'), 'handles.json');

/**
 * Holds the list of handles in memory.
 *
 * Is just a wrapper for a JSON array of handles, with automatic writeback on update.
 * Read in at startup (or initialised to empty list if file not present).
 */
const handles = {
  // TODO: find out if promises resolve before exit,
  //        or find out how to make sure they do (so we dont lose a write on exit if still unresolved)
  /**
   * Keeps track of the last write promise active on the handles file.
   *
   * Allows us to chain future writes to the handles file after this promise is resolved.
   */
  currentHandlesFileWritePromise: Promise.resolve(),
  array: existsSync(projectHandlesFile)
    ? (() => {
      const json = JSON.parse(readFileSync(projectHandlesFile).toString());
      const out: Array<ProjectHandle> = [];
      json.forEach((e: any) => {
        if (ProjectHandle.isProjectHandle(e)) {
          if (existsSync(e.projectPath)){
            out.push(ProjectHandle.copy(e));
          } else {
            console.log(`The project folder for handle ${e} does not exist, removing the handle.`);
          }
        } else {
          console.log(`Found malformed project handle: ${e}`);
        }
      });
      return out;
    })()
    : [],
  write: function () {
    const doWrite = () => {
      return fs.writeFile(projectHandlesFile, JSON.stringify(this.array));
    };
    this.currentHandlesFileWritePromise = this.currentHandlesFileWritePromise.then(
      doWrite,
      reason => {
        console.log(`Previous handles write failed, reason: ${reason}`);
        return doWrite();
      }
    );
  },
  push: function(handle: ProjectHandle) {
    this.array.push(handle);
    this.write();
  },
  remove: function(handle: ProjectHandle) {
    const indexToRemove = this.array.findIndex((e: any) => {
      if (ProjectHandle.isProjectHandle(e)) {
        return handle.equals(e);
      } else {
        // there is a malformed entry, ignore it
        return false;
      }
    });

    if (indexToRemove === -1) return;

    // remove the handle from the handles array
    this.array.splice(indexToRemove, 1);

    this.write();
  }
};

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
  const projectDirectoryPromise = createProjectDirectory(parentDirectory, projectName);

  const projectHandlePromise = projectDirectoryPromise.then(projectDir => {
    return initialiseProjectConfig(projectDir, projectName)
      .then(() => {
        return trackProject(projectDir);
      }, reason => {
        throw Error(`Failed to write initial config, reason: ${reason}`);
      })
      .catch(reason => {
        throw Error(`Failed to track new project, reason: ${reason}`);
      });
  });

  return projectHandlePromise;
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

  const projectDirectory = path.format({ dir: parentDirectory, base: projectName });

  if (existsSync(projectDirectory)) {
    throw Error(`Project directory already exists: ${projectDirectory}`);
  }

  // create project directory structure
  // chain promises so subdirs are only created once their parents are avaliable
  return fs.mkdir(projectDirectory)
    .then(() => {
      // make subdirs
      return fs.mkdir(path.join(projectDirectory, recordingsDirectoryName))
        .then(() => {
          return fs.mkdir(path.join(projectDirectory, tempDirectoryName));
        });
    })
    .then(() => {
      return projectDirectory;
    })
    .catch(reason => {
      throw new Error(`Failed to create project directory, reason: ${reason}`);
    });
}

/**
 * Adds a new project to the list of projects we know about, and creates a project handle for it.
 *
 * @param projectDirectory The directory of the project to add
 * @returns The project handle for the newly tracked project
 */
function trackProject(projectDirectory: string): Promise<ProjectHandle> {

  const cfgPromise = readDirectoryConfig(projectDirectory).catch(reason => {
    throw Error(`Failed to read a valid config file in directory ${projectDirectory}, reason: ${reason}`);
  });

  return cfgPromise.then(config => {
    const projectHandle = new ProjectHandle(projectDirectory, config.projectName);
    handles.push(projectHandle);
    return projectHandle;
  });
}

/**
 * Removes a project handle from the list of projects we know about.
 *
 * @param projectHandle The handle to remove
 */
function untrackProject(projectHandle: ProjectHandle): void {
  handles.remove(projectHandle);
}

/**
 * Get a readonly view of the tracked project handles list.
 */
function getTrackedProjects(): Readonly<Array<ProjectHandle>> {
  return handles.array;
}

export {
  ProjectHandle, createProject,
  trackProject, untrackProject, getTrackedProjects
};
