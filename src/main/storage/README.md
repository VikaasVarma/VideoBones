# Storage stuff

The apis provided here make heavy use of promises, it will be easier to use this code if you understand the JS promises stuff.

## Modules

### Storage

Implementation module handling file operations (don't use directly).

### Projects

Handles project management stuff - creating projects, getting tracked projects, etc.

Mostly async using promises.

### Config

Handles individual project data/config options.

Mostly synchronous, with background file ops.

## Basic usage

```
import * as projects from '/storage/projects'
import * as config from '/storage/config'
```

#### Creating a new project

```
const project: Promise<ProjectHandle> = projects.createProject("{ Parent directory }", "{ Project name }")
```

Returns a promise resolving to a handle for the new project, which is then used to open the project.

#### Open a project

```
const openPromise: Promise<void> = config.openProject("{ Project handle }")
```

Returns a promise which resolves when the project is open. Needs to be done before calling any other config module methods.

### Recordings

```
const recordingsDirectory: string = config.getRecordingsDirectory()
```

Returns the full path to the recordings dir for the open project.

```
const recordings: Readonly<Array<string>> = config.getRecordingsList()
```

Returns a readonly view of the recordings files currently associated with the project.

```
config.addRecording("{ Recording path }")
```

Creates a file for a new recording for the open project. Returns a promise resolving to a file handle for the new file (use this to write into the file).

```
config.removeRecording({ Recording index })
```

Removes a recording file from the project, using the index from the getRecordingsList(). At the moment, doesn't actually delete the underlying file, do we want this?

### Get/set options

```
config.setOption("{ Option name }", { Option value })
```

Sets an option for this project, which is saved to file and persisted across executions. Basically just a key-value pair (string, object) which stores any JS object. Don't use BigInt or cyclic object as JSON.stringify hates.

```
const opt: any = config.getOption("{ Option name }")
```

Returns the value associated with an option previously set. null if option was never set. Do your own type checking on the result.

```
config.removeOption("{ Option name }")
```

Removes an option from the project completely, as if it was never set.

#### Temp files

```
const tempDirectory: string = config.getTempDirectory()
```

Returns the directory for temp files for the currently opened project.

This directory is automatically cleaned regularly (approx every 1 minute for now), and any files which have not been accessed or modified for too long will be deleted. Be aware of this when having long-lived temp files.

[The storage module](storage.ts) contains a regex tempDeathExclusionRegex. Files in the temp directories matching this regex will never be cleaned. Add to this to prevent your temp files being deleted automatically (note the files become your responsibility, try not to bloat the dir too much).