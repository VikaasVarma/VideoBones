<template>
  <video-player v-if="stream_url != '' " :manifest-url="stream_url" />
</template>

<script lang="ts">
import { join } from 'node:path';
import { isUndefined } from 'node:util';
import { ipcRenderer } from 'electron';
import { defineComponent, Ref, ref } from 'vue';
import VideoPlayer from '../components/VideoPlayer.vue';
import { AudioInput } from '../../main/render/types';


export default defineComponent({
  name: 'FfmpegTest',
  components: {
    VideoPlayer
  },
  setup() {
    const stream_url = ref('');

    ipcRenderer.addListener('asynchronous-reply',  (event, args) => {
      const port = args.port;
      if (stream_url.value === '') {
        stream_url.value = `http://localhost:${port.toString()  }/stream.mpd`;
      }
    });

    return { stream_url };
  },
  data() {
    return {};
  },
  created() {

    console.log('Running created ()');
    ipcRenderer.invoke('get-recordings-directory').then(dir => {
      ipcRenderer.send(
        'asynchronous-message',
        {
          type: 'audioOptions',
          data: {
            file: '../recording/audio1.webm',
            startTime: 0,
            volume: 0,
            reverb_active: true,
            reverb_delay_indentidier: 500,
            reverb_decay_indentifier: 0.5,
            declick_active: true,
            declip_active: true
          }
        }
      );
      ipcRenderer.send(
        'asynchronous-message',
        {
          type: 'audioOptions',
          data: {
            file: '../recording/audio2.webm',
            startTime: 0,
            volume: 0,
            reverb_active: true,
            reverb_delay_indentidier: 900,
            reverb_decay_indentifier: 0.5,
            declick_active: false,
            declip_active: true
          }
        }
      );
      ipcRenderer.send(
        'asynchronous-message',
        {
          type: 'audioOptions',
          data: {
            file: '../recording/audio3.webm',
            startTime: 0,
            volume: 0,
            reverb_active: true,
            reverb_delay_indentidier: 200,
            reverb_decay_indentifier: 0.6,
            declick_active: true,
            declip_active: true
          }
        }
      );
      ipcRenderer.send(
        'asynchronous-message',
        {
          type: 'startEngine',
          data: {
            outputType: 'preview',
            videoInputs: [
              // {
              //   files: [ 'video1.webm', 'video2.webm', 'video3.webm' ].map(file => join('../recordings', (file))),
              //   screenStyle: '|..',
              //   resolution: [
              //     { width: 1280, height: 1440 },
              //     { width: 1280, height: 720 },
              //     { width: 1280, height: 720 }
              //   ],
              //   interval: [ 0, 1.5 ]
              // },
              // {
              //   files: [ 'video5.webm', 'video4.webm', 'video3.webm', 'video2.webm' ].map(file => join('../recordings', (file))),
              //   screenStyle: '....',
              //   interval: [ 1.5, 3 ],
              //   resolution: [
              //     { width: 1280, height: 720 },
              //     { width: 1280, height: 720 },
              //     { width: 1280, height: 720 },
              //     { width: 1280, height: 720 }
              //   ]
              // }
            ],
            audioInputs: []
          }
        }
      );
    });
  }
});
</script>

<style lang="scss" scoped>
  @import "../styles/main.scss";
  @import "../styles/pages/recording-page.scss"
</style>
