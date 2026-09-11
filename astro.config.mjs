import { defineConfig } from 'astro/config'
import vue from '@astrojs/vue'
import tailwindcss from '@tailwindcss/vite'
import sitemap from '@astrojs/sitemap'

// https://astro.build/config
export default defineConfig({
  site: 'https://devutils.fox9.dev',
  integrations: [
    vue({
      jsx: false
    }),
    sitemap()
  ],
  vite: {
    plugins: [tailwindcss()]
  },
  server: {
    port: 12356
  }
})
