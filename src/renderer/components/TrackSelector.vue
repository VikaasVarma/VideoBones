<template>
  <div class="tickbox-container">
    <input class="tickbox" type="checkbox">
    <h3>{{ trackName }}</h3>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';


export default defineComponent({
  name: 'TrackSelector',
  props: {
    trackName: String
  }
});

</script>
<style lang="scss" scoped>
  @import "../styles/main.scss";
  @import "../styles/pages/video-editor.scss";
</style>
