import assert from 'node:assert/strict'
import test from 'node:test'
import { composeFinalText } from '../src/host/compose.ts'

const result = {
  rewrite: '继续做 D3 时，美术规范要遵循：战前 7 选 4、7 职业/7 英雄、5 类敌人、10 波表、种子日志这些新增内容，UI 和素材都按现有美术规范来，不要另起风格。',
  task: { text: '继续 D3，并遵循美术规范', source: 'draft' },
  constraints: [{ text: '需要遵循美术规范', source: 'draft', applied_in_rewrite: true }],
  signals: [],
}

test('replace uses only the rewrite when no chip is checked', () => {
  const text = composeFinalText(result, { task: false, constraints: [false], signals: [] }, 'zh')
  assert.equal(text, result.rewrite.trim())
  assert.doesNotMatch(text, /本次任务：|需要保持的约束：/)
})

test('checked chips already expressed by the rewrite are not appended again', () => {
  const text = composeFinalText(result, { task: true, constraints: [true], signals: [] }, 'zh')
  assert.equal(text, result.rewrite.trim())
  assert.doesNotMatch(text, /另外，/)
  assert.doesNotMatch(text, /本次任务：|需要保持的约束：/)
})

test('a genuinely missing checked constraint is appended as a natural sentence', () => {
  const withMissing = {
    ...result,
    constraints: [{ text: '发布前跑一遍回归测试', source: 'draft', applied_in_rewrite: false }],
  }
  const text = composeFinalText(withMissing, { task: false, constraints: [true], signals: [] }, 'zh')
  assert.equal(text, `${result.rewrite.trim()}\n\n另外，发布前跑一遍回归测试。`)
  assert.doesNotMatch(text, /需要保持的约束：|本次任务：/)
})

test('english composition uses a natural lead-in as well', () => {
  const english = {
    rewrite: 'Continue D3 and keep the existing art direction.',
    task: { text: 'Continue D3', source: 'draft' },
    constraints: [{ text: 'Run the regression suite', source: 'draft', applied_in_rewrite: false }],
    signals: [],
  }
  const text = composeFinalText(english, { task: false, constraints: [true], signals: [] }, 'en')
  assert.equal(text, `${english.rewrite}\n\nAlso, Run the regression suite.`)
})
