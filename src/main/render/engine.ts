import { AudioInput, EngineOptions, VideoInput } from './types';
import { ChildProcessByStdio, spawn } from 'child_process';
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
  thumbnailEvery = '1/5',
  videoBitRate = '6M',
  videoInputs = [] as VideoInput[]
}: EngineOptions): string[] {
  // The holy ffmpeg argument builder
  return videoInputs.map((input: VideoInput) => [ '-ss', (startTime + input.startTime).toString(), '-i', input.file ]).flat(1).concat(audioInputs.map((input:AudioInput) => [ '-ss', (startTime + input.startTime).toString(), '-i', input.file ]).flat(1).concat([
    '-filter_complex',
    [
      videoInputs.map((input: VideoInput, i: number) => `[${i}:v]setpts=PTS-STARTPTS,volume=${input.volume || 256},scale=${input.resolution.width}x${input.resolution.height}[input${i}];`).join(''),
      `${videoInputs.map((__: VideoInput, i: number) => `[input${i}]`)}xstack=inputs=${videoInputs.length}:layout=${videoInputs.map((input: VideoInput) => `${input.position.left}_${input.position.top}`).join('|')}[matrix];`,
      outputType === 'thumbnail' ? `[matrix]fps=${thumbnailEvery}[pr];` : '',
      `[${outputType === 'thumbnail' ? '[pr]' : '[matrix]'}]scale=${outputResolution.width}:${outputResolution.height},setsar=1:1[out];`,
      audioInputs.map((input: AudioInput, i: number) => 
      `[${i + videoInputs.length}:a]setpts=PTS-STARTPTS,
        ${!input.echo_active?'':'aecho=in_gain='+input.echo_in_gain+':out_gain='+input.echo_out_gain+':delays='+input.echo_delays+'decays='+input.echo_decays+','}
        ${input.declip_active ? 'adeclip=window=55:overlap=75:arorder=8:threshold=10:hsize=1000:method=add,' : ''}
        ${input.declick_active ? 'adeclick=window=55:overlap:75:arorder=2:threshold=2:burst=2:method=a,' : ''}
        ${input.reverse_active ? 'reverse,' : ''}
        volume=${input.volume || 256}[ainput${i}];`).join(''),
      audioInputs.map((input:AudioInput, i:number) => `[ainput${i}]`).join(''), `amerge=inputs=${audioInputs.length}[aout];`
    ].join(''),
    '-map', '[out]',
    '-map', '[aout]',
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
    outputType === 'preview' ? '-re' : '',
    '-v', 'info',
    '-aspect', aspectRatio,
    '-vol', outputVolume.toString(),
    '-metadata', 'description="Made with VideoBones"',
    '-stats',
    join(getTempDirectory(), outputType === 'render' ? outputFile : (outputType === 'thumbnail' ? 'thumb%04d.png' : previewManifest))
  ]));
}

let ffmpeg: ChildProcessByStdio<null, Readable, null> | null;

export function start(
  options: EngineOptions,
  statusCallback: (elapsedTime: string, donePercentage: number) => void,
  doneCallback: () => void
) {
  if (ffmpeg) {
    ffmpeg.kill();
  }

  const bin = getPath();
  const args = buildArgs(options);
  console.log(bin, args);

  if (bin) {
    ffmpeg = spawn(bin, args, { stdio: [ 'ignore', 'pipe', process.stderr ] });
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
