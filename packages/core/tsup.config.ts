import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  minify: false,
  external: [],
  noExternal: [],
  platform: 'node',
  target: 'node18',
  outDir: 'dist',
  onSuccess: 'echo "✅ @sker/core build completed"'
})