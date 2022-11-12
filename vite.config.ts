import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import del from 'rollup-plugin-delete';
import copy from 'rollup-plugin-copy';
// https://crxjs.dev/vite-plugin/getting-started/vue/dev-basics
import { crx } from '@crxjs/vite-plugin';
// https://developer.chrome.com/docs/extensions/mv3/getstarted/
import manifest from './manifest.json';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: 'index.html',
        popup: 'popup.html',
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    vue(),
    vueJsx(),
    crx({
      manifest: manifest as any,
    }),
    // delete lib
    del({
      targets: 'public/lib/*',
      hook: 'options',
      runOnce: true,
    }) as Plugin,
    // copy lib
    copy({
      targets: [
        // used by: index.html <script>
        {
          src: 'node_modules/requirejs/require.js',
          dest: 'public/lib/requirejs',
        },
        // used by: index.html <script>; src/main/useMonaco.ts require.config
        {
          src: 'node_modules/monaco-editor/min/vs/**/*',
          dest: 'public/lib/monaco-editor/min/vs',
        },
        {
          src: 'node_modules/monaco-editor/min-maps/vs/**/*',
          dest: 'public/lib/monaco-editor/min-maps/vs',
        },
      ],
      hook: 'buildStart',
    }) as Plugin,
  ],
});
