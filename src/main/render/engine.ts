import { AudioInput, EngineOptions, VideoInput } from './types';
import { ChildProcessByStdio, spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
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
  return videoInputs.map((input:VideoInput) => [ '-ss', (startTime + input.startTime).toString(), '-i', input.file ]).flat(1).concat([
    '-filter_complex',
    [
      videoInputs.map((input: VideoInput, i: number) => `[${i}:v]setpts=PTS-STARTPTS,volume=${input.volume},scale=${input.resolution.width}x${input.resolution.height}[input${i}];`).join(''),
      `${videoInputs.map((__: VideoInput, i:number) => `[input${i}]`)}xstack=inputs=${videoInputs.length}:layout=0_0|0_h0|w0_0|w0_h0[matrix];`,
      outputType === 'thumbnail' ? `[matrix]fps=${thumbnailEvery}[pr]` : '[matrix][pr]',
      `[pr]scale=${outputResolution.width}:${outputResolution.height},setsar=1:1[out]`
    ].join(''),
    '-map', '[out]',
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
    join(getTempDirectory(), outputType === 'render' ? outputFile : previewManifest)
  ]);
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

  const args = buildArgs(options);

  ffmpeg = spawn(ffmpegStatic, args, { stdio: [ 'ignore', 'pipe', process.stderr ] });
  ffmpeg.stdout.on('data', data => {
    console.log(data);
    statusCallback(data.toString(), 0);
  });
  ffmpeg.on('exit', doneCallback);
}

export function kill() {
  if (ffmpeg) {
    ffmpeg.kill();
    ffmpeg = null;
  }
}
