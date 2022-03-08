
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
                    
                    <tickbox-component @click="reverb_enabled=!reverb_enabled" />

                    <slider-component :v-show="reverb_enabled" slider_name="Reverb" />
                    <slider-component :v-if="reverb_enabled" slider_name="Decay" />

                    <slider-component :v-if="echo_enabled" slider_name="dsa1" />
                    <slider-component :v-if="echo_enabled" slider_name="dsa2" />


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
import TickboxComponent from '../components/TickboxComponent.vue';

export default defineComponent({
  components: { SliderComponent, TickboxComponent },
    name: "single-video-editor-page",
    data () {
        return {
            reverb_enabled : false, 
            echo_enabled : { type : Boolean, default : false}, 
        }
    },
    setup(props, context) {
        return {}
    }
});
</script>

<style lang="scss" scoped>
  @import "../styles/main.scss";
  @import "../styles/pages/single-video-editor.scss";
</style>