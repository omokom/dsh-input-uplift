/**
 * Two builds, deliberately kept in the same package:
 *  - lib/index.js  ESM host plugin (Node), `@deepseek-ai/dsh-llm` stays external;
 *  - lib/client.js lazy CJS module in the DSH `window.__ModuleLoader__` envelope.
 *
 * The client may only value-import modules from the web shell's frozen module
 * table. The resolve-time purity gate fails the build for anything else.
 */
import type { UserConfig } from 'tsdown'

const ID = '@local/dsh-input-uplift'

/** The 11-module platform table exposed by the DSH web shell. */
const EXTERNALS = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  'zod',
  '@tanstack/react-virtual',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-dockkit',
]

function purityGate(): NonNullable<UserConfig['plugins']>[number] {
  return {
    name: 'dsh-input-uplift-client-purity',
    resolveId(source: string) {
      // Relative modules, the build entry, virtual modules, and absolute paths
      // are plugin-owned.
      if (source.startsWith('.') || source.startsWith('/') || source.startsWith('src/') || source.startsWith('\0')) return null
      if (EXTERNALS.includes(source)) return null
      throw new Error(
        `client bundle purity: "${source}" is not in the DSH platform module table; `
        + 'use a cordis service or a type-only import instead',
      )
    },
  }
}

const hostConfig: UserConfig = {
  name: ID,
  entry: { index: 'src/index.ts' },
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  dts: false,
  minify: false,
  sourcemap: false,
  clean: false,
  // Runtime resolution is owned by the DSH installation; never bundle it.
  deps: { neverBundle: ['@deepseek-ai/dsh-llm'] },
  outputOptions: { entryFileNames: 'index.js' },
}

const clientConfig: UserConfig = {
  name: `${ID}/client`,
  entry: { client: 'src/client/index.tsx' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  dts: false,
  minify: false,
  sourcemap: false,
  clean: false,
  deps: {
    neverBundle: [...EXTERNALS],
    alwaysBundle: (id: string) => !EXTERNALS.includes(id),
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
  },
  plugins: [purityGate()],
  outputOptions: {
    entryFileNames: 'client.js',
    codeSplitting: false,
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(ID)}, factory: (require) => {`,
    intro: 'var module = { exports: {} }; var exports = module.exports;',
    footer: 'return module.exports; } });',
  },
}

export default [hostConfig, clientConfig]
