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

class Input {
  file: string;
  startTime: number; // Measured in seconds

  constructor(file:string, start:number){
    this.file=file;
    this.startTime=start;
  }
}

 class AudioInput extends Input {
  volume: number;
  reverb_active: 'Off'|'Low'|'High';
  declick_active: boolean;
  declip_active: boolean;

  constructor(
    file:string,
    startTime:number = 0,
    volume:number = 1.0,   
    reverb_active:'Off'|'Low'|'High' = 'Off',
    declick_active:boolean = true,
    declip_active:boolean = true
  ){
    super(file,startTime);
    this.volume = volume;
    this.reverb_active = reverb_active;
    this.declick_active = declick_active;
    this.declip_active = declip_active;
  }

  getDeclickArgs():string{
    let s:string = '';
    if(this.declick_active){
      s = 'adeclip=window=55:overlap=75:arorder=8:threshold=10:hsize=1000:method=add,'
    }
    return s;
  }

  getDeclipArgs():string{
    let s:string = '';
    if (this.declip_active) 
      {
        s = 'adeclip=window=55:overlap=75:arorder=8:threshold=10:hsize=1000:method=add,';
      }
    return s;
  }

  getReverbArgs():string{
    let s:string = '';
    if(this.reverb_active==='High'){
      s = 'aecho=0.8:0.9:500:0.5,'
    }
    else if (this.reverb_active==='Low'){
      s = 'aecho=0.8:0.88:60:0.4,'
    }
    return s;
  }
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
