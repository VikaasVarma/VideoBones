interface EngineOptions {
  aspectRatio: string // A:B format, e.g. 16:9
  audioBitRate: string
  audioInputs: AudioInput[] // required
  audioSampleRate: number
  bufferSize: string
  framesPerSecond: number
  outputFile: string // Ignored unless type is render
  outputResolution: Resolution
  outputType: 'thumbnail' | 'preview' | 'render' // required
  outputVolume: number
  previewManifest: string // Ignored unless type is preview
  thumbnailEvery: string // X/Y format, X images every Y seconds
  startTime: number // Measured in seconds
  videoBitRate: string
  videoInputs: VideoInput[] // required
}

interface Input {
  file: string
  startTime: number // Measured in seconds
}

interface AudioInput extends Input {
  //TODO: why are both audioinput and videoinput required when videoinput extends Audioinput?
  volume: number
  echo_active: boolean
  reverse_active: boolean
  echo_in_gain: number
  echo_out_gain: number
  echo_delays: number[]
  echo_decays: number[]
  declick_active: boolean
  declip_active: boolean
}

interface VideoInput extends AudioInput {
  position: Position
  resolution: Resolution
}

interface Resolution {
  width: number
  height: number
}

interface Position {
  left: number | string
  top: number | string
}

export {
  AudioInput,
  EngineOptions,
  Input,
  Position,
  Resolution,
  VideoInput
};
