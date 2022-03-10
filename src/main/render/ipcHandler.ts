import { ipcMain } from 'electron';
import { getThumbnails, kill, start } from './engine';
import { addAudioOption } from './AudioOption';
import { addVideoOption } from './videoOption';


/**
 * Adds a bunch of handlers for ipc message types for render interactions.
 *
 * Essentially provides the inter-thread interface for the frontend to call this backend stuff.
 *
 * @param port Specifies which port the integrated server should attempt to use when serving the render output.
 */
export function startHandler(port: number) {

  ipcMain.addListener('asynchronous-message', (event, arg) => {
    if (!arg.type) {
      console.warn('Incorrect type from IPC', arg);
      return;
    }

    switch (arg.type) {
      case 'startEngine':
        start(arg.data, (elapsedTime, donePercentage) => {
          event.sender.send('asynchronous-reply', { donePercentage, elapsedTime, event: 'progress', port });
        }, () => {
          event.sender.send('asynchronous-reply', { event: 'done', port });
        });
        break;
      case 'getThumbnails':
        getThumbnails(arg.data, (thumbnailFiles: string[]) => {
          event.sender.send('thumbnail-reply', { event: 'thumbnails', thumbnailFiles });
        });
        break;
      case 'audioOptions':
        addAudioOption(arg.data);
        break;
      case 'videoOptions':
        addVideoOption(arg.data);
        break;
      case 'stopEngine':
        kill();
        break;
      default:
        console.warn('Unknown type from IPC', arg);
    }
  });
}

export function stopHandler() {
  ipcMain.removeAllListeners();
}
