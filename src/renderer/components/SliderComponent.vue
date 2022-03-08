<template>
    
    <div class="slider-container">
        <h3>{{slider_name}}</h3>
        <input type="range" min="1" max="100" value="50">
    </div>

</template>

<script lang="ts">
import { defineComponent, ref } from "vue";

export default defineComponent({
  name: "slider-component",
  props: {
      slider_name : String,
  },
  setup() {
    return {}
  },
});

</script>
<style lang="scss" scoped>
  @import "../styles/main.scss";
  @import "../styles/pages/video-editor.scss";
</style>