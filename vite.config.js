import { defineConfig } from 'vite';
import { resolve } from "path";

export default defineConfig({
    resolve: {
        alias: {
            "@": resolve("/src"),
        },
    },
    esbuild: {
        jsx: "transform",
        jsxImportSource: "@",
        jsxInject: "import { jsx } from '@/jsx'",
        jsxFactory: "jsx.component",
        jsxFragment: "jsx.Fragment",
    }
})
