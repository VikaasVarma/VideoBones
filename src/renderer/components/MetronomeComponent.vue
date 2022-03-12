<template>
  <div class="metronome-container">
    <h2>{{ modelValue }}</h2>
    <div>
      <img src="../../../assets/images/arrow.svg" @click="updateMetronome(1)">
      <img
        src="../../../assets/images/arrow.svg"
        style="transform: scaleY(-1);"
        @click="updateMetronome(-1)"
      >
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ipcRenderer } from 'electron';
import { generateMetronome } from '../util/metronome';


export default defineComponent({
  name: 'MetronomeComponent',
  emits: [ 'update:modelValue' ],
  data() {
    return {
      modelValue: 80
    };
  },
  mounted() {
    ipcRenderer.invoke('get-option', 'metronome').then(bpm => {
      if (bpm !== null) {
        this.modelValue = Number.parseInt(bpm);
        this.$emit('update:modelValue', this.modelValue);
      }
    });
  },
  unmounted() {
    // When we switch to the recording page, generate the metronomes
    generateMetronome({ bpm: this.modelValue });
  },
  methods: {
    updateMetronome(change?: number) {
      if (change) {
        this.modelValue += change;
      }
      ipcRenderer.send('set-option', 'metronome', this.modelValue);
      this.$emit('update:modelValue', this.modelValue);
    }
  }
});

</script>
<style lang="scss" scoped>
  @import '../styles/components/metronome';
</style>
