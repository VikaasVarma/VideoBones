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
import { Player } from 'shaka-player';

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
    const player = new Player(this.$refs.videoPlayer as HTMLMediaElement);
    player.configure({});
    player
      .load(this.manifestUrl)
      .then(() => {
        console.log(player.getPlaybackRate());
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