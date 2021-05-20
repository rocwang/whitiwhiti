<template>
  <router-view />
</template>

<script>
import { defineComponent, watchEffect } from "vue";
import { useRoute } from "vue-router";

export default defineComponent({
  name: "App",
  setup() {
    const route = useRoute();

    // tag body with route/component name
    watchEffect(() => {
      document.body.setAttribute("route", route.name || "");
    });
  }
});
</script>
