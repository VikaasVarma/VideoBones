
<template id="SingleVideoEditorPage">
    <div>
        <menu class="grid-container" style="margin: auto;">

            <div id="video-container">
                <video controls>
                    <source>
                </video>
            </div>

            <div id="video-controls" class="horizontal-spacer">
                <button class="image-container">
                    <img src="../../../assets/images/playButton.svg">
                </button>

                <button class="image-container">
                    <img src="../../../assets/images/stopButton.svg">
                </button>

                <div class="timeline">
                </div>
            </div>


            <menu class="vertical-options-menu">
                <div>
                    <h2 class="section-title">Video Effects</h2>
                    <div class="tickbox-container">
                        <input type="checkbox" class="tickbox"/>
                        <h3>Something Else</h3>
                    </div>

                </div>

                <div>
                    <h2 class="section-title">Rerecord Sections</h2>
                </div>

            </menu>

            <button @click="exitSingleEditor()" class="button-primary">DONE</button>

        </menu>
    </div>

</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name: "single-video-editor-page",
    setup(props, context) {
        function exitSingleEditor() {
            context.emit("exit-single-editor")
        }

        return {exitSingleEditor}
    }
});
</script>

<style lang="scss" scoped>
  @import "../styles/main.scss";
  @import "../styles/pages/single-video-editor.scss";
</style>