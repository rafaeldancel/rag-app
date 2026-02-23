import { build } from 'esbuild'
import path from 'path'
await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'lib/index.js',
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  external: ['firebase-admin', 'firebase-functions', '@google-cloud/storage', '@google/genai'],
  alias: {
    '@repo/shared': path.resolve('../../packages/shared/src/index.ts'),
  },
})
console.log('Build complete!')
