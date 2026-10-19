/** Tiny zh/en translation layer with optional host-locale mirroring. */
import { useSyncExternalStore } from 'react'

export type Locale = 'zh' | 'en'

export const LOCALE_NS = '@local/dsh-input-uplift'

type Dictionary = Record<string, string>

const zh: Dictionary = {
  'trigger.label': '升维',
  'trigger.title': '升维这条草稿',
  'trigger.shortcut': '快捷键：{shortcut}',
  'trigger.empty': '先输入一些草稿',
  'trigger.busy': '正在生成升维预览',
  'trigger.phase': '当前输入状态不可用',

  'panel.title': '升维预览',
  'sidebar.title': '升维结果',
  'sidebar.empty': '这里会显示升维结果',
  'sidebar.emptyHint': '在输入框写草稿后点「生成升维」；也可以关掉本页回到浮层模式。',
  'sidebar.generate': '生成升维',
  'sidebar.close': '关闭侧栏页',
  'panel.close': '关闭',
  'panel.dock': '在侧边打开',
  'panel.undock': '贴回输入框',
  'panel.stop': '停止',
  'panel.generating': '正在对照最近上下文升维…',
  'panel.generatingHint': '生成期间可以继续输入；结果会以生成时的草稿版本为准。',
  'panel.staleTitle': '草稿已变化',
  'panel.staleBody': '生成后输入框内容已修改，已禁止替换。请按当前草稿重新生成。',
  'panel.errorTitle': '升维失败',
  'panel.retry': '重试',
  'panel.unstructured': '模型返回了非结构化文本，请核对后再决定是否替换。',
  'options.title': '结果选项',
  'options.balanced': '平衡',
  'options.balancedHint': '平衡呈现多种合理方案/解读与各自取舍，不只推一条路线',
  'options.detailed': '详尽',
  'options.detailedHint': '更完整覆盖目的、任务链、约束、验收信号与风险，不注水',
  'options.hint': '在下次生成（重新生成）时生效',
  'supplement.title': '补充',
  'supplement.placeholder': '在升维结果基础上继续补充内容，例如：再强调一下不要改动登录逻辑',
  'supplement.hint': '可直接附加到改写，或带着补充重新生成',
  'supplement.apply': '附加到改写',
  'supplement.undo': '撤销附加',
  'supplement.regenerate': '按补充重生成',
  'supplement.applied': '已附加',
  'settings.open': '设置',
  'settings.title': '升维设置',
  'settings.hint': '下次生成生效',
  'settings.detailLevel': '详细程度',
  'settings.detail.concise': '简洁',
  'settings.detail.standard': '标准',
  'settings.detail.detailed': '详尽',
  'settings.balanced': '平衡',
  'settings.balancedHint': '多种方案/解读时平衡呈现利弊',
  'settings.display': '展示方式',
  'settings.display.overlay': '浮层（输入框上方）',
  'settings.display.side': '侧边栏（右侧打开）',
  'settings.displayHint': '侧边栏不遮挡输入框，便于对照对话记录',
  'settings.model': '模型',
  'settings.modelFollow': '跟随会话模型',
  'settings.modelLoading': '加载模型…',
  'settings.modelEmpty': '暂无模型目录',
  'settings.auto': '自动升维',
  'settings.autoOff': '关闭',
  'settings.autoUnit': '秒后自动升维（0=关闭）',
  'settings.autoHint': '输入停下后触发；可填 0–120 秒',
  'panel.mock': '本地 mock',
  'panel.noUplift': '这条草稿不需要升维',
  'panel.onlyReminder': '只提醒，不改写',
  'panel.sourceNote': '未点“替换输入框”前，输入框不会改变。',
  'panel.readonlyReplaced': '已替换输入框',
  'panel.restoreUnavailable': '替换后草稿又被修改，已隐藏“恢复原文”。',
  'panel.attachmentNote': '附件 {count} 个会保留。',
  'panel.replaceError': '替换失败：{message}',
  'panel.chipWarningTitle': '草稿包含引用标记',
  'panel.chipWarningBody': '含 @ 引用时无法做无副作用的整稿替换。确认后会用 setDraft 写入：引用标记会被移除，附件保留；「恢复原文」也只能恢复文字，原引用标记不会恢复。',
  'panel.confirmRemoveRefs': '确认移除引用并替换',
  'panel.cancel': '取消',
  'panel.closeAndKeep': '先不替换',
  'panel.understanding': '理解摘要',
  'brief.scope': '范围：{text}',
  'brief.approach': '约束落地：{text}',

  'kind.new_goal': '新目标',
  'kind.continue': '延续',
  'kind.choose_confirm': '确认选择',
  'kind.scope_change': '范围变化',
  'kind.challenge': '质疑',
  'kind.question': '纯询问',

  'alignment.title': '对齐检查（{count}）',
  'alignment.conflict': '冲突',
  'alignment.duplicate': '重复',
  'alignment.overrides_confirmed': '改变已确认项',
  'alignment.stale_assumption': '过时假设',
  'alignment.severity.high': '高',
  'alignment.severity.medium': '中',
  'alignment.severity.low': '低',
  'alignment.evidence': '依据：{from}',
  'alignment.suggestion': '建议：{text}',
  'alignment.adopt': '采纳',
  'alignment.adopted': '已采纳',
  'alignment.ignore': '忽略',
  'alignment.ignoredCount': '已忽略 {count} 条',
  'alignment.note': '只依据引用的上下文原文；没有原文依据的发现已被丢弃。',
  'alignment.select': '选择用于批量采纳',
  'alignment.adoptSelected': '统一采纳（{count}）',
  'alignment.adoptedCount': '已采纳 {count} 条',
  'alignment.undoAdoptions': '撤销采纳',

  'rewrite.title': '改写正文',
  'rewrite.empty': '模型没有给出可直接替换的正文。',
  'rewrite.emptyReminder': '只发现了需要确认的问题，没有可直接替换的正文。',
  'rewrite.safe': '安全版',

  'chips.title': '约束 / 信号',
  'chips.hint': '默认不勾选；勾选后，正文里还没有的项会以「另外，…」补进替换文本；标「已在正文」的项不会重复添加。',
  'chips.task': '本次任务',
  'chips.constraint': '约束',
  'chips.signal': '成立信号',
  'chips.source.context': '来自上下文',
  'chips.source.draft': '来自草稿',
  'chips.none': '没有需要补充的约束或信号。',
  'chips.covered': '已在正文',
  'chips.coveredHint': '正文已经包含这一项，勾选不会改变替换结果。',

  'inference.title': '推断与未知',
  'inference.summary': '{inferred} 条推断 · {unknowns} 个未知',
  'inference.assumptions': '推断',
  'inference.unknowns': '未知',
  'inference.inferred': '已写入正文的推断',
  'inference.reversible': '可反转',
  'inference.irreversible': '不可反转',
  'inference.consequence': '若不对：{text}',
  'inference.none': '没有额外推断或未知。',

  'actions.replace': '替换输入框',
  'actions.regenerate': '重新生成',
  'actions.regenerateNew': '按新草稿重生成',
  'actions.restore': '恢复原文',
  'actions.close': '关闭',
  'actions.cancel': '取消',

  'compose.task': '本次任务：{text}',
  'compose.constraints': '需要保持的约束：{text}',
  'compose.signals': '成立信号：{text}',
  'compose.extra': '另外，{text}。',

  'error.SESSION_NOT_LIVE': '当前会话不在运行中，请重新打开会话后重试。',
  'error.NO_MODEL': '当前会话未配置可用模型；可在插件配置中指定 provider/model。',
  'error.LLM_UNAVAILABLE': '模型服务不可用。',
  'error.LLM_TIMEOUT': '生成超时，请重试。',
  'error.LLM_ABORTED': '生成已取消。',
  'error.RATE_LIMIT': '模型触发限流，请稍后再试。',
  'error.EMPTY_RESPONSE': '模型没有返回正文内容（可能被推理占满输出预算；已放大预算自动重试过一次）。可点「重新生成」再试。',
  'error.CONTEXT_UNAVAILABLE': '无法读取会话上下文。',
  'error.NETWORK': '请求宿主失败，请检查连接。',
  'error.BAD_RESPONSE': '宿主返回了无法识别的结果。',
  'error.DRAFT_TOO_LONG': '草稿太长，请缩短后再试。',
  'error.REPLACE_REJECTED': '输入框在生成后又发生变化，替换被拒绝。',
  'error.RESTORE_REJECTED': '草稿已变化，恢复被拒绝。',
  'error.AUTH': '模型凭据鉴权失败，请在 DSH 模型设置中检查。',
  'error.MISSING_CREDENTIAL': '模型服务缺少凭据，请在 DSH 模型设置中检查。',
  'error.INVALID_CREDENTIAL': '模型凭据无效，请在 DSH 模型设置中检查。',
  'error.QUOTA': '模型额度不足，请检查账户额度。',
  'error.ACCOUNT_QUOTA': '模型账户额度不足，请检查账户额度。',
  'error.CONTEXT_WINDOW_EXCEEDED': '上下文超出模型窗口，请缩短草稿后重试。',
  'error.NO_ADAPTER': '当前 provider 没有可用的模型适配器。',
  'error.ABORTED': '生成已取消。',
  'error.INVALID_BODY': '请求体无效。',
  'error.INVALID_CONTENT_TYPE': '请求必须使用 application/json。',
  'error.REQUEST_TOO_LARGE': '请求体超过 64 KiB。',
  'error.INVALID_SESSION_ID': '缺少有效的 sessionId。',
  'error.HTTP_401': '宿主鉴权失败，请刷新页面或重新登录 DSH。',
  'error.HTTP_403': '宿主拒绝了请求（登录或 Origin/Host 校验失败），请从当前 DSH 页面重试。',
  'error.HTTP_404': '未找到升维路由；请确认宿主半已加载并重启桌面端。',
  'error.HTTP_500': '宿主内部错误。',
  'error.UNKNOWN': '发生未知错误。',
}

