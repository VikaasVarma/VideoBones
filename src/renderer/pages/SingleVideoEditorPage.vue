
<template id="SingleVideoEditorPage">
  <div>
    <menu class="grid-container" style="margin: auto;">
      <div id="video-container">
        <video controls>
          <source :src="previewUrl" type="video/webm">
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

          <slider-component v-model="settings.volume" name="Volume" />

          <tickbox-component v-model="settings.reverbEnabled" text="Enable Reverb" />

          <slider-component
            v-if="settings.reverbEnabled"
            v-model="settings.reverbDelay"
            name="Delay"
          />

          <slider-component
            v-if="settings.reverbEnabled"
            v-model="settings.reverbDecay"
            name="Decay"
          />

          <tickbox-component v-model="settings.echoEnabled" text="Enable Echo" />

          <slider-component
            v-if="settings.echoEnabled"
            v-model="settings.echoDelay"
            name="Delay"
          />
          <slider-component
            v-if="settings.echoEnabled"
            v-model="settings.echoDecay"
            name="Decay"
          />

          <tickbox-component v-model="settings.denoiseEnabled" text="Denoise" />
        </div>
        <div>
          <h4 class="section-title">
            Video Effects
          </h4>

          <tickbox-component v-model="settings.brightnessEnabled" text="Brightness" />
          <slider-component
            v-if="settings.brightnessEnabled"
            v-model="settings.brightness"
            name="Brightness"
          />

          <tickbox-component v-model="settings.contrastEnabled" text="Contrast" />
          <slider-component
            v-if="settings.contrastEnabled"
            v-model="settings.contrast"
            name="Contrast"
          />

          <tickbox-component v-model="settings.correctionEnabled" text="Color Correction" />
          <slider-component
            v-if="settings.correctionEnabled"
            v-model="settings.gammaR"
            name="Red"
          />
          <slider-component
            v-if="settings.correctionEnabled"
            v-model="settings.gammaG"
            name="Green"
          />
          <slider-component
            v-if="settings.correctionEnabled"
            v-model="settings.gammaB"
            name="Blue"
          />

          <tickbox-component v-model="settings.blurEnabled" text="Blur" />
          <slider-component
            v-if="settings.blurEnabled"
            v-model="settings.blurRadius"
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
    videoId: { type: Number, required: true }
  },
  emits: [ 'exit-single-editor' ],
  data() {
    return {
      previewUrl: `../../DemoProject/recordings/video${this.videoId}.webm`,
      settings: {
        blurEnabled: false,
        blurRadius: 0,
        brightness: 0,
        brightnessEnabled: false,
        contrast: 0,
        contrastEnabled: false,
        correctionEnabled: false,
        denoiseEnabled: false,
        echoDecay: 0,
        echoDelay: 0,
        echoEnabled: false,
        gammaB: 0,
        gammaG: 0,
        gammaR: 0,
        reverbDecay: 0,
        reverbDelay: 0,
        reverbEnabled: false,
        volume: 50
      }
    };
  },
  mounted() {
    ipcRenderer.invoke('get-option', 'videoTracks').then(JSON.parse).then(tracks => tracks.find((track: { trackId: number }) => track.trackId === this.videoId)).then(data => {
      console.log('video', data);
      this.settings.blurEnabled = data.blurEnabled ?? false;
      this.settings.blurRadius = Number.parseFloat(data.blurRadius) ?? 0;
      this.settings.brightness = Number.parseFloat(data.brightness) ?? 0;
      this.settings.brightnessEnabled = data.brightnessEnabled ?? false;
      this.settings.contrast = Number.parseFloat(data.contrast) ?? 0;
      this.settings.contrastEnabled = data.contrastEnabled ?? false;
      this.settings.correctionEnabled = data.correctionEnabled ?? false;
      this.settings.gammaB = Number.parseFloat(data.gammaB) ?? 0;
      this.settings.gammaG = Number.parseFloat(data.gammaG) ?? 0;
      this.settings.gammaR = Number.parseFloat(data.gammaR) ?? 0;
    });
    ipcRenderer.invoke('get-option', 'audioTracks').then(JSON.parse).then(tracks => tracks.find((track: { trackId: number }) => track.trackId === this.videoId)).then(data => {
      console.log('audio', data);
      this.settings.denoiseEnabled = data.denoiseEnabled ?? false;
      this.settings.echoDecay = Number.parseFloat(data.echoDecay) ?? 0;
      this.settings.echoDelay = Number.parseFloat(data.echoDelay) ?? 0;
      this.settings.echoEnabled = data.echoEnabled ?? false;
      this.settings.reverbDecay = Number.parseFloat(data.reverbDecay) ?? 0;
      this.settings.reverbDelay = Number.parseFloat(data.reverbDelay) ?? 0;
      this.settings.reverbEnabled = data.reverbEnabled ?? false;
      this.settings.volume = data.volume ?? 50;
    });
  },
  methods: {
    done() {
      ipcRenderer.send(
        'save-track-data',
        this.videoId,
        {
          ...JSON.parse(JSON.stringify(this.settings)),
          videoId: this.videoId,
          volume: this.settings.volume * 2.55
        }
      );
      this.$emit('exit-single-editor');
    }
  }
});
</script>

<style lang="scss" scoped>
  @import '../styles/main';
  @import '../styles/pages/single-video-editor';
</style>
