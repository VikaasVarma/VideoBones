<template>
  <div class="tickbox-container">
    <input class="tickbox" type="checkbox" @click="ticked=!ticked">
    <h3>{{ tickbox_text }}</h3>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';


export default defineComponent({
  name: 'TickboxComponent',
  props: {
    tickbox_text: String

  },
  setup() {
    return {};
  },
  data() {
    return { ticked: false };
  }
});

</script>
<style lang="scss" scoped>
  @import "../styles/main.scss";
  @import "../styles/pages/video-editor.scss";
  @import "../styles/pages/single-video-editor.scss";
</style>
