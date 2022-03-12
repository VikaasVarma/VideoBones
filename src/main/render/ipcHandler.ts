import { existsSync, rmSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { ipcMain } from 'electron';
import { getTempDirectory, getOption, setOption } from '../storage/config';
import { getThumbnails, kill, start } from './engine';


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

  ipcMain.addListener('save-track-data', async (event, id: number, data) => {
    console.log('DATA', data);
    let videos = getOption('videoTracks');
    let audios = getOption('audioTracks');

    if (Array.isArray(videos)) {
      videos = videos.map(item => item.trackId !== id ? item : {
        ...item,
        blurEnabled: data.blurEnabled ?? false,
        blurRadius: data.blurRadius ?? 0,
        brightness: data.brightness ?? 0,
        brightnessEnabled: data.brightnessEnabled ?? false,
        contrast: data.contrast ?? 0,
        contrastEnabled: data.contrastEnabled ?? false,
        correctionEnabled: data.correctionEnabled ?? false,
        gammaB: data.gammaB ?? 0,
        gammaG: data.gammaG ?? 0,
        gammaR: data.gammaR ?? 0
      });
      setOption('videoTracks', videos);
    } else if (Array.isArray(audios)) {
      audios = audios.map(item => item.trackId !== id ? item : {
        ...item,
        denoiseEnabled: data.denoiseEnabled ?? false,
        echoDecay: data.echoDecay ?? 0,
        echoDelay: data.echoDelay ?? 0,
        echoEnabled: data.echoEnabled ?? false,
        reverbDecay: data.reverbDecay ?? 0,
        reverbDelay: data.reverbDelay ?? 0,
        reverbEnabled: data.reverbEnabled ?? false,
        volume: data.volume ?? 0
      });
      setOption('audioTracks', audios);
    }
  });
}

export function stopHandler() {
  ipcMain.removeAllListeners();
}
