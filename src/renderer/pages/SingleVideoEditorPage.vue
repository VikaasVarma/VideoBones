
<template id="SingleVideoEditorPage">
  
    <menu class="grid-container" style="margin: auto;">

        <div id="video-container">

            <video controls>
                <source>
            </video>

            <div></div>

        </div>

        <menu class="vertical-options-menu">

            <div style="">
            </div>
            <div style="">
            </div>

        </menu>

    </menu>

</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name: "SingleVideoEditorPage",
});
</script>

<style lang="scss">
  @import "../styles/main.scss";
  @import "../styles/pages/single-video-editor.scss";
</style>