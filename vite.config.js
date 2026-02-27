import { defineConfig } from 'vite';
import tailwindcss from "@tailwindcss/vite"
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Base path for production build
  base: './',

  // Build configuration
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router'],
          'ui-vendor': ['motion', 'lucide-react'],
          'charts': ['recharts'],
          'three-vendor': ['three'],
        },
      },
    },
  },

  // Server configuration for development
  server: {
    port: 5173,
    strictPort: false,
  },

  // Optimize deps
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
