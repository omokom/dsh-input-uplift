/**
 * Pure composition of the final message that replaces the composer.
 *
 * Kept import-free so it can be unit-tested directly by Node's test runner.
 * The rewrite is the message; checked chips are opt-in and only appended when
 * the rewrite does not already express them. Appended items use one natural
 * sentence ("Also, …"), never field labels such as “本次任务：”.
 */

export interface ComposeChipSelection {
  task: boolean
  constraints: boolean[]
  signals: boolean[]
}

export interface ComposeResult {
  rewrite: string
  task?: { text?: string }
  constraints?: ReadonlyArray<{ text?: string }>
  signals?: ReadonlyArray<string>
}

const EXTRA_LEAD_IN = { zh: '另外，', en: 'Also, ' }
const CLAUSE_SEPARATOR = { zh: '；', en: '; ' }

function normalized(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase()
}

/** Tokens used for the “already said in the rewrite” check: words + CJK bigrams. */
function textTokens(value: string): string[] {
  const lower = value.toLowerCase()
  const tokens: string[] = []
  for (const word of lower.match(/[a-z0-9][a-z0-9._-]*/g) ?? []) tokens.push(word)
  for (const run of lower.match(/[\u3400-\u9fff]+/g) ?? []) {
    if (run.length <= 2) {
      tokens.push(run)
      continue
    }
    for (let index = 0; index < run.length - 1; index += 1) tokens.push(run.slice(index, index + 2))
  }
  return tokens
}

/**
 * True when the rewrite already expresses the chip: an exact normalized match,
 * or at least 60% of its tokens (CJK bigrams / words) occur in the rewrite.
 * This keeps summaries like “继续 D3，并遵循美术规范” from being appended to a
 * rewrite that already says “继续做 D3 … 都按现有美术规范来”.
 */
export function alreadyPresent(base: string, candidate: string): boolean {
  if (candidate.trim() === '') return true
  const compactBase = normalized(base).replace(/\s+/g, '')
  if (compactBase.includes(normalized(candidate).replace(/\s+/g, ''))) return true
  const tokens = textTokens(candidate)
  if (tokens.length === 0) return true
  let hits = 0
  for (const token of tokens) if (compactBase.includes(token)) hits += 1
  return hits / tokens.length >= 0.6
}

export function composeFinalText(
  result: ComposeResult,
  selection: ComposeChipSelection,
  locale: 'zh' | 'en',
): string {
  const base = result.rewrite.trim()
  if (base === '') return ''

  const missing: string[] = []
  const taskText = result.task?.text?.trim() ?? ''
  if (selection.task && taskText !== '' && !alreadyPresent(base, taskText)) missing.push(taskText)
  for (const [index, item] of (result.constraints ?? []).entries()) {
    const text = item.text?.trim() ?? ''
    if (selection.constraints[index] === true && text !== '' && !alreadyPresent(base, text)) missing.push(text)
  }
  for (const [index, item] of (result.signals ?? []).entries()) {
    const text = item.trim()
    if (selection.signals[index] === true && text !== '' && !alreadyPresent(base, text)) missing.push(text)
  }

  const unique = [...new Set(missing)]
  if (unique.length === 0) return base
  const joined = unique.join(CLAUSE_SEPARATOR[locale])
  return `${base}\n\n${EXTRA_LEAD_IN[locale]}${joined}${locale === 'zh' ? '。' : '.'}`
}
