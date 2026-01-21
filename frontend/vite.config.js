import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Dev proxy: forward /api requests to production backend to avoid CORS during local testing
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY || 'https://api.banhannah.dpdns.org',
        changeOrigin: true,
        secure: false,
        // keep path as-is
      }
    }
  }
})
