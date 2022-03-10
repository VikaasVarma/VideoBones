<template id="SingleVideoEditorPage">
  <div @mousemove="drag($event)" @mouseup="endTimelineDrag()">
    <menu class="grid-container" style="margin: auto;">
      <div id="video-container">
        <video-player v-if="stream_url != '' " ref="previewPlayer" :manifest-url="stream_url" />
      </div>

      <div id="video-controls" class="horizontal-spacer">
        <button class="image-container" @click="previewPlay(previewPaused)">
          <img v-if="previewPaused" src="../../../assets/images/playButton.svg">
          <img v-else src="../../../assets/images/stopButton.svg">
        </button>

        <div style="align-items: center; color: white; display: flex; justify-content: center;">
          {{ previewCurrentTime.toFixed(2) }} <br> / <br> {{ previewEndTime.toFixed(2) }}
        </div>

        <div
          ref="timeline"
          class="timeline"
          style="display: flex; overflow: hidden;"
          @mousedown="startTimelineDrag()"
        >
          <div v-for="i in timeline_images.length" :key="i">
            <div :style="`aspect-ratio: 16/9; height:${timeline_seg_height};`">
              <img alt="loading timeline..." :src="timeline_images[i - 1]" style="max-height: 100%; max-width: 100%;">
            </div>
            <div :style="`height:${timeline_seg_height}; width:5px`" />
          </div>

          <div class="playhead" :style="`position:absolute; z-index:10; left: calc(-5px + ${playhead}px)`">
            <div /> <div />
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
            @delete-clicked="deleteTrack(track.trackName)"
            @edit-clicked="$emit('open-single-editor', track.trackName)"
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


const thumbnailFrequency = '1';

