<template id="SingleVideoEditorPage">
  <div @mousemove="drag($event, mouse_down)" @mouseup="mouse_down = false">
    <menu class="grid-container" style="margin: auto;">
      <div id="video-container">
        <video-player v-if="stream_url != ''" :manifest-url="stream_url" />
      </div>

      <div id="video-controls" class="horizontal-spacer">
        <button class="image-container">
          <img src="../../../assets/images/playButton.svg">
        </button>

        <button class="image-container">
          <img src="../../../assets/images/stopButton.svg">
        </button>

        <div
          ref="timeline"
          class="timeline"
          style="display: flex; overflow: hidden;"
          @mousedown="mouse_down = true"
        >
          <div v-for="i in timeline_images.length" :key="i">
            <div :style="`aspect-ratio: 16/9; height:${timeline_seg_height};`">
              <img
                alt="loading timeline..."
                :src="timeline_images[i - 1]"
                style="max-height: 100%; max-width: 100%;"
              >
            </div>
            <div :style="`height:${timeline_seg_height}; width:5px`" />
          </div>

          <div
            class="playhead"
            :style="`position:absolute; z-index:10; left: calc(-5px + ${playhead}px)`"
          >
            <div />
            <div />
          </div>
        </div>
      </div>

      <menu class="vertical-options-menu">
        <div>
          <h2 class="section-title">
            Metronome
          </h2>
          <metronome-component ref="metronome" />
        </div>
        <div id="track-selection-menu">
          <h2 class="section-title">
            Tracks
          </h2>
          <track-selector
            v-for="track in tracks"
            :key="track.trackName"
            :track-name="track.trackName"
            @edit-clicked="$emit('open-single-editor', track.trackName)"
            @delete-clicked="deleteTrack(track.trackName)"
          />

          <div class="add-item-container" @click="$emit('open-recording-page')">
            <img src="../../../assets/images/addIcon.png">
            <h3>Add New Track</h3>
          </div>
        </div>
        <div>
          <h2 class="section-title">
            Screen Styles
          </h2>
          <div
            :class="['screen-style', screenStyle === 0 ? 'selected' : '']"
            @click="setScreenStyle(0)"
          >
            <div style="grid-column: 1 / 2; grid-row: 1 / 2;" />
            <div style="grid-column: 2 / 3; grid-row: 1 / 2;" />
            <div style="grid-column: 1 / 2; grid-row: 2 / 3;" />
            <div style="grid-column: 2 / 3; grid-row: 2 / 3;" />
          </div>
          <div
            :class="['screen-style', screenStyle === 1 ? 'selected' : '']"
            @click="setScreenStyle(1)"
          >
            <div style="grid-column: 1 / 3; grid-row: 1 / 2;" />
            <div style="grid-column: 1 / 2; grid-row: 2 / 3;" />
            <div style="grid-column: 2 / 3; grid-row: 2 / 3;" />
          </div>
          <div
            :class="['screen-style', screenStyle === 2 ? 'selected' : '']"
            @click="setScreenStyle(2)"
          >
            <div style="grid-column: 1 / 2; grid-row: 1 / 2;" />
            <div style="grid-column: 1 / 2; grid-row: 2 / 3;" />
            <div style="grid-column: 2 / 3; grid-row: 1 / 3;" />
          </div>
        </div>
      </menu>
    </menu>
  </div>
</template>

<script lang="ts">
import { join } from 'node:path';
import { defineComponent, ref } from 'vue';
import { ipcRenderer } from 'electron';
import TrackSelector from '../components/TrackSelector.vue';
import MetronomeComponent from '../components/MetronomeComponent.vue';
import VideoPlayer from '../components/VideoPlayer.vue';


const thumbnailFrequency = '1/5';

