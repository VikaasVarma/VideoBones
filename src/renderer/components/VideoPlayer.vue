<template>
  <div ref="videoContainer" class="shadow-lg mx-auto max-w-full size">
    <video
      id="video"
      ref="videoPlayer"
      class="w-full h-full"
      :poster="posterUrl"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
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
    const player = new shaka.Player(this.$refs.videoPlayer as HTMLVideoElement);
    player.configure({
      manifest: {
        dash: {
          ignoreMinBufferTime: true
        }
      },
      streaming: {
        inaccurateManifestTolerance: 0,
        lowLatencyMode: true,
        rebufferingGoal: 0.01
      }
    });
    player
      .load(this.manifestUrl)
      .catch(this.onError);
  },
  methods: {
    getCurrentTime() {
      return (this.$refs.videoPlayer as HTMLVideoElement).currentTime;
    },
    getEndTime() {
      return (this.$refs.videoPlayer as HTMLVideoElement).duration;
    },
    onError(error: Error) {
      console.error('Error code', error);
    },
    pausePlayback() {
      (this.$refs.videoPlayer as HTMLVideoElement).pause();
    },
    resumePlayback() {
      (this.$refs.videoPlayer as HTMLVideoElement).play();
    },
    seekToTime(newTime: number) {
      if (newTime < 0 || newTime > (this.$refs.videoPlayer as HTMLVideoElement).duration) {
        throw new Error(`Cannot seek to time ${newTime} in video of duration ${(this.$refs.videoPlayer as HTMLVideoElement).duration}s.`);
      }

      (this.$refs.videoPlayer as HTMLVideoElement).currentTime = newTime;
    },
  }
});
</script>

<style lang="scss" scoped>
//@import '../../node_modules/shaka-player/dist/controls.css'; /* Shaka player CSS import */
.size {
  width: 800px;
}
</style>
