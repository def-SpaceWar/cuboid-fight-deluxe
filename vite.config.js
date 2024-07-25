import { defineConfig } from 'vite';
import { resolve } from "path";

export default defineConfig({
    resolve: {
        alias: {
            "@": resolve("/src"),
        },
    },
    build: {
        target: 'esnext',
    },
    esbuild: {
        jsx: "transform",
        jsxImportSource: "@",
        jsxInject: "import { jsx } from '@/jsx-runtime'",
        jsxFactory: "jsx.element",
        jsxFragment: "jsx.Fragment",
    }
})
