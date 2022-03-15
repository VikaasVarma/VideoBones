/* eslint-disable unicorn/consistent-function-scoping */

import { Readable } from 'node:stream';
import { join } from 'node:path';
import { ChildProcessByStdio, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { getTempDirectory } from '../storage/config';
import { getPath } from './ffmpeg';
import { AudioInput, EngineOptions, VideoInput, VideoData, VideoFilter, Resolution, Position } from './types';


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
  outputResolution = { height: 1080, width: 1920 },
  outputType,
  outputVolume = 256,
  previewManifest = 'stream.mpd',
  videoBitRate = '6M',
  videoFilters = [] as VideoFilter[],
  videoInputs = [] as VideoInput[]
}: EngineOptions): string[] {

  // The holy ffmpeg argument builder
  function getTemplateSizeAndAnchors(screenStyle: string): { anchors: Position[]; templateSizes: Resolution[] } {
    let templateSizes: Resolution[];
    let anchors: Position[];
    const screenWidth = outputResolution.width;
    const screenHeight = outputResolution.height;

    switch (screenStyle) {
      case '....':
        templateSizes = Array.from<Resolution>({ length: 4 }).fill({
          height: screenHeight / 2,
          width: screenWidth / 2
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
          { height: screenHeight, width: screenWidth / 2 },
          { height: screenHeight / 2, width: screenWidth / 2 },
          { height: screenHeight / 2, width: screenWidth / 2 }
        ];

        anchors = [
          { x: 0, y: 0 },
          { x: screenWidth / 2, y: 0 },
          { x: screenWidth / 2, y: screenHeight / 2 }
        ];
        break;

      case '_..':
        templateSizes = [
          { height: screenHeight / 2, width: screenWidth },
          { height: screenHeight / 2, width: screenWidth / 2 },
          { height: screenHeight / 2, width: screenWidth / 2 }
        ];

        anchors = [
          { x: 0, y: 0 },
          { x: 0, y: screenHeight / 2 },
          { x: screenWidth / 2, y: screenHeight / 2 }
        ];
        break;

      case '.':
        templateSizes = [{ height: screenHeight, width: screenWidth }];

        anchors = [{ x: 0, y: 0 }];
        break;

      default:
        throw new Error('Error: invalid screenstyle');
    }
    return { anchors, templateSizes };
  }

  function calculateLayout(videoInput: VideoInput) {
    const screenStyle = videoInput.screenStyle;
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
        height: res.height / res_ratio,
        width: res.width / res_ratio
      });
    }
    return {
      layout_resolutions: template_data.templateSizes,
      real_resolutions,
      video_anchors
    };
  }

  function genVideoData(videoInputs: VideoInput[], videoDict: Map<string, number>): VideoData[][] {
    const videoData: VideoData[][] = [];
    const appearances: { [file: string]: number } = {};
    for (const input of videoInputs) {
      const data: VideoData[] = [];
      input.files.forEach((file, i) => {
        const layout = calculateLayout(input);
        const id = videoDict.get(file);
        if (id === undefined) {
          return;
        }

        appearances[file] = (appearances[file] ?? 0) + 1;
        data.push({
          cropOffset: { x: 0, y: 0 },
          cropSize: { height: layout.layout_resolutions[i].height, width: layout.layout_resolutions[i].width },
          file: file === '' ? 'NULL' : file,
          id: file === '' ?  [ -1, 0 ] : [ id, appearances[file] - 1 ],
          interval: input.interval,
          position: { x: layout.video_anchors[i].x, y: layout.video_anchors[i].y  },
          resolution: { height: layout.real_resolutions[i].height, width: layout.real_resolutions[i].width }
        });
      });
      videoData.push(data);
    }
    return videoData;
  }

  function reverbForSomeReason(reverbDelay: number, reverbDecay: number): string {
    let s_delays = '';
    let i = 0;
    while (i < 10) {
      s_delays += `${Math.min((i + 1) * reverbDelay * 5, 90000)}`;
      if (i < 9) s_delays += '|';
      i++;
    }

    i = 0;
    let power = 1;
    let s_decays = '';
    while (i < 10) {
      s_decays += `${Math.pow(reverbDecay / 100, power)}`;
      if (i < 9) s_decays += '|';
      i++;
      power += 0.6;
    }

    return `aecho=0.8:0.9:${s_delays}:${s_decays}`;
  }

  function getAudioFilters(input: AudioInput): string {
    return [
      !input.enableEcho ? '' : `aecho=0.8:0.8:${input.echoDelay}:${input.echoDecay}`,
      !input.enableDeclick ? '' : 'adeclick=55:75:2:2:2:add',
      !input.enableDeclip ? '' : 'adeclip=55:75:8:10:1000:a',
      !input.enableReverb ? '' : reverbForSomeReason(input.reverbDelay, input.reverbDecay)
    ].filter(el => el.length > 0).join(',');
  }

  function getVideoFilters(filters: VideoFilter[], file: string): string {
    const filter = filters.find(filter => filter.file === file);
    if (!filter) {
      return '';
    }
    return [
      [
        `eq=${filter.enableContrast ? filter.contrast.toString() : '1'}`,
        filter.enableBrightness ? filter.brightness.toString() : '1',
        '1.0',
        '1.0',
        filter.enableCorrections ? filter.balanceR.toString() : '1.0',
        filter.enableCorrections ? filter.balanceG.toString() : '1.0',
        filter.enableCorrections ? filter.balanceB.toString() : '1.0',
        '1.0'
      ].join(':'),
      `avgblur=${filter.blurRadius}`
    ].filter(el => el.length > 0).join(',');
  }

  function genVideoDict(videoInputs: VideoInput[]): Map<string, number> {
    const videoDict = new Map<string, number>();
    let i = 0;
    videoInputs.map(input => input.files.map(file => {
      if (file !== '' && !videoDict.has(file)) {
        videoDict.set(file, i); i++;
      }
    }));
    return videoDict;
  }

  function splitInstr(videoData: VideoData[][], videoDict: Map<string, number>): string[] {
    const splits = new Map<string, number>();
    videoData.map(screen => screen.map(video => splits.set(video.file, (splits.get(video.file) ?? 0) + 1)));

    return [ ...splits.keys() ].flatMap(file => {
      const id = videoDict.get(file);
      const numSplits = splits.get(file);
      if (id === undefined || numSplits === undefined) {
        return '';
      }
      if (numSplits > 2) {
        return `[${id}:v]split=${numSplits}${[ ...Array.from({ length: numSplits }) ].map((_, i) => `[v${id}${i}]`).join('')}`;
      } else if (numSplits === 2) {
        return `[${id}:v]split[v${id}0][v${id}1]`;
      }
      return `[${id}:v]null[v${id}0]`;
    });
  }

  function videoSetup(videoFilters: VideoFilter[], videoData: VideoData[][]): string[] {
    return videoData.flatMap(screen => screen.map(input => {
      const [ i, j, res, c_size, c_offset ]
      = [ input.id[0], input.id[1], input.resolution, input.cropSize, input.cropOffset ];

      if (input.file === 'NULL') {
        return `[null${videoData.indexOf(screen)}${screen.indexOf(input)}]${getVideoFilters(videoFilters, input.file)}scale=${res.width}x${res.height},crop=${c_size.width}:${c_size.height}:${c_offset.x}:${c_offset.y}[i${i}${j}]`;
      }

      return `[v${i}${j}]${getVideoFilters(videoFilters, input.file)}scale=${res.width}x${res.height},crop=${c_size.width}:${c_size.height}:${c_offset.x}:${c_offset.y}[i${i}${j}]`;
    }));
  }

  function videoOverlay(videoData: VideoData[][]): string[] {
    let index = 0;
    const overlay = videoData.flatMap(screen => screen.map(input => {
      const [ i, j, x, y, start, end ]
      = [ input.id[0], input.id[1], input.position.x, input.position.y, input.interval[0], input.interval[1] ];
      index++;
      return `[tmp${index - 1}][i${i}${j}]overlay=shortest=1:x=${x}:y=${y}:enable='between(t,${start},${end})'[tmp${index}]`;
    }));
    overlay[overlay.length - 1] = overlay[overlay.length - 1].replace(`tmp${index}`, 'out');
    return overlay;
  }

  function genNullStreams(videoData: VideoData[][]): string {
    const out = [ '[tmp0]' ];

    for (const a in videoData) {
      for (const b in videoData[a]) {
        if (videoData[a][b].file === 'NULL') {
          out.push(`[null${a}${b}]`);
        }
      }
    }

    return (`[null]split${out.join('')}`);
  }

  const videoDict: Map<string, number> = genVideoDict(videoInputs);
  const videoData: VideoData[][] = genVideoData(videoInputs, videoDict);

  let duration = 0;
  for (const a of videoData) {
    for (const b of a) {
      if (b.interval[1] > duration) duration = b.interval[1];
    }
  }

  //the filter is the main part of the arguements, it specifies the rendering type,
  //the video layout, timing and video/audio effects.
  const filter = [
    ...[ ...videoDict.keys() ].flatMap(file => [ '-i', file ]),
    ...audioInputs.flatMap(input => [ '-i', input.file ]),

    '-filter_complex', [
      `color=s=${outputResolution.width}x${outputResolution.height}:c=black,trim=0:${duration}[null]`,
      genNullStreams(videoData),
      ...splitInstr(videoData, videoDict),
      ...videoSetup(videoFilters, videoData),
      ...videoOverlay(videoData),
      outputType === 'thumbnail' ? '' : audioInputs.map((input: AudioInput, i: number) =>
        `[${i + videoDict.size}:a]aformat=fltp:48000:stereo,volume=${input.volume || 1}${getAudioFilters(input).length === 0 ? '' : ','.concat(getAudioFilters(input))}[ainput${i}]`)
        .join(';'),
      outputType === 'thumbnail' ? '' : (audioInputs.length === 0 ? '' : `${audioInputs.map((_, i: number) => `[ainput${i}]`).join('')}amix=inputs=${audioInputs.length}:duration=longest,apad[aout]`)
    ].filter(el => el.length > 0).join(';'),

    '-map', '[out]:v:0',
    (outputType === 'thumbnail' || audioInputs.length === 0) ? '' : '-map', (outputType === 'thumbnail' || audioInputs.length === 0) ? '' : '[aout]:a:0'

  ].filter(el => el.length > 0);

  return outputType === 'thumbnail' ? [
    ...filter,
    '-preset', 'ultrafast',
    '-aspect', aspectRatio,
    '-progress', '-', '-nostats', // get it to print stats
    '-r', '1',
    'thumbs/%04d.png'
  ].filter(el => el.length > 0) : [
    outputType === 'preview' ? '-re' : '',
    ...filter,
    '-c:v', 'libx264',
    '-c:a', 'aac',
    '-ac', '2',
    '-ar', audioSampleRate.toString(),
    '-x264opts', `keyint=${framesPerSecond}:min-keyint=${framesPerSecond}:no-scenecut`,
    '-f', outputType === 'preview' ? 'dash' : 'mp4',
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
    '-probesize', '32', '-analyzeduration', '0', // optimisations, can remove if breaking
    '-progress', '-', '-nostats', // get it to print stats
    '-stats',
    outputType === 'render' ? outputFile : previewManifest
  ].filter(el => el.length > 0);
}

let ffmpeg: ChildProcessByStdio<null, Readable, null> | null;
let ffmpeg_thumbs: ChildProcessByStdio<null, Readable, null> | null;

//The function that will specify the engine options and start the rendering process
export function start(
  options: EngineOptions,
  statusCallback: (renderedTime: number) => void,
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
    ffmpeg = spawn(bin, args, { cwd: getTempDirectory(), stdio: [ 'ignore', 'pipe', process.stderr ] });
    ffmpeg.stdout.on('data', data => {
      const values = data.toString().split(/\n|=/);
      const i = values.indexOf('out_time_ms') + 1;
      const doneTime = Number.parseInt(values[i]) / 1000000;
      statusCallback(doneTime);
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
  console.log('THUMBNAIL', bin, args);

  if (bin) {
    ffmpeg_thumbs = spawn(bin, args, { cwd: getTempDirectory(), stdio: [ 'ignore', 'pipe', process.stderr ] });
    ffmpeg_thumbs.on('exit', function() {
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
