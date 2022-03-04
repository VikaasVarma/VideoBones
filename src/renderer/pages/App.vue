<template>
  <on-open-page @create-new-project="pageDisplayed = 'create-new-project-page'"
                v-if="pageDisplayed === 'on-open-page'"/>
  <create-new-project-page @create-project="pageDisplayed = 'video-editor-page'"
                           @cancel="pageDisplayed = 'on-open-page'" 
                           v-else-if="pageDisplayed === 'create-new-project-page'"/>

  <single-video-editor-page v-else-if="pageDisplayed === 'single-video-editor-page'"/>
  <video-editor-page v-else-if="pageDisplayed === 'video-editor-page'"/>
  <recording-page v-else-if="pageDisplayed === 'recording-page'"/>
  <ffmpeg-test v-else-if="pageDisplayed === 'ffmpeg-test'"/>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import OnOpenPage from './OnOpenPage.vue'
import CreateNewProjectPage from './CreateNewProjectPage.vue'
import SingleVideoEditorPage from './SingleVideoEditorPage.vue'
import VideoEditorPage from './VideoEditorPage.vue';
import RecordingPage from './RecordingPage.vue'
import FfmpegTest from './FfmpegTest.vue'


export default defineComponent({
    name: "app",
    components : {
      OnOpenPage,
      CreateNewProjectPage,
      SingleVideoEditorPage,
      VideoEditorPage, 
      RecordingPage,
      FfmpegTest,
    },
    methods : {
      onClick() {
        console.log("dhjsakdhsakj")
      }
    },
    setup(props, context) {
      var pageDisplayed = ref("ffmpeg-test")
      
      function onClick() {
        pageDisplayed.value = "create-new-project-page"
        console.log("working")
      }

      return {props, pageDisplayed}

    },
});
</script>

<style lang="scss">
  @import "../styles/main.scss";
</style>