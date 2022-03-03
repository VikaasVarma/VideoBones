<template>
    <div class="recording-grid">
        <video ref=videoPreview> </video>

        <select class=dropdown ref=audioDevices @change="onAudioChange($event)"> </select>

        <div v-bind:class="recording ? 'recording-button' : 'not-recording-button'" @click="recordOnClick()"> <div></div> </div>
        
        <select class=dropdown ref=videoDevices @change="onVideoChange($event)"> </select>
    </div>
</template>

<script lang="ts">
import * as fs from 'fs'
import path from 'path'
import { defineComponent } from 'vue'

export default defineComponent({
  name: "RecordingScreen",
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
    onAudioChange(event: Event) {
      this.audioDevice = (<HTMLSelectElement> event.target).value;
      this.startStreams()
    },
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
          this.audioRecorder.onstop = this.download
        })
    },
    recordOnClick() {
      const audioDevices = <HTMLSelectElement> this.$refs.audioDevices;
      const videoDevices = <HTMLSelectElement> this.$refs.videoDevices;

      this.recording = !this.recording
      if (this.recording) {
        this.videoRecorder.start();
        this.audioRecorder.start();

        // Hide change device menus
        audioDevices.style.display = "none";
        videoDevices.style.display = "none";

      } else {
        this.videoRecorder.stop();
        this.audioRecorder.stop();

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
      const videoBlob = new Blob(this.videoChunks, { type: 'video/webm' })
      videoBlob.arrayBuffer().then(buffer => {
        const videoData = Buffer.from(buffer)
        const videoPath = path.join('media', 'video.webm')
        fs.writeFile(videoPath, videoData, err => {
          if (err) throw err
        })
      })

      const audioBlob = new Blob(this.audioChunks)
      audioBlob.arrayBuffer().then(buffer => {
        const audioData = Buffer.from(buffer)
        const audioPath = path.join('media', 'audio.wav')
        fs.writeFile(audioPath, audioData, err => {
          if (err) throw err
        })
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

    video.autoplay = true;
    this.startStreams()
  }
})
</script>

<style lang="scss" scoped>
  @import "../styles/main.scss";
  @import "../styles/pages/recording-page.scss"
</style>
