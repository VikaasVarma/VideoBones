<template>
  <video ref=videoPreview style="width:90%; height:90%"> </video>
  <select class=dropdown style="width:30%; position:fixed; left:5%" ref=audioDevices> </select>
  <select class=dropdown style="width:30%; position:fixed; right:5%" ref=videoDevices> </select>
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
</style>
