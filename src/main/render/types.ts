interface EngineOptions {
  aspectRatio: string; // A:B format, e.g. 16:9
  audioBitRate: string;
  audioInputs: AudioInput[]; // not required, audio inputs are from other ways, not deleted for consistent
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

interface AudioInput{
  file: string;
  startTime: number;
  volume: number;
  reverb_active: boolean;
  reverb_delay_identifier: number;  //in ms
  reverb_decay_identifier: number;   //between 0 and 1
  declick_active: boolean;
  declip_active: boolean;
}

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
