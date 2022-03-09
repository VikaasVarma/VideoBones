<template>

    <div class="tickbox-container">
        <input type="checkbox" class="tickbox"/>
        <h3>{{ trackName }}</h3>
        <button @click="$emit('delete-track', trackNumber )" class="button-close"></button>
    </div>

</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "track-selector",
  props: {
      trackNumber : Number,
  },
  emits: ["delete-track"]
});

</script>
<style lang="scss" scoped>
  @import "../styles/main.scss";
  @import "../styles/pages/video-editor.scss";
</style>