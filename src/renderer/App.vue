<template>
  <component ref="parent" @update="onClick()" :is="dynamicComponent"></component>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import OnOpenPage from './pages/OnOpenPage.vue'
import CreateNewProjectPage from './pages/CreateNewProjectPage.vue'
import SingleVideoEditorPage from './pages/SingleVideoEditorPage.vue'


export default defineComponent({
    name: "app",
    props : {
      dynamicComponent: String
    },
    setup(props, context) {
      

      var dynamicComponent = "OnOpenPage"

      var currentPage = OnOpenPage;

      

      function onClick() {
        console.log("Worjkmdsa")
        dynamicComponent = "CreateNewProjectPage" 

      }
      return {"dynamicComponent":CreateNewProjectPage}

      // return {dynamicComponent, onClick, 
              // "OnOpenPage" : OnOpenPage,
              // "CreateNewProjectPage" : CreateNewProjectPage}
    },
});
</script>

<style>

</style>