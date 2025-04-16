import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'Decko',
      fileName: format => `decko.${format}.js`,
      formats: ['es', 'cjs', 'umd'],
    },
    outDir: 'dist',
    sourcemap: true,
  },
  plugins: [dts()],
})
