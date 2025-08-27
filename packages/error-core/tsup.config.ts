import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  minify: false,
  external: ['@sker/types', '@sker/constants'],
  noExternal: [],
  platform: 'neutral',
  target: 'node18',
  outDir: 'dist',
  onSuccess: 'echo "✅ @sker/error-core build completed"'
})