import { defineConfig } from 'vite';
import path from "path";

export default defineConfig({
    //esbuild: {
    //    jsxInject: `import { customElement } from '@/jsx'`
    //},
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
})
