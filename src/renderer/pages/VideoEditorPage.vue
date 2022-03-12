<template id="SingleVideoEditorPage">
  <div
    @mousemove="drag($event)"
    @mouseup="endDrag($event)"
  >
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
          @dblclick="addSegment($event)"
        >
          <div style="display: flex; overflow: hidden;">
            <div v-for="image of timelineImages" :key="image">
              <div :style="`aspect-ratio: 16/9; height:${timelineSegHeight};`">
                <img alt="loading timeline..." :src="image" style="max-height: 100%; max-width: 100%;">
              </div>
              <div :style="`height:${timelineSegHeight}; width:5px`" />
            </div>
          </div>

          <div class="playhead" :style="`left: calc(-5px + ${playhead}px)`">
            <div /> <div />
          </div>

          <div v-for="input, id of engineOpts.videoInputs" :key="input.interval.toString()" class="sectionMarker">
            <div
              :class="['marker', activeSegment === id ? 'selected' : '']"
              :style="{left: `${input.interval[0] / projLength * timelineWidth - 8}px`}"
              @click.left="selectSegment(id)"
              @click.right="deleteSegment($event, id)"
            >
              <img src="../../../assets/images/arrow.svg">
            </div>
          </div>
        </div>
      </div>

      <menu class="vertical-options-menu">
        <div>
          <h2 class="section-title">
            Metronome
          </h2>
          <metronome-component v-model="metronomeBpm" />
        </div>
        <div id="track-selection-menu">
          <h2 class="section-title">
            Tracks
          </h2>
          <track-selector
            v-for="track, id in tracks"
            :key="track.trackId"
            :track-name="track.trackName.replace('.webm', '')"
            :track-number="id"
            @delete-clicked="deleteTrack(track.trackId)"
            @dragged="dragTrack($event, track.trackId)"
            @edit-clicked="$emit('open-single-editor', track.trackId)"
          />

          <div class="add-item-container" @click="$emit('open-recording-page')">
            <img src="../../../assets/images/addIcon.png">
            <h3>Record New Track</h3>
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
            <div style="grid-column: 1 / 2; grid-row: 1 / 3;" />
            <div style="grid-column: 2 / 3; grid-row: 1 / 2;" />
            <div style="grid-column: 2 / 3; grid-row: 2 / 3;" />
          </div>
          <div
            :class="['screen-style', screenStyle === 3 ? 'selected' : '']"
            @click="setScreenStyle(3)"
          >
            <div style="grid-column: 1 / 3; grid-row: 1 / 3;" />
          </div>
        </div>
      </menu>
      <button class="button-primary" @click="render()">
        {{ !isRendering ? 'RENDER' : `${renderPct.toFixed(2)}%` }}
      </button>
    </menu>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, Ref } from 'vue';
import { ipcRenderer } from 'electron';
import { EngineOptions, AudioInput, VideoInput } from '../../main/render/types';
import TrackSelector from '../components/TrackSelector.vue';
import MetronomeComponent from '../components/MetronomeComponent.vue';
import VideoPlayer from '../components/VideoPlayer.vue';


