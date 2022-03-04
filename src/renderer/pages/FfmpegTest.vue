<template>
  <video-player manifest-url="http://localhost:8080/stream.mpd"/>
</template>

<script lang="ts">
import VideoPlayer from '../components/VideoPlayer.vue'
import { ipcRenderer } from "electron";
import { defineComponent } from 'vue'
import { join } from 'path';

export default defineComponent({
  name: "FfmpegTest",
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
    ipcRenderer.invoke('get-recordings-directory').then(dir => {
      ipcRenderer.send('asynchronous-message', 
    {
      type: 'startEngine', 
      data: {
        outputType: "preview",
        videoInputs: [
          {
            file: join("../recordings", "video1.webm"),
            startTime: 0.02,
            position: {left: 0, top: 0},
            resolution: {width: 1280, height: 720}
          },
          {
            file: join("../recordings", "video2.webm"),
            startTime: 0.02,
            position: {left: "w0", top: 0},
            resolution: {width: 1280, height: 720}
          },
        ],
        audioInputs:[
          /*{
            file: join("../recordings", "audio1.webm"),
            startTime: 0.02,
            volume: 255,
          },*/
        ]
      }
    })
    });
  }
})
</script>

<style lang="scss">
  @import "../styles/main.scss";
  @import "../styles/pages/recording-page.scss"
</style>