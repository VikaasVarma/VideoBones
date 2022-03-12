<template>
  <div class="tickbox-container">
    <input
      class="tickbox"
      type="checkbox"
      @change="changed($event)"
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
  emits: [ 'update' ],
  data() {
    return {
      ticked: false
    };
  },
  methods: {
    changed(event: Event) {
      this.ticked = (event.target as HTMLInputElement).checked;
    }
  }
});

</script>

<style lang="scss" scoped>
  @import "../styles/main.scss";
</style>
