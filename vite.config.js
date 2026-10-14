import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 7173, strictPort: true },
  preview: { port: 7173, strictPort: true },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: { three: ['three'], motion: ['gsap', 'lottie-web'] },
      },
    },
  },
});
