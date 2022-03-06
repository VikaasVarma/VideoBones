<template>
  <on-open-page @create-new-project="pageDisplayed = 'create-new-project-page'"
                @open-previous-project="pageDisplayed = 'video-editor-page'"
                v-if="pageDisplayed === 'on-open-page'"/>
  <create-new-project-page @create-project="pageDisplayed = 'video-editor-page'"
                           @cancel="pageDisplayed = 'on-open-page'" 
                           v-else-if="pageDisplayed === 'create-new-project-page'"/>

<<<<<<< HEAD
  <single-video-editor-page v-else-if="pageDisplayed === 'single-video-editor-page'"/>
  <video-editor-page v-else-if="pageDisplayed === 'video-editor-page'"/>
  <recording-page v-else-if="pageDisplayed === 'recording-page'"/>
  <ffmpeg-test v-else-if="pageDisplayed === 'ffmpeg-test'"/>
=======
  <video-editor-page @open-single-editor="pageDisplayed = 'single-video-editor-page'" 
                      v-else-if="pageDisplayed === 'video-editor-page'"/>

  <single-video-editor-page @exit-single-editor="pageDisplayed = 'video-editor-page'" 
                  v-else-if="pageDisplayed === 'single-video-editor-page'"/>

  <recording-page v-else-if="pageDisplayed === 'recording-page'"/>
>>>>>>> origin/master
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import OnOpenPage from './OnOpenPage.vue'
import CreateNewProjectPage from './CreateNewProjectPage.vue'
import SingleVideoEditorPage from './SingleVideoEditorPage.vue'
import VideoEditorPage from './VideoEditorPage.vue';
<<<<<<< HEAD
import RecordingPage from './RecordingPage.vue'
import FfmpegTest from './FfmpegTest.vue'

=======
import RecordingPage from './RecordingPage.vue';
>>>>>>> origin/master

export default defineComponent({
    name: "app",
    components : {
      OnOpenPage,
      CreateNewProjectPage,
      SingleVideoEditorPage,
      VideoEditorPage, 
      RecordingPage,
<<<<<<< HEAD
      FfmpegTest,
    },
    methods : {
      onClick() {
        console.log("dhjsakdhsakj")
      }
    },
    setup(props, context) {
      var pageDisplayed = ref("ffmpeg-test")
=======
    },
    setup(props, context) {
      // var pageDisplayed = ref("recording-page")
      var pageDisplayed = ref("on-open-page")
>>>>>>> origin/master
      
      function onClick() {
        pageDisplayed.value = "create-new-project-page"
      }

      return {props, pageDisplayed}

    },
});
</script>

<style lang="scss">
  @import "../styles/main.scss";
</style>