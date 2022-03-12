import { existsSync, rmSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { ipcMain } from 'electron';
import { getTempDirectory } from '../storage/config';
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
      case 'audioOptions':
        addAudioOption(arg.data);
        break;
      case 'videoOptions':
        addVideoOption(arg.data);
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

  ipcMain.addListener('export-render', (event, args) => {
    args.data.outputFile = args.data.outputFile === undefined ? 'output.mp4' : args.data.outputFile;
    const p = isAbsolute(args.data.outputFile) ? args.data.outputFile : join(getTempDirectory(), args.data.outputFile);
    if (existsSync(p)) {
      console.log(`overwriting ${p}`);
      rmSync(p);
    }
    start(
      { ...args.data, outputType: 'render' }, renderedTime => {
        event.sender.send('render-progress', { renderedTime });
      },
      () => {
        event.sender.send('render-done', { outputFile: p });
      }
    );
  });
}

export function stopHandler() {
  ipcMain.removeAllListeners();
}
