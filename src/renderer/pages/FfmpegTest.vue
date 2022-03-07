<template>
  <video-player v-if="stream_url != '' " :manifest-url="stream_url"/>
</template>

<script lang="ts">
import VideoPlayer from '../components/VideoPlayer.vue'
import { ipcRenderer } from "electron";
import { defineComponent, Ref } from 'vue'
import { join } from 'path';
import { ref } from 'vue'

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
            files: ["video1.webm", "video2.webm", "video3.webm"].map(
                (file) => join("../recordings", (file))
            ),
            screenStyle: "|..",
            resolution: [
                {width: 1280, height: 1440},
                {width: 1280, height: 720},
                {width: 1280, height: 720},
            ],
            interval: [0, 1.5]
          },
          {
            files: ["video5.webm", "video4.webm", "video3.webm", "video2.webm"].map(
                (file) => join("../recordings", (file))
            ),
            screenStyle: "....",
            interval: [1.5, 3],
            resolution: [
                {width: 1280, height: 720},
                {width: 1280, height: 720},
                {width: 1280, height: 720},
                {width: 1280, height: 720}
            ],
          }
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