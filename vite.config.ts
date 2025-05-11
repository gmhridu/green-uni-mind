import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  worker: {
    format: 'es', // Use ES modules for workers
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'], // Exclude FFmpeg from optimization
    include: [
      'react-player/lazy',
      'react-player/file',
      'react-player/youtube',
      'react-player/vimeo',
    ],
  },
  build: {
    target: 'esnext', // Use modern JavaScript features
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'video-player': [
            'video.js',
            'hls.js',
            '@videojs/http-streaming',
            '@silvermine/videojs-quality-selector'
          ],
          'react-player': [
            'react-player',
            'react-player/lazy',
            'react-player/file',
            'react-player/youtube',
            'react-player/vimeo',
          ],
        },
      },
    },
  },
});
