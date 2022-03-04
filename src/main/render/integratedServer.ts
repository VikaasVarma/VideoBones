import { open, readFile } from 'fs/promises';
import { createServer } from 'http';
import { getTempDirectory } from '../storage/config';
import { join } from 'path';

const server = createServer(async (request, response) => {
  console.log('Integrated server request', request.url);
  try {
    if (request.url === '/stream.mpd') {
      const file = await readFile(join(getTempDirectory(), request.url));
      response.setHeader('Access-Control-Allow-Origin', '*');
      response.setHeader('Content-Type', 'application/dash+xml');
      response.writeHead(200);
      response.end(file);
    } else if (request.url) {
      const file = await open(join(getTempDirectory(), request.url), 'r');
      response.setHeader('Access-Control-Allow-Origin', '*');
      response.writeHead(200);
      file.createReadStream().pipe(response);
    } else {
      response.end();
    }
  } catch (error) {
    response.end();
    console.warn('Integrated server encountered error', error);
  }
});

export function startIntegratedServer(): void {
  if (server.listening) {
    server.close();
  }
  server.listen(8080);
}

export function stopIntegratedServer(): void {
  if (server.listening) {
    server.close();
  }
}
