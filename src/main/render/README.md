# render/

These modules handle setting up and interfacing with ffmpeg for video and audio rendering.

## Modules

### engine.ts

Spawns and kills ffmpeg processes on-demand, as well as builds cli argument lists for ffmpeg.

### ffmpeg.ts

Just provides a method to find the path to the ffmpeg binary in a platform-portable way.

### integratedServer.ts

Spins up a local http server to serve the output stream from ffmpeg processes to the frontend.

### ipcHandler.ts

Creates listeners for IPC messages from the frontend renderer thread to interact with the backend rendered.

### types.ts

Defines type interfaces, which are used to provide types for the render system.
