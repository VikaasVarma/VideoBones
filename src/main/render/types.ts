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
  reverb_active: 'Off'|'On';
  reverb_delay_identifier:number;  //in ms 
  reverb_decay_identifier:number;   //between 0 and 1
  declick_active: boolean;
  declip_active: boolean;

  constructor(
    file: string,
    startTime = 0,
    volume = 1.0,
    reverb_active: 'Off'|'On' = 'Off',
    reverb_delay:number = 0,
    reverb_dacay:number = 0,
    declick_active = true,
    declip_active = true
  ){
    this.file = file;
    this.startTime = startTime;
    this.volume = volume;
    this.reverb_active = reverb_active;
    this.reverb_delay_identifier = reverb_delay;
    this.reverb_decay_identifier = reverb_dacay;
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
    if(this.reverb_active){
      s = 'acho=0.8:0.9:';
      //add delays args 
      let s_delays:string = '';
      let i:number = 0;
      while(i<10){
        s_delays += `${(i+1)*this.reverb_delay_identifier}`;
        if(i<9) s_delays+= '|'; 
        i++;
      }

      //add decays args
      i=0;
      let power:number = 1.0;
      let s_decays:string = '';
      while(i<10){
        s_decays += `${Math.pow(this.reverb_decay_identifier,power)}`;
        if(i<9) s_decays+='|';
        i++;
        power+=0.6;
      }
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