const en: Dictionary = {
  'trigger.label': 'Uplift',
  'trigger.title': 'Uplift this draft',
  'trigger.shortcut': 'Shortcut: {shortcut}',
  'trigger.empty': 'Type a draft first',
  'trigger.busy': 'Generating uplift preview',
  'trigger.phase': 'Input is not available right now',

  'panel.title': 'Uplift preview',
  'sidebar.title': 'Uplift result',
  'sidebar.empty': 'The uplift result appears here',
  'sidebar.emptyHint': 'Write a draft in the composer and press “Generate uplift”, or close this page to use the floating card.',
  'sidebar.generate': 'Generate uplift',
  'sidebar.close': 'Close sidebar page',
  'panel.close': 'Close',
  'panel.dock': 'Open at the side',
  'panel.undock': 'Dock above composer',
  'panel.stop': 'Stop',
  'panel.generating': 'Checking the recent context and uplifting…',
  'panel.generatingHint': 'Keep editing while this runs; the result is tied to the draft revision it started with.',
  'panel.staleTitle': 'Draft changed',
  'panel.staleBody': 'The composer changed after generation, so replacement is disabled. Regenerate from the current draft.',
  'panel.errorTitle': 'Uplift failed',
  'panel.retry': 'Retry',
  'panel.unstructured': 'The model returned unstructured text. Review it before replacing.',
  'options.title': 'Result options',
  'options.balanced': 'Balanced',
  'options.balancedHint': 'Present competing valid options/readings with their trade-offs, not one route only',
  'options.detailed': 'Detailed',
  'options.detailedHint': 'Cover goal, task chain, constraints, acceptance signals and risks more fully, without padding',
  'options.hint': 'applies on the next generation (Regenerate)',
  'supplement.title': 'Supplement',
  'supplement.placeholder': 'Add to the uplifted result, e.g. also stress that the login flow must not change',
  'supplement.hint': 'append it to the rewrite, or regenerate with it',
  'supplement.apply': 'Append to rewrite',
  'supplement.undo': 'Undo append',
  'supplement.regenerate': 'Regenerate with supplement',
  'supplement.applied': 'appended',
  'settings.open': 'Settings',
  'settings.title': 'Uplift settings',
  'settings.hint': 'applies on the next generation',
  'settings.detailLevel': 'Detail',
  'settings.detail.concise': 'Concise',
  'settings.detail.standard': 'Standard',
  'settings.detail.detailed': 'Detailed',
  'settings.balanced': 'Balanced',
  'settings.balancedHint': 'show trade-offs when several readings are valid',
  'settings.display': 'Display',
  'settings.display.overlay': 'Floating above composer',
  'settings.display.side': 'Side drawer (right)',
  'settings.displayHint': 'the side drawer leaves the composer free and keeps the transcript visible',
  'settings.model': 'Model',
  'settings.modelFollow': 'Follow session model',
  'settings.modelLoading': 'Loading models…',
  'settings.modelEmpty': 'No model catalog',
  'settings.auto': 'Auto uplift',
  'settings.autoOff': 'Off',
  'settings.autoUnit': 'seconds after idle (0 = off)',
  'settings.autoHint': 'fires after typing pauses; 0–120 seconds',
  'panel.mock': 'local mock',
  'panel.noUplift': 'No uplift needed for this draft',
  'panel.onlyReminder': 'Reminder only',
  'panel.sourceNote': 'The composer is untouched until you click Replace.',
  'panel.readonlyReplaced': 'Composer replaced',
  'panel.restoreUnavailable': 'The draft changed after replacement; Restore original is hidden.',
  'panel.attachmentNote': '{count} attachment(s) will be kept.',
  'panel.replaceError': 'Replace failed: {message}',
  'panel.chipWarningTitle': 'The draft contains references',
  'panel.chipWarningBody': 'A whole-draft insertText span cannot preserve @ reference chips. Confirming uses setDraft: reference marks are removed, attachments are kept. Restore original recovers text only; the original reference marks are not restored.',
  'panel.confirmRemoveRefs': 'Remove references and replace',
  'panel.cancel': 'Cancel',
  'panel.closeAndKeep': 'Keep draft',
  'panel.understanding': 'Understanding',
  'brief.scope': 'Scope: {text}',
  'brief.approach': 'How constraints apply: {text}',

  'kind.new_goal': 'New goal',
  'kind.continue': 'Continue',
  'kind.choose_confirm': 'Choose / confirm',
  'kind.scope_change': 'Scope change',
  'kind.challenge': 'Challenge',
  'kind.question': 'Question',

  'alignment.title': 'Alignment check ({count})',
  'alignment.conflict': 'Conflict',
  'alignment.duplicate': 'Duplicate',
  'alignment.overrides_confirmed': 'Changes confirmed item',
  'alignment.stale_assumption': 'Stale assumption',
  'alignment.severity.high': 'high',
  'alignment.severity.medium': 'medium',
  'alignment.severity.low': 'low',
  'alignment.evidence': 'Evidence: {from}',
  'alignment.suggestion': 'Suggestion: {text}',
  'alignment.adopt': 'Adopt',
  'alignment.adopted': 'Adopted',
  'alignment.ignore': 'Ignore',
  'alignment.ignoredCount': '{count} ignored',
  'alignment.note': 'Only quoted context is used; findings without a quote are dropped.',
  'alignment.select': 'Select for batch adoption',
  'alignment.adoptSelected': 'Adopt selected ({count})',
  'alignment.adoptedCount': '{count} adopted',
  'alignment.undoAdoptions': 'Undo adoptions',

  'rewrite.title': 'Rewritten message',
  'rewrite.empty': 'The model did not produce a directly replaceable message.',
  'rewrite.emptyReminder': 'Only issues needing confirmation were found; there is no replacement text.',
  'rewrite.safe': 'Safe version',

  'chips.title': 'Constraints / signals',
  'chips.hint': 'Unchecked by default. Checked items missing from the rewrite are appended as an “Also, …” sentence; items marked “already in rewrite” are not duplicated.',
  'chips.task': 'Task',
  'chips.constraint': 'Constraint',
  'chips.signal': 'Success signal',
  'chips.source.context': 'from context',
  'chips.source.draft': 'from draft',
  'chips.none': 'No additional constraints or signals.',
  'chips.covered': 'already in rewrite',
  'chips.coveredHint': 'The rewrite already contains this item; checking it would not change the replacement.',

  'inference.title': 'Inferences and unknowns',
  'inference.summary': '{inferred} inference(s) · {unknowns} unknown(s)',
  'inference.assumptions': 'Inferences',
  'inference.unknowns': 'Unknowns',
  'inference.inferred': 'Inferences written into the rewrite',
  'inference.reversible': 'reversible',
  'inference.irreversible': 'not reversible',
  'inference.consequence': 'If wrong: {text}',
  'inference.none': 'No additional inferences or unknowns.',

  'actions.replace': 'Replace composer',
  'actions.regenerate': 'Regenerate',
  'actions.regenerateNew': 'Regenerate from changed draft',
  'actions.restore': 'Restore original',
  'actions.close': 'Close',
  'actions.cancel': 'Cancel',

  'compose.task': 'Task: {text}',
  'compose.constraints': 'Constraints to keep: {text}',
  'compose.signals': 'Success signals: {text}',
  'compose.extra': 'Also, {text}.',

  'error.SESSION_NOT_LIVE': 'The session is no longer live. Reopen it and try again.',
  'error.NO_MODEL': 'No provider/model is configured for this session. Set provider/model in the plugin config.',
  'error.LLM_UNAVAILABLE': 'The model service is unavailable.',
  'error.LLM_TIMEOUT': 'Generation timed out. Try again.',
  'error.LLM_ABORTED': 'Generation was cancelled.',
  'error.RATE_LIMIT': 'The model is rate-limited. Try again shortly.',
  'error.EMPTY_RESPONSE': 'The model returned no text (reasoning may have consumed the output budget; retried once with a larger budget). Try Regenerate.',
  'error.CONTEXT_UNAVAILABLE': 'Could not read the session context.',
  'error.NETWORK': 'The host request failed. Check the connection.',
  'error.BAD_RESPONSE': 'The host returned an unrecognized result.',
  'error.DRAFT_TOO_LONG': 'The draft is too long. Shorten it and try again.',
  'error.REPLACE_REJECTED': 'The composer changed after generation, so replacement was rejected.',
  'error.RESTORE_REJECTED': 'The draft changed, so restore was rejected.',
  'error.AUTH': 'Model credential authentication failed. Check the DSH model settings.',
  'error.MISSING_CREDENTIAL': 'The model service has no credentials. Check the DSH model settings.',
  'error.INVALID_CREDENTIAL': 'The model credentials are invalid. Check the DSH model settings.',
  'error.QUOTA': 'The model quota is exhausted. Check the account quota.',
  'error.ACCOUNT_QUOTA': 'The model account quota is exhausted. Check the account quota.',
  'error.CONTEXT_WINDOW_EXCEEDED': 'The context exceeds the model window. Shorten the draft and retry.',
  'error.NO_ADAPTER': 'No model adapter is available for this provider.',
  'error.ABORTED': 'Generation was cancelled.',
  'error.INVALID_BODY': 'Invalid request body.',
  'error.INVALID_CONTENT_TYPE': 'The request must use application/json.',
  'error.REQUEST_TOO_LARGE': 'The request body exceeds 64 KiB.',
  'error.INVALID_SESSION_ID': 'A valid sessionId is required.',
  'error.HTTP_401': 'Host authentication failed. Refresh the page or sign in to DSH again.',
  'error.HTTP_403': 'The host rejected the request (login or Origin/Host check). Retry from this DSH page.',
  'error.HTTP_404': 'Uplift route not found; confirm the host half is loaded and restart the desktop app.',
  'error.HTTP_500': 'Host internal error.',
  'error.UNKNOWN': 'An unknown error occurred.',
}

