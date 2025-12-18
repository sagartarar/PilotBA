import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.glsl'],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
      },
    },
    // Security headers for development
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval'", // unsafe-eval required for Apache Arrow WASM
        "style-src 'self' 'unsafe-inline'", // inline styles for Tailwind
        "img-src 'self' data: blob:",
        "connect-src 'self' ws: wss: http://localhost:*",
        "font-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
      ].join('; '),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-arrow': ['apache-arrow'],
          'vendor-zustand': ['zustand'],
          'vendor-query': ['@tanstack/react-query'],
          // Feature chunks
          'feature-viz': [
            './src/viz-engine/VizEngine.ts',
            './src/viz-engine/Renderer.ts',
            './src/viz-engine/Camera.ts',
          ],
          'feature-data': [
            './src/data-pipeline/DataLoader.ts',
            './src/data-pipeline/QueryOptimizer.ts',
            './src/data-pipeline/ExecutionEngine.ts',
          ],
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['apache-arrow'],
  },
})

