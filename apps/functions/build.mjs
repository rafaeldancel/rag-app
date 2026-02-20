import { build } from 'esbuild'
await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'lib/index.js',
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  external: ['firebase-admin', 'firebase-functions', '@google-cloud/storage', '@google/genai'],
})
console.log('Build complete!')
