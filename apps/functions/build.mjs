import { build } from 'esbuild'
import path from 'path'
import { writeFileSync, readFileSync } from 'fs'

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/index.js',
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  external: ['firebase-admin', 'firebase-functions', '@google-cloud/storage', '@google/genai'],
  alias: {
    '@repo/shared': path.resolve('../../packages/shared/src/index.ts'),
  },
})

// Write a clean package.json to dist/ — no workspace:* entries that break npm on Cloud Build.
// Only runtime deps that are external to the esbuild bundle are needed here.
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const deployPkg = {
  name: pkg.name,
  version: pkg.version,
  main: 'index.js',
  type: 'commonjs',
  engines: { node: '22' },
  dependencies: {
    'firebase-admin': pkg.dependencies['firebase-admin'],
    'firebase-functions': pkg.dependencies['firebase-functions'],
    '@google-cloud/storage': pkg.dependencies['@google-cloud/storage'],
    '@google/genai': pkg.dependencies['@google/genai'],
  },
}
writeFileSync('dist/package.json', JSON.stringify(deployPkg, null, 2))

console.log('Build complete!')
