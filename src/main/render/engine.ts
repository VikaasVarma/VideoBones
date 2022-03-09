import { AudioInput, EngineOptions, VideoInput, VideoData, Resolution } from './types';
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
  thumbnailEvery = '1/5',
  videoBitRate = '6M',
  videoInputs = [] as VideoInput[]
}: EngineOptions): string[] {
  // The holy ffmpeg argument builder
  console.log(videoInputs);
  function calculateLayoutPositions(input: VideoInput) : {x: number, y: number, resolution: Resolution}[] {
      return [];
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
                resolution: layout[i].resolution
            })
        })
        videoData.push(data)
    }
    return videoData
  }

  function genVideoDict(videoInputs: VideoInput[]): Map<string, number> {
    let videoDict = new Map<string, number>()
    let i = 0;
    videoInputs.map((input) => input.files.map((file) => { if (!(file in videoDict)) { videoDict.set(file, i++) } }))
    return videoDict
  }

  function splitInstr(videoData: VideoData[][], videoDict: Map<string, number>): string[] {
    let splits: { [file: string]: number } = {};
    videoData.map(screen => screen.map(video => splits[video.file] = (splits[video.file] ?? 0) + 1))

    return videoData.map(screen => screen.map(video => {
        let id = videoDict.get(video.file)!
        let numSplits = splits[video.file]
        if (numSplits > 1) {
            return `[${id}:v]split=${numSplits}${[...Array(numSplits).keys()].map((j) => `[v${id}${j}]`).join('')}`
        }
        return `[${id}:v]null[v${id}0]`
    })).flat(1)
  }

  function videoSetup(videoData: VideoData[][]): string[] {
      return videoData.map((screen) => screen.map((input) => {
          let [i, j, width, height] = [input.id[0], input.id[1], input.resolution.width, input.resolution.height]
          return `[v${i}${j}]setpts=PTS-STARTPTS,scale=${width}x${height}[i${i}${j}]`
      })).flat(1)
  }

  function videoOverlay(videoData: VideoData[][]): string[] {
    let index = 0;
    let overlay = videoData.map((screen) => screen.map((input) => {
        let [i, j, x, y, start, end] = [input.id[0], input.id[1], input.position.left, input.position.top, input.interval[0], input.interval[1]]
        index++
        return `[tmp${index - 1}][i${i}${j}]overlay=shortest=1:x=${x}:y=${y}:enable='between(t,${start},${end})'[tmp${index}]`
    })).flat(1)
    overlay[overlay.length - 1].replace(`tmp${index}`, `[out]`)
    return overlay
  }

  let videoDict: Map<string, number> = genVideoDict(videoInputs)
  let videoData: VideoData[][] = genVideoData(videoInputs, videoDict)

  // eslint-disable-next-line function-paren-newline
  return (<string[]>[]).concat(
    [outputType === 'preview' ? '-re' : ''],
    [...videoDict.keys()].map(file => ['-i', file]).flat(1),
    audioInputs.map(input => input.files.map((file) => ['-i', file])).flat(2),
    ['filter_complex',  (<string[]>[]).concat(
        [`nullsrc=size=${outputResolution.width}:${outputResolution.height}[tmp0]`],
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
