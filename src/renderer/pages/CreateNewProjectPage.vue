<template id="CreateNewProject">
    <div>
        <h1 class="page-title" style="margin-top: 10%; margin-bottom: 5%;">VIDEO BONES</h1>

        <menu class="options-menu" style="margin: auto;">

            <div style="grid-column: 1 / 3; grid-row: 1/1;" class="named-input-container">
                <h3>Project Name</h3>
                <input placeholder="Ex: Gangnam Style TikTok" type="text">
            </div>

            <div style="grid-column: 1 / 2; grid-row: 2/2;">
                <h3>Video Input</h3>
                <select name="" id="" ></select>
            </div>

            <div style="grid-column: 2 / 2; grid-row: 2/2;">
                <h3>Audio Input</h3>
                <select name="" id=""></select>
            </div>
            <div style="grid-column: 1 / 3; grid-row: 3/3;" class="horizontal-spacer">
                <div class="button-secondary">Recording</div>
                <div class="button-primary">Click me!</div>
            </div>

        </menu>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name: "create-new-project",
});
</script>

<style lang="scss" scoped>
  @import "../styles/main.scss";
  @import "../styles/pages/create-new-project.scss";
</style>

