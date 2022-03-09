import { ipcMain } from 'electron';
import { getThumbnails, kill, start } from './engine';


/**
 * Adds a bunch of handlers for ipc message types for render interactions.
 *
 * Essentially provides the inter-thread interface for the frontend to call this backend stuff.
 *
 * @param port Specifies which port the integrated server should attempt to use when serving the render output.
 */
export function startHandler(port: number) {
  // start the preview render engine
  ipcMain.addListener('start-engine', (event, arg) => {
    start(arg.data, renderedTime => {
      event.sender.send('engine-progress', { port, renderedTime });
    }, () => {
      event.sender.send('engine-done', { port });
    });
  });

  ipcMain.addListener('stop-engine', () => {
    kill();
  });

  // start the thumbnail engine
  ipcMain.addListener('get-thumbnails', (event, arg) => {
    getThumbnails(arg.data, (thumbnailFiles: string[]) => {
      event.sender.send('thumbnail-reply', { thumbnailFiles });
    });
  });
}

export function stopHandler() {
  ipcMain.removeAllListeners();
}
