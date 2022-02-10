<template>

  <div style="margin: auto; width: 50%;">
    <div class="options-menu">
      <h3 class="options-menu-title">TRACKS</h3>

      <div class="button-secondary">Recording</div>
      <div class="button-primary">Click me!</div>
      <hr class="border-line">
      <div class="tickbox-container">
        <input type="checkbox" class="tickbox"/>
        <h2>Trombone Melody</h2>
      </div>

      <div class="tickbox-container">
        <input type="checkbox" class="tickbox"/>
        <h2>Something Else</h2>
      </div>

      <div class="tickbox-container">
        <input type="checkbox" class="tickbox"/>
        <h2>Some other thing</h2>
      </div>

    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name: "Recording",
});
</script>

<style src="./styles/main.scss">
  div {
    margin-left: 30px;
  }
</style>