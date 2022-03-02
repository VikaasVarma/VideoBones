import { kill, start } from './engine';
import { ipcMain } from 'electron';

export function startHandler() {
  ipcMain.addListener('asynchronous-message', (event, arg) => {
    if (!arg.type) {
      console.warn('Incorrect type from IPC', arg);
      return;
    }

    switch (arg.type) {
        case 'startEngine':
          start(arg.data, (elapsedTime, donePercentage) => {
            event.sender.send('asynchronous-reply', { event: 'progress', elapsedTime, donePercentage });
          }, () => {
            event.sender.send('asynchronous-reply', { event: 'done' });
          });
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