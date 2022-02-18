<template>
  <recording-screen> </recording-screen>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import  RecordingScreen from './pages/RecordingScreen.vue'

export default defineComponent({
    name: "App",
    components: {
      RecordingScreen
    }
});
</script>

<style>

</style>