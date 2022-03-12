<template>
  <div class="tickbox-container">
    <input
      v-model="modelValue"
      class="tickbox"
      type="checkbox"
      @change="$emit('update:modelValue', modelValue)"
    >
    <h3>{{ text }}</h3>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';


export default defineComponent({
  name: 'TickboxComponent',
  model: {
    prop: 'ticked',
    event: 'update'
  },
  props: {
    text: {
      required: true,
      type: String
    }
  },
  emits: [ 'update:modelValue' ],
  data() {
    return {
      modelValue: false
    };
  }
});

</script>

<style lang="scss" scoped>
  @import '../styles/main';
</style>