export default defineComponent({
  name: 'VideoEditorPage',
  components: { MetronomeComponent, TrackSelector, VideoPlayer },
  emits: [ 'open-recording-page', 'open-single-editor' ],
  setup() {
        interface Track {
            trackName: string;
        }

        const activeSegment = ref(0);
        const tracks = ref([] as Track[]);
        const metronome = ref({ initialBpm: 80 });
        const screenStyle = ref(0);
        const playhead = ref(0.6);
        const mouse_down = ref(false);
        const stream_url = ref('');
        const track_data = {
          all_track_ids: [ 'Track_0', 'Track_1', 'Track_3', 'Track_3' ],
          timeline_splits: [
            { active_tracks: [ 0, 1, 2, 3 ], endpoint: 0.3, screenStyle: '....'  },
            { active_tracks: [ 0, 2, 3 ], endpoint: 0.7, screenStyle: '_..' },
            { active_tracks: [ 0, 1, 3 ], endpoint: 1, screenStyle: '|..'  }
          ]
        };

        function setScreenStyle(style: number) {
          screenStyle.value = style;
        }

        function deleteTrack(trackName: string) {
          tracks.value = tracks.value.filter(track => track.trackName !== trackName);
          ipcRenderer.send('remove-recording', trackName);
        }

        function drag(event: MouseEvent, mouse_down: boolean) {
          if (mouse_down) {
            const timeline = document.querySelectorAll('.timeline')[0].getBoundingClientRect();
            const x = event.clientX;
            playhead.value = Math.min(timeline.width, Math.max(0, (x - timeline.x)));
          }
        }

        ipcRenderer.addListener('asynchronous-reply', (event, args) => {
          const port = args.port;
          if (stream_url.value === '') {
            stream_url.value = `http://localhost:${  port.toString()  }/stream.mpd`;
          }
        });

        return { activeSegment, deleteTrack, drag, metronome, mouse_down,
          playhead, screenStyle, setScreenStyle, stream_url, track_data, tracks };

  },
  data(): { timeline_images: string[]; timeline_seg_height: number; timeline_segments_count: number } {
    return {
      timeline_images: [],
      timeline_seg_height: 0,
      timeline_segments_count: 0
    };
  },
  created() {
    ipcRenderer.on('thumbnail-reply', (event, args) => {
      this.timeline_images = [];
      for (let i = 0; i < this.timeline_segments_count; ++i) {
        this.timeline_images.push(args.thumbnailFiles[
          Math.floor((i / this.timeline_segments_count) * args.thumbnailFiles.length)
        ]);
      }
    });

    ipcRenderer.invoke('get-recordings-directory').then(dir => {
      const engineOpts = {
        audioInputs: [
        /*{
                        file: join("../recordings", "audio1.webm"),
                        startTime: 0.02,
                        volume: 255,
                    },*/
        ],
        outputType: 'preview',
        thumbnailEvery: thumbnailFrequency,
        videoInputs: [
          {
            files: [
              join(dir, 'video1.webm'),
              join('../recordings', 'video2.webm'),
              join('../recordings', 'video3.webm'),
              join('../recordings', 'video4.webm')
            ],
            interval: [ 0, 10 ],
            resolution: [
              { height: 720, width: 1280 },
              { height: 720, width: 1280 },
              { height: 720, width: 1280 },
              { height: 720, width: 1280 }
            ],
            screenStyle: '....'
          }
        ]
      };
      ipcRenderer.send(
        'asynchronous-message',
        {
          data: engineOpts,
          type: 'startEngine'
        }
      );

      ipcRenderer.send(
        'asynchronous-message',
        {
          data: { ...engineOpts, outputType: 'thumbnail' },
          type: 'getThumbnails'
        }
      );
    });
  },
  async mounted() {
    ipcRenderer.invoke('get-option', 'videoTracks').then(videoTracks => {
      const data = JSON.parse(videoTracks);
      for (const track of data) {
        this.tracks.push({ trackName: track.slice(0, Math.max(0, track.indexOf('.webm'))) });
      }
    });

    const timeline_h = (this.$refs.timeline as HTMLElement).clientHeight;
    const timeline_w = (this.$refs.timeline as HTMLElement).clientWidth;

    this.timeline_seg_height = timeline_h;

    // TODO: update this if we change the aspect ratio
    const timeline_seg_width = Math.floor((timeline_h / 9) * 16);

    this.timeline_segments_count = Math.ceil(timeline_w / timeline_seg_width);

    //this.$forceUpdate();
  }
});
</script>

<style lang="scss" scoped>
  @import '../styles/main';
  @import '../styles/pages/video-editor';
</style>
