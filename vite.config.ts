import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import vueDevTools from "vite-plugin-vue-devtools";
import { quasar, transformAssetUrls } from "@quasar/vite-plugin";

export default defineConfig({
    plugins: [
        vue({
            template: { transformAssetUrls },
        }),
        vueJsx(),
        vueDevTools(),
        quasar({
            sassVariables: "@/assets/css/quasar.variables.sass",
        }),
    ],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
});
