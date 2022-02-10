/**
 * Holds data from .bones project config files.
 */
export interface Config {
  /**
   * Holds a simple version tag for the project.
   *
   * Am keeping this in case we need to do versioning on configs down the line,
   * can use this to do things like update the .bones file structure from earlier versions.
   */
  version: number;
  projectName: string;
  value?: number;
}

/**
 * User-defined type guard for Config type.
 * 
 * Narrows type of o to Config if true.
 * 
 * @returns True if o is a valid Config object
 */
export function isConfig(o: any): o is Config {
  return  "projectName" in o && typeof o.projectName == "string" &&
          ("value" in o ? typeof o.value == "number" : true)
}

export class ConfigBuilder {
  private readonly _config: Config

  // ctor sets required members of Config
  constructor(projectName: string) {
    this._config = {
      version: 1,
      projectName: projectName,
    }
  }

  // setters for optional members
  value(value: number): ConfigBuilder {
    this._config.value = value
    return this
  }

  /**
   * Returns the resulting Config object
   */
  build(): Config {
    return this._config
  }
}
