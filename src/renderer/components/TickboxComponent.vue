<template>
    
    <div @click="ticked=!ticked" class="tickbox-container">
        <input type="checkbox" class="tickbox"/>
        <h3>{{tickbox_text}}</h3>
    </div>

</template>

<script lang="ts">
import { defineComponent, ref } from "vue";

export default defineComponent({
  name: "tickbox-component",
  props: {
      tickbox_text : String,
      
  },
  data() {
    return {ticked : {type:Boolean, default: false}}
  },
  setup() {
    return {}
  },
});

</script>
<style lang="scss" scoped>
  @import "../styles/main.scss";
  @import "../styles/pages/video-editor.scss";
  @import "../styles/pages/single-video-editor.scss";
</style>