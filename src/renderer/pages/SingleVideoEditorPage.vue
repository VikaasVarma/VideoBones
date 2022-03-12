
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
            v-model:slider_value="volume"
            slider_name="Volume"
            @update:slider_value="updateVolume()"
          />

          <tickbox-component text="Enable Reverb" @click="reverb_enabled=!reverb_enabled" />

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

          <tickbox-component text="Enable Echo" @click="echo_enabled=!echo_enabled" />

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

          <tickbox-component text="Denoise" @click="denoise_enabled=!denoise_enabled" />
        </div>
        <div>
          <h4 class="section-title">
            Video Effects
          </h4>

          <tickbox-component text="Enable Brightness" @click="brigtness_enable=!brightness_enable" />
          <slider-component
            v-if="true"
            v-model:slider_value="video_setting.brightness"
            slider_name="Brightness"
            @update:slider_value="updateVideoSetting()"
          />

          <tickbox-component text="Enable Contrast" @click="contrast_enable=!contrast_enable" />
          <slider-component
            v-if="true"
            v-model:slider_value="video_setting.contrast"
            slider_name="Contrast"
            @update:slider_value="updateVideoSetting()"
          />

          <tickbox-component text="Enable Colour Correction" @click="correction_enable=!correction_enable" />
          <slider-component
            v-if="true"
            v-model:slider_value="video_setting.r_gamma"
            slider_name="Red"
            @update:slider_value="updateVideoSetting()"
          />
          <slider-component
            v-if="true"
            v-model:slider_value="video_setting.g_gamma"
            slider_name="Green"
            @update:slider_value="updateVideoSetting()"
          />
          <slider-component
            v-if="true"
            v-model:slider_value="video_setting.b_gamma"
            slider_name="Blue"
            @update:slider_value="updateVideoSetting()"
          />

          <tickbox-component text="Blur Enable" @click="blur_enable=!blur_enable" />
          <slider-component
            v-if="true"
            v-model:slider_value="video_setting.blur_radius"
            slider_name="Blur Radius"
            @update:slider_value="updateVideoSetting()"
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
    video_name: { type: String, default: '' }
  },
  emits: [ 'exit-single-editor' ],
  data() {
    return {
      video_url: `../../DemoProject/recordings/${this.video_name  }.webm`,
      denoise_enabled: false,
      volume: 255,
      echo_enabled: false,
      echo_settings: { decay: 0, delay: 0 },
      reverb_enabled: false,
      reverb_settings: { decay: 0, delay: 0 },
      birghtness_enable: false,
      contrast_enable: false,
      correction_enable: false,
      blur_enable: false,
      video_setting: {
        bightness: 0,
        contrast: 0,
        r_gamma: 0,
        g_gamma: 0,
        b_gamma: 0,
        blur_radius: 0
      }
    };
  },
  methods: {
    updateVideoSetting(){},
    updateVolume(){},
    updateEcho() {},
    updateReverb() {},
    done(){
      ipcRenderer.send(
        'asynchronous-message',
        {
          type: 'audioOptions',
          data: {
            file: this.video_name,
            startTime: 0,
            volume: this.volume,
            reverb_active: this.reverb_enabled,
            reverb_delay_identifier: this.reverb_settings.delay,
            reverb_decay_indentifier: this.reverb_settings.decay,
            declick_active: this.denoise_enabled,
            declip_active: this.denoise_enabled
          }
        }
      );
      ipcRenderer.send(
        'asynchronous-message',
        {
          type: 'videoOpitons',
          data: {
            file: this.video_name,
            brightness_enable: this.birghtness_enable,
            birghtness: this.video_setting.bightness / 100,
            contrast_enable: this.contrast_enable,
            contrast: (this. video_setting.contrast - 50) * 150,
            balance_enable: this.correction_enable,
            r_balance: this.video_setting.r_gamma / 10,
            g_balance: this.video_setting.g_gamma / 10,
            b_balance: this.video_setting.b_gamma / 10,
            blur_enable: this.blur_enable,
            blur_radius: this.video_setting.blur_radius / 5
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
