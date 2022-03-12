<template>
  <div class="slider-container">
    <h3>{{ name }}</h3>
    <input
      v-model="value"
      max="100"
      min="1"
      type="range"
      @mouseup="onValueChange"
    >
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';


export default defineComponent({
  name: 'SliderComponent',
  props: {
    name: {
      required: true,
      type: String
    }
  },
  emits: [ 'update' ],
  data() {
    return {
      value: 0
    };
  },
  methods: {
    onValueChange(e: Event) {
      this.$emit('update', + (e.currentTarget as HTMLInputElement).value);
    }
  }
});

</script>
<style lang="scss" scoped>
  @import "../styles/main.scss";
</style>
