<template>
    <div class="recording-grid">
      <video ref=videoPreview> </video>

      <div class="row vu" ref="vu" :style="{ clipPath : vuClip }"></div>

      <select class=dropdown ref=audioDevices @change="onAudioChange($event)"> </select>

      <div :class="recording ? 'recording-button' : 'not-recording-button'" @click="recordOnClick()"> <div></div> </div>
      
      <select class=dropdown ref=videoDevices @change="onVideoChange($event)"> </select>

      <h2 class="row">Playback Audio Tracks</h2>
      <div class="row tickbox-container" ref=playbackTracks> </div>
    </div>

</template>

<script lang="ts">
import * as fs from 'fs'
import path from 'path'
import { defineComponent } from 'vue'
import { ipcRenderer } from 'electron';

export default defineComponent({
  name: "RecordingPage",
  data() {
    return {
      videoDevice: "default",
      audioDevice: "default",
      videoRecorder: new MediaRecorder(new MediaStream(), undefined),
      audioRecorder: new MediaRecorder(new MediaStream(), undefined),
      videoChunks: <Blob[]> [],
      audioChunks: <Blob[]> [],
      recording: false,
      vuClip: ""
    }
  },
  methods: {
    // On audio device selection change
    onAudioChange(event: Event) {
      this.audioDevice = (<HTMLSelectElement> event.target).value;
      this.startStreams()
    },
    // On video device selection change
    onVideoChange(event: Event) {
      this.videoDevice = (<HTMLSelectElement> event.target).value
      this.startStreams()
    },
    startStreams() {
      const video = <HTMLVideoElement> this.$refs.videoPreview;
      const videoConstraints = {
        audio: false,
        video: { width: 1280, height: 720, deviceId: this.videoDevice }
      }
      // Get video stream
      navigator.mediaDevices.getUserMedia(videoConstraints)
        .then(stream => {
          video.srcObject = stream;

          // mp4/mpeg not supported by electron, though YouTube does support .webm
          // Alternatively we can use ffmpeg to convert between file formats
          const options = { mimeType: 'video/webm' };
          this.videoRecorder = new MediaRecorder(stream, options);

          // Set mediaRecorder funcionality
          const that = this;
          this.videoRecorder.ondataavailable = function(event) {
            that.handleDataAvailable(event, 'video');
          };
          this.videoRecorder.onstop = this.download;
        })

      const audioConstraints = {
        audio: { deviceId: this.audioDevice },
        video: false
      }
      // Get audio stream
      navigator.mediaDevices.getUserMedia(audioConstraints)
        .then(stream => {
          const options = { mimeType: 'audio/webm' };
          this.audioRecorder = new MediaRecorder(stream, options);

          // Set audioRecorder funcionality
          const that = this;
          this.audioRecorder.ondataavailable = function(event) {
            that.handleDataAvailable(event, 'audio');
          }
          
          // Hooking more things up
          const ac = new AudioContext();
          const m = ac.createMediaStreamSource(stream);
          const analyser = ac.createAnalyser();
          m.connect(analyser);
          analyser.fftSize = 32;

          const vuAnimation = () => {
            let d = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(d);
            console.log(d)

            let volume = d.reduce((d1, d2) => Math.max(d1, d2)) / 255 * 100

            this.vuClip = `polygon(0 0, ${volume}% 0, ${volume}% 100%, 0 100%)`;
            console.log(this.vuClip)
            requestAnimationFrame(vuAnimation);

          };
          requestAnimationFrame(vuAnimation);
        })
    },
    async recordOnClick() {
      const audioDevices = <HTMLSelectElement> this.$refs.audioDevices;
      const videoDevices = <HTMLSelectElement> this.$refs.videoDevices;

      this.recording = !this.recording
      // On start recording
      if (this.recording) {
        this.videoRecorder.start();
        this.audioRecorder.start();

        // Hide change device menus
        audioDevices.style.display = "none";
        videoDevices.style.display = "none";

        const playbackTracks = <HTMLDivElement> this.$refs.playbackTracks;
        const audioTracks = <HTMLAudioElement[]> [];
        // @ts-ignore
        for (const node of [...playbackTracks.childNodes]) {
          // Get inputs that have been checked
          if ((<HTMLElement> node).tagName === "INPUT" && (<HTMLInputElement> node).checked) {
            const dir = await ipcRenderer.invoke('get-recordings-directory');
            
            // Create an audio element and preload it
            const audio = new Audio(path.join(dir, (<HTMLInputElement> node).value));
            audio.preload = 'auto';
            
            audioTracks.push(audio);
            playbackTracks.appendChild(audio);
          }
        }
        // Play all the new audio elements
        audioTracks.forEach(audio => {
          audio.play();
        });
      } else {
        this.audioRecorder.stop();
        this.videoRecorder.stop();
        
        audioDevices.style.display = "block";
        videoDevices.style.display = "block";
      }
    },
    handleDataAvailable(event: BlobEvent, type: string) {
      if (event.data.size > 0) {
        if (type === 'video') {
          this.videoChunks.push(event.data)
        } else if (type === 'audio') {
          this.audioChunks.push(event.data)
        }
      }
    },
    download() {
      // Get number to append to file names
      var audioTracks = 1;
      ipcRenderer.invoke('get-option', 'audioTracks').then(function(recordings: string) {
        JSON.parse(recordings).forEach(() => {
          audioTracks++;
        });
      });

      // Write video data to file in project folder
      const videoBlob = new Blob(this.videoChunks, { type: 'video/webm' })
      videoBlob.arrayBuffer().then(async buffer => {
        ipcRenderer.invoke('add-recording', 'video' + audioTracks + '.webm').then(filePath => {
          fs.writeFile(filePath, new Uint8Array(buffer), err => {
            if (err) throw err;
          });
        });
      });
      this.$data.videoChunks = [];

      // Write audio data to file in project folder
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' })
      audioBlob.arrayBuffer().then(buffer => {
        ipcRenderer.invoke('add-recording', 'audio' + audioTracks + '.webm').then(filePath => {
          fs.writeFile(filePath, new Uint8Array(buffer), err => {
            if (err) throw err;
          });

          // Update the audioTracks option to hold the new audio track
          ipcRenderer.invoke('get-option', 'audioTracks').then(option => {
            var copy = JSON.parse(option);
            copy.push('audio' + audioTracks + '.webm');
            ipcRenderer.send('set-option', 'audioTracks', copy);
          })
        });
      });
      this.$data.audioChunks = [];
    },
  },
  mounted () {
    const video = <HTMLVideoElement> this.$refs.videoPreview;
    const audioDevices = <HTMLSelectElement> this.$refs.audioDevices
    const videoDevices = <HTMLSelectElement> this.$refs.videoDevices

    // Adds devices onto audio and video input device menus
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        devices.forEach(device => {
          if (device.kind.toString() === 'audioinput') {
            if (device.deviceId !== 'default' && device.deviceId !== 'communications') {
              audioDevices.options[audioDevices.options.length] = new Option(device.label, device.deviceId);
            }
          } else if (device.kind.toString() === 'videoinput') {
            if (device.deviceId !== 'default') {
              videoDevices.options[videoDevices.options.length] = new Option(device.label, device.deviceId);
            }
          }
        })
      })

    // Add checkboxes for each audio track already recorded to be played back
    const playbackTracks = <HTMLDivElement> this.$refs.playbackTracks;
    ipcRenderer.invoke("get-option", "audioTracks").then(function(recordings: string) {
      JSON.parse(recordings).forEach(function(file:string) {
        var checkbox = document.createElement('input');
        checkbox.className = 'tickbox';
        checkbox.type = 'checkbox';
        checkbox.value = file;

        var header = document.createElement('h3');
        header.textContent = file.substr(0, file.indexOf(".webm"));

        playbackTracks.appendChild(checkbox);
        playbackTracks.appendChild(header);
      });
    }).catch(err => {
      console.log(err);
    });

    video.autoplay = true;
    this.startStreams();
  }
})
</script>

<style lang="scss" scoped>
  @import "../styles/main.scss";
  @import "../styles/pages/recording-page.scss";
</style>
