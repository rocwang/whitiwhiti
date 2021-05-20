<template>
  <div :class="$style.root">
    <h1>
      🔃 Whitiwhiti,
    </h1>
    <p class="lead">
      "Swap, Exchange" in Maori, is a PageDuty app that can easily swap 2
      on-call shifts for you.
    </p>
    <button
      type="button"
      class="btn btn-primary btn-lg"
      @click="login()"
      :class="$style.login"
    >
      Login using your PageDuty account
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "Login",
  setup() {
    return {
      login() {
        location.href = `https://app.pagerduty.com/oauth/authorize?client_id=${
          import.meta.env.VITE_CLIENT_ID
        }&redirect_uri=${
          import.meta.env.VITE_REDIRECT_URI
        }&response_type=code&code_challenge_method=S256&code_challenge`;
      }
    };
  }
});
</script>

<style module>
body[route="Login"] {
  display: grid;
  padding: 20px;
  justify-items: center;
  align-items: center;
  min-height: 100vh;
}

.root {
  justify-self: center;
  align-self: center;
  display: flex;
  flex-flow: column nowrap;
}

.login {
  align-self: flex-end;
}
</style>
