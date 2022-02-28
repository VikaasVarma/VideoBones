
<template id="SingleVideoEditorPage">
  
    <menu class="grid-container" style="margin: auto;">

        <div id="video-container">

            <video controls>
                <source>
            </video>

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

            
        </div>

        <menu class="vertical-options-menu">
            
            <div>
                <h2 class="section-title">Tracks</h2>
                <div class="tickbox-container">
                    <input type="checkbox" class="tickbox"/>
                    <h3>Track 1</h3>
                </div>
                <div class="tickbox-container">
                    <input type="checkbox" class="tickbox"/>
                    <h3>Track 2</h3>
                </div>
                <div class="add-item-container">
                    <img src="../../../assets/images/addIcon.png">
                    <h3>Add New Track</h3>
                </div>
            </div>
            <div>
                <h2 class="section-title">Metronome</h2>
                <div class="tickbox-container">
                    <input type="checkbox" class="tickbox"/>
                    <h3>Play While Recording</h3>
                </div>
                <div class="metronome-container">
                    <h2>80 BPM</h2>
                    <div>
                        <img src="../../../assets/images/arrow.svg">
                        <img src="../../../assets/images/arrow.svg" style="transform: scaleY(-1)">
                    </div>
                </div>
                <div class="add-item-container">
                    <img src="../../../assets/images/addIcon.png">
                    <h3>New Clicker Track</h3>
                </div>
            </div>
            <div>
                <h2 class="section-title">Screen Styles</h2>
            </div>

        </menu>

    </menu>

</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name: "SingleVideoEditorPage"
});
</script>

<style lang="scss" scoped>
  @import "../styles/main.scss";
  @import "../styles/pages/video-editor.scss";
</style>