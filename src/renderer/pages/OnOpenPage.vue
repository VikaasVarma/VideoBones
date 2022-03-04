<template id="OnOpenPage">
    <h1 class="page-title" style="margin-top: 10%; margin-bottom: 5%;">VIDEO BONES</h1>
    <menu class="horizontal-options-menu">

        <div>
            <button @click="createNewProject()" class="image-container">
                <img src="../../../assets/images/addIcon.png">
            </button>
            
            <h3>Create New Project</h3>
        </div>

        <hr class="vertical-border-line">

        <div>
            <button @click="openProject()" class="image-container">
                <img src="../../../assets/images/folderIcon.png">
            </button>

            <h3>Open Existing Project</h3>
        </div>
    </menu>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { ipcRenderer } from 'electron'

export default defineComponent({
    name: "on-open-page",
    setup(props, context) {

      function createNewProject () {
        context.emit("create-new-project")
        console.log("Emmiting create-new-project")
      }
      
      function openProject() {
          ipcRenderer.invoke("open-project-clicked").then(
            (value) => {
              console.log(value)
              // I know, just leave it be
              if (value === false) {
                alert("Please select a Project file")
              } else {
                context.emit("open-previous-project")
              }
            }
          )
      }

      return { createNewProject, openProject }

    },
    emits: ["create-new-project", "open-previous-project"], 
});


</script>

<style lang="scss" scoped>
  @import "../styles/main.scss";
  @import "../styles/pages/on-open-page.scss";
</style>

