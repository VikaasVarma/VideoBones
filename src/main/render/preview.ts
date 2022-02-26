import { open, readFile } from 'fs/promises';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const args = [
  '-re',
  '-v', 'info',
  '-ss', '00:00:00',
  '-i', 'bbb_1080p_60fps.mp4',
  '-ss', '00:00:10',
  '-i', 'bbb_1080p_60fps.mp4',
  '-ss', '00:00:20',
  '-i', 'bbb_1080p_60fps.mp4',
  '-ss', '00:00:30',
  '-i', 'bbb_1080p_60fps.mp4',
  '-filter_complex',
  [
    '[0:v]', 'setpts=PTS-STARTPTS,', 'scale=960x540', '[input0];',
    '[1:v]', 'setpts=PTS-STARTPTS,', 'scale=960x540', '[input1];',
    '[2:v]', 'setpts=PTS-STARTPTS,', 'scale=960x540', '[input2];',
    '[3:v]', 'setpts=PTS-STARTPTS,', 'scale=960x540', '[input3];',
    '[input0][input1][input2][input3]', 'xstack=inputs=4:layout=0_0|0_h0|w0_0|w0_h0[matrix];',
    '[matrix]', 'scale=1920:1080,setsar=1:1[out]'
  ].join(''),
  '-map', '[out]',
  '-c:v', 'libx264',
  '-c:a', 'aac',
  '-ac', '2',
  '-ar', '48000',
  '-x264opts', 'keyint=60:min-keyint=60:no-scenecut',
  '-f', 'dash',
  //'-min_seg_duration', '2000000',
  '-b:v', '6M',
  '-b:a', '320k',
  '-preset', 'ultrafast',
  '-tune', 'zerolatency',
  '-maxrate', '6M',
  '-bufsize', '32M',
  '-stats',
  // TODO replace with storage api path + stream.mpd
  '/Users/danielfoldi/Documents/VB/stream.mpd'
];
// TODO replace with path to ffmpeg binary
const ffmpeg = spawn('node_modules/ffmpeg-static/ffmpeg', args, { stdio: [ 'ignore', 'pipe', process.stderr ] });

ffmpeg.stdout.pipe(process.stdout);

export const server = createServer(async (request, response) => {
  console.log('Internal server request', request.url);
  if (request.url === '/stream.mpd') {
    const file = await readFile(fileURLToPath(new URL('file:///Users/danielfoldi/Documents/VB' + request.url)));
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Content-Type', 'application/dash+xml');
    response.writeHead(200);
    response.end(file);
  } else {
    const file = await open(fileURLToPath(new URL('file:///Users/danielfoldi/Documents/VB' + request.url)), 'r');
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.writeHead(200);
    file.createReadStream().pipe(response);
  }
});
