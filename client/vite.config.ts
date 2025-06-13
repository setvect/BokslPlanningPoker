import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'icon/*.png'],
      manifest: {
        name: '복슬 플래닝 포커',
        short_name: '복슬포커',
        description: '복슬 웹 기반 애자일 스프린트 플래닝 포커 도구',
        theme_color: '#3b82f6',
        background_color: '#f9fafb',
        display: 'standalone',
        icons: [
          {
            src: '/icon/logo192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon/logo512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1년
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  server: {
    port: 5173,
    host: true, // 외부 접속 허용
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
        changeOrigin: true
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // 청크 크기 제한 증가 (Socket.io 때문에)
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          socket: ['socket.io-client']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@hooks': '/src/hooks',
      '@types': '/src/types',
      '@utils': '/src/utils'
    }
  }
}) 