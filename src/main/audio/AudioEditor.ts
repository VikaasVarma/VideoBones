import { spawn } from "child_process";

/* TODO: to make it user-friendly, consider aborting an operation
* showing the progress of operation, force the ffmpeg to overwrite
* when there is a file with the same name
*/

//the class implements some method that can do audio editing and synchronising
export class AudioEditor{
    //remove impulsive noise, adeclick 
    static denoise(filepath_in:string,filepath_out:string){
        const adeclickArgs = [
            '-i', filepath_in,
            '-af', 
            'adeclick=window=55: overlap=75: arorder=2: threshold=2: burst=2: method=a',
             filepath_out
            ];
        const adeclick = spawn('ffmpeg',adeclickArgs,{ stdio: [ 'ignore', 'pipe', process.stderr ] });
        adeclick.stdout.pipe(process.stdout);
    }

    //audio compression to add propriate effect to a track
    //, whose arguments are different to tune
    //maybe useless function
    static compress(filepath_in:string,filepath_out:string){
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

    //remove clipped samples from input video, which is very useful 
    //from the experience of a brass player
    static declip(filepath_in:string,filepath_out:string){
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

    

}