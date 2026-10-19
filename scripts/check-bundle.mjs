#!/usr/bin/env node
/**
 * Static sanity check for the two built artifacts. It does not execute plugin
 * code and does not need the DSH runtime.
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const failures = []

const BASELINE = new Set([
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
])

function check(condition, label, detail = '') {
  if (condition) {
    console.log(`PASS  ${label}`)
  } else {
    console.log(`FAIL  ${label}${detail === '' ? '' : ` — ${detail}`}`)
    failures.push(label)
  }
}

function read(relative) {
  const path = resolve(root, relative)
  if (!existsSync(path)) {
    console.log(`FAIL  missing ${relative}`)
    failures.push(`missing ${relative}`)
    return ''
  }
  return readFileSync(path, 'utf8')
}

const packageJson = JSON.parse(read('package.json') || '{}')
check(packageJson.name === '@local/dsh-input-uplift', 'package name')
check(packageJson.main === 'lib/index.js', 'host main is lib/index.js')
check(packageJson.exports?.['./client'] === './lib/client.js', 'client export is lib/client.js')
check(packageJson.dsh?.bundle?.patch === './cordis.patch.yml', 'dsh bundle patch configured')
check(packageJson.dsh?.client?.platform === 'web', 'dsh client platform is web')
check(packageJson.dsh?.client?.immediately === true, 'dsh client immediately is true')
check(packageJson.dependencies === undefined, 'no runtime dependencies')
check(packageJson.engines?.dsh === '^0.2.1-rc.1', 'engines.dsh pinned to runtime line')

const patch = read('cordis.patch.yml')
check(patch.includes("id: input-uplift"), 'cordis patch inserts input-uplift')
check(patch.includes("name: '@local/dsh-input-uplift'"), 'cordis patch package name')

const host = read('lib/index.js')
check(/export\s*\{[^}]*\bapply\b[^}]*\}/s.test(host), 'host exposes export { apply }')
check(/export\s*\{[^}]*\binject\b[^}]*\}/s.test(host), 'host exposes export { inject }')
check(host.includes('await import("@deepseek-ai/dsh-llm")'), 'dsh-llm stays a dynamic external import')
check(!/from\s+["']react["']/.test(host), 'host has no react import')
check(!/require\(\s*["']react/.test(host), 'host has no require(react)')
check(!/jsx-runtime/.test(host), 'host has no JSX runtime import')
check(!/button|conversation\.input/.test(host), 'host bundle carries no client UI code')

const client = read('lib/client.js')
const banner = 'window.__ModuleLoader__.load({ id: "@local/dsh-input-uplift", factory: (require) => {'
const footer = 'return module.exports; } });'
check(client.startsWith(banner), 'client starts with the ModuleLoader banner')
check(client.trimEnd().endsWith(footer), 'client ends with the ModuleLoader footer')
check(/exports\.apply\s*=/.test(client), 'client exports apply')
check(/exports\.inject\s*=/.test(client), 'client exports inject')
check(!/^\s*export\s/m.test(client), 'client has no top-level ESM exports')
check(!client.includes('@deepseek-ai/dsh-llm'), 'client does not import the host LLM package')
check(!/require\.async\s*\(/.test(client), 'client has no code-split require.async')

const requires = new Set()
for (const match of client.matchAll(/require\(\s*(["'])([^"']+)\1\s*\)/g)) {
  requires.add(match[2])
}
const unexpected = [...requires].filter(id => !BASELINE.has(id))
check(unexpected.length === 0, 'client require() calls are all baseline modules', unexpected.join(', '))
check(requires.has('react'), 'client requires react')
check(requires.size > 0, 'client has at least one baseline require')
console.log(`INFO  client requires: ${[...requires].sort().join(', ')}`)

check(client.includes('conversation.input.right'), 'client registers conversation.input.right')
check(client.includes('conversation.input.overlay'), 'client registers conversation.input.overlay')
check(client.includes('/api/input-uplift/reorganize'), 'client targets the uplift route')

if (failures.length > 0) {
  console.error(`\nBundle check FAILED (${failures.length} problem(s)).`)
  process.exitCode = 1
} else {
  console.log('\nBundle check passed.')
}
