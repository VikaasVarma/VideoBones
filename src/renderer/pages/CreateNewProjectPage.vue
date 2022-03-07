<template id="CreateNewProject">
    <div>
        <h1 class="page-title" style="margin-bottom: 5vh; margin-top: 10vh;">VIDEO BONES</h1>

        <menu class="options-menu" style="margin: auto;">

            <div style="grid-column: 1 / 3; grid-row: 1 / 2;" class="named-input-container">
                <h3>Project Name</h3>
                <input @input="updateLocation" id="project-name-input" placeholder="Ex: Gangnam Style A Capella" type="text">
            </div>

            <div class="named-input-container action-input-container" style="grid-column: 1 / 3; grid-row: 2 / 3;">
                <h3 style="margin-bottom: 5px;">Project location</h3>
                <input @input="usingDefaultPath = false" id="project-location-input" type="text">
                <button @click="browseDirectory" class="image-container">
                    <img src="../../../assets/images/folderIcon.png" alt="">
                </button>
            </div>

            <div style="grid-column: 1 / 3; grid-row: 3 / 4; margin-top: auto;">
                <div style="display: flex; justify-content: right;">
                    <div @click="$emit('cancel')" class="button-secondary">Cancel</div>
                    <div @click="createProject()" class="button-primary">Create Project</div>
                </div>
            </div>

        </menu>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ipcRenderer } from 'electron';
import {join} from 'path';

export default defineComponent({
    name: "create-new-project-page",
    emits: ["create-project", "cancel"],
    setup(props, context) {
        let usingDefaultPath = true;
        let selectedDirectory = '';

        async function createProject() {
            let inputButton = <HTMLInputElement>document.getElementById("project-name-input")
            let projectName = inputButton.value

            let otherButton = <HTMLInputElement>document.getElementById("project-location-input")
            let projectLocation = otherButton.value

            if (projectName == "") {
                alert("Please name your project")
                return
            }
            if (projectLocation == "") {
                alert("Please select a location for your project")
                return
            }
            
            ipcRenderer.invoke("create-project-clicked", projectName, projectLocation).then(
            (result) => {
                if (result.failed) {
                    if (result.alert) {
                        alert(result.output)
                    }
                } else {
                    context.emit('create-project')
                }
            }
          )
        }

        function updateLocation() {
            let inputButton = <HTMLInputElement>document.getElementById("project-location-input")
            inputButton.value = join(selectedDirectory, (<HTMLInputElement>document.getElementById("project-name-input")).value)
        }

        async function browseDirectory() {
            usingDefaultPath = true
            selectedDirectory = await ipcRenderer.invoke("browse-directory-clicked")
  
            let inputButton = <HTMLInputElement>document.getElementById("project-location-input")
            inputButton.value = join(selectedDirectory, (<HTMLInputElement>document.getElementById("project-name-input")).value)
        }

        ipcRenderer.invoke('get-default-project-directory').then(dir => {
            selectedDirectory = dir;
            (<HTMLInputElement>document.getElementById("project-location-input")).value = dir;
        })

        return { browseDirectory, createProject, updateLocation, usingDefaultPath }

    }
});
</script>

<style lang="scss" scoped>
  @import '../styles/main';
  @import '../styles/pages/create-new-project';
</style>

