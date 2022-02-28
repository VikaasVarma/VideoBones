import { spawn } from "child_process";
import * as project from "../storage/projects";
import * as config from "../storage/config";

/* TODO: to make it user-friendly, consider aborting an operation
* showing the progress of operation, force the ffmpeg to overwrite
* when there is a file with the same name
*/

//the class implements some method that can do audio editing and synchronising
export class AudioEditor{

    constructor(){

    }

    /**
     * denoise the audio with several methods
    **/
    static denoise(filepath_in:string,filepath_out:string):void{
        //using a linear combination of several methods, still wondering
        //whether that is a good choice

        //remove impulsive noise, adeclick
        let tempfile_declick:string =config.getTempDirectory() + 'temp_from_click' + new Date().toDateString;
        const adeclickArgs = [
            '-i', filepath_in,
            '-af', 
            'adeclick=window=55: overlap=75: arorder=2: threshold=2: burst=2: method=a',
             tempfile_declick
            ];

        const adeclick = spawn('ffmpeg',adeclickArgs,{ stdio: [ 'ignore', 'pipe', process.stderr ] });
        adeclick.stdout.pipe(process.stdout);
        //denoise with FFT method(?)
        let afftdnArgs:string[] = [
            '-i', tempfile_declick,
            '-af',
            ['afftdn=nr=12',
            'nf=-50',
            ,'nt=w',
            'rf=-38',
            'om=o'].join(': '),
            filepath_out
        ];

        //possible choice: denoise by non-local means algorithm
        //reduce broadband noise 7.36
    }

    /**
     * audio compression to add propriate effect to a track
     * , whose arguments are different to tune
     * maybe useless function
     **/
    static compress(filepath_in:string,filepath_out:string):void{
        const acompressArgs = [
            '-i',filepath_in,
            '-af',
            ['acompressor=level_in=1',
            'mode=downward',
            'threshold=0.125',
            'ratio=2',
            'attack=20',
            'release=250',
            'makeup=1',
            'knee=2.82843',
            'link=average',
            'detection=rms',
            'mix=1'].join(': '),
            filepath_out
        ] ;
        const acompress = spawn('ffmpeg',acompressArgs,{stdio: ['ignore','pipe',process.stderr]});
        acompress.stdout.pipe(process.stdout);
    }

    /**
     * remove clipped samples from input video, which is very useful 
     *from the experience of a brass player
    **/
    static declip(filepath_in:string,filepath_out:string):void{
        const adeclipArgs = [
            '-i',filepath_in,
            '-af',
            ['adeclip= window=55',
            'overlap=75',
            'arorder=8',
            'threshold=10',
            'hsize=1000',
            'method=add'].join(': '),
            filepath_out
        ];
        const adeclip = spawn('adeclip',adeclipArgs,{stdio: ['ignore','pipe',process.stderr]});
        adeclip.stdout.pipe(process.stdout);
    }

    /**
     * can apply echoing effect of different loudnesses and delays
     *, can further implement lots of useful effects
     **/
    static echo(filepath_in:string,filepath_out:string):void{
        const achoArgs = [
            '-i', filepath_in,
            '-af', 
            ['aecho=in_gain=0.6',
            'out_gain=0.3',
            'delays=500',
            'decays=0.3'].join(': '),
            filepath_out
        ];
        const acho = spawn('ffmpeg',achoArgs,{stdio:['ignore','pipe',process.stderr]});
        acho.stdout.pipe(process.stdout);
    }

    /**
     * mix two or more audio input into a single multi-channel file
     * the output stops when the longest one ends
     */
    static mix(files_in:string[],filepath_out:string):void{
        let amixArgs:string[] = 
            files_in.map((s:string)=>'-i '+s)
            .concat(
                ['-af',
                'amix=input= '+ files_in.length+': duration=longest',
                filepath_out
            ]
            );
        const amix = spawn('ffmpeg',amixArgs,{stdio:['ignore','pipe',process.stderr]});
        amix.stdout.pipe(process.stdout);
    }
    //TODO: 7.39 apad: pad the end of an audio stram with silence 
    
    
}
