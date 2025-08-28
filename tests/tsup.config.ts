import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  target: 'node18',
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  external: [
    '@sker/core',
    '@sker/protocol-http',
    '@sker/protocol-grpc', 
    '@sker/protocol-websocket',
    '@sker/protocol-ucp',
    '@sker/serialization-json',
    '@sker/serialization-protobuf',
    '@sker/data-udef'
  ],
  esbuildOptions(options) {
    options.conditions = ['module'];
  }
});
