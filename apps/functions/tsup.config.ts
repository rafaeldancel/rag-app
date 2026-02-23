import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'], // CommonJS — required for Firebase Functions runtime
  target: 'node22',
  outDir: 'dist',
  // Bundle workspace packages (they aren't deployed separately).
  // Everything else (firebase-admin, @trpc/server, zod, etc.) stays external
  // and is installed from node_modules by Firebase at deploy time.
  noExternal: [/^@repo\//],
  clean: true,
  sourcemap: false,
})