export const DICTIONARIES: Readonly<Record<Locale, Dictionary>> = { zh, en }

function normalizeLocale(value: unknown): Locale {
  return typeof value === 'string' && value.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

function browserLocale(): Locale {
  if (typeof document !== 'undefined') {
    const htmlLang = document.documentElement?.lang
    if (typeof htmlLang === 'string' && htmlLang !== '') return normalizeLocale(htmlLang)
  }
  if (typeof navigator !== 'undefined') return normalizeLocale(navigator.language)
  return 'zh'
}

let activeLocale: Locale = browserLocale()
const localeListeners = new Set<() => void>()

export function getLocale(): Locale {
  return activeLocale
}

export function setLocale(value: unknown): void {
  const next = normalizeLocale(value)
  if (next === activeLocale) return
  activeLocale = next
  for (const listener of [...localeListeners]) listener()
}

function subscribeLocale(listener: () => void): () => void {
  localeListeners.add(listener)
  return () => localeListeners.delete(listener)
}

export function useLocale(): Locale {
  return useSyncExternalStore(subscribeLocale, getLocale, getLocale)
}

export function translate(locale: Locale, key: string, params?: Record<string, string | number>): string {
  const template = DICTIONARIES[locale][key] ?? DICTIONARIES.en[key] ?? key
  if (params === undefined) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name]
    return value === undefined ? match : String(value)
  })
}

export function t(locale: Locale, key: string, params?: Record<string, string | number>): string {
  return translate(locale, key, params)
}

export function errorText(locale: Locale, code: string | undefined, fallback: string | undefined): string {
  if (code !== undefined) {
    const localized = t(locale, `error.${code}`)
    if (localized !== `error.${code}`) return localized
  }
  return fallback !== undefined && fallback.trim() !== '' ? fallback : t(locale, 'error.UNKNOWN')
}
