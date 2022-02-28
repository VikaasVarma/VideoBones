<template>
  <create-new-project-page v-if="pageDisplayed === 'create-new-project-page'"/>
  <on-open-page @update="pageDisplayed = 'create-new-project-page'" v-else-if="pageDisplayed === 'on-open-page'"/>
  <single-video-editor-page v-else-if="pageDisplayed === 'single-video-editor-page'"/>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import OnOpenPage from './pages/OnOpenPage.vue'
import CreateNewProjectPage from './pages/CreateNewProjectPage.vue'
import SingleVideoEditorPage from './pages/SingleVideoEditorPage.vue'

export default defineComponent({
    name: "app",
    components : {
      OnOpenPage,
      CreateNewProjectPage,
      SingleVideoEditorPage 
    },
    // props : {
    //   pageDisplayed : {type:String, default: "on-open-page"},
    // },

    methods : {
      onClick() {
        console.log("dhjsakdhsakj")
      }
    },
    setup(props, context) {
      var pageDisplayed = ref("on-open-page")
      
      function onClick() {
        pageDisplayed.value = "create-new-project-page"
      }

      return {props, pageDisplayed}

    },
});
</script>

<style>

</style>