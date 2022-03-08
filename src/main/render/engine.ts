import { AudioInput, EngineOptions, VideoInput } from './types';
import { ChildProcessByStdio, spawn } from 'child_process';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'fs';

import { getPath } from './ffmpeg';
import { getTempDirectory } from '../storage/config';
import { join } from 'path';
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
          throw Error('Fuck you: invalid screenstyle');
    }
  }

  // eslint-disable-next-line function-paren-newline
  const filter // eslint-disable-next-line function-paren-newline
  = videoInputs.map((input: VideoInput) => [ '-ss', (startTime + input.startTime).toString(), '-i', input.file ]).flat(1).concat(
    // eslint-disable-next-line function-paren-newline
    audioInputs.map((input: AudioInput) => [ '-ss', (startTime + input.startTime).toString(), '-i', input.file ]).flat(1).concat([
      '-filter_complex',
      [
        videoInputs.map((input: VideoInput, i: number) => `[${i}:v]setpts=PTS-STARTPTS,scale=${input.resolution.width}x${input.resolution.height}[input${i}];`).join(''),
        `${videoInputs.map((__: VideoInput, i: number) => `[input${i}]`).join('')}xstack=inputs=${videoInputs.length}:layout=${videoInputs.map((input: VideoInput) => `${input.position.left}_${input.position.top}`).join('|')}[matrix];`,
        outputType === 'thumbnail' ? `[matrix]fps=${thumbnailEvery}[pr];` : '',
        `${outputType === 'thumbnail' ? '[pr]' : '[matrix]'}scale=${outputResolution.width}:${outputResolution.height},setsar=1:1[out]${audioInputs.length > 0 ? ';' : ''}`
        //audioInputs.map((input: AudioInput, i: number) => `[${i + videoInputs.length}:a]setpts=PTS-STARTPTS,volume=${input.volume || 256}[ainput${i}];`).join(''),
        //audioInputs.map((__: AudioInput, i:number) => `[ainput${i}]`).join(''), `amerge=inputs=${audioInputs.length}[aout]`
      ].join(''),
      '-map', '[out]'
      //'-map', '[aout]',
    ]));

  let args: string[];

  if (outputType === 'thumbnail') {
    args = filter.concat([ 'thumbs/%04d.png' ]);
  } else {
    args = [ outputType === 'preview' ? '-re' : 'REMOVED' ].concat(filter).concat([
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-ac', '2',
      '-ar', audioSampleRate.toString(),
      '-x264opts', `keyint=${framesPerSecond}:min-keyint=${framesPerSecond}:no-scenecut`,
      { 'preview': '-f', 'thumbnail': 'REMOVED', 'render': '-f' }[outputType],
      { 'preview': 'dash', 'thumbnail': 'REMOVED', 'render': 'mp4' }[outputType],
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
    ])
      .concat([ outputType === 'render' ? outputFile : previewManifest ]).filter(str => {
        return str !== 'REMOVED';
      });
  }

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
    throw Error('Invalid out type for starting engine');
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
    throw Error('Invalid out type for getThumbnails');
  }

  // clean thumbnails folder
  const thumbs = join(getTempDirectory(), 'thumbs');
  if (!existsSync(thumbs)) {
    mkdirSync(thumbs);
  }
  readdirSync(thumbs).forEach(f => rmSync(`${thumbs}/${f}`));

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
