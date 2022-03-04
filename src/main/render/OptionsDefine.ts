// import { buildArgs } from './engine'
import * as types from './types';

//define an audio inut with default parameter
function defineAudioInput(
  file:string,
  startTime = 0,
  volume = 1.0,
  echo_active = false,
  reverse_active = false,
  echo_in_gain = 0.6,
  echo_out_gain = 0.3,
  echo_delays:number[] = [ 1000 ],
  echo_decays:number[] = [ 0.5 ],
  declick_active = true,
  declip_active = true

):types.AudioInput{
  return {
    file: file,
    startTime: startTime,
    volume: volume,
    echo_active: echo_active,
    reverse_active: reverse_active,
    echo_in_gain: echo_in_gain,
    echo_out_gain: echo_out_gain,
    echo_delays: echo_delays,
    echo_decays: echo_decays,
    declick_active: declick_active,
    declip_active: declip_active
  };
}

//define videoinput with default input
function defineVideoInput(
  file:string,
  startTime = 0,
  volume = 256,
  echo_active = false,
  reverse_active = false,
  echo_in_gain = 0.6,
  echo_out_gain = 0.3,
  echo_delays:number[] = [ 1000 ],
  echo_decays:number[] = [ 0.5 ],
  declick_active = true,
  declip_active = true,
  position:types.Position,
  resolution:types.Resolution = { width: 1920, height: 1080 }

):types.VideoInput{
  return {
    file: file,
    startTime: startTime,
    volume: volume,
    echo_active: echo_active,
    reverse_active: reverse_active,
    echo_in_gain: echo_in_gain,
    echo_out_gain: echo_out_gain,
    echo_delays: echo_delays,
    echo_decays: echo_decays,
    declick_active: declick_active,
    declip_active: declip_active,
    position: position,
    resolution: resolution
  };

}

