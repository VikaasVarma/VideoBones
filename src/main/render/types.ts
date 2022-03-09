/**
 * Packages all the parameters for a run of the render process.
 */
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

/**
 * Specifies audio tracks for a segment of the final render.
 *
 * Can be many audio files, along with a volume.
 * All the audio tracks in a single AudioInput are first volume scaled with their respective volume,
 * then overlayed and finally trimmed to the interval.
 */
interface AudioInput {
  files: string[];
  volumes: number[];
  interval: [number, number];
}

/**
 * Specifies video tracks for a segment of the final render.
 *
 * Can be many video files, each with an associated Resolution.
 * We also have a screen style, which describes (in an abstract way) how the videos will be layed out in the render.
 *
 * All the videos in a single VideoInput are trimmed to the interval,
 * then transformed to conform to the layout specified in screenStyle.
 */
interface VideoInput {
  files: string[];
  screenStyle: '....' | '|..' | '_..';
  interval: [number, number];
  resolution: Resolution[];
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
  VideoInput
};
