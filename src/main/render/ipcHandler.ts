import { ipcMain } from 'electron';
import { getThumbnails, kill, start } from './engine';
import { addAudioOption } from './AudioOption';
import { addVideoOption } from './videoOption';


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
  ipcMain.addListener('asynchronous-message', (event, arg) => {
    switch (arg.type) {
      case 'startEngine':
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
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
