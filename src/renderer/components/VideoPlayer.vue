<template>
  <div ref="videoContainer" class="shadow-lg mx-auto max-w-full size">
    <video
      id="video"
      ref="videoPlayer"
      class="w-full h-full"
      :poster="posterUrl"
    ></video>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import * as shaka from 'shaka-player';

export default defineComponent({
  props: {
    manifestUrl: {
      type: String,
      required: true
    },
    posterUrl: {
      type: String,
      required: false,
      default: ''
    }
  },
  mounted() {
    const player = new shaka.Player(this.$refs.videoPlayer as HTMLMediaElement);
    player.configure({
      streaming: {
        lowLatencyMode: true,
        inaccurateManifestTolerance: 0,
        rebufferingGoal: 0.01,
      },
      manifest:{
        dash:{
          ignoreMinBufferTime: true,
        }
      }
    });
    player
      .load(this.manifestUrl)
      .catch(this.onError);
  },
  methods: {
    onError(error: Error) {
      console.error('Error code', error);
    },
    getCurrentTime() {
      return (<HTMLMediaElement>this.$refs.videoPlayer).currentTime;
    },
    getEndTime() {
      return (<HTMLMediaElement>this.$refs.videoPlayer).duration;
    },
    seekToTime(newTime: number) {
      if (newTime < 0 || newTime > (<HTMLMediaElement>this.$refs.videoPlayer).duration) {
        throw Error(`Cannot seek to time ${newTime} in video of duration ${(<HTMLMediaElement>this.$refs.videoPlayer).duration}s.`)
      }

      (<HTMLMediaElement>this.$refs.videoPlayer).currentTime = newTime;
    },
    pausePlayback() {
      (<HTMLMediaElement>this.$refs.videoPlayer).pause();
    },
    resumePlayback() {
      (<HTMLMediaElement>this.$refs.videoPlayer).play();
    }
  }
});
</script>

<style lang="scss" scoped>
//@import '../../node_modules/shaka-player/dist/controls.css'; /* Shaka player CSS import */
.size {
  width: 800px;
}
</style>