import { open, readFile } from 'fs/promises';
import { createServer } from 'http';
import { getTempDirectory } from '../storage/config';
import { join } from 'path';
import { promisify } from 'util';

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

export async function startIntegratedServer(): Promise<number> {
  if (server.listening) {
    server.close();
  }
  for (let port = 43234; port < 43244; port++) {
    try {
      server.listen(port);
      return port;
    } catch (error) {
      console.warn(`Integrated server port ${port} in use`, error);
    }
  }
  return -1;
}

export function stopIntegratedServer(): void {
  if (server.listening) {
    server.close();
  }
}
