import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  external: [
    '@sker/core',
    '@sker/serialization-json'
  ],
  outDir: 'dist',
  target: 'node18',
  platform: 'node'
});