import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  publicDir: 'public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    assetsDir: 'assets/build',
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        game: resolve(import.meta.dirname, 'game.html'),
        process: resolve(import.meta.dirname, 'process.html')
      }
    }
  }
});
