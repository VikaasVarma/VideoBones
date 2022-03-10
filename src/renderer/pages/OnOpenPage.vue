<template id="OnOpenPage">
  <h1 class="page-title" style="margin-top: 10%; margin-bottom: 5%;">
    VIDEO BONES
  </h1>
  <menu class="horizontal-options-menu">
    <div>
      <button class="image-container" @click="$emit('create-new-project')">
        <img src="../../../assets/images/addIcon.png">
      </button>

      <h3>Create New Project</h3>
    </div>

    <hr class="vertical-border-line">

    <div>
      <button class="image-container" @click="openProject()">
        <img src="../../../assets/images/folderIcon.png">
      </button>

      <h3>Open Existing Project</h3>
    </div>
  </menu>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ipcRenderer } from 'electron';


export default defineComponent({
  name: 'OnOpenPage',
  emits: [ 'create-new-project', 'open-previous-project' ],
  setup(props, context) {

    function openProject() {
      ipcRenderer.invoke('open-project-clicked').then(result => {
        if (result.failed) {
          if (result.alert) {
            alert(result.output);
          }
        } else {
          context.emit('open-previous-project');
        }
      });
    }

    return { openProject };

  }
});


</script>

<style lang="scss" scoped>
  @import "../styles/main.scss";
  @import "../styles/pages/on-open-page.scss";
</style>
