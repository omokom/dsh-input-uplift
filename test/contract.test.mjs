import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createMockResult,
  createUnstructuredResult,
  parseUpliftResponse,
} from '../src/host/contract.ts'

const complete = {
  kind: 'scope_change',
  rewrite: '我按 B 继续；如果确实要回到 A，请直接说。',
  rewrite_override: '按 A 继续。',
  alignment: [{
    type: 'conflict',
    severity: 'high',
    claim: '看起来与上一步否决 A 的结论冲突。',
    evidence: { from: 'assistant#2', quote: 'A 方案已否决' },
    suggestion: '确认要回到 A 还是按 B。',
    applied_in_rewrite: true,
  }],
  task: { text: '继续改登录页', source: 'context' },
  constraints: [{ text: '不改 UI', source: 'context', applied_in_rewrite: true }],
  signals: ['登录可用'],
  brief: { purpose: '推进登录页', acceptance: '可登录', chain: '页面 → 接口' },
  assumptions: [{ text: '按 B 理解', consequence: '会重做登录流', reversible: true }],
  unknowns: ['是否保留旧接口'],
  inferred_in_rewrite: ['按 B 继续'],
  no_uplift: false,
  reason: '',
}

test('parses a bare JSON object and preserves the contract fields', () => {
  const outcome = parseUpliftResponse(JSON.stringify(complete))
  assert.equal(outcome.ok, true)
  if (!outcome.ok) return
  assert.equal(outcome.result.kind, 'scope_change')
  assert.equal(outcome.result.rewrite, complete.rewrite)
  assert.equal(outcome.result.rewrite_override, complete.rewrite_override)
  assert.equal(outcome.result.alignment.length, 1)
  assert.equal(outcome.result.alignment[0].evidence.quote, 'A 方案已否决')
  assert.equal(outcome.result.constraints[0].text, '不改 UI')
  assert.deepEqual(outcome.result.signals, ['登录可用'])
  assert.equal(outcome.result.assumptions[0].reversible, true)
  assert.deepEqual(outcome.result.inferred_in_rewrite, ['按 B 继续'])
})

test('tolerates markdown fences and prose before/after the object', () => {
  const text = `好的，结果如下：\n\n\`\`\`json\n${JSON.stringify(complete)}\n\`\`\`\n\n请查收。`
  const outcome = parseUpliftResponse(text)
  assert.equal(outcome.ok, true)
  if (outcome.ok) assert.equal(outcome.result.kind, 'scope_change')
})

test('finds a balanced JSON object inside prose', () => {
  const outcome = parseUpliftResponse(`Here is the result: ${JSON.stringify({ rewrite: 'hello', no_uplift: false })} — done.`)
  assert.equal(outcome.ok, true)
  if (outcome.ok) assert.equal(outcome.result.rewrite, 'hello')
})

test('drops alignment findings without evidence.quote', () => {
  const outcome = parseUpliftResponse(JSON.stringify({
    rewrite: 'x',
    alignment: [
      { type: 'conflict', claim: 'no quote', evidence: { from: 'assistant#1' } },
      { type: 'duplicate', claim: 'empty quote', evidence: { from: 'assistant#2', quote: '   ' } },
      { type: 'stale_assumption', claim: 'has quote', evidence: { from: 'assistant#3', quote: '没有测试环境' } },
    ],
  }))
  assert.equal(outcome.ok, true)
  if (!outcome.ok) return
  assert.equal(outcome.result.alignment.length, 1)
  assert.equal(outcome.result.alignment[0].type, 'stale_assumption')
  assert.ok(outcome.warnings.some(warning => warning.includes('without evidence.quote')))
})

