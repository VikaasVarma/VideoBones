import { Readable } from 'node:stream';
import { join } from 'node:path';
import { ChildProcessByStdio, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { getTempDirectory } from '../storage/config';
import { getPath } from './ffmpeg';
import { AudioInput, EngineOptions, VideoInput, VideoData, VideoOption } from './types';
import { AudioInputOption, getAudioOptions } from './AudioOption';
import { getVideoOptionMap, VideoInputOption } from './videoOption';


const thumbnailResolutionDivisor = 4;

/**
 *
 * @param param0 Needs a structure of EngineOptions, go to: @interface EngineOptions
 *
 * @returns all the arguements that ffmpeg needs to do the rendering job
 */
function buildArgs({
  aspectRatio = '16:9',
  audioBitRate = '320k',
  audioInputs = [] as AudioInput[],
  audioSampleRate = 48000,
  bufferSize = '32M',
  framesPerSecond = 60,
  outputFile = 'output.mp4',
  outputResolution = { height: 1080, width: 1920  },
  outputType,
  outputVolume = 256,
  previewManifest = 'stream.mpd',
  startTime = 0,
  thumbnailEvery = '1/5',
  videoBitRate = '6M',
  videoInputs = [] as VideoInput[]
}: EngineOptions): string[] {

  //to figure out the indices for video inputs
  console.log(videoInputs);
  const cumsum = ((sum: number) => (value: VideoInput) => {
    sum += value.files.length; return sum - value.files.length;
  })(0);
  const offset = videoInputs.map(cumsum);

  //to figure out the indices for audio inputs
  const videoCount: number[] = videoInputs.map(videoArray => videoArray.files.length);
  let videoSum = 0;
  for (const n of videoCount){
    videoSum += n;
  }

  // The holy ffmpeg argument builder
  function getTemplateSizeAndAnchors(screenStyle: string): { anchors: any[]; templateSizes: any[] } {
    let templateSizes;
    let anchors;
    const screenWidth = outputResolution.width;
    const screenHeight = outputResolution.height;

    switch (screenStyle) {
      case '....':
        templateSizes = Array.from({ length: 4 }).fill({
          width: screenWidth / 2,
          height: screenHeight / 2
        });

        anchors = [
          { x: 0, y: 0 },
          { x: screenWidth / 2, y: 0 },
          { x: 0, y: screenHeight / 2 },
          { x: screenWidth / 2, y: screenHeight / 2 }
        ];
        break;

      case '|..':
        templateSizes = [
          { width: screenWidth / 2, height: screenHeight },
          { width: screenWidth / 2, height: screenHeight / 2 },
          { width: screenWidth / 2, height: screenHeight / 2 }
        ];

        anchors = [
          { x: 0, y: 0 },
          { x: screenWidth / 2, y: 0 },
          { x: screenWidth / 2, y: screenHeight / 2 }
        ];
        break;

      case '_..':
        templateSizes = [
          { width: screenWidth, height: screenHeight / 2 },
          { width: screenWidth / 2, height: screenHeight / 2 },
          { width: screenWidth / 2, height: screenHeight / 2 }
        ];

        anchors = [
          { x: 0, y: 0 },
          { x: 0, y: screenHeight / 2 },
          { x: screenWidth / 2, y: screenHeight / 2 }
        ];
        break;

      default:
        throw new Error('Fuck you: invalid screenstyle');
    }
    return { anchors, templateSizes };
  }

  function calculateLayout(videoInput: VideoInput) {
    const screenStyle = videoInput.screenStyle;
    console.log(`\n\n\n${  screenStyle  }\n\n\n`);
    if (videoInput.files.length !== screenStyle.length) {
      throw new Error('Incorrect number of videos supplied');
    }
    const video_resolutions = videoInput.resolutions;
    const template_data = getTemplateSizeAndAnchors(screenStyle);
    const video_anchors = template_data.anchors;
    const real_resolutions = [];

    for (let i = 0; i < videoInput.files.length; i++) {
      const res = video_resolutions[i];
      const res_ratio = Math.min(
        res.width / template_data.templateSizes[i].width,
        res.height / template_data.templateSizes[i].height
      );
      real_resolutions.push({
        width: res.width / res_ratio,
        height: res.height / res_ratio
      });
    }
    return { video_anchors,
      real_resolutions,
      layout_resolutions: template_data.templateSizes };
  }

  function genVideoData(videoInputs: VideoInput[], videoDict: Map<string, number>): VideoData[][] {
    const videoData: VideoData[][] = [];
    const appearances: { [file: string]: number } = {};
    for (const input of videoInputs) {
      const data: VideoData[] = [];
      input.files.map((file, i) => {
        const layout = calculateLayout(input);

        console.log('\n\n\n', layout, '\n\n\n');

        appearances[file] = (appearances[file] ?? 0) + 1;
        data.push({
          id: [ videoDict.get(file)!, appearances[file] - 1 ],
          file: file,
          interval: input.interval,
          position: { top: layout.video_anchors[i].y, left: layout.video_anchors[i].x },
          resolution: { width: layout.real_resolutions[i].width, height: layout.real_resolutions[i].height },
          crop_size: {  width: layout.layout_resolutions[i].width, height: layout.layout_resolutions[i].height },
          crop_offset: { top: 0, left: 0 }
        });
      });
      videoData.push(data);
    }
    return videoData;
  }

  function genVideoDict(videoInputs: VideoInput[]): Map<string, number> {
    const videoDict = new Map<string, number>();
    let i = 0;
    videoInputs.map(input => input.files.map(file => {
      if (!videoDict.has(file)) {
        videoDict.set(file, i); i++;
      }
    }));
    return videoDict;
  }

  function splitInstr(videoData: VideoData[][], videoDict: Map<string, number>): string[] {
    const splits = new Map<string, number>();
    videoData.map(screen => screen.map(video => splits.set(video.file, (splits.get(video.file) ?? 0) + 1)));

    return [ ...splits.keys() ].flatMap(file => {
      const id = videoDict.get(file)!;
      const numSplits = splits.get(file)!;
      if (numSplits > 2) {
        return `[${id}:v]split=${numSplits}${[ ...new Array(numSplits).keys() ].map(j => `[v${id}${j}]`).join('')}`;
      } else if (numSplits === 2) {
        return `[${id}:v]split[v${id}0][v${id}1]`;
      }
      return `[${id}:v]null[v${id}0]`;
    });
  }

  function videoSetup(videoData: VideoData[][]): string[] {
    return videoData.flatMap(screen => screen.map(input => {
      const [ i, j, res, c_size, c_offset ] = [ input.id[0], input.id[1], input.resolution, input.crop_size, input.crop_offset ];
      return `[v${i}${j}]scale=${res.width}x${res.height},crop=${c_size.width}:${c_size.height}:${c_offset.left}:${c_offset.top}[i${i}${j}]`;
    }));
  }

  function videoOverlay(videoData: VideoData[][]): string[] {
    let index = 0;
    const overlay = videoData.flatMap(screen => screen.map(input => {
      const [ i, j, x, y, start, end ] = [ input.id[0], input.id[1], input.position.left, input.position.top, input.interval[0], input.interval[1] ];
      index++;
      return `[tmp${index - 1}][i${i}${j}]overlay=shortest=1:x=${x}:y=${y}:enable='between(t,${start},${end})'[tmp${index}]`;
    }));
    overlay[overlay.length - 1] = overlay[overlay.length - 1].replace(`tmp${index}`, 'out');
    return overlay;
  }

  const videoDict: Map<string, number> = genVideoDict(videoInputs);
  const videoData: VideoData[][] = genVideoData(videoInputs, videoDict);
  //the audioInput part of the EngineOption is never used, instead, it uses the records from AudioOption
  const audioInputOptions: AudioInputOption[] = getAudioOptions();
  //video effect part
  const videoInputOptionsMap: Map<string, VideoInputOption> = getVideoOptionMap();

  //the filter is the main part of the arguements, it specifies the rendering type,
  //the video layout, timing and video/audio effects.
  const filter
    = (<string[]>[]).concat(
      [ ...videoDict.keys() ].flatMap(file => [ '-i', file ]),
      audioInputOptions.flatMap(input => [ '-i', input.file ]),
      [
        '-filter_complex',  [ ...(<string[]>[]), `color=s=${outputResolution.width}x${outputResolution.height}:c=black[tmp0]` ].concat(
          splitInstr(videoData, videoDict),
          videoSetup(videoData),
          videoOverlay(videoData),
          audioInputOptions.map((input: AudioInputOption, i: number) =>
            `[${i + videoDict.size}:a]${input.getAllOptions()}aformat=fltp:48000:stereo,volume=${input.volume / 256}[ainput${i}]`)
            .join(';'),
          audioInputOptions.length === 0 ? '' : `${audioInputOptions.map((_, i: number) => `[ainput${i}]`).join('')  }amerge=inputs=${audioInputOptions.length  }[aout]`
        ).filter(el => el.length > 0).join(';')
      ],
      [
        '-map', '[out]',
        '-map', '[aout]',
      ]
    );

  const args = outputType === 'thumbnail' ? [
    ...filter,
    '-preset', 'ultrafast',
    '-aspect', aspectRatio,
    '-r', '1'
    ,  'thumbs/%04d.png'
  ] : [
    ...[ outputType === 'preview' ? '-re' : 'REMOVED' ].concat(filter),
    '-c:v', 'libx264',
    '-c:a', 'aac',
    '-ac', '2',
    '-ar', audioSampleRate.toString(),
    '-x264opts', `keyint=${framesPerSecond}:min-keyint=${framesPerSecond}:no-scenecut`,
    { 'preview': '-f', 'render': '-f' }[outputType],
    { 'preview': 'dash', 'render': 'mp4' }[outputType],
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
    '-stats'
    ,  outputType === 'render' ? outputFile : previewManifest
  ].filter(str => {
    return str !== 'REMOVED';
  });
  console.log(args);
  return args;
}

let ffmpeg: ChildProcessByStdio<null, Readable, null> | null;
let ffmpeg_thumbs: ChildProcessByStdio<null, Readable, null> | null;

//The function that will specify the engine options and start the rendering process
export function start(
  options: EngineOptions,
  statusCallback: (elapsedTime: string, donePercentage: number) => void,
  doneCallback: () => void
) {
  if (options.outputType === 'thumbnail') {
    throw new Error('Invalid out type for starting engine');
  }

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

//the functiion that starts the engine in thumbnail mode, which takes less time
export function getThumbnails(
  options: EngineOptions,
  doneCallback: (paths: string[]) => void
) {
  if (options.outputType !== 'thumbnail') {
    throw new Error('Invalid out type for getThumbnails');
  }

  // clean thumbnails folder
  const thumbs = join(getTempDirectory(), 'thumbs');
  if (!existsSync(thumbs)) {
    mkdirSync(thumbs);
  }
  for (const f of readdirSync(thumbs))  rmSync(`${thumbs}/${f}`);

  if (ffmpeg_thumbs) {
    ffmpeg_thumbs.kill();
    ffmpeg_thumbs = null;
  }

  const bin = getPath();
  const args = buildArgs(options);
  console.log(bin, args);

  if (bin) {
    console.log(getTempDirectory());
    ffmpeg_thumbs = spawn(bin, args, { cwd: getTempDirectory(), stdio: [ 'ignore', 'pipe', process.stderr ] });
    ffmpeg_thumbs.on('exit', () => {
      const files = readdirSync(thumbs);
      doneCallback(files.map(f => join(thumbs, f)));
    });
  }
}

export function kill() {
  if (ffmpeg) {
    ffmpeg.kill();
    ffmpeg = null;
  }
  if (ffmpeg_thumbs) {
    ffmpeg_thumbs.kill();
    ffmpeg_thumbs = null;
  }
}
