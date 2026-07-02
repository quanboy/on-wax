import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    // Reachable via the Caddy reverse proxy at https://onwax.test
    allowedHosts: ['onwax.test'],
    // HMR websocket goes back through Caddy on 443, not the raw Vite port
    hmr: {
      clientPort: 443,
    },
    // So /api also resolves when hitting 127.0.0.1:5173 directly (bypassing Caddy).
    // Via https://onwax.test, Caddy handles /api before it ever reaches Vite.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
