import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 库模式构建：ESM + UMD 双产物，vue 外置（peer），CSS 抽出为 style.css。
export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'DmkUI',
      formats: ['es', 'umd'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.umd.cjs'),
      cssFileName: 'style'
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: { vue: 'Vue' }
      }
    },
    cssCodeSplit: false,
    sourcemap: true
  }
})
