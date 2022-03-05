
<template id="SingleVideoEditorPage">
    <div @mouseup="mouse_down = false" @mousemove="drag($event, mouse_down)" >
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

export default defineComponent({
  components: { TrackSelector, MetronomeComponent },
    name: "VideoEditorPage",
    setup(props, context) {
        
        var tracks = ref([
            {trackName : "Track 0"}, 
        ])
        var clickTracks = ref([{ initialBpm : 80}])
        var screenStyle = ref(0)
        var playhead = ref(.6)
        var mouse_down = ref(false)
        var track_data = {
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

        return {tracks, clickTracks, addNewClickTrack, openSingleVideoEditor, setScreenStyle, drag, track_data, playhead, mouse_down, addNewTrack}
    },
    emits: ["open-single-editor", "open-recording-page"]
});
</script>

<style lang="scss" scoped>
  @import "../styles/main.scss";
  @import "../styles/pages/video-editor.scss";
</style>