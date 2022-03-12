<template id="CreateNewProject">
  <div>
    <h1 class="page-title" style="margin-bottom: 5vh; margin-top: 10vh;">
      VIDEO BONES
    </h1>

    <menu class="options-menu" style="margin: auto;">
      <div class="named-input-container" style="grid-column: 1 / 3; grid-row: 1 / 2;">
        <h3>Project Name</h3>
        <input
          id="project-name-input"
          placeholder="Ex: Gangnam Style A Capella"
          type="text"
          @input="updateLocation()"
        >
      </div>

      <div class="named-input-container action-input-container" style="grid-column: 1 / 3; grid-row: 2 / 3;">
        <h3 style="margin-bottom: 5px;">
          Project location
        </h3>
        <input id="project-location-input" type="text" @input="usingDefaultPath = false">
        <button class="image-container" @click="browseDirectory()">
          <img alt="" src="../../../assets/images/folderIcon.png">
        </button>
      </div>

      <div style="grid-column: 1 / 3; grid-row: 3 / 4; margin-top: auto;">
        <div style="display: flex; justify-content: right;">
          <div class="button-secondary" @click="$emit('cancel')">
            Cancel
          </div>
          <div class="button-primary" @click="createProject()">
            Create Project
          </div>
        </div>
      </div>
    </menu>
  </div>
</template>

<script lang="ts">
import { join } from 'node:path';
import { defineComponent } from 'vue';
import { ipcRenderer } from 'electron';


export default defineComponent({
  name: 'CreateNewProjectPage',
  emits: [ 'create-project', 'cancel' ],
  setup(props, context) {
    let usingDefaultPath = true;
    let selectedDirectory = '';

    async function createProject() {
      const inputButton = document.querySelector('#project-name-input') as HTMLInputElement;
      const projectName = inputButton.value;

      const otherButton = document.querySelector('#project-location-input') as HTMLInputElement;
      const projectLocation = otherButton.value;

      if (projectName === '') {
        alert('Please name your project');
        return;
      }
      if (projectLocation === '') {
        alert('Please select a location for your project');
        return;
      }

      ipcRenderer.invoke('create-project-clicked', projectName, projectLocation).then(result => {
        if (result.failed) {
          if (result.alert) {
            alert(result.output);
          }
        } else {
          context.emit('create-project');
        }
      });
    }

    function updateLocation() {
      if (!usingDefaultPath) {
        return;
      }
      const inputButton = document.querySelector('#project-location-input') as HTMLInputElement;
      inputButton.value = join(selectedDirectory, (document.querySelector('#project-name-input') as HTMLInputElement).value);
    }

    async function browseDirectory() {
      usingDefaultPath = true;
      selectedDirectory = await ipcRenderer.invoke('browse-directory-clicked');

      const inputButton = document.querySelector('#project-location-input') as HTMLInputElement;
      inputButton.value = join(selectedDirectory, (document.querySelector('#project-name-input') as HTMLInputElement).value);
    }

    ipcRenderer.invoke('get-default-project-directory').then(dir => {
      selectedDirectory = dir;
      (document.querySelector('#project-location-input') as HTMLInputElement).value = dir;
    });

    return { browseDirectory, createProject, updateLocation, usingDefaultPath };

  }
});
</script>

<style lang="scss" scoped>
  @import '../styles/main';
  @import '../styles/pages/create-new-project';
</style>
