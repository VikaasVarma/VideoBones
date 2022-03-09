import { join } from 'node:path';
import { open, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { promisify } from 'node:util';
import { getTempDirectory } from '../storage/config';

/**
 * Holds a static http server open for the lifetime of the program.
 */
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

/**
 * Spins up/restarts the integrated server.
 *
 * @returns A promise resolving to the port the server is using
 */
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

/**
 * Heartlessly murders the server :)
 */
export function stopIntegratedServer(): void {
  if (server.listening) {
    server.close();
  }
}
