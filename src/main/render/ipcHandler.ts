import { ipcMain } from 'electron';
import { getThumbnails, kill, start } from './engine';
import { addAudioOption } from './AudioOption';


export function startHandler(port: number) {

  ipcMain.addListener('asynchronous-message', (event, arg) => {
    if (!arg.type) {
      console.warn('Incorrect type from IPC', arg);
      return;
    }

    switch (arg.type) {
      case 'startEngine':
        start(arg.data, (elapsedTime, donePercentage) => {
          event.sender.send('asynchronous-reply', { event: 'progress', elapsedTime, donePercentage, port });
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
