import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const useTestDomain = process.env.VITE_USE_TEST_DOMAIN === 'true'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    // Only enforce onwax.test host header + route HMR through Caddy when the
    // test-domain proxy is active. Without this, direct 127.0.0.1:5173 access
    // (other machines, CI) works normally.
    ...(useTestDomain && {
      allowedHosts: ['onwax.test'],
      hmr: { clientPort: 443 },
    }),
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
