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
    player.configure({streaming: {
    lowLatencyMode: true,
    inaccurateManifestTolerance: 0,
    rebufferingGoal: 0.01,
  },
  manifest:{
    dash:{
      ignoreMinBufferTime: true,
    }
  }});
    player
      .load(this.manifestUrl)
      .then(() => {
        (<HTMLMediaElement>this.$refs.videoPlayer).play();
      })
      .catch(this.onError);
  },
  methods: {
    onError(error: Error) {
      console.error('Error code', error);
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