import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': 'src',
      '@assets': 'src/assets',
      '@/utils': 'src/utils',
      '@/features': 'src/features',
      '@/repositories': 'src/repositories',
      '@/types': 'src/types',
    }
  }
})
