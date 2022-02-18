<template>
  <video ref=videoPreview> </video>

  <div class="horizontal-spacer">
    <select class=dropdown ref=audioDevices> </select>

    <button class="image-container">
        <img src="../../../assets/images/record.png">
    </button>

    <select class=dropdown ref=videoDevices> </select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: "RecordingPreview",
  data() {
    return {videoDevice: "default"}
  },
  methods: {
  },
  mounted () {
    const video = <HTMLVideoElement> this.$refs.videoPreview;
    const audioDevices = <HTMLSelectElement> this.$refs.audioDevices

    audioDevices.options[audioDevices.options.length] = new Option()

    // Adds devices onto audio and video input device menus
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        devices.forEach(device => {
          if (device.kind.toString() === 'audioinput') {
            if (device.deviceId !== 'default' && device.deviceId !== 'communications') {
              audioDevices.options[audioDevices.options.length] = new Option(device.deviceId, device.label);
            }
          }
        })
      })

    const videoConstraints = {
      audio: false,
      video: { width: 1280, height: 720, deviceId: this.videoDevice }
    }
    // Get video stream
    navigator.mediaDevices.getUserMedia(videoConstraints)
      .then(stream => {
        video.srcObject = stream

      })
  }
})
</script>

<style lang="scss">
  @import "../styles/main.scss";
  @import "../styles/pages/recording-page.scss"
</style>
