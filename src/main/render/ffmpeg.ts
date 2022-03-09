import { arch, platform } from 'os';
import { join } from 'path';

export function getPath() {
  if (process.env.FFMPEG_BIN) {
    module.exports = process.env.FFMPEG_BIN;
  } else {
    const binaries = Object.assign(Object.create(null), {
      darwin: [ 'x64', 'arm64' ],
      freebsd: [ 'x64' ],
      linux: [ 'x64', 'ia32', 'arm64', 'arm' ],
      win32: [ 'x64', 'ia32' ]
    });

    const pl = process.env.npm_config_platform || platform();
    const ar = process.env.npm_config_arch || arch();

    const ffmpegPath = join(
      process.cwd(),
      'node_modules',
      'ffmpeg-static',
      pl === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
    );

    if (!binaries[pl] || binaries[pl].indexOf(ar) === -1) {
      return null;
    }

    return ffmpegPath;
  }
}
