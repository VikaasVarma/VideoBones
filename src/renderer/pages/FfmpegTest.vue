<template>
  <video-player v-if="stream_url != '' " :manifest-url="stream_url"/>
</template>

<script lang="ts">
import VideoPlayer from '../components/VideoPlayer.vue'
import { ipcRenderer } from "electron";
import { defineComponent, Ref } from 'vue'
import { join } from 'path';
import { ref } from 'vue'
import { stringify } from 'querystring';

export default defineComponent({
  name: "FfmpegTest",
  components: {
    VideoPlayer,
  },
  data() {
    return {
    }
  },
  setup() {
    let stream_url = ref('')

    ipcRenderer.addListener('asynchronous-reply',  (event, args) => {
      let port = args.port
      if (stream_url.value === "") {
        stream_url.value = "http://localhost:"+port.toString()+"/stream.mpd"
      }
    })

    return {stream_url}
  },
  created() {

    console.log("Running created ()");
    ipcRenderer.invoke('get-recordings-directory').then( (dir) => {
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
          {
            file: join("../recordings", "video3.webm"),
            startTime: 0.02,
            position: {left: 0, top: "h0"},
            resolution: {width: 1280, height: 720}
          },
          {
            file: join("../recordings", "video4.webm"),
            startTime: 0.02,
            position: {left: "w0", top: "h0"},
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