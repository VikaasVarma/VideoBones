<template>
  <div class="slider-container">
    <h3>{{ name }}</h3>
    <input
      v-model="modelValue"
      max="100"
      min="1"
      type="range"
      @change="$emit('update:modelValue', modelValue)"
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
  emits: [ 'update:modelValue' ],
  data() {
    return {
      modelValue: 0
    };
  }
});

</script>
<style lang="scss" scoped>
  @import '../styles/components/slider';
</style>
