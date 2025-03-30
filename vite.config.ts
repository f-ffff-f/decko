import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        types: 'src/types.ts',
      },
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      output: {
        entryFileNames: ({ name }) => `${name}.js`,
      },
    },
    outDir: 'dist',
    sourcemap: true,
  },
  plugins: [dts()],
})
