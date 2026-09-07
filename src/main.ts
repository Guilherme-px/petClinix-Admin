import { createApp } from "vue";
import { createPinia } from "pinia";
import { Quasar, Notify } from "quasar";
import { useAuthStore } from "./stores/auth.ts";
import { container } from "./infrastructure/container.ts";

import App from "./App.vue";
import router from "./router";

import "@quasar/extras/material-icons/material-icons.css";
import "quasar/src/css/index.sass";
import "@/assets/css/main.css";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(Quasar, {
    plugins: {
        Notify,
    },
});

const authStore = useAuthStore();

container.httpClient.setAuthHandlers(
    () => authStore.doRefreshToken(),
    () => authStore.logout(),
);

app.mount("#app");
