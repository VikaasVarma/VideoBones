import { AudioInput, EngineOptions, Resolution, VideoInput } from './types';
import { ChildProcessByStdio, spawn } from 'child_process';
import { getPath } from './ffmpeg';
import { getTempDirectory } from '../storage/config';
import { Readable } from 'stream';

function buildArgs({
  aspectRatio = '16:9',
  audioBitRate = '320k',
  audioInputs = [] as AudioInput[],
  audioSampleRate = 48000,
  bufferSize = '32M',
  framesPerSecond = 60,
  outputFile = 'output.mp4',
  outputResolution = { width: 1920, height: 1080 },
  outputType,
  outputVolume = 256,
  previewManifest = 'stream.mpd',
  startTime = 0,
  thumbnailEvery = '1/5',
  videoBitRate = '6M',
  videoInputs = [] as VideoInput[]
}: EngineOptions): string[] {
  // The holy ffmpeg argument builder
  console.log(videoInputs);
  const cumsum = ((sum: number) => (value: VideoInput) => {sum += value.files.length; return sum - value.files.length})(0);
  let offset = videoInputs.map(cumsum);
  
  // Thought about doing it programmatically, landed on this instead
  function calculateLayoutPositions(resolutions:Resolution[], screenStyle:string) {
      if (resolutions.length !== screenStyle.length) { throw Error('Incorrect number of videos supplied')}

    let screenWidth = outputResolution.width, screenHeight = outputResolution.height
    let resizeData = []
    let templateSizes = []

    switch(screenStyle) {
        case "....":
            templateSizes = Array(4).fill({x:screenWidth/2, y:screenHeight/2})
            
            resizeData.push({x:0, y:0, resizeRatio:1}, 
                            {x:screenWidth/2, y:0, resizeRatio:1}, 
                            {x:0, y:screenHeight/2, resizeRatio:1}, 
                            {x:screenWidth/2, y:screenHeight/2, resizeRatio:1})
            break

        case "|..":
            
            templateSizes = [{x:screenWidth/2, y:screenHeight},
                             {x:screenWidth/2, y:screenHeight/2},
                             {x:screenWidth/2, y:screenHeight/2}]

            resizeData.push({x:0, y:0, resizeRatio:1}, 
                             {x:resolutions[0].width, y:0, resizeRatio:1}, 
                             {x:resolutions[0].width, y:resolutions[1].height, resizeRatio:1})
            break
            
        case "_..":

            templateSizes = [{x:screenWidth, y:screenHeight/2},
                             {x:screenWidth/2, y:screenHeight/2},
                             {x:screenWidth/2, y:screenHeight/2}]

            resizeData.push({x:0, y:0, resizeData:1}, {x:0, y:resolutions[0].height, resizeData:1}, 
                                           {x:resolutions[1].width, y:resolutions[0].height, resizeData:1})
            break
                
        default:
            throw Error("Fuck you: invalid screenstyle")
    }
    
    for (let i = 0; i < resolutions.length; i++) {
        let res = resolutions[i]
        let xRatio = res.width / templateSizes[i].x, yRatio = res.height / templateSizes[i].y
        resizeData[i].resizeRatio = (xRatio > yRatio) ? 1 / xRatio : 1 / yRatio
    }
    return resizeData
  }


  function screenStyle_to_layout(screenStyle: string) {
    switch(screenStyle) {
        case "....":
            return "0_0|w0_0|0_h0|w0_h0";
        case "|..":
            return "0_0|w0_0|w0_h1";
        case "_..":
            return "0_0|0_h0|w1_h0";
        default:
            throw Error("Fuck you: invalid screenstyle")
    }
  }

  // eslint-disable-next-line function-paren-newline
  let args: string[] = (<string[]>[]).concat(
    [outputType === 'preview' ? '-re' : ''],
    videoInputs.map(input => input.files.map((file) => ['-i', file])).flat(2),
    audioInputs.map(input => input.files.map((file) => ['-i', file])).flat(2),
    ['-filter_complex', videoInputs.map((input, i) => ([
        input.resolution.map((res, j) => `[${offset[i] + j}:v]setpts=PTS-STARTPTS,scale=${res.width}x${res.height},trim=${input.interval[0]}:${input.interval[1]}[input${offset[i] + j}];`).join(''),
        `${input.files.map((_,j) => `[input${offset[i] + j}]`).join('')}xstack=inputs=${input.files.length}:layout=${screenStyle_to_layout(input.screenStyle)}[matrix${i}];`,
        `[matrix${i}]scale=${outputResolution.width}:${outputResolution.height},setsar=1:1[v${i}];`
    ].join(''))).join('') + `${videoInputs.map((_,i) => `[v${i}]`).join('')}concat[out]`],
    [
        '-map', '[out]',
        //'-map', '[aout]',
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-ac', '2',
        '-ar', audioSampleRate.toString(),
        '-x264opts', `keyint=${framesPerSecond}:min-keyint=${framesPerSecond}:no-scenecut`,
        '-f', 'dash',
        //'-min_seg_duration', '2000000',
        '-b:v', videoBitRate,
        '-b:a', audioBitRate,
        '-preset', outputType === 'render' ? 'medium' : 'ultrafast',
        '-tune', 'zerolatency',
        '-maxrate', videoBitRate,
        '-bufsize', bufferSize,
        '-v', 'info',
        '-aspect', aspectRatio,
        '-vol', outputVolume.toString(),
        '-metadata', 'description="Made with VideoBones"',
        '-stats',
        outputType === 'render' ? outputFile : (outputType === 'thumbnail' ? 'thumb%04d.png' : previewManifest)
    ]
  )
    console.log(args);
    return args;
}

let ffmpeg: ChildProcessByStdio<null, Readable, null> | null;

export function start(
  options: EngineOptions,
  statusCallback: (elapsedTime: string, donePercentage: number) => void,
  doneCallback: () => void
) {
  if (ffmpeg) {
    ffmpeg.kill();
    ffmpeg = null;
  }

  const bin = getPath();
  const args = buildArgs(options);
  console.log(bin, args);

  if (bin) {
    console.log(getTempDirectory());
    ffmpeg = spawn(bin, args, { cwd: getTempDirectory(), stdio: [ 'ignore', 'pipe', process.stderr ] });
    ffmpeg.stdout.on('data', data => {
      console.log(data);
      statusCallback(data.toString(), 0);
    });
    ffmpeg.on('exit', doneCallback);
  }
}

export function kill() {
  if (ffmpeg) {
    ffmpeg.kill();
    ffmpeg = null;
  }
}
