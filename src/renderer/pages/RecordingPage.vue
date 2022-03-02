<template>
  <video ref=videoPreview style="transform:scaleX(-1)"> </video>

  <div class="horizontal-spacer">
    <select class=dropdown ref=audioDevices @change="onAudioChange($event)"> </select>

    <button class="image-container" @click="recordOnClick()">
      <img src="../../../assets/images/record.svg">
    </button>

    <select class=dropdown ref=videoDevices @change="onVideoChange($event)"> </select>
  </div>

  <h2>Playback Audio Tracks</h2>
  <div class="tickbox-container" ref=playbackTracks> </div>
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
        for (const node of [...playbackTracks.childNodes]) {
          // Get inputs that have been checked
          if ((<HTMLElement> node).tagName === "INPUT" && (<HTMLInputElement> node).checked) {
            const dir = await ipcRenderer.invoke('get-recordings-directory');
            
            // Create an audio element and preload it
            const audio = new Audio(path.join('../../', dir, (<HTMLInputElement> node).value));
            audio.preload = 'auto';
            
            audioTracks.push(audio);
            playbackTracks.appendChild(audio);
          }
        }
        // Play all the new audio elements
        audioTracks.forEach(audio => {
          audio.play();
        })
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
      ipcRenderer.invoke("get-recordings").then(function(recordings: string) {
        JSON.parse(recordings).forEach(function(file:string) {
          if (file.indexOf(".wav") === file.length - 4) {
            audioTracks++;
          }
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
      })

      // Write audio data to file in project folder
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' })
      console.log(audioBlob);
      audioBlob.arrayBuffer().then(buffer => {
        ipcRenderer.invoke('add-recording', 'audio' + audioTracks + '.wav').then(filePath => {
          fs.writeFile(filePath, new Uint8Array(buffer), err => {
            if (err) throw err;
          });
        });
      })
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
    ipcRenderer.invoke("get-recordings").then(function(recordings: string) {
      JSON.parse(recordings).forEach(function(file:string) {
        if (file.indexOf(".wav") === file.length - 4) {
          var checkbox = document.createElement('input');
          checkbox.className = 'tickbox';
          checkbox.type = 'checkbox';
          checkbox.value = file;

          var header = document.createElement('h3');
          header.textContent = file.substr(0, file.indexOf(".wav"));

          playbackTracks.appendChild(checkbox);
          playbackTracks.appendChild(header);
        }
      });
    }).catch(err => {
      console.log(err);
    });

    video.autoplay = true;
    this.startStreams();
  }
})
</script>

<style lang="scss">
  @import "../styles/main.scss";
  @import "../styles/pages/recording-page.scss"
</style>
