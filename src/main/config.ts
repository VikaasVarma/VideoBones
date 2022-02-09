/**
 * Holds data from .bones project config files.
 */
export interface Config {
  projectName: string;
  value: number;
}

export class ConfigBuilder {
  private readonly _config: Config

  constructor(projectName: string) {
    this._config = {
      // required parameters
      projectName: projectName,

      // defaults for optional parameters
      value: 0
    }
  }

  value(value: number): ConfigBuilder {
    this._config.value = value
    return this
  }

  build(): Config {
    return this._config
  }
}
