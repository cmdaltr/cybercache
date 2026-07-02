import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 22243,
    proxy: {
      '/api': {
        target: 'http://localhost:22244',
        changeOrigin: true,
      },
      '/files': {
        target: 'http://localhost:22244',
        changeOrigin: true,
      }
    }
  }
})
