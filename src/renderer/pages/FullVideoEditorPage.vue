<template>
  <video-player/>
</template>

<script lang="ts">
import VideoPlayer from '../components/VideoPlayer.vue'
import { ipcRenderer } from "electron";
import { defineComponent } from 'vue'

export default defineComponent({
  name: "RecordingPage",
  components: {
    VideoPlayer,
  },
  data() {
    return {
    }
  },
  methods: {
    
  },
  created() {
    console.log("hello");
    ipcRenderer.send('asynchronous-message', 
    {
      type: 'startEngine', 
      data: {
        outputType: "preview",
        videoInputs: [
          {
            file: "media/video1.webm",
            startTime: 0.02,
            position: {left: 0, top: 0},
            resolution: {width: 1280, height: 720}
          },
          {
            file: "media/video2.webm",
            startTime: 0.02,
            position: {left: 0, top: 0},
            resolution: {width: 1280, height: 720}
          },
          {
            file: "media/video3.webm",
            startTime: 0.02,
            position: {left: 0, top: 0},
            resolution: {width: 1280, height: 720}
          },
          {
            file: "media/video4.webm",
            startTime: 0.02,
            position: {left: 0, top: 0},
            resolution: {width: 1280, height: 720}
          }
        ],
        audioInputs:[
          {
            file: "media/audio1.wav",
            startTime: 0.02,
            volume: 255,
          },
          {
            file: "media/audio2.wav",
            startTime: 0.02,
            volume: 255,
          },
          {
            file: "media/audio3.wav",
            startTime: 0.02,
            volume: 255,
          },
          {
            file: "media/audio4.wav",
            startTime: 0.02,
            volume: 255,
          }
        ]
      }
    })
  }
})
</script>

<style lang="scss">
  @import "../styles/main.scss";
  @import "../styles/pages/recording-page.scss"
</style>