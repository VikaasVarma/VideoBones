import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { open, readFile } from 'fs/promises';
import { spawn } from 'child_process';

const args = [
  '-re',
  '-v', 'info',
  '-i', 'bbb_1080p_60fps.mp4',
  '-c:v', 'libx264',
  '-c:a', 'aac',
  '-ar', '48000',
  '-x264opts', 'keyint=60:min-keyint=60:no-scenecut',
  '-f', 'dash',
  '-b:v', '4M',
  '-b:a', '256k',
  '-preset', 'ultrafast',
  '-tune', 'zerolatency',
  '-stats',
  //'-maxrate', '2500k',
  //'-bufsize', '2500k',
  '/Users/danielfoldi/Documents/VB/stream.mpd'
];
const ffmpeg = spawn('node_modules/ffmpeg-static/ffmpeg', args, { stdio: ['ignore', 'pipe', process.stderr] });

ffmpeg.stdout.pipe(process.stdout);

export const server = createServer(async (request, response) => {
  console.log(request.url);
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
