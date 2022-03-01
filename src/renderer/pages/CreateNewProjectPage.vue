<template id="CreateNewProject">
    <div>
        <h1 class="page-title" style="margin-top: 10%; margin-bottom: 5%;">VIDEO BONES</h1>

        <menu class="options-menu" style="margin: auto;">

            <div style="grid-column: 1 / 3; grid-row: 1/1;" class="named-input-container">
                <h3>Project Name</h3>
                <input placeholder="Ex: Gangnam Style TikTok" type="text">
            </div>

            <div style="grid-column: 1 / 2; grid-row: 2/2;">
                <h3 style="margin-bottom: 5px">Video Input</h3>
                <select name="" id="" >
                    <option value="built-in-camera" style="color: white">Built-in Camera</option>
                </select>
            </div>

            <div style="grid-column: 2 / 2; grid-row: 2/2;">
                <h3 style="margin-bottom: 5px">Audio Input</h3>
                <div class="select-box">
                    <select name="" id="">
                        <option value="built-in-mic">Built-in Microphone</option>
                    </select>
                </div>
            </div>
            <div style="grid-column: 1 / 3; grid-row: 3/3;" class="horizontal-spacer">
                <div @click="cancel()" class="button-secondary">Cancel</div>
                <div @click="createProject()" class="button-primary">Create Project</div>
            </div>

        </menu>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name: "create-new-project-page",
    emits: ["create-project", "cancel"],
    setup(props, context) {

        function createProject() {
            context.emit('create-project')
        }

        function cancel() {
            context.emit("cancel")
        }

        return {createProject, cancel}

    }
});
</script>

<style lang="scss" scoped>
  @import "../styles/main.scss";
  @import "../styles/pages/create-new-project.scss";
</style>

