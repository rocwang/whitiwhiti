import { createApp } from "vue";
import App from "./App.vue";
import Home from "./components/Home.vue";
import Dummy from "./components/Dummy.vue";
import Login from "./components/Login.vue";
import { createRouter, createWebHistory } from "vue-router";
import "bootstrap/dist/css/bootstrap.min.css";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      component: Login,
      name: Login.name,
      beforeEnter: () => {
        const token = localStorage.getItem("token");

        return token ? "/" : true;
      }
    },
    {
      path: "/oauth-callback",
      component: Dummy,
      name: Dummy.name,
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
      name: Home.name,
      beforeEnter: () => {
        const token = localStorage.getItem("token");

        return token ? true : "/login";
      }
    }
  ]
});

const app = createApp(App);
app.use(router);
app.mount(document.body);
