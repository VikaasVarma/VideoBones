
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
                    <h3  class="section-title">Audio Effects</h3 >
                    
                    <slider-component slider_name="Reverb" />
                    <slider-component slider_name="Decay" />

                    <slider-component slider_name="dsa" />
                    <slider-component slider_name="dsa" />

                    <!-- <div class="tickbox-container">
                        <input type="checkbox" class="tickbox"/>
                        <h3>Something Else</h3>
                    </div> -->

                </div>

                <div>
                    <h2 class="section-title">Rerecord Sections</h2>
                </div>

            </menu>

            <button @click="$emit('exit-single-editor')" class="button-primary">DONE</button>

        </menu>
    </div>

</template>

<script lang="ts">
import { defineComponent } from 'vue';
import SliderComponent from '../components/SliderComponent.vue';

export default defineComponent({
  components: { SliderComponent },
    name: "single-video-editor-page",
    setup(props, context) {
        return {}
    }
});
</script>

<style lang="scss" scoped>
  @import "../styles/main.scss";
  @import "../styles/pages/single-video-editor.scss";
</style>