export default defineComponent({
  name: 'VideoEditorPage',
  components: { MetronomeComponent, TrackSelector, VideoPlayer },
  emits: [ 'open-recording-page', 'open-single-editor' ],
  setup() {
        interface Track {
            trackName: string;
        }

        const tracks = ref([] as Track[]);
        const stream_url = ref('');
        const track_data = {
          all_track_ids: [ 'Track_0', 'Track_1', 'Track_3', 'Track_3' ],
          timeline_splits: [
            { active_tracks: [ 0, 1, 2, 3 ], endpoint: 0.3, screenStyle: '....'  },
            { active_tracks: [ 0, 2, 3 ], endpoint: 0.7, screenStyle: '_..' },
            { active_tracks: [ 0, 1, 3 ], endpoint: 1, screenStyle: '|..'  }
          ]
        };

        ipcRenderer.addListener('asynchronous-reply', (event, args) => {
          const port = args.port;
          if (stream_url.value === '') {
            stream_url.value = `http://localhost:${  port.toString()  }/stream.mpd`;
          }
        });

        return { stream_url, track_data, tracks };

  },
  data() {
    return {
      activeSegment: 0,
      metronome: { initialBpm: 80 },
      mouse_down: false,
      playhead: 0.6,

      previewCurrentTime: 0,
      previewEndTime: 0,
      previewPaused: false,
      previewPausedBeforeSeek: false,

      screenStyle: 0,

      timeline_images: ([] as string[]),
      timeline_max_time: 0,
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
      ipcRenderer.send(
        'asynchronous-message',
        {
          data: {
            file: join(dir, 'audio1.webm'),
            startTime: 0,
            volume: 0,
            reverb_active: false,
            reverb_delay_identifier: 500,
            reverb_decay_identifier: 0.5,
            declick_active: true,
            declip_active: true,
            echo_active: false,
            echo_delay_identifier: 50,
            echo_decay_identifier: 0.5
          },
          type: 'audioOptions'
        }
      );
      ipcRenderer.send(
        'asynchronous-message',
        {
          data: {
            file: join(dir, 'audio2.webm'),
            startTime: 0,
            volume: 0,
            reverb_active: false,
            reverb_delay_identifier: 900,
            reverb_decay_identifier: 0.5,
            declick_active: false,
            declip_active: true,
            echo_active: false,
            echo_delay_identifier: 50,
            echo_decay_identifier: 0.5
          },
          type: 'audioOptions'
        }
      );
      ipcRenderer.send(
        'asynchronous-message',
        {
          data: {
            file: join(dir, 'audio3.webm'),
            startTime: 0,
            volume: 0,
            reverb_active: false,
            reverb_delay_identifier: 200,
            reverb_decay_identifier: 0.6,
            declick_active: true,
            declip_active: true,
            echo_active: true,
            echo_delay_identifier: 50,
            echo_decay_identifier: 0.5
          },
          type: 'audioOptions'
        }
      );
      ipcRenderer.send(
        'asynchronous-message',
        {
          data: {
            file: join(dir, 'video1.webm'),
            brightness_enable: true,
            brightness: 0.5,
            contrast_enable: false,
            contrast: 0,
            balance_enable: false,
            r_balance: 1,
            g_balance: 1,
            b_balance: 1,
            blur_enable: false,
            blur_radius: 1
          },
          type: 'videoOptions'
        }
      );
      ipcRenderer.send(
        'asynchronous-message',
        {
          data: {
            file: join('../recordings', 'video2.webm'),
            brightness_enable: false,
            brightness: 0.5,
            contrast_enable: false,
            contrast: 20,
            balance_enable: false,
            r_balance: 1,
            g_balance: 1,
            b_balance: 1,
            blur_enable: true,
            blur_radius: 20
          },
          type: 'videoOptions'
        }
      );
      ipcRenderer.send(
        'asynchronous-message',
        {
          data: {
            file: join('../recordings', 'video3.webm'),
            brightness_enable: false,
            brightness: 0.5,
            contrast_enable: false,
            contrast: 20,
            balance_enable: true,
            r_balance: 0.1,
            g_balance: 3,
            b_balance: 1,
            blur_enable: false,
            blur_radius: 0
          },
          type: 'videoOptions'
        }
      );ipcRenderer.send(
        'asynchronous-message',
        {
          data: {
            file: join('../recordings', 'video4.webm'),
            brightness_enable: false,
            brightness: 0.5,
            contrast_enable: true,
            contrast: 200,
            balance_enable: false,
            r_balance: 1,
            g_balance: 1,
            b_balance: 1,
            blur_enable: false,
            blur_radius: 0
          },
          type: 'videoOptions'
        }
      );
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
              join(dir, 'video1.webm'), join('../recordings', 'video2.webm'),
              join('../recordings', 'video3.webm'), join('../recordings', 'video4.webm')
            ],
            interval: [ 0, 5 ],
            resolution: [
              {  height: 720, width: 1280 }, { height: 720, width: 1280  },
              { height: 720, width: 1280  }, { height: 720, width: 1280  }
            ],
            screenStyle: '....'
          },
          {
            files: [ join('../recordings', 'video1.webm'), join('../recordings', 'video2.webm'), join('../recordings', 'video3.webm') ],
            interval: [ 5, 10 ],
            resolution: [{ height: 1440, width: 1280 }, {  height: 720, width: 1280 }, { height: 720, width: 1280 }],
            screenStyle: '|..'
          }
        ]
      };
      // the max time for the timeline is the end of the last video interval, which is the length of the whole video
      this.timeline_max_time = engineOpts.videoInputs[engineOpts.videoInputs.length - 1].interval[1];
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

    // feels like the leas frequent we can get away with while making the playhead still seem smooth
    window.setInterval(this.playheadUpdate, 0.1);
  },
  methods: {
    deleteTrack(trackName: string) {
      this.tracks = this.tracks.filter(track => track.trackName !== trackName);
      ipcRenderer.send('remove-recording', trackName);
    },
    drag(event: MouseEvent) {
      if (this.mouse_down) {
        const timeline = document.querySelectorAll('.timeline')[0].getBoundingClientRect();
        const x = event.clientX;
        this.playhead = Math.min(timeline.width, Math.max(0, (x - timeline.x)));

        // I've done this for now so that the preview seeks while you drag the playhead
        // this may not be performant as we seek on every mousemove event
        // and this line can be removed to revert to just seeking after the drag has ended
        // however, i think this is more useful as user sees in the big picture what they are seeking over
        this.seekToPlayhead();

        this.previewCurrentTime = (this.playhead / timeline.width)
        * (this.$refs.previewPlayer as any).getEndTime();
      }
    },
    endTimelineDrag: function() {
      if (this.mouse_down) {
        this.seekToPlayhead();

        if (!this.previewPausedBeforeSeek) this.previewPlay(false);
        this.mouse_down = false;
      }
    },
    playheadUpdate() {
      if (this.$refs.previewPlayer && !this.mouse_down && !this.previewPaused) {
        const timeline = document.querySelectorAll('.timeline')[0].getBoundingClientRect();
        const vidPlayer = (this.$refs.previewPlayer as any);

        this.previewCurrentTime = vidPlayer.getCurrentTime();
        this.previewEndTime = vidPlayer.getEndTime();

        const playheadx = (this.previewCurrentTime / vidPlayer.getEndTime()) * timeline.width;

        this.playhead = (playheadx);

        if (this.previewCurrentTime === this.previewEndTime) {
          this.previewPlay(true);
        }
      }
    },
    previewPlay(playing: boolean) {
      this.previewPaused = !playing;
      if (this.$refs.previewPlayer) {
        const previewElement = (this.$refs.previewPlayer as any);
        if (playing) {
          previewElement.resumePlayback();
        } else {
          previewElement.pausePlayback();
        }
      }
    },
    seekToPlayhead() {
      const vidPlayer = (this.$refs.previewPlayer as any);
      const timeline = document.querySelectorAll('.timeline')[0].getBoundingClientRect();
      const newPlaybackTime = (this.playhead / timeline.width) * vidPlayer.getEndTime();

      vidPlayer.seekToTime(newPlaybackTime);
    },
    setScreenStyle(style: number) {
      this.screenStyle = style;
    },
    startTimelineDrag: function() {
      this.mouse_down = true;
      this.previewPausedBeforeSeek = this.previewPaused;
      this.previewPlay(true);
    }
  }
});
</script>

<style lang="scss" scoped>
  @import '../styles/main';
  @import '../styles/pages/video-editor';
</style>
