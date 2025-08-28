import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/protocol/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    testTimeout: 60000,
    hookTimeout: 15000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      reportsDirectory: './coverage/protocol',
      include: ['../packages/protocol-*/**/*.ts'],
      exclude: [
        '**/*.d.ts',
        '**/*.config.*',
        '**/tests/**',
        '**/*.test.*'
      ]
    },
    setupFiles: ['./src/setup/protocol-setup.ts']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@sker/core': resolve(__dirname, '../packages/core/src'),
      '@sker/protocol-http': resolve(__dirname, '../packages/protocol-http/src'),
      '@sker/protocol-grpc': resolve(__dirname, '../packages/protocol-grpc/src'),
      '@sker/protocol-websocket': resolve(__dirname, '../packages/protocol-websocket/src'),
      '@sker/protocol-ucp': resolve(__dirname, '../packages/protocol-ucp/src')
    }
  }
});
