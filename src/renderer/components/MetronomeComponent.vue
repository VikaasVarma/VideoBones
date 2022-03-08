<template>

    <div class="metronome-container">
        <h2>{{bpm}}</h2>
        <div>
            <img @click="bpm += 1" src="../../../assets/images/arrow.svg">
            <img @click="bpm -= 1" src="../../../assets/images/arrow.svg" style="transform: scaleY(-1)">
        </div>
    </div>

</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { generateMetronome } from '../util/metronome'

export default defineComponent({
  name: "metronome-component",
  props: {
      bpm : Number
  },
  setup() {
    var bpm = ref(80)

    return {bpm}
  },
  unmounted() {
    // When we switch to the recording page, generate the metronomes
    generateMetronome({ bpm: this.bpm });
  }
});

</script>
<style lang="scss" scoped>
  @import "../styles/main.scss";
  @import "../styles/pages/video-editor.scss";
</style>