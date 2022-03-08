<template>
  <video-player v-if="stream_url != '' " :manifest-url="stream_url"/>
</template>

<script lang="ts">
import VideoPlayer from '../components/VideoPlayer.vue'
import { ipcRenderer } from "electron";
import { defineComponent, Ref } from 'vue'
import { join } from 'path';
import { ref } from 'vue'
import { AudioInput } from '../../main/render/types';
import { isUndefined } from 'util';

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
          new AudioInput(join("../recordings", "audio1.webm"),
            1.0,255,'On',400,0.7,true,true),
          new AudioInput(join("../recordings", "audio2.webm"),
            0.2,255,'On',200,0.5,false,false),
          new AudioInput(join("../recordings", "audio3.webm"),
            2.0,255,'Off',undefined,undefined,false,true),
        ]
      }
    })
    });
  }
})
</script>

<style lang="scss" scoped>
  @import "../styles/main.scss";
  @import "../styles/pages/recording-page.scss"
</style>