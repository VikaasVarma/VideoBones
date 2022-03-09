
<template id="SingleVideoEditorPage">
  <div>
    <menu class="grid-container" style="margin: auto;">

        
      <div id="video-container">
        <video controls>
          <source :src="video_url" type="video/webm">
        </video>
      </div>

      <div id="video-controls" class="horizontal-spacer">
        <button class="image-container">
          <img src="../../../assets/images/playButton.svg">
        </button>

        <button class="image-container">
          <img src="../../../assets/images/stopButton.svg">
        </button>

        <div class="timeline" />
      </div>


      <menu class="vertical-options-menu">
        <div>
          <h3 class="section-title">
            Audio Effects
          </h3>

          <tickbox-component tickbox_text="Enable Reverb" @click="reverb_enabled=!reverb_enabled" />

          <slider-component
            v-if="reverb_enabled"
            v-model:slider_value="reverb_settings.delay"
            slider_name="Delay"
            @update:slider_value="updateReverb()"
          />

          <slider-component
            v-if="reverb_enabled"
            v-model:slider_value="reverb_settings.decay"
            slider_name="Decay"
            @update:slider_value="updateReverb()"
          />

          <tickbox-component tickbox_text="Enable Echo" @click="echo_enabled=!echo_enabled" />

          <slider-component
            v-if="echo_enabled"
            v-model:slider_value="echo_settings.delay"
            slider_name="Delay"
            @update:slider_value="updateEcho()"
          />
          <slider-component
            v-if="echo_enabled"
            v-model:slider_value="echo_settings.decay"
            slider_name="Decay"
            @update:slider_value="updateEcho()"
          />

          <tickbox-component tickbox_text="Denoise" @click="denoise_enabled=!denoise_enabled" />
        </div>
      </menu>

      <button class="button-primary" @click="$emit('exit-single-editor')">
        DONE
      </button>
    </menu>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ipcRenderer } from 'electron';
import SliderComponent from '../components/SliderComponent.vue';
import TickboxComponent from '../components/TickboxComponent.vue';


export default defineComponent({
  name: 'SingleVideoEditorPage',
  components: { SliderComponent, TickboxComponent },
  emits: [ 'exit-single-editor' ],
  props : {
    video_name: { type:String, default:""}
  },
  data() {
    return {
      video_url: "../../DemoProject/recordings/"+this.video_name+".webm",
      denoise_enabled: false,
      echo_enabled: false,
      echo_settings: { decay: 0, delay: 0 },
      reverb_enabled: false,
      reverb_settings: { decay: 0, delay: 0 }

    };
  },
  methods: {
    updateEcho() {
      ipcRenderer.send('echo-settings-changed', this.echo_settings);
    },
    updateReverb() {
      ipcRenderer.send('reverb-settings-changed', this.reverb_settings);
    }
  }
  // djsjahkdsa.send("reverb-settings-changed", {decay:3728, delay:3278327})
  // djsjahkdsa.send("echo-settings-changed", {decay:3728, delay:3278327})
});
</script>

<style lang="scss" scoped>
  @import "../styles/main.scss";
  @import "../styles/pages/single-video-editor.scss";
</style>
