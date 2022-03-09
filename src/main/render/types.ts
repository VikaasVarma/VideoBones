interface EngineOptions {
  aspectRatio: string; // A:B format, e.g. 16:9
  audioBitRate: string;
  audioInputs: AudioInput[]; // required
  audioSampleRate: number;
  bufferSize: string;
  framesPerSecond: number;
  outputFile: string; // Ignored unless type is render
  outputResolution: Resolution;
  outputType: 'thumbnail' | 'preview' | 'render'; // required
  outputVolume: number;
  previewManifest: string; // Ignored unless type is preview
  thumbnailEvery: string; // X/Y format, X images every Y seconds
  startTime: number; // Measured in seconds
  videoBitRate: string;
  videoInputs: VideoInput[]; // required
}


interface AudioInput {
  files: string[]
  volumes: number[]
  interval: [number, number]
}

interface VideoInput {
  files: string[]
  screenStyle: '....' | '|..' | '_..'
  interval: [number, number]
  resolutions: Resolution[]
  crop_offsets: Resolution[]
  zoom_levels: number[]
}

interface VideoData {
    id: [number, number],
    file: string,
    interval: [number, number],
    position: Position,
    resolution: Resolution
}

interface Resolution {
  width: number;
  height: number;
}

interface Position {
  left: number | string;
  top: number | string;
}

export {
  AudioInput,
  EngineOptions,
  Position,
  Resolution,
  VideoInput,
  VideoData
};
