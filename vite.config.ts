import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Porta 5174: liberada no CORS do backend VirtualGameCard.
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES === "true" ? "/VirtualGameCardFrontend/" : "/",
  server: {
    port: 5174,
    strictPort: true,
  },
})
