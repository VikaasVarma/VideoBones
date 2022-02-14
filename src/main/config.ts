/**
 * Holds data from .bones project config files.
 */
export interface Config {
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
  recordings?: Array<string>;
}

/**
 * User-defined type guard for Config type.
 *
 * Narrows type of o to Config if true.
 *
 * @returns True if o is a valid Config object
 */
export function isConfig(o: any): o is Config {
  return  'projectName' in o && typeof o.projectName === 'string'
          && 'recordings' in o && o.recordings.constructor === Array
}

export class ConfigBuilder {
  private readonly _config: Config

  // ctor sets required members of Config
  constructor(projectName: string) {
    this._config = {
      version: 1,
      projectName: projectName
    }
  }

  // setters for optional members
  recordings(recordings: []): ConfigBuilder {
    this._config.recordings = recordings
    return this
  }

  /**
   * Returns the resulting Config object
   */
  build(): Config {
    return this._config
  }
}
