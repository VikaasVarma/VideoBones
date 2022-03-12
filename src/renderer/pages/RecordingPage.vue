<template>
  <div class="horizontal-spacer">
    <button class="button-primary" @click="$emit('exit-recording')">
      EXIT
    </button>
    <h1 class="section-title">
      RECORDING
    </h1>
  </div>

  <div class="recording-grid">
    <video ref="videoPreview" />

    <div ref="vu" class="row vu" :style="{ clipPath : vuClip }" />

    <select ref="audioDevices" class="dropdown" @change="onAudioChange($event)" />

    <div :class="recording ? 'recording-button' : 'not-recording-button'" @click="recordOnClick()">
      <div />
    </div>

    <select ref="videoDevices" class="dropdown" @change="onVideoChange($event)" />

    <h2 class="row">
      Playback Audio Tracks
    </h2>
    <div ref="playbackTracks" class="row tickbox-container" />
  </div>
</template>

<script lang="ts">
import * as fs from 'node:fs';
import path from 'node:path';
import { defineComponent } from 'vue';
import { ipcRenderer } from 'electron';


export default defineComponent({
  name: 'RecordingPage',
  emits: [ 'recording-end', 'exit-recording' ],
  data() {
    return {
      audioChunks: [] as Blob[],
      audioDevice: 'default',
      audioRecorder: new MediaRecorder(new MediaStream(), undefined),
      metronomeSource: new AudioBufferSourceNode(new AudioContext()),
      recording: false,
      videoChunks: [] as Blob[],
      videoDevice: 'default',
      videoRecorder: new MediaRecorder(new MediaStream(), undefined),
      vuClip: ''
    };
  },
  async mounted() {
    const video = this.$refs.videoPreview as HTMLVideoElement;
    const audioDevices = this.$refs.audioDevices as HTMLSelectElement;
    const videoDevices = this.$refs.videoDevices as HTMLSelectElement;

    // Adds devices onto audio and video input device menus
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        for (const device of devices) {
          if (device.kind.toString() === 'audioinput') {
            if (device.deviceId !== 'default' && device.deviceId !== 'communications') {
              audioDevices.options[audioDevices.options.length] = new Option(device.label, device.deviceId);
            }
          } else if (device.kind.toString() === 'videoinput' && device.deviceId !== 'default') {
            videoDevices.options[videoDevices.options.length] = new Option(device.label, device.deviceId);
          }
        }
      });

    // Needs to wait until the metronomes are saved because they are created on the page switch
    await new Promise(r => setTimeout(r, 500));

    // Add checkboxes for each audio and metronome track to be played back
    const playbackTracks = this.$refs.playbackTracks as HTMLDivElement;
    ipcRenderer.invoke('get-option', 'audioTracks').then((recordings: string) => {
      const audiofiles = JSON.parse(recordings) as string[];
      ipcRenderer.invoke('get-temp-directory').then(dir => {

        fs.readdir(dir, (err, files) => {
          for (const file of files) {
            if (file.lastIndexOf('.wav') === file.length - 4) audiofiles.push(file);
          }

          audiofiles.forEach(function(file: string) {
            const checkbox = document.createElement('input');
            checkbox.className = 'tickbox';
            checkbox.type = 'checkbox';
            checkbox.value = file;

            const header = document.createElement('h3');
            header.textContent = file.slice(0, Math.max(0, file.indexOf('.w')));

            playbackTracks.append(checkbox);
            playbackTracks.append(header);
          });
        });
      });
    });

    video.autoplay = true;
    this.startStreams();
  },
  // On page change, turn stop video and audio streams
  beforeUnmount() {
    const video = this.$refs.videoPreview as HTMLVideoElement;
    const stream = video.srcObject as MediaStream;

    for (const track of stream.getTracks()) {
      track.stop();
    }

    if (this.metronomeSource.buffer !== null) {
      this.metronomeSource.stop();
    }
  },
  methods: {
    download() {
      // If user hits the Exit button during recording
      if (this.recording) {
        return;
      }
      // Get number to append to file names
      let videoCount = 1;
      ipcRenderer.invoke('get-option', 'videoTracks').then((recordings: string) => {
        videoCount = JSON.parse(recordings).length;
      });

      // Write video data to file in project folder
      const videoBlob = new Blob(this.videoChunks, { type: 'video/webm' });
      videoBlob.arrayBuffer().then(async buffer => {
        ipcRenderer.invoke('add-recording', `video${videoCount + 1}.webm`).then(filePath => {
          fs.writeFile(filePath, new Uint8Array(buffer), err => {
            if (err) throw err;
          });

          // Update the audioTracks option to hold the new audio track
          ipcRenderer.invoke('get-option', 'videoTracks').then(option => {
            const copy = JSON.parse(option);
            copy.push({ trackId: videoCount + 1, trackName: `video${videoCount + 1}.webm` });
            ipcRenderer.send('set-option', 'videoTracks', copy);

            // Emit "recording-end" to switch page
            this.$emit('recording-end');
          });
        });
      });
      this.$data.videoChunks = [];

      let audioCount = 1;
      ipcRenderer.invoke('get-option', 'audioTracks').then(function(recordings: string) {
        audioCount = JSON.parse(recordings).length;
      });

      // Write audio data to file in project folder
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      audioBlob.arrayBuffer().then(buffer => {
        ipcRenderer.invoke('add-recording', `audio${audioCount + 1}.webm`).then(filePath => {
          fs.writeFile(filePath, new Uint8Array(buffer), err => {
            if (err) throw err;
          });

          // Update the audioTracks option to hold the new audio track
          ipcRenderer.invoke('get-option', 'audioTracks').then(option => {
            const copy = JSON.parse(option);
            copy.push({ trackId: audioCount + 1, trackName: `audio${audioCount + 1}.webm` });
            ipcRenderer.send('set-option', 'audioTracks', copy);
          });
        });
      });
      this.$data.audioChunks = [];
    },
    handleDataAvailable(event: BlobEvent, type: string) {
      if (event.data.size > 0) {
        if (type === 'video') {
          this.videoChunks.push(event.data);
        } else if (type === 'audio') {
          this.audioChunks.push(event.data);
        }
      }
    },
    // Gets metronome audio source for play back
    async handleMetronome(fileName: string): Promise<AudioBufferSourceNode>{
      const dir = await ipcRenderer.invoke('get-temp-directory');
      const audioFile = path.join(dir, fileName);

      const audioCtx = new AudioContext();
      const source = audioCtx.createBufferSource();

      fs.readFile(audioFile, async (err, data) => {
        if (err) {
          throw err;
        } else {
          const buf = await audioCtx.decodeAudioData(data.buffer);
          source.buffer = buf;
          source.loop = true;
          source.connect(audioCtx.destination);
        }
      });
      return source;
    },
    // On audio device selection change
    onAudioChange(event: Event) {
      this.audioDevice = (event.target as HTMLSelectElement).value;
      this.startStreams();
    },
    onRecordEnd() {
      this.$emit('recording-end');
    },
    // On video device selection change
    onVideoChange(event: Event) {
      this.videoDevice = (event.target as HTMLSelectElement).value;
      this.startStreams();
    },
    async recordOnClick() {
      const audioDevices = this.$refs.audioDevices as HTMLSelectElement;
      const videoDevices = this.$refs.videoDevices as HTMLSelectElement;

      this.recording = !this.recording;
      // On start recording
      if (this.recording) {
        // Hide change device menus
        audioDevices.style.display = 'none';
        videoDevices.style.display = 'none';

        const playbackTracks = this.$refs.playbackTracks as HTMLDivElement;
        const audioTracks = [] as HTMLAudioElement[];
        // eslint-disable-next-line  @typescript-eslint/ban-ts-comment
        // @ts-ignore
        for (const node of playbackTracks.childNodes) {
          // Get inputs that have been checked
          if ((node as HTMLElement).tagName === 'INPUT' && (node as HTMLInputElement).checked) {
            if ((node as HTMLInputElement).value.includes('.wav')) {
              this.$data.metronomeSource = await this.handleMetronome((node as HTMLInputElement).value);
            } else {
              const dir = await ipcRenderer.invoke('get-recordings-directory');

              // Create an audio element and preload it
              const audio = new Audio(path.join(dir, (node as HTMLInputElement).value));
              audio.preload = 'auto';

              audioTracks.push(audio);
              playbackTracks.append(audio);
            }
          }
        }
        // Play all the new audio elements
        for (const audio of audioTracks) {
          audio.play();
        }
        this.$data.metronomeSource.start(0);

        this.videoRecorder.start();
        this.audioRecorder.start();
      } else {
        this.audioRecorder.stop();
        this.videoRecorder.stop();

        this.$data.metronomeSource.stop();
      }
    },
    startStreams() {
      const video = this.$refs.videoPreview as HTMLVideoElement;
      const videoConstraints = {
        audio: false,
        video: { deviceId: this.videoDevice, height: 720, width: 1280 }
      };
      // Get video stream
      navigator.mediaDevices.getUserMedia(videoConstraints)
        .then(stream => {
          video.srcObject = stream;

          // mp4/mpeg not supported by electron, though YouTube does support .webm
          // Alternatively we can use ffmpeg to convert between file formats
          const options = { mimeType: 'video/webm' };
          this.videoRecorder = new MediaRecorder(stream, options);

          // Set mediaRecorder funcionality
          this.videoRecorder.ondataavailable = event => {
            this.handleDataAvailable(event, 'video');
          };

          this.videoRecorder.onstop = this.download;
        });

      const audioConstraints = {
        audio: { deviceId: this.audioDevice },
        video: false
      };
      // Get audio stream
      navigator.mediaDevices.getUserMedia(audioConstraints)
        .then(stream => {
          const options = { mimeType: 'audio/webm' };
          this.audioRecorder = new MediaRecorder(stream, options);

          // Set audioRecorder funcionality
          this.audioRecorder.ondataavailable = event => {
            this.handleDataAvailable(event, 'audio');
          };

          // Hooking more things up
          const ac = new AudioContext();
          const m = ac.createMediaStreamSource(stream);
          const analyser = ac.createAnalyser();
          m.connect(analyser);
          analyser.fftSize = 32;

          const vuAnimation = () => {
            const d = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(d);

            const volume = ((d.sort((a, b) => b - a)[3] / 255) ** 2.5) * 100;

            this.vuClip = `polygon(0 0, ${volume}% 0, ${volume}% 100%, 0 100%)`;
            requestAnimationFrame(vuAnimation);

          };
          requestAnimationFrame(vuAnimation);
        });
    }
  }
});
</script>

<style lang="scss" scoped>
  @import '../styles/main';
  @import '../styles/pages/recording-page';
</style>
