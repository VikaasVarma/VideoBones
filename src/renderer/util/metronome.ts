import * as fs from 'fs';

import { ipcRenderer } from 'electron';

interface MetronomeOptions {
  bpm: number;
  offset?: number;
  beatsPerBar?: number;
  freqMain?: number;
  freqSub?: number;
  gainMain?: number;
  gainSub?: number;
  lengthMain?: number;
  lengthSub?: number;
}

export function generateMetronome({
  bpm,
  offset = 0,
  beatsPerBar = 4,
  freqMain = 440,
  freqSub = 220,
  gainMain = 1,
  gainSub = 0.8,
  lengthMain = 1 / 16,
  lengthSub = 1 / 16
}: MetronomeOptions) {
  const ac = new AudioContext();
  const length = 1 / (bpm / 60) * beatsPerBar;
  const buf = ac.createBuffer(1, ac.sampleRate * length, ac.sampleRate);
  const channel = buf.getChannelData(0);

  let amplitude = gainMain;
  let phase = 0;
  const first = offset;

  for (let i = 0; i < lengthMain * ac.sampleRate; i++) {
    channel[i + first] = amplitude * Math.sin(phase);
    phase += 2 * Math.PI * freqMain / ac.sampleRate;
    if (phase > 2 * Math.PI) {
      phase -= 2 * Math.PI;
    }
    amplitude -= gainMain / (lengthMain * ac.sampleRate);
  }

  for (let c = 1; c < beatsPerBar; c++) {
    let amplitude = gainSub;
    let phase = 0;
    const first = Math.round(ac.sampleRate * 1 / (bpm / 60) * c) + offset;

    for (let i = 0; i < lengthSub * ac.sampleRate; i++) {
      channel[i + first] = amplitude * Math.sin(phase);
      phase += 2 * Math.PI * freqSub / ac.sampleRate;
      if (phase > 2 * Math.PI) {
        phase -= 2 * Math.PI;
      }
      amplitude -= gainSub / (lengthSub * ac.sampleRate);
    }
  }

  // Float32Array samples
  const data =  buf.getChannelData(0);

  // get WAV file bytes and audio params of your audio source
  const wavBytes = getWavBytes(data.buffer, {
    isFloat: true,       // floating point or 16-bit integer
    numChannels: 1,
    sampleRate: 48000
  });
  const wav = new Blob([ wavBytes ], { type: 'audio/wav' });

  wav.arrayBuffer().then(buffer => {
    ipcRenderer.invoke('add-recording', 'metronome.wav').then(filePath => {
      fs.writeFile(filePath, new Uint8Array(buffer), err => {
        if (err) throw err;
      });

      // Update the audioTracks option to hold the new audio track
      ipcRenderer.invoke('get-option', 'audioTracks').then(option => {
        const copy = JSON.parse(option);
        copy.push('metronome.wav');
        ipcRenderer.send('set-option', 'audioTracks', copy);
      });
    });
  });
}

// Returns Uint8Array of WAV bytes
function getWavBytes(buffer: ArrayBufferLike, options: WavOptions) {
  const type = options.isFloat ? Float32Array : Uint16Array;
  const numFrames = buffer.byteLength / type.BYTES_PER_ELEMENT;

  const headerBytes = getWavHeader(Object.assign({}, options, { numFrames }));
  const wavBytes = new Uint8Array(headerBytes.length + buffer.byteLength);

  // prepend header, then add pcmBytes
  wavBytes.set(headerBytes, 0);
  wavBytes.set(new Uint8Array(buffer), headerBytes.length);

  return wavBytes;
}

interface WavOptions {
  numFrames?: number;
  numChannels: number;
  sampleRate: number;
  isFloat: boolean;
}

// copied from https://stackoverflow.com/questions/62172398/convert-audiobuffer-to-arraybuffer-blob-for-wav-download
// returns Uint8Array of WAV header bytes
function getWavHeader(options: WavOptions) {
  const numFrames =      <number> options.numFrames;
  const numChannels =    options.numChannels || 2;
  const sampleRate =     options.sampleRate || 44100;
  const bytesPerSample = options.isFloat ? 4 : 2;
  const format =         options.isFloat ? 3 : 1;

  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numFrames * blockAlign;

  const buffer = new ArrayBuffer(44);
  const dv = new DataView(buffer);

  let p = 0;

  function writeString(s: string) {
    for (let i = 0; i < s.length; i++) {
      dv.setUint8(p + i, s.charCodeAt(i));
    }
    p += s.length;
  }

  function writeUint32(d: number) {
    dv.setUint32(p, d, true);
    p += 4;
  }

  function writeUint16(d: number) {
    dv.setUint16(p, d, true);
    p += 2;
  }

  writeString('RIFF') ;             // ChunkID
  writeUint32(dataSize + 36);       // ChunkSize
  writeString('WAVE');              // Format
  writeString('fmt ');              // Subchunk1ID
  writeUint32(16);                  // Subchunk1Size
  writeUint16(format);              // AudioFormat https://i.stack.imgur.com/BuSmb.png
  writeUint16(numChannels);         // NumChannels
  writeUint32(sampleRate);          // SampleRate
  writeUint32(byteRate);            // ByteRate
  writeUint16(blockAlign);          // BlockAlign
  writeUint16(bytesPerSample * 8);  // BitsPerSample
  writeString('data');              // Subchunk2ID
  writeUint32(dataSize);            // Subchunk2Size

  return new Uint8Array(buffer);
}
