import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            // Suppress connection refused errors when backend is not running
            if (err.code !== 'ECONNREFUSED') {
              console.error('Proxy error:', err);
            }
          });
        }
      }
    }
  }
})

