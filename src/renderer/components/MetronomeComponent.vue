<template>
  <div class="metronome-container">
    <h2>{{ modelValue }}</h2>
    <div>
      <img src="../../../assets/images/arrow.svg" @click="modelValue++; $emit('update:modelValue', modelValue)">
      <img
        src="../../../assets/images/arrow.svg"
        style="transform: scaleY(-1);"
        @click="modelValue--; $emit('update:modelValue', modelValue)"
      >
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { generateMetronome } from '../util/metronome';


export default defineComponent({
  name: 'MetronomeComponent',
  emits: [ 'update:modelValue' ],
  data() {
    return {
      modelValue: 80
    };
  },
  unmounted() {
    // When we switch to the recording page, generate the metronomes
    generateMetronome({ bpm: this.modelValue });
  }
});

</script>
<style lang="scss" scoped>
  @import '../styles/main';
</style>
