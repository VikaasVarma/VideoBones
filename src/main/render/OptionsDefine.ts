// import { buildArgs } from './engine'
import * as types from './types'


//define an audio inut with default parameter
function defineAudioInput(
    file:string,
    startTime:number=0,
    volume: number=1.0,
    echo_active:boolean=false,
    reverse_active:boolean=false,
    echo_in_gain:number=0.6,
    echo_out_gain:number=0.3,
    echo_delays:number[]=[1000],
    echo_decays:number[]=[0.5],
    declick_active:boolean=true,
    declip_active:boolean=true

):types.AudioInput{
    return {
        file: file,
        startTime: startTime,
        volume: volume,
        echo_active:echo_active,
        reverse_active:reverse_active,
        echo_in_gain: echo_in_gain,
        echo_out_gain:echo_out_gain,
        echo_delays: echo_delays,
        echo_decays: echo_decays,
        declick_active: declick_active,
        declip_active:declip_active
    }
}

//define videoinput with default input
function defineVideoInput(
    file:string,
    startTime:number=0,
    volume: number=1.0,
    echo_active:boolean=false,
    reverse_active:boolean=false,
    echo_in_gain:number=0.6,
    echo_out_gain:number=0.3,
    echo_delays:number[]=[1000],
    echo_decays:number[]=[0.5],
    declick_active:boolean=true,
    declip_active:boolean=true,
    position:types.Position,
    resolution:types.Resolution = {width:1920,height:1080}

):types.VideoInput{
    return {
        file: file,
        startTime: startTime,
        volume: volume,
        echo_active:echo_active,
        reverse_active:reverse_active,
        echo_in_gain: echo_in_gain,
        echo_out_gain:echo_out_gain,
        echo_delays: echo_delays,
        echo_decays: echo_decays,
        declick_active: declick_active,
        declip_active:declip_active,
        position:position,
        resolution:resolution,
    }

}
// let audioList = [defineAudio('1.mp3'),defineAudio('2.mp3')]

// let option:EngineOptions = {
//     aspectRatio:'16:9',
//     audioBitRate:'320k',
//     audioInputs: audioList,
//     audioSampleRate:48000,
//     bufferSize:'32M',
//     framesPerSecond:60,
//     outputFile:'out.mp4',
//     outputResolution:{width:1920,height:1080},
//     outputType:'preview',
//     outputVolume:256,
//     previewManifest:'stream.mpd',
//     thumbnailEvery:'1/5',
//     startTime:0,
//     videoBitRate:'6M',
//     videoInputs:[]
// }

// buildArgs(option)
