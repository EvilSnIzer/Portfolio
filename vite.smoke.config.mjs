import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

const smoke = (p) => fileURLToPath(new URL(`./.smoke/${p}`, import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@react-three/fiber': smoke('stub-canvas.tsx'),
      'gsap/ScrollTrigger': smoke('stub-gsap-plugins.js'),
      'gsap/SplitText': smoke('stub-gsap-plugins.js'),
      three: smoke('stub-three.js'),
    },
  },
  build: { ssr: true, outDir: '.smoke/dist', rollupOptions: { input: '.smoke/entry.tsx' } },
})
