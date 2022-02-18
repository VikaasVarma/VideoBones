<template id="OnOpenPage">

  <h1 class="page-title" style="margin-top: 10%; margin-bottom: 5%;">VIDEO BONES</h1>
  <menu class="horizontal-options-menu">

    <div>
      <button class="image-container">
        <img src="../../../assets/images/addIcon.png">
      </button>
      
      <h3>Create New Project</h3>
    </div>

    <hr class="vertical-border-line">

    <div>
      <button @click="onClick" class="image-container">
        <img src="../../../assets/images/folderIcon.png">
      </button>

      <h3>Open Existing Project</h3>
    </div>
    
  </menu>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name: "OnOpenPage",
    setup() {
      function onClick() {
        console.log("working")
      }

      return { onClick }

    }
});


</script>

<style lang="scss">
  @import "../styles/main.scss";
</style>