export default defineComponent({
  name: 'VideoEditorPage',
  components: { MetronomeComponent, TrackSelector, VideoPlayer },
  emits: [ 'open-recording-page', 'open-single-editor' ],
  setup() {
    const stream_url = ref('');
    const engineOpts: Ref<EngineOptions> = ref({
      audioInputs: [] as AudioInput[],
      outputType: 'preview' as const,
      videoInputs: [] as VideoInput[]
    });

    ipcRenderer.addListener('engine-progress', (event, args) => {
      // if the preview has rendered more than 2 secs, start the preview viewer
      if (args.renderedTime > 2) {
        const port = args.port;
        if (stream_url.value === '') {
          stream_url.value = `http://localhost:${port.toString()}/stream.mpd`;
        }
      }
    });

    return { engineOpts, stream_url };
  },
  data() {
    return {
      activeSegment: 0,
      dir: '',
      draggingTrack: (null as null | HTMLElement),
      isRendering: false,
      metronomeBpm: 80,
      mouseIsDown: false,
      playhead: 0.6,

      previewCurrentTime: 0,
      previewEndTime: 0,
      previewPaused: false,
      previewPausedBeforeSeek: false,
      projLength: 15,
      renderPct: 0,
      screenStyle: 0,

      timelineImages: ([] as string[]),
      timelineMaxTime: 0,
      timelineSegHeight: 0,
      timelineSegmentsCount: 0,
      timelineWidth: 1,

      tracks: ([] as {trackId: number; trackName: string}[])
    };
  },
  created() {
    ipcRenderer.on('thumbnail-reply', (event, args) => {
      this.timelineImages = [];
      for (let i = 0; i < this.timelineSegmentsCount; ++i) {
        this.timelineImages.push(args.thumbnailFiles[
          Math.floor((i / this.timelineSegmentsCount) * args.thumbnailFiles.length)
        ]);
      }
    });

    ipcRenderer.invoke('get-recordings-directory').then(dir => {
      // the max time for the timeline is the end of the last video interval, which is the length of the whole video
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.dir = dir;
      this.timelineMaxTime = this.engineOpts.videoInputs.map(i => i.interval[1])
      // eslint-disable-next-line unicorn/no-array-reduce
        .reduce((max, video) => Math.max(max, video), 0);
      this.getThumbnails();
      this.getPreview();
    });
  },
  async mounted() {
    ipcRenderer.invoke('get-option', 'videoTracks').then(videoTracks => {
      this.tracks = JSON.parse(videoTracks);
    });

    ipcRenderer.addListener('render-progress', (event, args) => {
      console.log(args.renderedTime);
      if (this.isRendering) {
        const t = args.renderedTime;
        const pct = t / this.engineOpts.videoInputs[this.engineOpts.videoInputs.length - 1].interval[1];
        this.renderPct = pct * 100;
      }
    });

    ipcRenderer.addListener('render-done', async (event, args) => {
      console.log(args.outputFile);
      if (this.isRendering) {
        this.isRendering = false;
        const file = await ipcRenderer.invoke('save-render', args.outputFile);
        alert(`Rendering finished, output in file: ${file}.`);
      }
    });

    const timeline_h = (this.$refs.timeline as HTMLElement).clientHeight;
    const timeline_w = (this.$refs.timeline as HTMLElement).clientWidth;
    this.timelineWidth = timeline_w;

    this.timelineSegHeight = timeline_h;

    // TODO: update this if we change the aspect ratio
    const timeline_seg_width = Math.floor((timeline_h / 9) * 16);

    this.timelineSegmentsCount = Math.ceil(timeline_w / timeline_seg_width);

    //this.$forceUpdate();

    ipcRenderer.addListener('engine-done', () => {
      // if the preview has rendered more than 2 secs, start the preview viewer
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.previewEndTime = (this.$refs.previewPlayer as any).getEndTime();
    });

    // feels like the leas frequent we can get away with while making the playhead still seem smooth
    window.setInterval(this.playheadUpdate, 0.1);

    this.previewPlay(false);
  },
  unmounted() {
    ipcRenderer.removeAllListeners('engine-progress');
    ipcRenderer.removeAllListeners('engine-done');
    ipcRenderer.removeAllListeners('render-done');
    ipcRenderer.removeAllListeners('render-progress');
  },
  methods: {
    addSegment(event: MouseEvent) {
      const timeline = document.querySelectorAll('.timeline')[0].getBoundingClientRect();
      /*this.engineOpts.videoInputs.push({
        crop_offsets: [],
        files: [],
        interval: [
          (event.clientX - timeline.left)
         / timeline.width * this.projLength, this.projLength
        ] as [number, number],
        resolutions: [],
        screenStyle: ('....' as '....' | '|..' | '_..'),
        zoom_levels: []
      });*/
    },
    deleteSegment(event: MouseEvent, id: number) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore -- Trust me on this one
      (event.target as HTMLElement).parentNode?.parentNode?.remove();
    },
    deleteTrack(trackId: number) {
      this.tracks = this.tracks.filter(track => track.trackId !== trackId);
      ipcRenderer.send('remove-recording', trackId);
    },
    drag(event: MouseEvent) {
      if (this.draggingTrack) {
        this.draggingTrack.style.left = `${event.clientX - this.draggingTrack.clientWidth / 2}px`;
        this.draggingTrack.style.top = `${event.clientY - this.draggingTrack.clientHeight / 2}px`;
      }
      if (this.mouseIsDown) {
        const timeline = document.querySelectorAll('.timeline')[0].getBoundingClientRect();
        const x = event.clientX;
        this.playhead = Math.min(timeline.width, Math.max(0, (x - timeline.x)));

        // I've done this for now so that the preview seeks while you drag the playhead
        // this may not be performant as we seek on every mousemove event
        // and this line can be removed to revert to just seeking after the drag has ended
        // however, i think this is more useful as user sees in the big picture what they are seeking over
        this.seekToPlayhead();

        this.previewCurrentTime = (this.playhead / timeline.width)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        * (this.$refs.previewPlayer as any).getEndTime();
      }
    },
    dragTrack(event: MouseEvent, trackId: number) {
      this.draggingTrack = document.createElement('p');
      const track = this.tracks.find(track => track.trackId === trackId);
      if (track) {
        this.draggingTrack.textContent = track.trackName.replace('.webm', '');
      }
      this.draggingTrack.classList.add('track-draggable');
      this.draggingTrack.style.position = 'absolute';
      this.draggingTrack.style.cursor = 'grabbing';
      this.draggingTrack.style.color = 'white';
      this.draggingTrack.style.fontSize = '11px';
      this.draggingTrack.style.userSelect = 'none';
      this.draggingTrack.addEventListener('mousemove', this.drag.bind(this));
      this.draggingTrack.addEventListener('mouseup', this.endDrag.bind(this));
      document.body.append(this.draggingTrack);
      this.draggingTrack.style.left = `${event.clientX - this.draggingTrack.clientWidth / 2}px`;
      this.draggingTrack.style.top = `${event.clientY - this.draggingTrack.clientHeight / 2}px`;
    },
    endDrag(event: MouseEvent) {
      if (this.draggingTrack) {
        this.draggingTrack.remove();
        const boxes = [ ...document.querySelectorAll('.screen-style.selected > div') ];
        const box = boxes.find(box => {
          const box_rect = box.getBoundingClientRect();
          return (
            event.clientX >= box_rect.x
            && event.clientX <= box_rect.x + box_rect.width
            && event.clientY >= box_rect.y
            && event.clientY <= box_rect.y + box_rect.height
          );
        });
        if (!box) {
          this.draggingTrack = null;
          return;
        }
        for (const child of box.childNodes) {
          child.remove();
        }
        const indicator = document.createElement('p');
        indicator.textContent = this.draggingTrack.textContent;
        indicator.classList.add('track-inserted');
        box.append(indicator);
      }
      if (this.mouseIsDown) {
        this.seekToPlayhead();

        if (!this.previewPausedBeforeSeek) this.previewPlay(false);
        this.mouseIsDown = false;
      }
    },
    getPreview() {
      ipcRenderer.send(
        'start-engine',
        {
          data: JSON.parse(JSON.stringify(this.engineOpts))
        }
      );
    },
    getThumbnails() {
      ipcRenderer.send(
        'get-thumbnails',
        {
          data: { ...JSON.parse(JSON.stringify(this.engineOpts)), outputType: 'thumbnail' }
        }
      );
    },
    playheadUpdate() {
      if (this.$refs.previewPlayer && !this.mouseIsDown && !this.previewPaused) {
        const timeline = document.querySelectorAll('.timeline')[0].getBoundingClientRect();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const vidPlayer = (this.$refs.previewPlayer as any);

        this.previewCurrentTime = vidPlayer.getCurrentTime();

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const previewElement = (this.$refs.previewPlayer as any);
        if (playing) {
          previewElement.resumePlayback();
        } else {
          previewElement.pausePlayback();
        }
      }
    },
    render() {
      if (this.isRendering) return;
      console.log('Starting render!');
      console.log(JSON.parse(JSON.stringify(this.engineOpts)));
      this.isRendering = true;
      this.renderPct = 0;
      ipcRenderer.send('export-render', {
        data: JSON.parse(JSON.stringify(this.engineOpts))
      });
    },
    seekToPlayhead() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vidPlayer = (this.$refs.previewPlayer as any);
      const timeline = document.querySelectorAll('.timeline')[0].getBoundingClientRect();
      const newPlaybackTime = (this.playhead / timeline.width) * vidPlayer.getEndTime();

      vidPlayer.seekToTime(newPlaybackTime);
    },
    selectSegment(id: number) {
      this.activeSegment = id;
    },
    setScreenStyle(style: number) {
      for (const el of document.querySelectorAll('div.screen-style.selected > div > p')) {
        el.remove();
      }
      this.screenStyle = style;
    },
    startTimelineDrag: function() {
      this.mouseIsDown = true;
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

<style lang="scss">
p.track-inserted {
  color: white;
  font-size: 11px;
  user-select: none;
}
</style>
