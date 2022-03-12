export interface EngineOptions {
  aspectRatio?: string; // A:B format, e.g. 16:9
  audioBitRate?: string;
  audioInputs: AudioInput[]; // not required, audio inputs are from other ways, not deleted for consistent
  audioSampleRate?: number;
  bufferSize?: string;
  framesPerSecond?: number;
  outputFile?: string; // Ignored unless type is render
  outputResolution?: Resolution;
  outputType: 'thumbnail' | 'preview' | 'render'; // required
  outputVolume?: number;
  previewManifest?: string; // Ignored unless type is preview
  videoBitRate?: string;
  videoInputs: VideoInput[]; // required
}

/**
 * Specifies audio tracks for a segment of the final render.
 *
 * Can be many audio files, along with a volume.
 * All the audio tracks in a single AudioInput are first volume scaled with their respective volume,
 * then overlayed and finally trimmed to the interval.
 * The AudioInput interface in mainly used in single editor page to passing a message to back end,
 * the audioOptions class will record them and apply the effect.
 */
export interface AudioInput {
  file: string;
  startTime: number;
  volume: number;
  reverb_active: boolean;
  reverb_delay_identifier: number;  //in ms
  reverb_decay_identifier: number;   //between 0 and 1
  declick_active: boolean;
  declip_active: boolean;
  echo_active: boolean;
  echo_delay_identifier: number;
  echo_decay_identifier: number;
}

/**
 * Specifies video tracks for a segment of the final render.
 *
 * Can be many video files, each with an associated Resolution.
 * We also have a screen style, which describes (in an abstract way) how the videos will be layed out in the render.
 *
 * In usage, @interface VideoInput comes as an array, so that the program can specify the change of screen-layout.
 *
 * All the videos in a single VideoInput are trimmed to the interval,
 * then transformed to conform to the layout specified in screenStyle.
 */
export interface VideoInput {
  cropOffsets: Resolution[];
  files: string[];
  interval: [number, number];
  screenStyle: '....' | '|..' | '_..' | '.';
  resolutions: Resolution[];
  zoomLevels: number[];
}

export interface VideoData {
  cropOffset: Position;
  cropSize: Resolution;
  id: [number, number];
  file: string;
  interval: [number, number];
  position: Position;
  resolution: Resolution;
}

export interface VideoOption {
  file: string;
  brightness_enable: boolean;
  brightness: number;
  contrast_enable: boolean;
  contrast: number;
  balance_enable: boolean;
  r_balance: number;
  g_balance: number;
  b_balance: number;
  blur_enable: boolean;
  blur_radius: number;
}

export interface Resolution {
  height: number;
  width: number;
}

export interface Position {
  x: number;
  y: number;
}
