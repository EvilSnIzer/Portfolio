import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // The preview proxy reaches the dev server through a hostname
    // (https://<port>-<sandbox>.e2b.app), so allow arbitrary hosts.
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    allowedHosts: true,
  },
  build: {
    target: 'es2022',
    cssTarget: 'chrome120',
    // three + drei is inherently large; keep an eye on this number.
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Split the heavy 3D runtime out of the entry chunk so the first paint
        // (hero DOM, fonts, styles) is not blocked by it.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('node_modules/three/')) return 'three'
          if (id.includes('@react-three') || id.includes('postprocessing')) return 'r3f'
          if (id.includes('gsap') || id.includes('lenis')) return 'motion'
        },
      },
    },
  },
})
