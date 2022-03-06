
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
                
                <div>
                    <h2 class="section-title">Tracks</h2>
                    <div class="tickbox-container">
                        <input type="checkbox" class="tickbox"/>
                        <h3>Track 1</h3>
                    </div>
                    <div class="tickbox-container">
                        <input type="checkbox" class="tickbox"/>
                        <h3>Track 2</h3>
                    </div>
                    <div class="add-item-container">
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
                    <div class="metronome-container">
                        <h2>{{bpm}}</h2>
                        <div>
                            <img @click="incBpm()" src="../../../assets/images/arrow.svg">
                            <img @click="decBpm()" src="../../../assets/images/arrow.svg" style="transform: scaleY(-1)">
                        </div>
                    </div>
                    <div class="add-item-container">
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
import { defineComponent, ref } from 'vue';

export default defineComponent({
    name: "VideoEditorPage",
    setup(props, context) {
        var bpm = ref(80)
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
        function incBpm() { bpm.value += 1 }
        function decBpm() { bpm.value -= 1 }
        function setScreenStyle(style: number) { screenStyle.value = style }

        function drag(event: any, mouse_down: boolean) {
            if (mouse_down) {
                var timeline = document.getElementsByClassName("timeline")[0].getBoundingClientRect()
                var x = event.clientX;
                playhead.value = Math.min(1, Math.max(0, (x - timeline.x) / timeline.width))
            }
        }

        return {openSingleVideoEditor, incBpm, decBpm, setScreenStyle, drag, bpm, track_data, playhead, mouse_down}
    },
    emits: ["open-single-editor"]
});
</script>

<style lang="scss" scoped>
  @import "../styles/main.scss";
  @import "../styles/pages/video-editor.scss";
</style>