import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/e2e/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    testTimeout: 300000, // 5 minutes for E2E tests
    hookTimeout: 60000,
    maxConcurrency: 1, // Run E2E tests sequentially
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      reportsDirectory: './coverage/e2e'
    },
    setupFiles: ['./src/setup/e2e-setup.ts']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@sker/core': resolve(__dirname, '../packages/core/src'),
      '@sker/protocol-http': resolve(__dirname, '../packages/protocol-http/src'),
      '@sker/protocol-grpc': resolve(__dirname, '../packages/protocol-grpc/src'),
      '@sker/protocol-websocket': resolve(__dirname, '../packages/protocol-websocket/src'),
      '@sker/protocol-ucp': resolve(__dirname, '../packages/protocol-ucp/src'),
      '@sker/serialization-json': resolve(__dirname, '../packages/serialization-json/src'),
      '@sker/serialization-protobuf': resolve(__dirname, '../packages/serialization-protobuf/src'),
      '@sker/data-udef': resolve(__dirname, '../packages/data-udef/src')
    }
  }
});
