<template>
  <div class="track-container">
    <h3 draggable="true">{{ trackName }}</h3>
    <button @click="$emit('edit-clicked')">
      Edit
    </button>
    <button class="destructive" @click="$emit('delete-clicked')">
      Delete
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';


export default defineComponent({
  name: 'TrackSelector',
  props: {
    trackName: {
      type: String,
      required: true
    }
  },
  emits: [ 'edit-clicked', 'delete-clicked' ]
});
</script>

<style lang="scss" scoped>
  @import '../styles/components/_track';
</style>
