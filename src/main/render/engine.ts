import { AudioInput, EngineOptions, VideoInput, VideoData, Resolution } from './types';
import { ChildProcessByStdio, spawn } from 'child_process';
import { getPath } from './ffmpeg';
import { getTempDirectory } from '../storage/config';
import { Readable } from 'stream';
import { stringify } from 'querystring';

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
  thumbnailEvery = '1/5',
  videoBitRate = '6M',
  videoInputs = [] as VideoInput[]
}: EngineOptions): string[] {
  // The holy ffmpeg argument builder
  function calculateLayoutPositions(videoInput: VideoInput) {
    let resolutions = videoInput.resolutions
    let screenStyle = videoInput.screenStyle
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
  
  function genVideoData(videoInputs: VideoInput[], videoDict: Map<string, number>): VideoData[][] {
    let videoData: VideoData[][] = []
    let appearances: { [file: string]: number } = {};
    for (let input of videoInputs) {
        let data: VideoData[] = []
        input.files.map((file, i) => {
            let layout = calculateLayoutPositions(input)
            appearances[file] = (appearances[file] ?? 0) + 1
            data.push({
                id: [videoDict.get(file)!, appearances[file] - 1],
                file: file,
                interval: input.interval,
                position: { top: layout[i].x, left: layout[i].y },
                resolution: { width: input.resolutions[i].width * layout[i].resizeRatio!, height: input.resolutions[i].height * layout[i].resizeRatio! }
            })
        })
        videoData.push(data)
    }
    return videoData
  }

  function genVideoDict(videoInputs: VideoInput[]): Map<string, number> {
    let videoDict = new Map<string, number>()
    let i = 0;
    videoInputs.map((input) => input.files.map((file) => { if (!videoDict.has(file)) { videoDict.set(file, i); i++ } }))
    return videoDict
  }

  function splitInstr(videoData: VideoData[][], videoDict: Map<string, number>): string[] {
    let splits = new Map<string, number>();
    videoData.map(screen => screen.map(video => splits.set(video.file, (splits.get(video.file) ?? 0) + 1)))

    return [...splits.keys()].map(file => {
        let id = videoDict.get(file)!
        let numSplits = splits.get(file)!
        if (numSplits > 2) {
            return `[${id}:v]split=${numSplits}${[...Array(numSplits).keys()].map((j) => `[v${id}${j}]`).join('')}`
        } else if (numSplits === 2) {
            return `[${id}:v]split[v${id}0][v${id}1]`
        }
        return `[${id}:v]null[v${id}0]`
    }).flat(1)
  }

  function videoSetup(videoData: VideoData[][]): string[] {
      return videoData.map((screen) => screen.map((input) => {
          let [i, j, width, height] = [input.id[0], input.id[1], input.resolution.width, input.resolution.height]
          return `[v${i}${j}]scale=${width}x${height}[i${i}${j}]`
      })).flat(1)
  }

  function videoOverlay(videoData: VideoData[][]): string[] {
    let index = 0;
    let overlay = videoData.map((screen) => screen.map((input) => {
        let [i, j, x, y, start, end] = [input.id[0], input.id[1], input.position.left, input.position.top, input.interval[0], input.interval[1]]
        index++
        return `[tmp${index - 1}][i${i}${j}]overlay=shortest=1:x=${x}:y=${y}[tmp${index}]`
        // return `[tmp${index - 1}][i${i}${j}]overlay=shortest=1:x=${x}:y=${y}:enable='between(t,${start},${end})'[tmp${index}]`
    })).flat(1)
    overlay[overlay.length - 1] = overlay[overlay.length - 1].replace(`tmp${index}`, `out`)
    return overlay
  }

  let videoDict: Map<string, number> = genVideoDict(videoInputs)
  let videoData: VideoData[][] = genVideoData(videoInputs, videoDict)

  // eslint-disable-next-line function-paren-newline
  return (<string[]>[]).concat(
    [outputType === 'preview' ? '-re' : ''],
    [...videoDict.keys()].map(file => ['-i', file]).flat(1),
    audioInputs.map(input => input.files.map((file) => ['-i', file])).flat(2),
    ['-filter_complex',  (<string[]>[]).concat(
        [`color=s=${outputResolution.width}x${outputResolution.height}:c=black[tmp0]`],
        splitInstr(videoData, videoDict),
        videoSetup(videoData),
        videoOverlay(videoData),
    ).join(';')],
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
