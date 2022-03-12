import { join } from 'node:path';
import { getRecordingsDirectory } from '../storage/config';
import { AudioInput } from './types';


let audioOptions: AudioInputOption[] = [];

export function addAudioOption(option: AudioInput): void{
  audioOptions = audioOptions.filter(object => object.file !== `${join(getRecordingsDirectory(), option.file)}.webm`);
  audioOptions.push(new AudioInputOption(
    `${join(getRecordingsDirectory(), option.file)}.webm`,
    option.startTime,
    option.volume,
    option.reverb_active,
    Math.max(option.reverb_delay_identifier * 5, 90000),
    Math.max(option.reverb_decay_identifier / 100, 0.1),
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

/**
 * The class receives message from IPC-handler and record the audio settings that are given
 * to each track.
 *
 * It will also generate the audio effect part of ffmpeg arguements.
 *
 */
export class AudioInputOption implements AudioInput {
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
    reverb_decay = 0,
    declick_active = true,
    declip_active = true,
    echo_active = false,
    echo_delay_indentifier = 0,
    echo_decay_indentifier = 0
  ){
    this.file = file.replace('video', 'audio');
    this.startTime = startTime;
    this.volume = volume;
    this.reverb_active = reverb_active;
    this.reverb_delay_identifier = reverb_delay;
    this.reverb_decay_identifier = reverb_decay;
    this.declick_active = declick_active;
    this.declip_active = declip_active;
    this.echo_active = echo_active;
    this.echo_delay_identifier = echo_delay_indentifier;
    this.echo_decay_identifier = echo_decay_indentifier;
  }

  //the order should be: getDeclick -> getDeclip -> getEcho -> reverb
  getAllOptions(): string{
    return this.getDeclickArgs()
    + this.getDeclipArgs()
    + this.getEchoArgs()
    + this.getReverbArgs();
  }

  getEchoArgs(): string{
    //if reverb is active, echo will not take effect
    let s = '';
    if (this.echo_active && !this.reverb_active){
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
      let s_delays = '';
      let i = 0;
      while (i < 10){
        s_delays += `${Math.min((i + 1) * this.reverb_delay_identifier, 90000)}`;
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
      s += `${s_delays}:${s_decays},`;
    }
    return s ;
  }
}
