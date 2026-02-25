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
  external: ['firebase-admin', 'firebase-functions', '@google-cloud/storage', '@google/genai', 'pdf-parse'],
  alias: {
    '@repo/shared': path.resolve('../../packages/shared/src/index.ts'),
  },
  // In CJS output, import.meta.url is empty. Inject the CJS equivalent at the
  // top of the bundle so createRequire(import.meta.url) works at runtime.
  banner: {
    js: "const __importMetaUrl = require('url').pathToFileURL(__filename).href;",
  },
  define: {
    'import.meta.url': '__importMetaUrl',
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
    'pdf-parse': pkg.dependencies['pdf-parse'],
  },
}
writeFileSync('dist/package.json', JSON.stringify(deployPkg, null, 2))

console.log('Build complete!')
