import { createApp } from "vue";
import App from "./App.vue";
import Home from "./components/Home.vue";
import Dummy from "./components/Dummy.vue";
import { createRouter, createWebHistory } from "vue-router";
import "bootstrap/dist/css/bootstrap.min.css";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/oauth-callback",
      component: Dummy,
      beforeEnter: async () => {
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get("code");

        const response = await fetch(
          `https://app.pagerduty.com/oauth/token?grant_type=authorization_code&client_id=${
            import.meta.env.VITE_CLIENT_ID
          }&redirect_uri=${
            import.meta.env.VITE_REDIRECT_URI
          }&code=${code}&code_verifier`,
          {
            method: "POST"
          }
        );

        if (response.ok) {
          const json = await response.json();
          localStorage.setItem("token", json.access_token);
        } else {
          alert(await response.text());
        }

        return "/";
      }
    },
    {
      path: "/",
      component: Home,
      beforeEnter: () => {
        const token = localStorage.getItem("token");

        if (token) {
          return true;
        } else {
          location.href = `https://app.pagerduty.com/oauth/authorize?client_id=${
            import.meta.env.VITE_CLIENT_ID
          }&redirect_uri=${
            import.meta.env.VITE_REDIRECT_URI
          }&response_type=code&code_challenge_method=S256&code_challenge`;

          return false;
        }
      }
    }
  ]
});

const app = createApp(App);
app.use(router);
app.mount(document.body);
