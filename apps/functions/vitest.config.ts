import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    // Only look inside src/ — prevents Vitest picking up stale lib/ build artifacts
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
  resolve: {
    alias: {
      '@repo/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
})
