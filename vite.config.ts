import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import path from 'path';
import { babel } from '@rollup/plugin-babel';
import typescript from './plugin/rollup-plugin-typescript3';

export default defineConfig({
  server: {
    hmr: {
      overlay: false
    }
  },

  plugins: [
    typescript(),

    babel({
      extensions: ['.tsx', '.ts', '.js'],
      plugins: [
        "@babel/plugin-syntax-jsx",
        ["@babel/plugin-proposal-decorators", { "legacy": true }],
        ["@babel/plugin-proposal-class-properties", {"loose": true}],
      ],
    }),

    vue(),
    vueJsx({enableObjectSlots: true}),
  ],
  resolve: {
    conditions: ['./xxx.js'],
    mainFields: ['esnext'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
});
