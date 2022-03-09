import * as projects from '../storage/projects';
import * as config from '../storage/config';
import { AudioInput } from './types';


export class AudioInputOption implements AudioInput{
  file: string;
  startTime: number;
  volume: number;
  reverb_active: boolean;
  reverb_delay_identifier: number;  //in ms
  reverb_decay_identifier: number;   //between 0 and 1
  declick_active: boolean;
  declip_active: boolean;

  constructor(
    file: string,
    startTime = 0,
    volume = 1,
    reverb_active = false,
    reverb_delay = 0,
    reverb_dacay = 0,
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
    if (this.reverb_active){
      s = 'acho=0.8:0.9:';
      //add delays args
      let s_delays = '';
      let i = 0;
      while (i < 10){
        s_delays += `${(i + 1) * this.reverb_delay_identifier}`;
        if (i < 9) s_delays += '|';
        i++;
      }

      //add decays args
      i = 0;
      let power = 1;
      let s_decays = '';
      while (i < 10){
        s_decays += `${Math.pow(this.reverb_decay_identifier, power)}`;
        if (i < 9) s_decays += '|';
        i++;
        power += 0.6;
      }
    }
    return s;
  }
}

const audioOptions: AudioInputOption[] = [];

export function addAudioOption(option: AudioInput): void{
  //the file field will be discarded, so can leave it blank at front end
  const realFile = `audio${config.getRecordingsList().length / 2}.webm`;
  audioOptions.push(new AudioInputOption(
    realFile,
    option.startTime,
    option.volume,
    option.reverb_active,
    option.reverb_delay_identifier,
    option.reverb_decay_identifier,
    option.declick_active,
    option.declip_active
  ));
}

export function getAudioOptions(): AudioInputOption[]{
  return audioOptions;
}
