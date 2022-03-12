<template>
  <div class="track-container">
    <h3 class="track-draggable" @mousedown="$emit('dragged', $event)">
      {{ trackName }}
    </h3>
    <button @click="$emit('edit-clicked')">
      Edit
    </button>
    <button class="destructive" @click="$emit('delete-clicked', trackNumber)">
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
    },
    trackNumber: {
      type: Number,
      required: true
    }
  },
  emits: [ 'dragged', 'edit-clicked', 'delete-clicked' ]
});
</script>

<style lang="scss" scoped>
  @import '../styles/components/track';
</style>
