<template id="OnOpenPage">
  <div class="base-page-div">
    <h1 class="page-title" style="margin-top: 10%; margin-bottom: 5%;">VIDEO BONES</h1>
    <menu class="horizontal-options-menu">

      <div>
        <button @click="folderIconClicked()" class="image-container">
          <img src="../../../assets/images/addIcon.png">
        </button>
        
        <h3>Create New Project</h3>
      </div>

      <hr class="vertical-border-line">

      <div>
        <button class="image-container">
          <img src="../../../assets/images/folderIcon.png">
        </button>

        <h3>Open Existing Project</h3>
      </div>
    </menu>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    name: "on-open-page",
    setup(props, context) {

      const folderIconClicked = () => {
        context.emit("create-new-project")
        console.log("Emmiting create-new-project")
      }

      return { folderIconClicked }

    },
    emits: ["create-new-project"], 
});


</script>

<style lang="scss" scoped>
  @import "../styles/main.scss";
  @import "../styles/pages/on-open-page.scss";
</style>

