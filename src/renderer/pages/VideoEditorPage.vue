
<template id="SingleVideoEditorPage">
    <div @mouseup="mouse_down = false" @mousemove="drag($event, mouse_down)" >
        <menu class="grid-container" style="margin: auto;">

            <div id="video-container">
                <video-player v-if="stream_url != '' " :manifest-url="stream_url"/>
            </div>

            <div id="video-controls" class="horizontal-spacer">
                <button class="image-container">
                    <img src="../../../assets/images/playButton.svg">
                </button>

                <button class="image-container">
                    <img src="../../../assets/images/stopButton.svg">
                </button>

                <div @mousedown="mouse_down = true" class="timeline">
                    <div class="playhead" :style="`left: calc(-5px + ${playhead * 100}%)`">
                        <div></div> <div></div>
                    </div>
                </div>
            </div>

            <menu class="vertical-options-menu">
                
                <div id="track-selection-menu">
                    <h2 class="section-title">Tracks</h2>
                    <track-selector v-for="track in tracks" :key="track.trackName" :trackName="track.trackName" />

                    <div @click="addNewTrack()" class="add-item-container">
                        <img src="../../../assets/images/addIcon.png">
                        <h3>Add New Track</h3>
                    </div>
                </div>
                <div>
                    <h2 class="section-title">Metronome</h2>
                    <div class="tickbox-container">
                        <input type="checkbox" class="tickbox"/>
                        <h3>Play While Recording</h3>
                    </div>

                    <metronome-component v-for="metronome in clickTracks" :key="metronome.initialBpm" />

                    <div @click="addNewClickTrack()" class="add-item-container">
                        <img src="../../../assets/images/addIcon.png">
                        <h3>New Clicker Track</h3>
                    </div>
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
import { stringify } from 'querystring';
import { defineComponent, ref } from 'vue';
import TrackSelector from '../components/TrackSelector.vue';
import MetronomeComponent from '../components/MetronomeComponent.vue';
import { ipcRenderer } from 'electron';
import { join } from 'path';
import VideoPlayer from '../components/VideoPlayer.vue'

export default defineComponent({
    name: "VideoEditorPage",
    components: { TrackSelector, MetronomeComponent, VideoPlayer },
    setup(props, context) {
        
        var tracks = ref([
            {trackName : "Track 0"}, 
        ])
        let clickTracks = ref([{ initialBpm : 80}])
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

        function drag(event: any, mouse_down: boolean) {
            if (mouse_down) {
                var timeline = document.getElementsByClassName("timeline")[0].getBoundingClientRect()
                var x = event.clientX;
                playhead.value = Math.min(1, Math.max(0, (x - timeline.x) / timeline.width))
            }
        }
        
        function addNewClickTrack() {
            clickTracks.value.push({ initialBpm : 80 })
        }

        function addNewTrack () {
            tracks.value.push({trackName: "Track " + (tracks.value.length + 0).toString()})
        }

        ipcRenderer.addListener('asynchronous-reply',  (event, args) => {
            let port = args.port
            if (stream_url.value === "") {
                stream_url.value = "http://localhost:"+port.toString()+"/stream.mpd"
            }
        })

        return {stream_url, tracks, clickTracks, addNewClickTrack, openSingleVideoEditor, setScreenStyle, drag, track_data, playhead, mouse_down, addNewTrack}
        

    },
    created() {

        console.log("Running created ()");
        ipcRenderer.invoke('get-recordings-directory').then( (dir) => {
        ipcRenderer.send('asynchronous-message', 
        {
        type: 'startEngine', 
        data: {
            outputType: "preview",
            videoInputs: [
            {
                file: join("../recordings", "video1.webm"),
                startTime: 0.02,
                position: {left: 0, top: 0},
                resolution: {width: 1280, height: 720}
            },
            {
                file: join("../recordings", "video2.webm"),
                startTime: 0.02,
                position: {left: "w0", top: 0},
                resolution: {width: 1280, height: 720}
            },
            {
                file: join("../recordings", "video3.webm"),
                startTime: 0.02,
                position: {left: 0, top: "h0"},
                resolution: {width: 1280, height: 720}
            },
            {
                file: join("../recordings", "video4.webm"),
                startTime: 0.02,
                position: {left: "w0", top: "h0"},
                resolution: {width: 1280, height: 720}
            },
            ],
            audioInputs:[
            /*{
                file: join("../recordings", "audio1.webm"),
                startTime: 0.02,
                volume: 255,
            },*/
            ]
        }
        })
        });
    },
    emits: ["open-single-editor", "open-recording-page"]
});
</script>

<style lang="scss" scoped>
  @import "../styles/main.scss";
  @import "../styles/pages/video-editor.scss";
</style>