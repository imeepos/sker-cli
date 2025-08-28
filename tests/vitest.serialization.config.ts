import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/serialization/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      reportsDirectory: './coverage/serialization',
      include: ['../packages/serialization-*/**/*.ts', '../packages/data-udef/**/*.ts'],
      exclude: [
        '**/*.d.ts',
        '**/*.config.*',
        '**/tests/**',
        '**/*.test.*'
      ]
    },
    setupFiles: ['./src/setup/serialization-setup.ts']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@sker/core': resolve(__dirname, '../packages/core/src'),
      '@sker/serialization-json': resolve(__dirname, '../packages/serialization-json/src'),
      '@sker/serialization-protobuf': resolve(__dirname, '../packages/serialization-protobuf/src'),
      '@sker/data-udef': resolve(__dirname, '../packages/data-udef/src')
    }
  }
});
