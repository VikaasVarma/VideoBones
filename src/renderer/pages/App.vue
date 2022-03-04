<template>
  <on-open-page @create-new-project="pageDisplayed = 'create-new-project-page'"
                @open-previous-project="pageDisplayed = 'video-editor-page'"
                v-if="pageDisplayed === 'on-open-page'"/>
  <create-new-project-page @create-project="pageDisplayed = 'video-editor-page'"
                           @cancel="pageDisplayed = 'on-open-page'" 
                           v-else-if="pageDisplayed === 'create-new-project-page'"/>

  <video-editor-page @open-single-editor="pageDisplayed = 'single-video-editor-page'" 
                      v-else-if="pageDisplayed === 'video-editor-page'"/>

  <single-video-editor-page @exit-single-editor="pageDisplayed = 'video-editor-page'" 
                  v-else-if="pageDisplayed === 'single-video-editor-page'"/>

  <recording-screen v-else-if="pageDisplayed === 'recording-screen'"/>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import OnOpenPage from './OnOpenPage.vue'
import CreateNewProjectPage from './CreateNewProjectPage.vue'
import SingleVideoEditorPage from './SingleVideoEditorPage.vue'
import VideoEditorPage from './VideoEditorPage.vue';
import RecordingScreen from './RecordingScreen.vue';

export default defineComponent({
    name: "app",
    components : {
      OnOpenPage,
      CreateNewProjectPage,
      SingleVideoEditorPage,
      VideoEditorPage, 
      RecordingScreen,
    },
    setup(props, context) {
      var pageDisplayed = ref("on-open-page")
      
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