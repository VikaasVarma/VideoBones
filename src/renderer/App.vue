<template>
  <full-video-editor-page/>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import  FullVideoEditorPage from './pages/FullVideoEditorPage.vue'

export default defineComponent({
    name: "App",
    components: {
      FullVideoEditorPage
    }
});
</script>

<style>

</style>