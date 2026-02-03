import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      'components': path.resolve(__dirname, './components'),
      'utils': path.resolve(__dirname, './utils'),
      'config': path.resolve(__dirname, './config')
    }
  },
  server: {
    port: 5173,
    strictPort: false,
    host: true
  }
});
