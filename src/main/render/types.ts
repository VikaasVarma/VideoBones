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
  videoBitRate: string;
  videoInputs: VideoInput[]; // required
}

class AudioInput {
  file: string;
  startTime: number;
  volume: number;
  reverb_active: 'Off'|'Low'|'High';
  declick_active: boolean;
  declip_active: boolean;

  constructor(
    file: string,
    startTime = 0,
    volume = 1.0,
    reverb_active: 'Off'|'Low'|'High' = 'Off',
    declick_active = true,
    declip_active = true
  ){
    this.file = file;
    this.startTime = startTime;
    this.volume = volume;
    this.reverb_active = reverb_active;
    this.declick_active = declick_active;
    this.declip_active = declip_active;
  }

  getDeclickArgs(): string{
    let s = '';
    if (this.declick_active){
      s = 'adeclip=window=55:overlap=75:arorder=8:threshold=10:hsize=1000:method=add,';
    }
    return s;
  }

  getDeclipArgs(): string{
    let s = '';
    if (this.declip_active) {
      s = 'adeclip=window=55:overlap=75:arorder=8:threshold=10:hsize=1000:method=add,';
    }
    return s;
  }

  getReverbArgs(): string{
    let s = '';
    if (this.reverb_active === 'High'){
      s = 'aecho=0.8:0.9:500:0.5,';
    } else if (this.reverb_active === 'Low'){
      s = 'aecho=0.8:0.88:60:0.4,';
    }
    return s;
  }
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
