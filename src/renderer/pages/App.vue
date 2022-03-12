<template>
  <on-open-page
    v-if="pageDisplayed === 'on-open-page'"
    @create-new-project="pageDisplayed = 'create-new-project-page'"
    @open-previous-project="pageDisplayed = 'video-editor-page'"
  />
  <create-new-project-page
    v-else-if="pageDisplayed === 'create-new-project-page'"
    @cancel="pageDisplayed = 'on-open-page'"
    @create-project="pageDisplayed = 'recording-page'"
  />


  <video-editor-page
    v-else-if="pageDisplayed === 'video-editor-page'"
    @open-recording-page="pageDisplayed = 'recording-page'"
    @open-single-editor="openSingleEditor"
  />

  <single-video-editor-page
    v-else-if="pageDisplayed === 'single-video-editor-page'"
    :video-id="videoId"
    @exit-single-editor="pageDisplayed = 'video-editor-page'"
  />

  <recording-page
    v-else-if="pageDisplayed === 'recording-page'"
    @exit-recording="pageDisplayed = 'video-editor-page'"
    @recording-end="pageDisplayed = 'video-editor-page'"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import OnOpenPage from './OnOpenPage.vue';
import CreateNewProjectPage from './CreateNewProjectPage.vue';
import SingleVideoEditorPage from './SingleVideoEditorPage.vue';
import VideoEditorPage from './VideoEditorPage.vue';
import RecordingPage from './RecordingPage.vue';


export default defineComponent({
  name: 'App',
  components: {
    CreateNewProjectPage,
    OnOpenPage,
    RecordingPage,
    SingleVideoEditorPage,
    VideoEditorPage
  },
  data() {
    return {
      pageDisplayed: 'on-open-page',
      videoId: 0
      // pageDisplayed: 'single-video-editor-page',
    };
  },
  methods: {
    openSingleEditor(track: number) {
      this.videoId = track;
      this.pageDisplayed = 'single-video-editor-page';
    }
  }
});
</script>

<style lang="scss">
  @import '../styles/reset';
  @import '../styles/main';
</style>
