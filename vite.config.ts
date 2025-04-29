import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'Decko',
      fileName: format => `decko.${format}.js`,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['react', 'valtio'],
    },
    outDir: 'dist',
    sourcemap: true,
  },
  plugins: [dts()],
})
