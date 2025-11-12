import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  define: {
    // Handle global p5 access if needed for @react-p5/core
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['p5', '@react-p5/core']
  },
  server: {
    port: 5173, // Vite default port
    host: true,
  }
})