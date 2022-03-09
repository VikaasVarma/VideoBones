
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
                    
                    <tickbox-component @click="reverb_enabled=!reverb_enabled" tickbox_text="Enable Reverb" />

                    <slider-component  v-model:slider_value="reverb_settings.delay"
                                        @update:slider_value="updateReverb()"
                                        v-if="reverb_enabled" slider_name="Delay" />

                    <slider-component v-model:slider_value="reverb_settings.decay"
                                        @update:slider_value="updateReverb()"
                                        v-if="reverb_enabled" slider_name="Decay" />

                    <tickbox-component @click="echo_enabled=!echo_enabled" tickbox_text="Enable Echo"/>

                    <slider-component v-model:slider_value="echo_settings.delay"
                                        @update:slider_value="updateEcho()"
                                     v-if="echo_enabled" slider_name="Delay" />
                    <slider-component v-model:slider_value="echo_settings.decay" 
                                         @update:slider_value="updateEcho()"
                                       v-if="echo_enabled" slider_name="Decay" />

                    <tickbox-component @click="denoise_enabled=!denoise_enabled" tickbox_text="Denoise"/>

                </div>

            </menu>

            <button @click="$emit('exit-single-editor')" class="button-primary">DONE</button>

        </menu>
    </div>

</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { ipcRenderer, IpcRenderer } from 'electron';
import SliderComponent from '../components/SliderComponent.vue';
import TickboxComponent from '../components/TickboxComponent.vue';

export default defineComponent({
  components: { SliderComponent, TickboxComponent },
    name: "single-video-editor-page",
    data() {
        return {
            reverb_enabled : false, 
            echo_enabled : false,
            denoise_enabled : false,
            reverb_settings : {decay: 0, delay: 0},
            echo_settings : {decay: 0, delay: 0},

        }
    },
    methods : {
        updateReverb () {
            ipcRenderer.send('reverb-settings-changed', this.reverb_settings)
        },
        updateEcho() {
            ipcRenderer.send('echo-settings-changed', this.echo_settings)
        }
    },
    // djsjahkdsa.send("reverb-settings-changed", {decay:3728, delay:3278327})
    // djsjahkdsa.send("echo-settings-changed", {decay:3728, delay:3278327})
});
</script>

<style lang="scss" scoped>
  @import "../styles/main.scss";
  @import "../styles/pages/single-video-editor.scss";
</style>