import { fileURLToPath } from "node:url";
import { mergeConfig, defineConfig, configDefaults } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
    viteConfig,
    defineConfig({
        test: {
            environment: "happy-dom",
            exclude: [...configDefaults.exclude, "e2e/**"],
            root: fileURLToPath(new URL("./", import.meta.url)),
            globals: true,
            setupFiles: ["src/test/setup.ts"],
            coverage: {
                provider: "v8",
                reporter: ["text", "html", "lcov"],
                exclude: [
                    "**/node_modules/**",
                    "**/dist/**",
                    "e2e/**",
                    "src/assets/**",
                    "src/test/**",
                    "src/main.ts",
                    "vite.config.ts",
                    "vitest.config.ts",
                    "eslint.config.ts",
                ],
            },
        },
    }),
);
