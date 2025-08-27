import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  external: [
    '@sker/types',
    '@sker/constants', 
    '@sker/utils',
    '@sker/logger',
    '@sker/error-core',
    '@sker/protocol-ucp',
    '@sker/serialization-protobuf'
  ],
  outDir: 'dist',
  target: 'node18',
  platform: 'node'
});