import { AudioInput } from './types';

/**
 * The class receives message from IPC-handler and record the audio settings that are given
 * to each track. 
 * 
 * It will also generate the audio effect part of ffmpeg arguements.
 * 
 */
export class AudioInputOption implements AudioInput{
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

  constructor(
    file: string,
    startTime = 0,
    volume = 1,
    reverb_active = false,
    reverb_delay = 0,
    reverb_dacay = 0,
    declick_active = true,
    declip_active = true,
    echo_active: boolean = false,
    echo_delay_indentifier: number = 0,
    echo_decay_indentifier: number = 0
  ){
    this.file = file;
    this.startTime = startTime;
    this.volume = volume;
    this.reverb_active = reverb_active;
    this.reverb_delay_identifier = reverb_delay;
    this.reverb_decay_identifier = reverb_dacay;
    this.declick_active = declick_active;
    this.declip_active = declip_active;
    this.echo_active = echo_active;
    this.echo_delay_identifier = echo_delay_indentifier;
    this.echo_decay_identifier = echo_decay_indentifier;
  }

  //the order should be: getDeclick -> getDeclip -> getEcho 
  getEchoArgs():string{
    //if reverb is active, echo will not take effect
    let s = '';
    if (this.echo_active&&!this.reverb_active){
      s += `aecho=0.8:0.8:${this.echo_delay_identifier}:${this.echo_decay_identifier},`;
    }
    return s;
  }
  getDeclickArgs(): string{
    return 'adeclick=55:75:2:2:2:add,';
  }

  getDeclipArgs(): string{
    let s = '';
    if (this.declip_active) {
      s = 'adeclip=55:75:8:10:1000:a,';
    }
    return s;
  }

  getReverbArgs(): string{
    let s = '';
    if (this.reverb_active){
      s = 'aecho=0.8:0.9:';
      //add delays args
      let s_delays:string = '';
      let i = 0;
      while (i < 10){
        s_delays += `${(i + 1) * this.reverb_delay_identifier}`;
        if (i < 9) s_delays += '|';
        i++;
      }

      //add decays args
      i = 0;
      let power = 1;
      let s_decays:string = '';
      while (i < 10){
        s_decays += `${Math.pow(this.reverb_decay_identifier, power)}`;
        if (i < 9) s_decays += '|';
        i++;
        power += 0.6;
      }
      s += s_delays +':' + s_decays + ',';
    }
    return s ;
  }
}

let audioOptions: AudioInputOption[] = [];

export function addAudioOption(option: AudioInput): void{
  audioOptions.push(new AudioInputOption(
    option.file,
    option.startTime,
    option.volume,
    option.reverb_active,
    Math.max(option.reverb_delay_identifier * 5,90000),
    Math.max(option.reverb_decay_identifier / 100.0, 0.1),
    option.declick_active,
    option.declip_active,
    option.echo_active,
    option.echo_delay_identifier,
    option.echo_decay_identifier
  ));
}

export function getAudioOptions(): AudioInputOption[]{
  return audioOptions;
}