import { join } from 'node:path';
import { ChildProcessByStdio, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';

import { Readable } from 'node:stream';
import { getTempDirectory } from '../storage/config';
import { getPath } from './ffmpeg';
import { AudioInput, EngineOptions, VideoInput } from './types';


const thumbnailResolutionDivisor = 4;

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
  thumbnailEvery = '1',
  videoBitRate = '6M',
  videoInputs = [] as VideoInput[]
}: EngineOptions): string[] {
  // The holy ffmpeg argument builder
  console.log(videoInputs);
  const cumsum = ((sum: number) => (value: VideoInput) => {
    sum += value.files.length; return sum - value.files.length;
  })(0);
  const offset = videoInputs.map(cumsum);

  function screenStyle_to_layout(screenStyle: string) {
    switch (screenStyle) {
      case '....':
        return '0_0|w0_0|0_h0|w0_h0';
      case '|..':
        return '0_0|w0_0|w0_h1';
      case '_..':
        return '0_0|0_h0|w1_h0';
      default:
        throw new Error(`Invalid screenstyle ${screenStyle}`);
    }
  }

  const filter
    = (<string[]>[]).concat(
      videoInputs.map(input => input.files.map(file => [ '-i', file ])).flat(2),
      audioInputs.map(input => input.files.map(file => [ '-i', file ])).flat(2),
      [
        '-filter_complex', `${videoInputs.map((input, i) => ([
          input.resolution.map((res, j) => `[${offset[i] + j}:v]setpts=PTS-STARTPTS,scale=${res.width / (outputType === 'thumbnail' ? thumbnailResolutionDivisor : 1)}x${res.height / (outputType === 'thumbnail' ? thumbnailResolutionDivisor : 1)},trim=${input.interval[0]}:${input.interval[1]}[input${offset[i] + j}];`).join(''),
          `${input.files.map((_, j) => `[input${offset[i] + j}]`).join('')}xstack=inputs=${input.files.length}:layout=${screenStyle_to_layout(input.screenStyle)}[matrix${i}];`,
          `[matrix${i}]scale=${outputResolution.width / (outputType === 'thumbnail' ? thumbnailResolutionDivisor : 1)}:${outputResolution.height / (outputType === 'thumbnail' ? thumbnailResolutionDivisor : 1)},setsar=1:1[v${i}];`
        ].join(''))).join('')  }${videoInputs.map((_, i) => `[v${i}]`).join('')}concat=n=${videoInputs.length},fps=${outputType === 'thumbnail' ? thumbnailEvery : framesPerSecond}[out]`
      ],
      [
        '-map', '[out]'
      //'-map', '[aout]'
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
    '-probesize', '32', '-analyzeduration', '0', // optimisations, can remove if breaking
    '-progress', '-', '-nostats', // get it to print stats
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
