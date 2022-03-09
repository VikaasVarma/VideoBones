<template id="SingleVideoEditorPage">
    <div @mouseup="endTimelineDrag()" @mousemove="drag($event, mouse_down)" >
        <menu class="grid-container" style="margin: auto;">

            <div id="video-container">
                <video-player ref='fuckingVideoPlayer' v-if="stream_url != '' " :manifest-url="stream_url"/>
            </div>

            <div id="video-controls" class="horizontal-spacer">
                <button v-show="previewPaused" @click="previewPlay()" class="image-container">
                    <img src="../../../assets/images/playButton.svg">
                </button>

                <button v-show="!previewPaused" @click="previewPause()" class="image-container">
                    <img src="../../../assets/images/stopButton.svg">
                </button>

                <div style="display: flex; justify-content: center; align-items: center;">
                    {{ previewCurrentTime.toFixed(2) }} <br> / <br> {{ previewEndTime.toFixed(2) }}
                </div>  

                <div @mousedown="startTimelineDrag()" class="timeline" ref="timeline" style="display:flex; overflow:hidden;">
                    <div v-for="i in timeline_images.length">
                        <div v-bind:style="`aspect-ratio: 16/9; height:${timeline_seg_height};`">
                            <img :src="timeline_images[i-1]" alt ="loading timeline..." style="max-width:100%;max-height:100%;">
                        </div>
                        <div v-bind:style="`height:${timeline_seg_height}; width:5px`"/>
                    </div>

                    <div class="playhead" :style="`position:absolute; z-index:10; left: calc(-5px + ${playhead}px)`">
                        <div></div> <div></div>
                    </div>
                </div>
            </div>

            <menu class="vertical-options-menu">
                
                <div id="track-selection-menu">
                    <h2 class="section-title">Tracks</h2>
                    <track-selector v-for="track in tracks" :key="track.trackName" :trackName="track.trackName" />

                    <div @click="record()" class="add-item-container">
                        <img src="../../../assets/images/addIcon.png">
                        <h3>Add New Track</h3>
                    </div>
                </div>
                <div>
                    <h2 class="section-title">Metronome</h2>
                    <metronome-component :key="metronome.initialBpm" ref="metronome" />
                </div>
                <div>
                    <h2 class="section-title">Screen Styles</h2>
                    <div class="screen-style" @click="setScreenStyle(0)">
                        <div style="grid-column: 1 / 2; grid-row: 1 / 2"></div>
                        <div style="grid-column: 2 / 3; grid-row: 1 / 2"></div>
                        <div style="grid-column: 1 / 2; grid-row: 2 / 3"></div>
                        <div style="grid-column: 2 / 3; grid-row: 2 / 3"></div>
                    </div>
                    <div class="screen-style" @click="setScreenStyle(1)">
                        <div style="grid-column: 1 / 2; grid-row: 1 / 2"></div>
                        <div style="grid-column: 2 / 3; grid-row: 1 / 2"></div>
                        <div style="grid-column: 1 / 3; grid-row: 2 / 3"></div>
                    </div>
                    <div class="screen-style" @click="setScreenStyle(2)">
                        <div style="grid-column: 1 / 2; grid-row: 1 / 2"></div>
                        <div style="grid-column: 1 / 2; grid-row: 2 / 3"></div>
                        <div style="grid-column: 2 / 3; grid-row: 1 / 3"></div>
                    </div>
                </div>

            </menu>

        </menu>
    </div>

</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import TrackSelector from '../components/TrackSelector.vue';
import MetronomeComponent from '../components/MetronomeComponent.vue';
import { ipcRenderer } from 'electron';
import VideoPlayer from '../components/VideoPlayer.vue';
import { join } from 'path';
import { EngineOptions } from '../../main/render/types';

const thumbnailFrequency = '1';

