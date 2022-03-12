
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

          <slider-component
            v-if="true"
            v-model:value="volume"
            name="Volume"
            @update:value="updateVolume()"
          />

          <tickbox-component text="Enable Reverb" @click="reverbEnabled = !reverbEnabled" />

          <slider-component
            v-if="reverbEnabled"
            v-model:value="reverbSettings.delay"
            name="Delay"
          />

          <slider-component
            v-if="reverbEnabled"
            v-model:value="reverbSettings.decay"
            name="Decay"
          />

          <tickbox-component text="Enable Echo" @click="echoEnabled = !echoEnabled" />

          <slider-component
            v-if="echoEnabled"
            v-model:value="echoSettings.delay"
            name="Delay"
          />
          <slider-component
            v-if="echoEnabled"
            v-model:value="echoSettings.decay"
            name="Decay"
          />

          <tickbox-component text="Denoise" @click="denoiseEnabled = !denoiseEnabled" />
        </div>
        <div>
          <h4 class="section-title">
            Video Effects
          </h4>

          <tickbox-component text="Enable Brightness" @click="brightnessEnabled = !brightnessEnabled" />
          <slider-component
            v-if="brightnessEnabled"
            v-model:value="settings.brightness"
            name="Brightness"
          />

          <tickbox-component text="Enable Contrast" @click="contrastEnabled = !contrastEnabled" />
          <slider-component
            v-if="contrastEnabled"
            v-model:value="settings.contrast"
            name="Contrast"
          />

          <tickbox-component text="Enable Colour Correction" @click="correctionEnabled = !correctionEnabled" />
          <slider-component
            v-if="correctionEnabled"
            v-model:value="settings.gammaR"
            name="Red"
          />
          <slider-component
            v-if="correctionEnabled"
            v-model:value="settings.gammaG"
            name="Green"
          />
          <slider-component
            v-if="correctionEnabled"
            v-model:value="settings.gammaB"
            name="Blue"
          />

          <tickbox-component text="Blur Enable" @click="blurEnabled = !blurEnabled" />
          <slider-component
            v-if="blurEnabled"
            v-model:value="settings.blurRadius"
            name="Blur Radius"
          />
        </div>
      </menu>

      <button class="button-primary" @click="done(); $emit('exit-single-editor')">
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
  props: {
    videoId: { type: String, default: '' }
  },
  emits: [ 'exit-single-editor' ],
  data() {
    return {
      blurEnabled: false,
      brightnessEnabled: false,
      contrastEnabled: false,
      correctionEnabled: false,
      denoiseEnabled: false,
      echoEnabled: false,
      echoSettings: { decay: 0, delay: 0 },
      reverbEnabled: false,
      reverbSettings: { decay: 0, delay: 0 },
      settings: {
        blurRadius: 0,
        brightness: 0,
        contrast: 0,
        gammaB: 0,
        gammaG: 0,
        gammaR: 0,
      },
      video_url: `../../DemoProject/recordings/video${this.videoId}.webm`,
      volume: 100,
    };
  },
  methods: {
    done(){
      ipcRenderer.send(
        'asynchronous-message',
        {
          type: 'audioOptions',
          data: {
            file: this.videoId,
            startTime: 0,
            volume: this.volume * 2.55,
            reverb_active: this.reverbEnabled,
            reverb_delay_identifier: this.reverbSettings.delay,
            reverb_decay_indentifier: this.reverbSettings.decay,
            declick_active: this.denoiseEnabled,
            declip_active: this.denoiseEnabled
          }
        }
      );
      ipcRenderer.send(
        'asynchronous-message',
        {
          type: 'videoOpitons',
          data: {
            file: this.videoId,
            brightness_enable: this.brightnessEnabled,
            birghtness: this.settings.brightness / 100,
            contrast_enable: this.contrastEnabled,
            contrast: (this. settings.contrast - 50) * 150,
            balance_enable: this.correctionEnabled,
            r_balance: this.settings.gammaR / 10,
            g_balance: this.settings.gammaG / 10,
            b_balance: this.settings.gammaB / 10,
            blur_enable: this.blurEnabled,
            blur_radius: this.settings.blurRadius / 5
          }
        }
      );
    }
  }
});
</script>

<style lang="scss" scoped>
  @import "../styles/main.scss";
  @import "../styles/pages/single-video-editor.scss";
</style>
