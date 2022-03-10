<template>
  <div class="slider-container">
    <h3>{{ slider_name }}</h3>
    <input
      max="100"
      min="1"
      type="range"
      :value="slider_value"
      @mouseup="onValueChange"
    >
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';


export default defineComponent({
  name: 'SliderComponent',
  props: {
    slider_name: String,
    slider_value: Number
  },
  setup(props, context) {

    function onValueChange(e: any) {
      context.emit('update:slider_value', +e.currentTarget.value);
    }

    return { onValueChange };
  }
});

</script>
<style lang="scss" scoped>
  @import "../styles/main.scss";
  @import "../styles/pages/video-editor.scss";
</style>