test('fills defaults for missing fields and tolerates string convenience fields', () => {
  const outcome = parseUpliftResponse(JSON.stringify({
    kind: 'question',
    rewrite: '接口在哪个文件？',
    task: '确认接口文件',
    constraints: ['不要猜路径'],
    no_uplift: true,
  }))
  assert.equal(outcome.ok, true)
  if (!outcome.ok) return
  assert.deepEqual(outcome.result.alignment, [])
  assert.deepEqual(outcome.result.task, { text: '确认接口文件', source: 'draft' })
  assert.deepEqual(outcome.result.constraints, [{ text: '不要猜路径', source: 'draft', applied_in_rewrite: false }])
  assert.deepEqual(outcome.result.signals, [])
  assert.deepEqual(outcome.result.unknowns, [])
  assert.equal(outcome.result.no_uplift, true)
})

test('unknown kind falls back to question with a warning', () => {
  const outcome = parseUpliftResponse(JSON.stringify({ kind: 'essay', rewrite: 'hi' }))
  assert.equal(outcome.ok, true)
  if (!outcome.ok) return
  assert.equal(outcome.result.kind, 'question')
  assert.ok(outcome.warnings.some(warning => warning.includes('unknown kind')))
})

test('rejects empty and non-JSON output', () => {
  assert.equal(parseUpliftResponse('   ').ok, false)
  assert.equal(parseUpliftResponse('Sorry, I cannot do that.').ok, false)
  assert.equal(parseUpliftResponse('{not valid json').ok, false)
  assert.equal(parseUpliftResponse('{"foo":"bar"}').ok, false)
})

test('unstructured fallback preserves plain text and marks itself', () => {
  const result = createUnstructuredResult('  A plain rewrite from the model.  ')
  assert.equal(result.unstructured, true)
  assert.equal(result.rewrite, 'A plain rewrite from the model.')
  assert.deepEqual(result.alignment, [])
  assert.equal(result.no_uplift, false)
})

test('mock result is deterministic, labelled, and has no invented checks', () => {
  const draft = '帮我改登录页\n加一个错误提示'
  const first = createMockResult(draft)
  const second = createMockResult(draft)
  assert.deepEqual(first, second)
  assert.equal(first.mock, true)
  assert.equal(first.kind, 'new_goal')
  assert.match(first.rewrite, /帮我改登录页\n\n加一个错误提示/)
  assert.match(first.rewrite, /（mock）$/)
  assert.deepEqual(first.alignment, [])
  assert.equal(first.task.text, '')
  assert.deepEqual(first.constraints, [])
  assert.deepEqual(first.signals, [])
})

test('mock result does not append the marker twice', () => {
  const first = createMockResult('hello')
  const second = createMockResult(first.rewrite)
  assert.equal((second.rewrite.match(/（mock）/g) ?? []).length, 1)
})

test('alignment adoption_text is parsed and missing values default to empty', () => {
  const raw = JSON.stringify({
    kind: 'continue',
    rewrite: 'A rewrite.',
    alignment: [{
      type: 'duplicate',
      severity: 'low',
      claim: 'Looks duplicated.',
      evidence: { from: 'assistant#1', quote: 'Already answered.' },
      suggestion: 'Ask whether the earlier answer is what you need.',
      adoption_text: '如果上一条已经回答过，请先确认那是否就是你要的答案。',
      applied_in_rewrite: false,
    }, {
      type: 'stale_assumption',
      severity: 'medium',
      claim: 'Assumes X.',
      evidence: { from: 'assistant#1', quote: 'X was rejected.' },
      suggestion: 'Mention X was rejected.',
      applied_in_rewrite: false,
    }],
    task: { text: '', source: 'draft' },
    constraints: [],
    signals: [],
    brief: { purpose: '', acceptance: '', chain: '' },
    assumptions: [],
    unknowns: [],
    inferred_in_rewrite: [],
    no_uplift: false,
    reason: '',
  })
  const parsed = parseUpliftResponse(raw)
  assert.equal(parsed.ok, true)
  if (!parsed.ok) return
  assert.equal(parsed.result.alignment[0].adoption_text, '如果上一条已经回答过，请先确认那是否就是你要的答案。')
  assert.equal(parsed.result.alignment[1].adoption_text, '')
})