export default defineComponent({
    name: "VideoEditorPage",
    components: { TrackSelector, MetronomeComponent, VideoPlayer },
    data() {
        return {
            timeline_images: [],
            timeline_seg_height:0,
            timeline_segments_count:0,
            timeline_max_time: 0,

            previewCurrentTime: 0,
            previewEndTime: 0,
            previewPaused: false,
            previewPausedBeforeSeek: false
        }
    },
    methods: {
        drag: function (event: any, mouse_down: boolean) {
            if (this.mouse_down) {
                var timeline = document.getElementsByClassName("timeline")[0].getBoundingClientRect();
                var x = event.clientX;
                this.playhead = Math.min(timeline.width, Math.max(0, (x - timeline.x)));

                // I've done this for now so that the preview seeks while you drag the playhead
                // this may not be performant as we seek on every mousemove event, and this line can be removed to revert to just seeking after the drag has ended
                // however, i think this is more useful as user sees in the big picture what they are seeking over
                this.seekToPlayhead();

                this.previewCurrentTime = (this.playhead / timeline.width) * (this.$refs.fuckingVideoPlayer as any).getEndTime();
            }
        },
        startTimelineDrag: function() {
            this.mouse_down = true;
            this.previewPausedBeforeSeek = this.previewPaused;
            this.previewPause();
        },
        endTimelineDrag: function() {
            if (this.mouse_down) {
                this.seekToPlayhead();

                if (!this.previewPausedBeforeSeek) this.previewPlay();
                this.mouse_down = false;
            }
        },
        seekToPlayhead() {
            const vidPlayer = (this.$refs.fuckingVideoPlayer as any);
            var timeline = document.getElementsByClassName("timeline")[0].getBoundingClientRect();
            const newPlaybackTime = (this.playhead / timeline.width) * vidPlayer.getEndTime();

            vidPlayer.seekToTime(newPlaybackTime);
        },
        previewPlay() {
            if (this.$refs.fuckingVideoPlayer !== undefined) {
                (this.$refs.fuckingVideoPlayer as any).resumePlayback();
                this.previewPaused = false;
            }
        },
        previewPause() {
            if (this.$refs.fuckingVideoPlayer !== undefined) {
                (this.$refs.fuckingVideoPlayer as any).pausePlayback();
                this.previewPaused = true;
            }
        }

    },
    setup(props, context) {
        var tracks = ref(<object[]> [])
        let metronome = ref({ initialBpm : 80})
        let screenStyle = ref(0)
        let playhead = ref(.6)
        let mouse_down = ref(false)
        let stream_url = ref('')
        let track_data = {
            all_track_ids: ["Track_0", "Track_1", "Track_3", "Track_3"],
            timeline_splits: [
                { endpoint: 0.3, screenStyle: "....", active_tracks: [0,1,2,3]},
                { endpoint: 0.7, screenStyle: "_..", active_tracks: [0,2,3]},
                { endpoint: 1.0, screenStyle: "|..", active_tracks: [0,1,3]},
            ]
        }

        function openSingleVideoEditor () { context.emit("open-single-editor") }
        function setScreenStyle(style: number) { screenStyle.value = style }
        function record () { context.emit('open-recording-page'); }

        ipcRenderer.addListener('asynchronous-reply',  (event, args) => {
            let port = args.port
            if (stream_url.value === "") {
                stream_url.value = "http://localhost:"+port.toString()+"/stream.mpd"
            }
        })

        return {record, metronome, mouse_down, openSingleVideoEditor, playhead, setScreenStyle, track_data, tracks, stream_url}

    },
    created() {

        console.log("Running created ()");

        let self = this;
        ipcRenderer.on('thumbnail-reply', (event, args) => {
            let new_timeline_images = new Array<string>(self.timeline_segments_count);
            for (let i = 0; i < self.timeline_segments_count; ++i) {
                new_timeline_images[i] = args.thumbnailFiles[Math.floor((i / new_timeline_images.length) * args.thumbnailFiles.length)]
            }

            (self.timeline_images as string[]) = new_timeline_images;
        });


        ipcRenderer.invoke('get-recordings-directory').then( (dir) => {
            const engineOpts = {
                outputType: "preview",
                videoInputs: 
                [
                    {
                        files: [join("../recordings", "video1.webm"), join("../recordings", "video2.webm"), join("../recordings", "video3.webm"), join("../recordings", "video4.webm")],
                        screenStyle: '....',
                        interval:[0,5],
                        resolution: [{width: 1280, height: 720},{width: 1280, height: 720},{width: 1280, height: 720},{width: 1280, height: 720}]
                    },
                    {
                        files: [join("../recordings", "video1.webm"), join("../recordings", "video2.webm"), join("../recordings", "video3.webm")],
                        screenStyle: '|..',
                        interval:[5,10],
                        resolution: [{width: 1280, height: 1440},{width: 1280, height: 720},{width: 1280, height: 720}]
                    }
                ],
                audioInputs:[
                /*{
                    file: join("../recordings", "audio1.webm"),
                    startTime: 0.02,
                    volume: 255,
                },*/
                ],
                thumbnailEvery:thumbnailFrequency
            };

        // the max time for the timeline is the end of the last video interval, which is the length of the whole video
        this.timeline_max_time = engineOpts.videoInputs[engineOpts.videoInputs.length-1].interval[1];

        ipcRenderer.send('asynchronous-message', 
        {
          type: 'startEngine', 
          data: engineOpts
        });

        const thumbEngineOpts = engineOpts;
        thumbEngineOpts.outputType = 'thumbnail';
        ipcRenderer.send('asynchronous-message', 
        {
          type: 'getThumbnails', 
          data: thumbEngineOpts
        })
        });
    },
    async mounted() {
        ipcRenderer.invoke('get-option', 'videoTracks').then(videoTracks => {
            JSON.parse(videoTracks).forEach((track: string) => {
                this.tracks.push({trackName: track.substr(0, track.indexOf(".webm"))})
            }) 
        })

        let timeline_h:any = (this.$refs.timeline as any).clientHeight;
        let timeline_w: any = (this.$refs.timeline as any).clientWidth;

        this.timeline_seg_height = timeline_h;

        // TODO: update this if we change the aspect ratio
        const timeline_seg_width = Math.floor((timeline_h / 9) * 16);

        this.timeline_segments_count = Math.ceil(timeline_w / timeline_seg_width);

        //this.$forceUpdate();

        const playheadUpdate = () => {
            if (this.$refs['fuckingVideoPlayer'] !== undefined && !this.mouse_down && !this.previewPaused) {
                var timeline = document.getElementsByClassName("timeline")[0].getBoundingClientRect()
                const vidPlayer = (this.$refs.fuckingVideoPlayer as any);

                this.previewCurrentTime = vidPlayer.getCurrentTime();
                this.previewEndTime = vidPlayer.getEndTime();

                const playheadx = (this.previewCurrentTime / vidPlayer.getEndTime()) * timeline.width;

                this.playhead = (playheadx);

                if (this.previewCurrentTime === this.previewEndTime) {
                    this.previewPause();
                }
            }
        }

        // feels like the leas frequent we can get away with while making the playhead still seem smooth
        window.setInterval(playheadUpdate, 0.1);
    }
});
</script>

<style lang="scss" scoped>
  @import "../styles/main.scss";
  @import "../styles/pages/video-editor.scss";
</style>