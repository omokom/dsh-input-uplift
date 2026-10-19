window.__ModuleLoader__.load({ id: "@local/dsh-input-uplift", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
let react = require("react");
let react_jsx_runtime = require("react/jsx-runtime");

//#region src/client/composition.ts
/** IME composition guard shared by the trigger and every replacement action. */
let composing = false;
function isComposingNow() {
	if (typeof document === "undefined") return false;
	if (composing) return true;
	return document.querySelector("[data-composer-composing]") !== null;
}
function useComposing() {
	const [state, setState] = (0, react.useState)(() => isComposingNow());
	(0, react.useEffect)(() => {
		const onStart = () => {
			composing = true;
			setState(true);
		};
		const onEnd = () => {
			composing = false;
			setState(false);
		};
		document.addEventListener("compositionstart", onStart, true);
		document.addEventListener("compositionend", onEnd, true);
		return () => {
			document.removeEventListener("compositionstart", onStart, true);
			document.removeEventListener("compositionend", onEnd, true);
		};
	}, []);
	return state;
}

//#endregion
//#region src/client/i18n.ts
/** Tiny zh/en translation layer with optional host-locale mirroring. */
const LOCALE_NS = "@local/dsh-input-uplift";
const zh = {
	"trigger.label": "升维",
	"trigger.title": "升维这条草稿",
	"trigger.shortcut": "快捷键：{shortcut}",
	"trigger.empty": "先输入一些草稿",
	"trigger.busy": "正在生成升维预览",
	"trigger.phase": "当前输入状态不可用",
	"panel.title": "升维预览",
	"sidebar.title": "升维结果",
	"sidebar.empty": "这里会显示升维结果",
	"sidebar.emptyHint": "在输入框写草稿后点「生成升维」；也可以关掉本页回到浮层模式。",
	"sidebar.generate": "生成升维",
	"sidebar.close": "关闭侧栏页",
	"panel.close": "关闭",
	"panel.dock": "在侧边打开",
	"panel.undock": "贴回输入框",
	"panel.stop": "停止",
	"panel.generating": "正在对照最近上下文升维…",
	"panel.generatingHint": "生成期间可以继续输入；结果会以生成时的草稿版本为准。",
	"panel.staleTitle": "草稿已变化",
	"panel.staleBody": "生成后输入框内容已修改，已禁止替换。请按当前草稿重新生成。",
	"panel.errorTitle": "升维失败",
	"panel.retry": "重试",
	"panel.unstructured": "模型返回了非结构化文本，请核对后再决定是否替换。",
	"options.title": "结果选项",
	"options.balanced": "平衡",
	"options.balancedHint": "平衡呈现多种合理方案/解读与各自取舍，不只推一条路线",
	"options.detailed": "详尽",
	"options.detailedHint": "更完整覆盖目的、任务链、约束、验收信号与风险，不注水",
	"options.hint": "在下次生成（重新生成）时生效",
	"supplement.title": "补充",
	"supplement.placeholder": "在升维结果基础上继续补充内容，例如：再强调一下不要改动登录逻辑",
	"supplement.hint": "可直接附加到改写，或带着补充重新生成",
	"supplement.apply": "附加到改写",
	"supplement.undo": "撤销附加",
	"supplement.regenerate": "按补充重生成",
	"supplement.applied": "已附加",
	"settings.open": "设置",
	"settings.title": "升维设置",
	"settings.hint": "下次生成生效",
	"settings.detailLevel": "详细程度",
	"settings.detail.concise": "简洁",
	"settings.detail.standard": "标准",
	"settings.detail.detailed": "详尽",
	"settings.balanced": "平衡",
	"settings.balancedHint": "多种方案/解读时平衡呈现利弊",
	"settings.display": "展示方式",
	"settings.display.overlay": "浮层（输入框上方）",
	"settings.display.side": "侧边栏（右侧打开）",
	"settings.displayHint": "侧边栏不遮挡输入框，便于对照对话记录",
	"settings.model": "模型",
	"settings.modelFollow": "跟随会话模型",
	"settings.modelLoading": "加载模型…",
	"settings.modelEmpty": "暂无模型目录",
	"settings.auto": "自动升维",
	"settings.autoOff": "关闭",
	"settings.autoUnit": "秒后自动升维（0=关闭）",
	"settings.autoHint": "输入停下后触发；可填 0–120 秒",
	"panel.mock": "本地 mock",
	"panel.noUplift": "这条草稿不需要升维",
	"panel.onlyReminder": "只提醒，不改写",
	"panel.sourceNote": "未点“替换输入框”前，输入框不会改变。",
	"panel.readonlyReplaced": "已替换输入框",
	"panel.restoreUnavailable": "替换后草稿又被修改，已隐藏“恢复原文”。",
	"panel.attachmentNote": "附件 {count} 个会保留。",
	"panel.replaceError": "替换失败：{message}",
	"panel.chipWarningTitle": "草稿包含引用标记",
	"panel.chipWarningBody": "含 @ 引用时无法做无副作用的整稿替换。确认后会用 setDraft 写入：引用标记会被移除，附件保留；「恢复原文」也只能恢复文字，原引用标记不会恢复。",
	"panel.confirmRemoveRefs": "确认移除引用并替换",
	"panel.cancel": "取消",
	"panel.closeAndKeep": "先不替换",
	"panel.understanding": "理解摘要",
	"brief.scope": "范围：{text}",
	"brief.approach": "约束落地：{text}",
	"kind.new_goal": "新目标",
	"kind.continue": "延续",
	"kind.choose_confirm": "确认选择",
	"kind.scope_change": "范围变化",
	"kind.challenge": "质疑",
	"kind.question": "纯询问",
	"alignment.title": "对齐检查（{count}）",
	"alignment.conflict": "冲突",
	"alignment.duplicate": "重复",
	"alignment.overrides_confirmed": "改变已确认项",
	"alignment.stale_assumption": "过时假设",
	"alignment.severity.high": "高",
	"alignment.severity.medium": "中",
	"alignment.severity.low": "低",
	"alignment.evidence": "依据：{from}",
	"alignment.suggestion": "建议：{text}",
	"alignment.adopt": "采纳",
	"alignment.adopted": "已采纳",
	"alignment.ignore": "忽略",
	"alignment.ignoredCount": "已忽略 {count} 条",
	"alignment.note": "只依据引用的上下文原文；没有原文依据的发现已被丢弃。",
	"alignment.select": "选择用于批量采纳",
	"alignment.adoptSelected": "统一采纳（{count}）",
	"alignment.adoptedCount": "已采纳 {count} 条",
	"alignment.undoAdoptions": "撤销采纳",
	"rewrite.title": "改写正文",
	"rewrite.empty": "模型没有给出可直接替换的正文。",
	"rewrite.emptyReminder": "只发现了需要确认的问题，没有可直接替换的正文。",
	"rewrite.safe": "安全版",
	"chips.title": "约束 / 信号",
	"chips.hint": "默认不勾选；勾选后，正文里还没有的项会以「另外，…」补进替换文本；标「已在正文」的项不会重复添加。",
	"chips.task": "本次任务",
	"chips.constraint": "约束",
	"chips.signal": "成立信号",
	"chips.source.context": "来自上下文",
	"chips.source.draft": "来自草稿",
	"chips.none": "没有需要补充的约束或信号。",
	"chips.covered": "已在正文",
	"chips.coveredHint": "正文已经包含这一项，勾选不会改变替换结果。",
	"inference.title": "推断与未知",
	"inference.summary": "{inferred} 条推断 · {unknowns} 个未知",
	"inference.assumptions": "推断",
	"inference.unknowns": "未知",
	"inference.inferred": "已写入正文的推断",
	"inference.reversible": "可反转",
	"inference.irreversible": "不可反转",
	"inference.consequence": "若不对：{text}",
	"inference.none": "没有额外推断或未知。",
	"actions.replace": "替换输入框",
	"actions.regenerate": "重新生成",
	"actions.regenerateNew": "按新草稿重生成",
	"actions.restore": "恢复原文",
	"actions.close": "关闭",
	"actions.cancel": "取消",
	"compose.task": "本次任务：{text}",
	"compose.constraints": "需要保持的约束：{text}",
	"compose.signals": "成立信号：{text}",
	"compose.extra": "另外，{text}。",
	"error.SESSION_NOT_LIVE": "当前会话不在运行中，请重新打开会话后重试。",
	"error.NO_MODEL": "当前会话未配置可用模型；可在插件配置中指定 provider/model。",
	"error.LLM_UNAVAILABLE": "模型服务不可用。",
	"error.LLM_TIMEOUT": "生成超时，请重试。",
	"error.LLM_ABORTED": "生成已取消。",
	"error.RATE_LIMIT": "模型触发限流，请稍后再试。",
	"error.EMPTY_RESPONSE": "模型没有返回正文内容（可能被推理占满输出预算；已放大预算自动重试过一次）。可点「重新生成」再试。",
	"error.CONTEXT_UNAVAILABLE": "无法读取会话上下文。",
	"error.NETWORK": "请求宿主失败，请检查连接。",
	"error.BAD_RESPONSE": "宿主返回了无法识别的结果。",
	"error.DRAFT_TOO_LONG": "草稿太长，请缩短后再试。",
	"error.REPLACE_REJECTED": "输入框在生成后又发生变化，替换被拒绝。",
	"error.RESTORE_REJECTED": "草稿已变化，恢复被拒绝。",
	"error.AUTH": "模型凭据鉴权失败，请在 DSH 模型设置中检查。",
	"error.MISSING_CREDENTIAL": "模型服务缺少凭据，请在 DSH 模型设置中检查。",
	"error.INVALID_CREDENTIAL": "模型凭据无效，请在 DSH 模型设置中检查。",
	"error.QUOTA": "模型额度不足，请检查账户额度。",
	"error.ACCOUNT_QUOTA": "模型账户额度不足，请检查账户额度。",
	"error.CONTEXT_WINDOW_EXCEEDED": "上下文超出模型窗口，请缩短草稿后重试。",
	"error.NO_ADAPTER": "当前 provider 没有可用的模型适配器。",
	"error.ABORTED": "生成已取消。",
	"error.INVALID_BODY": "请求体无效。",
	"error.INVALID_CONTENT_TYPE": "请求必须使用 application/json。",
	"error.REQUEST_TOO_LARGE": "请求体超过 64 KiB。",
	"error.INVALID_SESSION_ID": "缺少有效的 sessionId。",
	"error.HTTP_401": "宿主鉴权失败，请刷新页面或重新登录 DSH。",
	"error.HTTP_403": "宿主拒绝了请求（登录或 Origin/Host 校验失败），请从当前 DSH 页面重试。",
	"error.HTTP_404": "未找到升维路由；请确认宿主半已加载并重启桌面端。",
	"error.HTTP_500": "宿主内部错误。",
	"error.UNKNOWN": "发生未知错误。"
};
const en = {
	"trigger.label": "Uplift",
	"trigger.title": "Uplift this draft",
	"trigger.shortcut": "Shortcut: {shortcut}",
	"trigger.empty": "Type a draft first",
	"trigger.busy": "Generating uplift preview",
	"trigger.phase": "Input is not available right now",
	"panel.title": "Uplift preview",
	"sidebar.title": "Uplift result",
	"sidebar.empty": "The uplift result appears here",
	"sidebar.emptyHint": "Write a draft in the composer and press “Generate uplift”, or close this page to use the floating card.",
	"sidebar.generate": "Generate uplift",
	"sidebar.close": "Close sidebar page",
	"panel.close": "Close",
	"panel.dock": "Open at the side",
	"panel.undock": "Dock above composer",
	"panel.stop": "Stop",
	"panel.generating": "Checking the recent context and uplifting…",
	"panel.generatingHint": "Keep editing while this runs; the result is tied to the draft revision it started with.",
	"panel.staleTitle": "Draft changed",
	"panel.staleBody": "The composer changed after generation, so replacement is disabled. Regenerate from the current draft.",
	"panel.errorTitle": "Uplift failed",
	"panel.retry": "Retry",
	"panel.unstructured": "The model returned unstructured text. Review it before replacing.",
	"options.title": "Result options",
	"options.balanced": "Balanced",
	"options.balancedHint": "Present competing valid options/readings with their trade-offs, not one route only",
	"options.detailed": "Detailed",
	"options.detailedHint": "Cover goal, task chain, constraints, acceptance signals and risks more fully, without padding",
	"options.hint": "applies on the next generation (Regenerate)",
	"supplement.title": "Supplement",
	"supplement.placeholder": "Add to the uplifted result, e.g. also stress that the login flow must not change",
	"supplement.hint": "append it to the rewrite, or regenerate with it",
	"supplement.apply": "Append to rewrite",
	"supplement.undo": "Undo append",
	"supplement.regenerate": "Regenerate with supplement",
	"supplement.applied": "appended",
	"settings.open": "Settings",
	"settings.title": "Uplift settings",
	"settings.hint": "applies on the next generation",
	"settings.detailLevel": "Detail",
	"settings.detail.concise": "Concise",
	"settings.detail.standard": "Standard",
	"settings.detail.detailed": "Detailed",
	"settings.balanced": "Balanced",
	"settings.balancedHint": "show trade-offs when several readings are valid",
	"settings.display": "Display",
	"settings.display.overlay": "Floating above composer",
	"settings.display.side": "Side drawer (right)",
	"settings.displayHint": "the side drawer leaves the composer free and keeps the transcript visible",
	"settings.model": "Model",
	"settings.modelFollow": "Follow session model",
	"settings.modelLoading": "Loading models…",
	"settings.modelEmpty": "No model catalog",
	"settings.auto": "Auto uplift",
	"settings.autoOff": "Off",
	"settings.autoUnit": "seconds after idle (0 = off)",
	"settings.autoHint": "fires after typing pauses; 0–120 seconds",
	"panel.mock": "local mock",
	"panel.noUplift": "No uplift needed for this draft",
	"panel.onlyReminder": "Reminder only",
	"panel.sourceNote": "The composer is untouched until you click Replace.",
	"panel.readonlyReplaced": "Composer replaced",
	"panel.restoreUnavailable": "The draft changed after replacement; Restore original is hidden.",
	"panel.attachmentNote": "{count} attachment(s) will be kept.",
	"panel.replaceError": "Replace failed: {message}",
	"panel.chipWarningTitle": "The draft contains references",
	"panel.chipWarningBody": "A whole-draft insertText span cannot preserve @ reference chips. Confirming uses setDraft: reference marks are removed, attachments are kept. Restore original recovers text only; the original reference marks are not restored.",
	"panel.confirmRemoveRefs": "Remove references and replace",
	"panel.cancel": "Cancel",
	"panel.closeAndKeep": "Keep draft",
	"panel.understanding": "Understanding",
	"brief.scope": "Scope: {text}",
	"brief.approach": "How constraints apply: {text}",
	"kind.new_goal": "New goal",
	"kind.continue": "Continue",
	"kind.choose_confirm": "Choose / confirm",
	"kind.scope_change": "Scope change",
	"kind.challenge": "Challenge",
	"kind.question": "Question",
	"alignment.title": "Alignment check ({count})",
	"alignment.conflict": "Conflict",
	"alignment.duplicate": "Duplicate",
	"alignment.overrides_confirmed": "Changes confirmed item",
	"alignment.stale_assumption": "Stale assumption",
	"alignment.severity.high": "high",
	"alignment.severity.medium": "medium",
	"alignment.severity.low": "low",
	"alignment.evidence": "Evidence: {from}",
	"alignment.suggestion": "Suggestion: {text}",
	"alignment.adopt": "Adopt",
	"alignment.adopted": "Adopted",
	"alignment.ignore": "Ignore",
	"alignment.ignoredCount": "{count} ignored",
	"alignment.note": "Only quoted context is used; findings without a quote are dropped.",
	"alignment.select": "Select for batch adoption",
	"alignment.adoptSelected": "Adopt selected ({count})",
	"alignment.adoptedCount": "{count} adopted",
	"alignment.undoAdoptions": "Undo adoptions",
	"rewrite.title": "Rewritten message",
	"rewrite.empty": "The model did not produce a directly replaceable message.",
	"rewrite.emptyReminder": "Only issues needing confirmation were found; there is no replacement text.",
	"rewrite.safe": "Safe version",
	"chips.title": "Constraints / signals",
	"chips.hint": "Unchecked by default. Checked items missing from the rewrite are appended as an “Also, …” sentence; items marked “already in rewrite” are not duplicated.",
	"chips.task": "Task",
	"chips.constraint": "Constraint",
	"chips.signal": "Success signal",
	"chips.source.context": "from context",
	"chips.source.draft": "from draft",
	"chips.none": "No additional constraints or signals.",
	"chips.covered": "already in rewrite",
	"chips.coveredHint": "The rewrite already contains this item; checking it would not change the replacement.",
	"inference.title": "Inferences and unknowns",
	"inference.summary": "{inferred} inference(s) · {unknowns} unknown(s)",
	"inference.assumptions": "Inferences",
	"inference.unknowns": "Unknowns",
	"inference.inferred": "Inferences written into the rewrite",
	"inference.reversible": "reversible",
	"inference.irreversible": "not reversible",
	"inference.consequence": "If wrong: {text}",
	"inference.none": "No additional inferences or unknowns.",
	"actions.replace": "Replace composer",
	"actions.regenerate": "Regenerate",
	"actions.regenerateNew": "Regenerate from changed draft",
	"actions.restore": "Restore original",
	"actions.close": "Close",
	"actions.cancel": "Cancel",
	"compose.task": "Task: {text}",
	"compose.constraints": "Constraints to keep: {text}",
	"compose.signals": "Success signals: {text}",
	"compose.extra": "Also, {text}.",
	"error.SESSION_NOT_LIVE": "The session is no longer live. Reopen it and try again.",
	"error.NO_MODEL": "No provider/model is configured for this session. Set provider/model in the plugin config.",
	"error.LLM_UNAVAILABLE": "The model service is unavailable.",
	"error.LLM_TIMEOUT": "Generation timed out. Try again.",
	"error.LLM_ABORTED": "Generation was cancelled.",
	"error.RATE_LIMIT": "The model is rate-limited. Try again shortly.",
	"error.EMPTY_RESPONSE": "The model returned no text (reasoning may have consumed the output budget; retried once with a larger budget). Try Regenerate.",
	"error.CONTEXT_UNAVAILABLE": "Could not read the session context.",
	"error.NETWORK": "The host request failed. Check the connection.",
	"error.BAD_RESPONSE": "The host returned an unrecognized result.",
	"error.DRAFT_TOO_LONG": "The draft is too long. Shorten it and try again.",
	"error.REPLACE_REJECTED": "The composer changed after generation, so replacement was rejected.",
	"error.RESTORE_REJECTED": "The draft changed, so restore was rejected.",
	"error.AUTH": "Model credential authentication failed. Check the DSH model settings.",
	"error.MISSING_CREDENTIAL": "The model service has no credentials. Check the DSH model settings.",
	"error.INVALID_CREDENTIAL": "The model credentials are invalid. Check the DSH model settings.",
	"error.QUOTA": "The model quota is exhausted. Check the account quota.",
	"error.ACCOUNT_QUOTA": "The model account quota is exhausted. Check the account quota.",
	"error.CONTEXT_WINDOW_EXCEEDED": "The context exceeds the model window. Shorten the draft and retry.",
	"error.NO_ADAPTER": "No model adapter is available for this provider.",
	"error.ABORTED": "Generation was cancelled.",
	"error.INVALID_BODY": "Invalid request body.",
	"error.INVALID_CONTENT_TYPE": "The request must use application/json.",
	"error.REQUEST_TOO_LARGE": "The request body exceeds 64 KiB.",
	"error.INVALID_SESSION_ID": "A valid sessionId is required.",
	"error.HTTP_401": "Host authentication failed. Refresh the page or sign in to DSH again.",
	"error.HTTP_403": "The host rejected the request (login or Origin/Host check). Retry from this DSH page.",
	"error.HTTP_404": "Uplift route not found; confirm the host half is loaded and restart the desktop app.",
	"error.HTTP_500": "Host internal error.",
	"error.UNKNOWN": "An unknown error occurred."
};
const DICTIONARIES = {
	zh,
	en
};
function normalizeLocale(value) {
	return typeof value === "string" && value.toLowerCase().startsWith("zh") ? "zh" : "en";
}
function browserLocale() {
	if (typeof document !== "undefined") {
		const htmlLang = document.documentElement?.lang;
		if (typeof htmlLang === "string" && htmlLang !== "") return normalizeLocale(htmlLang);
	}
	if (typeof navigator !== "undefined") return normalizeLocale(navigator.language);
	return "zh";
}
let activeLocale = browserLocale();
const localeListeners = /* @__PURE__ */ new Set();
function getLocale() {
	return activeLocale;
}
function setLocale(value) {
	const next = normalizeLocale(value);
	if (next === activeLocale) return;
	activeLocale = next;
	for (const listener of [...localeListeners]) listener();
}
function subscribeLocale(listener) {
	localeListeners.add(listener);
	return () => localeListeners.delete(listener);
}
function useLocale() {
	return (0, react.useSyncExternalStore)(subscribeLocale, getLocale, getLocale);
}
function translate(locale, key, params) {
	const template = DICTIONARIES[locale][key] ?? DICTIONARIES.en[key] ?? key;
	if (params === void 0) return template;
	return template.replace(/\{(\w+)\}/g, (match, name) => {
		const value = params[name];
		return value === void 0 ? match : String(value);
	});
}
function t(locale, key, params) {
	return translate(locale, key, params);
}
function errorText(locale, code, fallback) {
	if (code !== void 0) {
		const localized = t(locale, `error.${code}`);
		if (localized !== `error.${code}`) return localized;
	}
	return fallback !== void 0 && fallback.trim() !== "" ? fallback : t(locale, "error.UNKNOWN");
}

//#endregion
//#region src/host/compose.ts
const EXTRA_LEAD_IN = {
	zh: "另外，",
	en: "Also, "
};
const CLAUSE_SEPARATOR = {
	zh: "；",
	en: "; "
};
function normalized(value) {
	return value.replace(/\s+/g, " ").trim().toLowerCase();
}
/** Tokens used for the “already said in the rewrite” check: words + CJK bigrams. */
function textTokens(value) {
	const lower = value.toLowerCase();
	const tokens = [];
	for (const word of lower.match(/[a-z0-9][a-z0-9._-]*/g) ?? []) tokens.push(word);
	for (const run of lower.match(/[\u3400-\u9fff]+/g) ?? []) {
		if (run.length <= 2) {
			tokens.push(run);
			continue;
		}
		for (let index = 0; index < run.length - 1; index += 1) tokens.push(run.slice(index, index + 2));
	}
	return tokens;
}
/**
* True when the rewrite already expresses the chip: an exact normalized match,
* or at least 60% of its tokens (CJK bigrams / words) occur in the rewrite.
* This keeps summaries like “继续 D3，并遵循美术规范” from being appended to a
* rewrite that already says “继续做 D3 … 都按现有美术规范来”.
*/
function alreadyPresent(base, candidate) {
	if (candidate.trim() === "") return true;
	const compactBase = normalized(base).replace(/\s+/g, "");
	if (compactBase.includes(normalized(candidate).replace(/\s+/g, ""))) return true;
	const tokens = textTokens(candidate);
	if (tokens.length === 0) return true;
	let hits = 0;
	for (const token of tokens) if (compactBase.includes(token)) hits += 1;
	return hits / tokens.length >= .6;
}
function composeFinalText(result, selection, locale) {
	const base = result.rewrite.trim();
	if (base === "") return "";
	const missing = [];
	const taskText = result.task?.text?.trim() ?? "";
	if (selection.task && taskText !== "" && !alreadyPresent(base, taskText)) missing.push(taskText);
	for (const [index, item] of (result.constraints ?? []).entries()) {
		const text = item.text?.trim() ?? "";
		if (selection.constraints[index] === true && text !== "" && !alreadyPresent(base, text)) missing.push(text);
	}
	for (const [index, item] of (result.signals ?? []).entries()) {
		const text = item.trim();
		if (selection.signals[index] === true && text !== "" && !alreadyPresent(base, text)) missing.push(text);
	}
	const unique = [...new Set(missing)];
	if (unique.length === 0) return base;
	const joined = unique.join(CLAUSE_SEPARATOR[locale]);
	return `${base}\n\n${EXTRA_LEAD_IN[locale]}${joined}${locale === "zh" ? "。" : "."}`;
}

//#endregion
//#region src/client/store.ts
/**
* Per-session in-memory card state. Nothing here writes the composer.
* `requestId` + session identity fence every late/aborted response.
*/
const DEFAULT_OPTIONS = {
	balanced: false,
	detailLevel: "standard",
	autoDelaySeconds: 0,
	provider: "",
	model: "",
	displayMode: "overlay"
};
/** Preferred result options survive closing the card, per session. */
const preferredOptions = /* @__PURE__ */ new Map();
const preferredListeners = /* @__PURE__ */ new Set();
const PREFERRED_STORAGE_KEY = "dsh-input-uplift:preferred";
let storedOptions = null;
function readStoredOptions() {
	if (storedOptions !== null) return storedOptions;
	storedOptions = DEFAULT_OPTIONS;
	try {
		const raw = window.localStorage.getItem(PREFERRED_STORAGE_KEY);
		if (raw !== null) {
			const value = JSON.parse(raw);
			storedOptions = {
				balanced: value.balanced === true,
				detailLevel: value.detailLevel === "concise" || value.detailLevel === "detailed" ? value.detailLevel : "standard",
				autoDelaySeconds: typeof value.autoDelaySeconds === "number" && Number.isFinite(value.autoDelaySeconds) ? Math.min(120, Math.max(0, Math.floor(value.autoDelaySeconds))) : 0,
				provider: typeof value.provider === "string" ? value.provider : "",
				model: typeof value.model === "string" ? value.model : "",
				displayMode: value.displayMode === "side" ? "side" : "overlay"
			};
		}
	} catch {
		storedOptions = DEFAULT_OPTIONS;
	}
	return storedOptions;
}
function sameOptions(left, right) {
	return left.balanced === right.balanced && left.detailLevel === right.detailLevel && left.autoDelaySeconds === right.autoDelaySeconds && left.provider === right.provider && left.model === right.model && left.displayMode === right.displayMode;
}
function notifyPreferred() {
	for (const listener of [...preferredListeners]) listener();
}
function getPreferredOptions(sessionId) {
	return preferredOptions.get(sessionId) ?? readStoredOptions();
}
function setPreferredOptions(sessionId, next) {
	if (sameOptions(preferredOptions.get(sessionId) ?? readStoredOptions(), next)) return;
	preferredOptions.set(sessionId, next);
	storedOptions = next;
	try {
		window.localStorage.setItem(PREFERRED_STORAGE_KEY, JSON.stringify(next));
	} catch {}
	notifyPreferred();
}
/** Reactive read of the preferred options (used by the auto-uplift timer). */
function usePreferredOptions(sessionId) {
	return (0, react.useSyncExternalStore)((listener) => {
		preferredListeners.add(listener);
		return () => preferredListeners.delete(listener);
	}, () => getPreferredOptions(sessionId), () => getPreferredOptions(sessionId));
}
const EMPTY_STATE = {
	status: "idle",
	requestId: 0,
	genDraft: "",
	genDraftRev: -1,
	originalDraft: "",
	result: null,
	error: null,
	replaceError: null,
	ignored: [],
	adopted: [],
	selectedChips: {
		task: false,
		constraints: [],
		signals: []
	},
	appliedText: "",
	replaceMode: null,
	options: DEFAULT_OPTIONS,
	supplement: "",
	supplementBase: "",
	supplementApplied: false,
	adoptionSelection: [],
	adoptionBase: "",
	adoptedTexts: []
};
const states = /* @__PURE__ */ new Map();
const controllers = /* @__PURE__ */ new Map();
const storeListeners = /* @__PURE__ */ new Set();
let nextRequestId = 1;
function notify() {
	for (const listener of [...storeListeners]) listener();
}
function subscribeStore(listener) {
	storeListeners.add(listener);
	return () => storeListeners.delete(listener);
}
function getSessionState(sessionId) {
	return states.get(sessionId) ?? EMPTY_STATE;
}
function useSessionState(sessionId) {
	return (0, react.useSyncExternalStore)(subscribeStore, () => getSessionState(sessionId), () => getSessionState(sessionId));
}
function update(sessionId, updater) {
	const previous = states.get(sessionId);
	if (previous === void 0) return;
	const next = updater(previous);
	if (next === previous) return;
	states.set(sessionId, next);
	notify();
}
function abortController(sessionId) {
	const controller = controllers.get(sessionId);
	if (controller !== void 0) {
		controllers.delete(sessionId);
		controller.abort();
	}
}
function isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function readErrorResponse(body, status) {
	if (isRecord(body) && isRecord(body.error)) return {
		code: typeof body.error.code === "string" && body.error.code !== "" ? body.error.code : `HTTP_${status}`,
		message: typeof body.error.message === "string" ? body.error.message : ""
	};
	return {
		code: status > 0 ? `HTTP_${status}` : "UNKNOWN",
		message: ""
	};
}
function isPlausibleResult(value) {
	if (!isRecord(value)) return false;
	return typeof value.rewrite === "string" && Array.isArray(value.alignment) && typeof value.no_uplift === "boolean";
}
function defaultChipSelection(result) {
	return {
		task: false,
		constraints: Array.isArray(result.constraints) ? result.constraints.map(() => false) : [],
		signals: Array.isArray(result.signals) ? result.signals.map(() => false) : []
	};
}
function fail(sessionId, requestId, error) {
	const current = states.get(sessionId);
	if (current === void 0 || current.requestId !== requestId) return;
	states.set(sessionId, {
		...current,
		status: "error",
		result: null,
		error,
		replaceError: null
	});
	notify();
}
/**
* Start one request. Re-triggering aborts the previous one. The input snapshot
* is captured by the caller; this function never reads/modifies the composer.
* `options` are the result-shape switches (balanced/detailed); `extra` is the
* user's supplement to integrate on a regenerate; `fresh` starts a new card
* (clears a previously appended supplement).
*/
function beginGeneration(sessionId, draft, draftRev, options = getPreferredOptions(sessionId), extra = "", fresh = false) {
	if (sessionId === "" || draft.trim() === "" || isComposingNow()) return false;
	abortController(sessionId);
	setPreferredOptions(sessionId, options);
	const requestId = nextRequestId;
	nextRequestId += 1;
	const controller = new AbortController();
	controllers.set(sessionId, controller);
	const previous = states.get(sessionId);
	states.set(sessionId, {
		status: "generating",
		requestId,
		genDraft: draft,
		genDraftRev: draftRev,
		originalDraft: draft,
		result: null,
		error: null,
		replaceError: null,
		ignored: [],
		adopted: [],
		selectedChips: {
			task: false,
			constraints: [],
			signals: []
		},
		appliedText: "",
		replaceMode: null,
		options,
		supplement: fresh ? "" : previous?.supplement ?? "",
		supplementBase: "",
		supplementApplied: false,
		adoptionSelection: [],
		adoptionBase: "",
		adoptedTexts: []
	});
	notify();
	(async () => {
		try {
			const trimmedExtra = extra.trim();
			const response = await fetch("/api/input-uplift/reorganize", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					sessionId,
					draft,
					options: {
						balanced: options.balanced,
						detailLevel: options.detailLevel,
						...options.provider === "" || options.model === "" ? {} : {
							provider: options.provider,
							model: options.model
						}
					},
					...trimmedExtra === "" ? {} : { extra: trimmedExtra }
				}),
				signal: controller.signal
			});
			let body = null;
			try {
				body = await response.json();
			} catch {
				body = null;
			}
			if (controller.signal.aborted) return;
			const current = states.get(sessionId);
			if (current === void 0 || current.requestId !== requestId) return;
			if (!response.ok || !isRecord(body) || body.ok !== true) {
				fail(sessionId, requestId, readErrorResponse(body, response.status));
				return;
			}
			if (!isPlausibleResult(body.result)) {
				fail(sessionId, requestId, {
					code: "BAD_RESPONSE",
					message: "Malformed result from host."
				});
				return;
			}
			update(sessionId, (state) => state.requestId === requestId ? {
				...state,
				status: "ready",
				result: body.result,
				selectedChips: defaultChipSelection(body.result),
				error: null,
				replaceError: null
			} : state);
		} catch (error) {
			if (controller.signal.aborted) return;
			const message = error instanceof Error ? error.message : "";
			fail(sessionId, requestId, {
				code: "NETWORK",
				message
			});
		} finally {
			if (controllers.get(sessionId) === controller) controllers.delete(sessionId);
		}
	})();
	return true;
}
function closeSession(sessionId) {
	abortController(sessionId);
	if (states.delete(sessionId)) notify();
}
function disposeSession(sessionId) {
	closeSession(sessionId);
}
function setReplaceError(sessionId, code, message) {
	update(sessionId, (state) => ({
		...state,
		replaceError: {
			code,
			message
		}
	}));
}
function markReplaced(sessionId, appliedText, mode) {
	update(sessionId, (state) => ({
		...state,
		status: "replaced",
		appliedText,
		replaceMode: mode,
		replaceError: null
	}));
}
/** Toggle the result-shape switches; they apply on the next generation. */
function setOptions(sessionId, patch) {
	update(sessionId, (state) => {
		const options = {
			...state.options,
			...patch
		};
		setPreferredOptions(sessionId, options);
		return {
			...state,
			options
		};
	});
}
/** Edit the free-text supplement (does not touch the result until applied). */
function setSupplement(sessionId, text) {
	update(sessionId, (state) => state.supplement === text ? state : {
		...state,
		supplement: text
	});
}
/** Append the supplement to the generated rewrite (client-side, no model call). */
function applySupplement(sessionId) {
	update(sessionId, (state) => {
		const extra = state.supplement.trim();
		if (state.result === null || extra === "" || state.supplementApplied) return state;
		const base = state.result.rewrite;
		return {
			...state,
			result: {
				...state.result,
				rewrite: `${base.trimEnd()}\n\n${extra}`
			},
			supplementBase: base,
			supplementApplied: true
		};
	});
}
function undoSupplement(sessionId) {
	update(sessionId, (state) => {
		if (state.result === null || !state.supplementApplied) return state;
		return {
			...state,
			result: {
				...state.result,
				rewrite: state.supplementBase
			},
			supplementBase: "",
			supplementApplied: false
		};
	});
}
/** The sentence a finding contributes to the rewrite when adopted. */
function adoptionSentence(result, index) {
	if (result === null) return "";
	const item = result.alignment[index];
	if (item === void 0) return "";
	return (item.adoption_text !== "" ? item.adoption_text : item.suggestion !== "" ? item.suggestion : item.claim).trim();
}
function adoptIntoState(state, indices) {
	if (state.result === null) return state;
	const usable = indices.filter((index) => !state.adopted.includes(index) && !state.ignored.includes(index));
	if (usable.length === 0) return state;
	const base = state.adoptionBase !== "" ? state.adoptionBase : state.result.rewrite;
	const adoptedTexts = [...state.adoptedTexts];
	for (const index of usable) {
		const sentence = adoptionSentence(state.result, index);
		if (sentence === "" || adoptedTexts.includes(sentence)) continue;
		adoptedTexts.push(sentence);
	}
	if (adoptedTexts.length === state.adoptedTexts.length) return state;
	return {
		...state,
		result: {
			...state.result,
			rewrite: [base.trimEnd(), ...adoptedTexts].join("\n\n")
		},
		adoptionBase: base,
		adoptedTexts,
		adopted: [...state.adopted, ...usable],
		adoptionSelection: state.adoptionSelection.filter((index) => !usable.includes(index))
	};
}
/** Check/uncheck a finding for a later batch adoption. */
function toggleAlignmentSelection(sessionId, index) {
	update(sessionId, (state) => {
		if (state.result === null || state.adopted.includes(index) || state.ignored.includes(index)) return state;
		const selected = state.adoptionSelection.includes(index);
		return {
			...state,
			adoptionSelection: selected ? state.adoptionSelection.filter((item) => item !== index) : [...state.adoptionSelection, index]
		};
	});
}
/** Adopt one finding immediately: its adoption sentence is appended to rewrite. */
function adoptAlignment(sessionId, index) {
	update(sessionId, (state) => adoptIntoState(state, [index]));
}
/** Adopt every checked finding in one step. */
function adoptSelectedAlignments(sessionId) {
	update(sessionId, (state) => adoptIntoState(state, state.adoptionSelection));
}
/** Undo every adoption: restore the rewrite captured before the first one. */
function undoAdoptions(sessionId) {
	update(sessionId, (state) => {
		if (state.result === null || state.adopted.length === 0) return state;
		return {
			...state,
			result: {
				...state.result,
				rewrite: state.adoptionBase !== "" ? state.adoptionBase : state.result.rewrite
			},
			adopted: [],
			adoptedTexts: [],
			adoptionBase: "",
			adoptionSelection: []
		};
	});
}
function ignoreAlignment(sessionId, index) {
	update(sessionId, (state) => ({
		...state,
		ignored: state.ignored.includes(index) ? state.ignored : [...state.ignored, index],
		adoptionSelection: state.adoptionSelection.filter((item) => item !== index)
	}));
}
function toggleConstraintChip(sessionId, index) {
	update(sessionId, (state) => {
		const next = [...state.selectedChips.constraints];
		next[index] = next[index] !== true;
		return {
			...state,
			selectedChips: {
				...state.selectedChips,
				constraints: next
			}
		};
	});
}
function toggleSignalChip(sessionId, index) {
	update(sessionId, (state) => {
		const next = [...state.selectedChips.signals];
		next[index] = next[index] !== true;
		return {
			...state,
			selectedChips: {
				...state.selectedChips,
				signals: next
			}
		};
	});
}
let activeSessionId;
const shortcutListeners = /* @__PURE__ */ new Set();
function setActiveSession(sessionId) {
	activeSessionId = sessionId;
}
function clearActiveSession(sessionId) {
	if (activeSessionId === sessionId) activeSessionId = void 0;
}
function onShortcutUplift(listener) {
	shortcutListeners.add(listener);
	return () => shortcutListeners.delete(listener);
}
function requestShortcutUplift() {
	if (activeSessionId === void 0) return false;
	const target = activeSessionId;
	for (const listener of [...shortcutListeners]) listener(target);
	return true;
}

//#endregion
//#region src/client/sidebar.ts
/**
* Bridge to the DSH right-sidebar tab registered by the client entry.
* The services are only available inside `ctx.inject`; the entry publishes a
* tiny face on `globalThis` so ordinary components can open/close the tab.
*/
const SIDEBAR_TAB_ID = "@local/dsh-input-uplift";
const SIDEBAR_TAB_KIND = "input-uplift";
function face() {
	return globalThis.__iuSidebar;
}
function openUpliftSidebar(sessionId) {
	const api = face();
	if (api === void 0) return false;
	try {
		api.openTab(sessionId);
		return true;
	} catch {
		return false;
	}
}
/** Close the right-sidebar tab (used when the user switches back to overlay). */
function closeUpliftSidebar() {
	const api = face();
	if (api === void 0) return;
	try {
		api.closeActive();
	} catch {}
}

//#endregion
//#region src/client/TriggerButton.tsx
const SHORTCUT = "Mod+Alt+U";
function TriggerButton({ sessionId, useInput }) {
	const locale = useLocale();
	const composing = useComposing();
	const draft = useInput((state) => state.draft);
	const draftRev = useInput((state) => state.draftRev);
	const phase = useInput((state) => state.phase);
	const generating = useSessionState(sessionId).status === "generating";
	const empty = draft.trim() === "";
	const phaseBlocked = phase !== "plain";
	const disabled = generating || empty || phaseBlocked || composing;
	let tooltip = `${t(locale, "trigger.title")} · ${t(locale, "trigger.shortcut", { shortcut: SHORTCUT })}`;
	if (empty) tooltip = t(locale, "trigger.empty");
	else if (phaseBlocked) tooltip = t(locale, "trigger.phase");
	else if (generating) tooltip = t(locale, "trigger.busy");
	else if (composing) tooltip = t(locale, "trigger.phase");
	const label = t(locale, "trigger.label");
	const onClick = () => {
		if (disabled) return;
		setActiveSession(sessionId);
		const options = getPreferredOptions(sessionId);
		beginGeneration(sessionId, draft, draftRev, options, "", true);
		if (options.displayMode === "side") openUpliftSidebar(sessionId);
	};
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
		type: "button",
		className: "dsh-iu-trigger",
		"aria-label": label,
		"aria-busy": generating || void 0,
		title: tooltip,
		disabled,
		onMouseDown: (event) => event.preventDefault(),
		onClick,
		style: {
			display: "inline-flex",
			alignItems: "center",
			gap: 5,
			height: 26,
			padding: "0 7px",
			border: "1px solid transparent",
			borderRadius: "var(--dsw-radius-sm, 6px)",
			background: "transparent",
			color: "var(--dsw-alias-label-secondary, #b3b3b3)",
			font: "inherit",
			fontSize: 12,
			lineHeight: "24px",
			cursor: disabled ? "default" : "pointer",
			opacity: disabled ? .45 : 1,
			whiteSpace: "nowrap"
		},
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
			"aria-hidden": "true",
			className: generating ? "dsh-iu-pulse" : void 0,
			children: "✦"
		}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: label })]
	});
}

//#endregion
//#region src/client/UpliftPanel.tsx
/**
* Floating uplift card, registered in `conversation.input.overlay`.
*
* The card never reads or writes the composer except on an explicit Replace /
* Restore click. It is non-modal (no portal, no layout shift) and every
* interactive control avoids taking editor focus on mousedown.
*/
const STYLE_ID = "dsh-input-uplift-client-css";
function ensureStyles() {
	if (typeof document === "undefined") return;
	if (document.querySelector(`style[data-plugin-css="${STYLE_ID}"]`) !== null) return;
	const style = document.createElement("style");
	style.dataset.plugin = "@local/dsh-input-uplift";
	style.dataset.pluginCss = STYLE_ID;
	style.textContent = `
    .dsh-iu-trigger:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover, rgba(255,255,255,.07)) !important; }
    .dsh-iu-action:hover:not(:disabled) { filter: brightness(1.08); }
    .dsh-iu-chip:hover { border-color: var(--dsw-alias-border-l3, rgba(255,255,255,.24)) !important; }
    .dsh-iu-pulse { animation: dsh-iu-pulse 1.2s ease-in-out infinite; }
    .dsh-iu-scroll { scrollbar-width: thin; scrollbar-color: var(--dsw-alias-scrollbar-bg-l2, rgba(255,255,255,.16)) transparent; }
    .dsh-iu-scroll::-webkit-scrollbar { width: 8px; }
    .dsh-iu-scroll::-webkit-scrollbar-thumb { background: var(--dsw-alias-scrollbar-bg-l2, rgba(255,255,255,.16)); border-radius: 999px; }
    .dsh-iu-skeleton {
      height: 12px; border-radius: 6px;
      background: linear-gradient(90deg, var(--dsw-alias-bg-layer-2, #242424), var(--dsw-alias-bg-layer-4, #353535), var(--dsw-alias-bg-layer-2, #242424));
      background-size: 200% 100%;
      animation: dsh-iu-skeleton 1.4s ease-in-out infinite;
    }
    .dsh-iu-card button:focus-visible { outline: 2px solid var(--dsw-alias-label-link, #6ea8fe); outline-offset: 1px; }
    .dsh-iu-card .sr-only {
      position: absolute !important; width: 1px !important; height: 1px !important;
      padding: 0 !important; margin: -1px !important; overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important; white-space: nowrap !important; border: 0 !important;
    }
    @keyframes dsh-iu-pulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
    @keyframes dsh-iu-skeleton { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  `;
	document.head.appendChild(style);
}
function removeStyles() {
	if (typeof document === "undefined") return;
	document.querySelector(`style[data-plugin-css="${STYLE_ID}"]`)?.remove();
}
function actionStyle(kind, disabled) {
	const base = {
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		gap: 5,
		minHeight: 28,
		padding: "0 10px",
		borderRadius: "var(--dsw-radius-sm, 6px)",
		fontFamily: "inherit",
		fontSize: 12,
		lineHeight: "26px",
		cursor: disabled ? "default" : "pointer",
		opacity: disabled ? .45 : 1,
		whiteSpace: "nowrap"
	};
	if (kind === "primary") return {
		...base,
		border: "1px solid transparent",
		background: "var(--dsw-alias-button-primary-fill, #4d6bfe)",
		color: "#fff",
		fontWeight: 600
	};
	if (kind === "secondary") return {
		...base,
		border: "1px solid var(--dsw-alias-border-l2, rgba(255,255,255,.14))",
		background: "var(--dsw-alias-bg-layer-3, #2a2a2a)",
		color: "var(--dsw-alias-label-primary, #f2f2f2)"
	};
	return {
		...base,
		border: "1px solid transparent",
		background: "transparent",
		color: "var(--dsw-alias-label-secondary, #b3b3b3)"
	};
}
function ActionButton({ children, onClick, disabled = false, kind = "ghost", title, ariaLabel, ariaPressed }) {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
		type: "button",
		className: "dsh-iu-action",
		style: actionStyle(kind, disabled),
		disabled,
		title,
		"aria-label": ariaLabel,
		"aria-pressed": ariaPressed,
		onMouseDown: (event) => event.preventDefault(),
		onClick,
		children
	});
}
function severityStyle(severity) {
	if (severity === "high") return {
		border: "1px solid rgba(235, 87, 87, .4)",
		background: "rgba(235, 87, 87, .10)"
	};
	if (severity === "low") return {
		border: "1px solid rgba(154, 154, 154, .28)",
		background: "rgba(154, 154, 154, .07)"
	};
	return {
		border: "1px solid rgba(234, 179, 8, .38)",
		background: "rgba(234, 179, 8, .09)"
	};
}
function AlignmentCard({ item, locale, adopted, selected, disabled, onAdopt, onIgnore, onToggleSelect }) {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		style: {
			...severityStyle(item.severity),
			borderRadius: 8,
			padding: "8px 9px",
			display: "grid",
			gap: 5
		},
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					alignItems: "center",
					gap: 6,
					flexWrap: "wrap"
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						role: "checkbox",
						"aria-checked": selected,
						"aria-label": t(locale, "alignment.select"),
						disabled: disabled || adopted,
						onMouseDown: (event) => event.preventDefault(),
						onClick: onToggleSelect,
						style: {
							border: "1px solid var(--dsw-alias-border-l2, rgba(255,255,255,.2))",
							background: selected ? "var(--dsw-alias-label-link, #6ea8fe)" : "transparent",
							color: selected ? "#fff" : "var(--dsw-alias-label-secondary, #b3b3b3)",
							borderRadius: 5,
							width: 18,
							height: 18,
							lineHeight: "16px",
							fontSize: 11,
							padding: 0,
							cursor: adopted ? "default" : "pointer"
						},
						children: selected ? "✓" : ""
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
						style: {
							fontSize: 12,
							color: "var(--dsw-alias-label-primary, #f2f2f2)"
						},
						children: t(locale, `alignment.${item.type}`)
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: {
							fontSize: 10,
							color: "var(--dsw-alias-label-tertiary, #8c8c8c)",
							border: "1px solid var(--dsw-alias-border-l2, rgba(255,255,255,.14))",
							borderRadius: 999,
							padding: "0 5px",
							lineHeight: "16px"
						},
						children: t(locale, `alignment.severity.${item.severity}`)
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { style: { flex: 1 } }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActionButton, {
						kind: "ghost",
						disabled: disabled || adopted,
						onClick: onAdopt,
						ariaPressed: adopted,
						children: adopted ? `✓ ${t(locale, "alignment.adopted")}` : t(locale, "alignment.adopt")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActionButton, {
						kind: "ghost",
						disabled,
						onClick: onIgnore,
						children: t(locale, "alignment.ignore")
					})
				]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: {
					fontSize: 12,
					lineHeight: 1.55,
					color: "var(--dsw-alias-label-primary, #f2f2f2)"
				},
				children: item.claim
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("blockquote", {
				style: {
					margin: 0,
					padding: "5px 8px",
					borderLeft: "2px solid var(--dsw-alias-border-l3, rgba(255,255,255,.22))",
					color: "var(--dsw-alias-label-secondary, #b3b3b3)",
					fontSize: 11,
					lineHeight: 1.5,
					whiteSpace: "pre-wrap",
					maxHeight: 100,
					overflowY: "auto"
				},
				children: [
					t(locale, "alignment.evidence", { from: item.evidence.from }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("br", {}),
					"“",
					item.evidence.quote,
					"”"
				]
			}),
			item.suggestion !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: {
					fontSize: 11,
					lineHeight: 1.5,
					color: "var(--dsw-alias-label-secondary, #b3b3b3)"
				},
				children: t(locale, "alignment.suggestion", { text: item.suggestion })
			})
		]
	});
}
function Chip({ selected, label, text, source, locale, disabled, covered = false, onToggle }) {
	const inactive = disabled || covered;
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
		type: "button",
		className: "dsh-iu-chip",
		"aria-pressed": selected,
		disabled: inactive,
		title: covered ? t(locale, "chips.coveredHint") : void 0,
		onMouseDown: (event) => event.preventDefault(),
		onClick: onToggle,
		style: {
			display: "inline-flex",
			alignItems: "flex-start",
			gap: 5,
			maxWidth: "100%",
			padding: "4px 7px",
			border: selected ? "1px solid var(--dsw-alias-label-link, #6ea8fe)" : "1px solid var(--dsw-alias-border-l2, rgba(255,255,255,.14))",
			borderRadius: 7,
			background: selected ? "var(--dsw-alias-interactive-bg-hover, rgba(255,255,255,.07))" : "transparent",
			color: "var(--dsw-alias-label-primary, #f2f2f2)",
			font: "inherit",
			fontSize: 11,
			lineHeight: 1.45,
			textAlign: "left",
			cursor: inactive ? "default" : "pointer",
			opacity: inactive ? .65 : 1
		},
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
			"aria-hidden": "true",
			style: { color: selected ? "var(--dsw-alias-label-link, #6ea8fe)" : "var(--dsw-alias-label-tertiary, #8c8c8c)" },
			children: covered ? "•" : selected ? "✓" : "○"
		}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
			style: { minWidth: 0 },
			children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					style: {
						color: "var(--dsw-alias-label-tertiary, #8c8c8c)",
						marginRight: 4
					},
					children: label
				}),
				text,
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					style: {
						color: "var(--dsw-alias-label-tertiary, #8c8c8c)",
						marginLeft: 4
					},
					children: ["· ", source]
				}),
				covered && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					style: {
						color: "var(--dsw-alias-label-tertiary, #8c8c8c)",
						marginLeft: 6
					},
					children: ["· ", t(locale, "chips.covered")]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "sr-only",
					children: t(locale, "chips.hint")
				})
			]
		})]
	});
}
function draftLocale(draft, fallback) {
	return /[\u3400-\u9fff]/.test(draft) ? "zh" : fallback;
}
function sameDraft(left, right) {
	return left === right;
}
function kindLabel(locale, result) {
	return t(locale, `kind.${result.kind}`);
}
function UpliftPanel({ sessionId, useInput, inputActions, variant = "overlay" }) {
	const locale = useLocale();
	const composing = useComposing();
	const card = useSessionState(sessionId);
	const draft = useInput((state) => state.draft);
	const draftRev = useInput((state) => state.draftRev);
	const phase = useInput((state) => state.phase);
	const occurrenceCount = useInput((state) => state.occurrences?.length ?? 0);
	const attachmentCount = useInput((state) => state.attachmentIds?.length ?? 0);
	const [confirmReferences, setConfirmReferences] = (0, react.useState)(false);
	const cardRef = (0, react.useRef)(null);
	const [cardMaxHeight, setCardMaxHeight] = (0, react.useState)(null);
	const preferred = usePreferredOptions(sessionId);
	const [settingsOpen, setSettingsOpen] = (0, react.useState)(false);
	const [models, setModels] = (0, react.useState)(null);
	const [modelsLoading, setModelsLoading] = (0, react.useState)(false);
	const latest = (0, react.useRef)({
		draft,
		draftRev,
		phase
	});
	latest.current = {
		draft,
		draftRev,
		phase
	};
	const open = card.status !== "idle";
	const sideMode = card.options.displayMode === "side";
	const sidebarVariant = variant === "sidebar";
	(0, react.useLayoutEffect)(() => {
		if (!open || sidebarVariant) return;
		const measure = () => {
			const composer = document.querySelector("[data-composer-card]");
			const top = composer instanceof HTMLElement && composer.getBoundingClientRect().top > 0 ? composer.getBoundingClientRect().top : window.innerHeight * .62;
			setCardMaxHeight(Math.max(200, Math.floor(top - 56)));
		};
		measure();
		window.addEventListener("resize", measure);
		const composer = document.querySelector("[data-composer-card]");
		const observer = typeof ResizeObserver === "function" && composer instanceof HTMLElement ? new ResizeObserver(measure) : null;
		if (observer !== null && composer instanceof HTMLElement) observer.observe(composer);
		const timer = window.setTimeout(measure, 120);
		return () => {
			window.removeEventListener("resize", measure);
			observer?.disconnect();
			window.clearTimeout(timer);
		};
	}, [
		open,
		sessionId,
		card.status
	]);
	const result = card.result;
	const generating = card.status === "generating";
	const stale = card.status === "ready" && card.genDraftRev !== draftRev;
	const ignored = new Set(card.ignored);
	const adopted = new Set(card.adopted);
	const selectedForAdoption = new Set(card.adoptionSelection);
	const visibleAlignment = result === null ? [] : result.alignment.map((item, index) => ({
		item,
		index
	})).filter((entry) => !ignored.has(entry.index));
	const sameAsApplied = card.status === "replaced" && sameDraft(draft, card.appliedText);
	const interactionsDisabled = card.status !== "ready";
	const canActOnComposer = phase === "plain" && !composing;
	const finalText = result === null ? "" : composeFinalText(result, card.selectedChips, draftLocale(draft, locale));
	const replaceDisabled = result === null || card.status !== "ready" || stale || !canActOnComposer || finalText.trim() === "" || result.no_uplift;
	const canRegenerate = draft.trim() !== "" && phase === "plain" && !composing;
	const canRestore = card.status === "replaced" && sameAsApplied && canActOnComposer;
	(0, react.useEffect)(() => {
		setActiveSession(sessionId);
		return () => clearActiveSession(sessionId);
	}, [sessionId]);
	(0, react.useEffect)(() => () => {
		if (!sidebarVariant) disposeSession(sessionId);
	}, [sessionId, sidebarVariant]);
	(0, react.useEffect)(() => onShortcutUplift((target) => {
		if (target !== sessionId) return;
		const snapshot = latest.current;
		if (snapshot.phase !== "plain" || snapshot.draft.trim() === "" || isComposingNow()) return;
		if (getSessionState(sessionId).status === "generating") return;
		const options = getPreferredOptions(sessionId);
		beginGeneration(sessionId, snapshot.draft, snapshot.draftRev, options, "", true);
		if (options.displayMode === "side") openUpliftSidebar(sessionId);
	}), [sessionId]);
	const autoDelay = preferred.autoDelaySeconds;
	(0, react.useEffect)(() => {
		if (autoDelay <= 0) return;
		const current = getSessionState(sessionId);
		if (draft.trim() === "" || phase !== "plain" || composing) return;
		if (current.status === "generating") return;
		if (current.status === "replaced" && sameDraft(draft, current.appliedText)) return;
		const rev = draftRev;
		const timer = window.setTimeout(() => {
			const snapshot = latest.current;
			if (snapshot.draftRev !== rev || snapshot.draft.trim() === "" || snapshot.phase !== "plain" || isComposingNow()) return;
			const state = getSessionState(sessionId);
			if (state.status === "generating") return;
			if (state.status === "replaced" && sameDraft(snapshot.draft, state.appliedText)) return;
			if (state.genDraftRev === rev && state.status !== "idle") return;
			const options = getPreferredOptions(sessionId);
			beginGeneration(sessionId, snapshot.draft, snapshot.draftRev, options, "", true);
			if (options.displayMode === "side") openUpliftSidebar(sessionId);
		}, autoDelay * 1e3);
		return () => window.clearTimeout(timer);
	}, [
		autoDelay,
		draft,
		draftRev,
		phase,
		composing,
		sessionId,
		card.status,
		card.appliedText
	]);
	(0, react.useEffect)(() => {
		if (!settingsOpen || models !== null) return;
		let cancelled = false;
		setModelsLoading(true);
		(async () => {
			try {
				const response = await fetch("/api/input-uplift/models");
				const body = await response.json();
				if (cancelled) return;
				if (response.ok && body.ok === true && Array.isArray(body.providers)) setModels(body.providers);
				else setModels([]);
			} catch {
				if (!cancelled) setModels([]);
			} finally {
				if (!cancelled) setModelsLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [settingsOpen, models]);
	(0, react.useEffect)(() => {
		if (card.status === "idle") return;
		if (phase === "submitting") {
			closeSession(sessionId);
			return;
		}
		if (draft === "" && card.status !== "generating") closeSession(sessionId);
	}, [
		phase,
		draft,
		card.status,
		sessionId
	]);
	(0, react.useEffect)(() => {
		if (!open) return;
		const onKeyDown = (event) => {
			if (event.key !== "Escape" || isComposingNow()) return;
			event.preventDefault();
			closeSession(sessionId);
		};
		document.addEventListener("keydown", onKeyDown, true);
		return () => document.removeEventListener("keydown", onKeyDown, true);
	}, [open, sessionId]);
	(0, react.useEffect)(() => {
		setConfirmReferences(false);
	}, [card.requestId, draftRev]);
	if (!open) return null;
	if (sideMode && !sidebarVariant) return null;
	const close = () => {
		closeSession(sessionId);
	};
	const regenerate = () => {
		if (!canRegenerate) return;
		beginGeneration(sessionId, draft, draftRev, card.options, card.supplement, false);
	};
	const replace = () => {
		if (replaceDisabled || result === null) return;
		if (isComposingNow()) return;
		if (occurrenceCount > 0 && !confirmReferences) {
			setConfirmReferences(true);
			return;
		}
		try {
			if (occurrenceCount > 0) {
				inputActions.setDraft(finalText);
				markReplaced(sessionId, finalText, "setDraft");
			} else {
				if (!inputActions.insertText(finalText, {
					start: 0,
					end: draft.length,
					draftRev
				})) {
					setReplaceError(sessionId, "REPLACE_REJECTED", "insertText returned false");
					return;
				}
				markReplaced(sessionId, finalText, "insert");
			}
			setConfirmReferences(false);
		} catch (error) {
			setReplaceError(sessionId, "REPLACE_REJECTED", error instanceof Error ? error.message : "");
		}
	};
	const restore = () => {
		if (card.status !== "replaced" || !sameAsApplied) return;
		if (isComposingNow()) return;
		try {
			if (card.replaceMode === "setDraft" || occurrenceCount > 0) inputActions.setDraft(card.originalDraft);
			else if (!inputActions.insertText(card.originalDraft, {
				start: 0,
				end: draft.length,
				draftRev
			})) {
				setReplaceError(sessionId, "RESTORE_REJECTED", "insertText returned false");
				return;
			}
			closeSession(sessionId);
		} catch (error) {
			setReplaceError(sessionId, "RESTORE_REJECTED", error instanceof Error ? error.message : "");
		}
	};
	const handleIgnore = (index) => {
		ignoreAlignment(sessionId, index);
	};
	const headerKind = result === null ? null : kindLabel(locale, result);
	const showRewrite = result !== null && !generating && card.status !== "error";
	const showOnlyReminder = result !== null && result.rewrite.trim() === "" && !result.no_uplift;
	const noUplift = result?.no_uplift === true;
	const replaceErrorText = card.replaceError === null ? "" : errorText(locale, card.replaceError.code, card.replaceError.message);
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		ref: cardRef,
		role: "dialog",
		"aria-label": t(locale, "panel.title"),
		"data-input-uplift-card": "",
		"data-input-uplift-session": sessionId,
		className: "dsh-iu-card",
		style: {
			zIndex: sidebarVariant ? "auto" : 1e3,
			...sidebarVariant ? {
				position: "relative",
				width: "100%",
				height: "100%",
				maxWidth: "none",
				maxHeight: "none",
				margin: 0
			} : {
				position: "absolute",
				left: 0,
				right: 0,
				bottom: "calc(100% + 8px)",
				maxWidth: "var(--dsh-composer-card-max-width, 860px)",
				margin: "0 auto",
				maxHeight: cardMaxHeight === null ? "min(52vh, 460px)" : cardMaxHeight
			},
			display: "flex",
			flexDirection: "column",
			overflow: "hidden",
			border: sidebarVariant ? "none" : "1px solid var(--dsw-alias-border-l2, rgba(255,255,255,.14))",
			borderRadius: sidebarVariant ? 0 : "var(--dsw-radius-panel, 12px)",
			background: sidebarVariant ? "transparent" : "var(--dsw-specific-input-major, var(--dsw-alias-bg-layer-1, #ffffff))",
			backdropFilter: sidebarVariant ? "none" : "blur(18px)",
			WebkitBackdropFilter: sidebarVariant ? "none" : "blur(18px)",
			boxShadow: sidebarVariant ? "none" : "var(--dsw-elevation-prominent, 0 12px 40px rgba(0,0,0,.42))",
			color: "var(--dsw-alias-label-primary, #f2f2f2)",
			fontFamily: "var(--dsw-font-family, inherit)",
			fontSize: 12,
			isolation: sidebarVariant ? "auto" : "isolate"
		},
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
				style: {
					display: "flex",
					alignItems: "center",
					gap: 8,
					padding: "9px 12px",
					borderBottom: "1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.09))",
					flexShrink: 0
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("strong", {
						style: { fontSize: 13 },
						children: ["✦ ", t(locale, "panel.title")]
					}),
					headerKind !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: {
							fontSize: 10,
							padding: "1px 6px",
							borderRadius: 999,
							border: "1px solid var(--dsw-alias-border-l2, rgba(255,255,255,.14))",
							color: "var(--dsw-alias-label-secondary, #b3b3b3)",
							lineHeight: "16px"
						},
						children: headerKind
					}),
					result?.mock === true && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: {
							fontSize: 10,
							color: "var(--dsw-alias-state-warn, #d6a400)"
						},
						children: t(locale, "panel.mock")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { style: { flex: 1 } }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActionButton, {
						kind: "ghost",
						ariaLabel: t(locale, sidebarVariant || sideMode ? "panel.undock" : "panel.dock"),
						title: t(locale, sidebarVariant || sideMode ? "panel.undock" : "panel.dock"),
						onClick: () => {
							if (sidebarVariant || sideMode) {
								setOptions(sessionId, { displayMode: "overlay" });
								closeUpliftSidebar();
								return;
							}
							setOptions(sessionId, { displayMode: "side" });
							openUpliftSidebar(sessionId);
						},
						children: sidebarVariant || sideMode ? "⇤" : "⇥"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActionButton, {
						kind: "ghost",
						ariaLabel: t(locale, "settings.open"),
						ariaPressed: settingsOpen,
						title: t(locale, "settings.open"),
						onClick: () => setSettingsOpen((open) => !open),
						children: "⚙"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActionButton, {
						kind: "ghost",
						ariaLabel: t(locale, "panel.close"),
						onClick: close,
						children: "✕"
					})
				]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsh-iu-scroll",
				style: {
					overflowY: "auto",
					minHeight: 0,
					flex: 1,
					padding: "10px 12px",
					display: "grid",
					gap: 10
				},
				children: [
					generating && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						"aria-live": "polite",
						style: {
							display: "grid",
							gap: 7,
							padding: "4px 0"
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: { color: "var(--dsw-alias-label-secondary, #b3b3b3)" },
								children: t(locale, "panel.generating")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dsh-iu-skeleton",
								style: { width: "88%" }
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dsh-iu-skeleton",
								style: { width: "72%" }
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dsh-iu-skeleton",
								style: { width: "80%" }
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: {
									fontSize: 11,
									color: "var(--dsw-alias-label-tertiary, #8c8c8c)",
									marginTop: 2
								},
								children: t(locale, "panel.generatingHint")
							})
						]
					}),
					card.status === "error" && card.error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						role: "alert",
						style: {
							display: "grid",
							gap: 6
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
								style: { color: "var(--dsw-alias-label-error, #f06a6a)" },
								children: t(locale, "panel.errorTitle")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: { lineHeight: 1.6 },
								children: errorText(locale, card.error.code, card.error.message)
							}),
							card.error.code !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
								style: {
									fontSize: 10,
									color: "var(--dsw-alias-label-tertiary, #8c8c8c)"
								},
								children: card.error.code
							})
						]
					}),
					stale && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						role: "alert",
						style: {
							border: "1px solid rgba(234,179,8,.42)",
							background: "rgba(234,179,8,.10)",
							borderRadius: 8,
							padding: "7px 9px",
							display: "grid",
							gap: 3
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t(locale, "panel.staleTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: {
								color: "var(--dsw-alias-label-secondary, #b3b3b3)",
								lineHeight: 1.55
							},
							children: t(locale, "panel.staleBody")
						})]
					}),
					result?.unstructured === true && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: {
							border: "1px solid rgba(234,179,8,.4)",
							background: "rgba(234,179,8,.08)",
							borderRadius: 8,
							padding: "7px 9px",
							color: "var(--dsw-alias-label-secondary, #b3b3b3)",
							lineHeight: 1.55
						},
						children: t(locale, "panel.unstructured")
					}),
					showRewrite && noUplift && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							border: "1px solid var(--dsw-alias-border-l2, rgba(255,255,255,.14))",
							borderRadius: 8,
							padding: "8px 9px",
							lineHeight: 1.55
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t(locale, "panel.noUplift") }), result.reason !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: {
								color: "var(--dsw-alias-label-secondary, #b3b3b3)",
								marginTop: 3
							},
							children: result.reason
						})]
					}),
					showRewrite && visibleAlignment.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						style: {
							display: "grid",
							gap: 7
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									alignItems: "center",
									gap: 6,
									flexWrap: "wrap"
								},
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("strong", {
										style: { color: "var(--dsw-alias-state-warn, #d6a400)" },
										children: ["⚠ ", t(locale, "alignment.title", { count: visibleAlignment.length })]
									}),
									adopted.size > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										style: {
											fontSize: 10,
											color: "var(--dsw-alias-label-link, #6ea8fe)"
										},
										children: t(locale, "alignment.adoptedCount", { count: adopted.size })
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { style: { flex: 1 } }),
									card.adoptionSelection.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActionButton, {
										kind: "secondary",
										disabled: interactionsDisabled,
										onClick: () => adoptSelectedAlignments(sessionId),
										children: t(locale, "alignment.adoptSelected", { count: card.adoptionSelection.length })
									}),
									adopted.size > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActionButton, {
										kind: "ghost",
										disabled: interactionsDisabled,
										onClick: () => undoAdoptions(sessionId),
										children: t(locale, "alignment.undoAdoptions")
									}),
									ignored.size > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										style: {
											fontSize: 10,
											color: "var(--dsw-alias-label-tertiary, #8c8c8c)"
										},
										children: t(locale, "alignment.ignoredCount", { count: ignored.size })
									})
								]
							}),
							visibleAlignment.map(({ item, index }) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(AlignmentCard, {
								item,
								locale,
								adopted: adopted.has(index),
								selected: selectedForAdoption.has(index),
								disabled: interactionsDisabled,
								onAdopt: () => adoptAlignment(sessionId, index),
								onIgnore: () => handleIgnore(index),
								onToggleSelect: () => toggleAlignmentSelection(sessionId, index)
							}, `${item.type}-${index}`)),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: {
									fontSize: 10,
									color: "var(--dsw-alias-label-tertiary, #8c8c8c)"
								},
								children: t(locale, "alignment.note")
							})
						]
					}),
					showRewrite && (result.brief.scope !== "" || result.brief.approach !== "") && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						"data-input-uplift-brief": "",
						style: {
							display: "grid",
							gap: 4,
							fontSize: 11,
							lineHeight: 1.6,
							color: "var(--dsw-alias-label-secondary, #b3b3b3)",
							border: "1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.09))",
							borderRadius: 8,
							padding: "7px 9px"
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
								style: { color: "var(--dsw-alias-label-primary, #f2f2f2)" },
								children: t(locale, "panel.understanding")
							}),
							result.brief.scope !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { children: t(locale, "brief.scope", { text: result.brief.scope }) }),
							result.brief.approach !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { children: t(locale, "brief.approach", { text: result.brief.approach }) })
						]
					}),
					showRewrite && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						style: {
							display: "grid",
							gap: 6
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								display: "flex",
								alignItems: "center",
								gap: 6
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t(locale, "rewrite.title") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: {
									fontSize: 10,
									color: "var(--dsw-alias-label-tertiary, #8c8c8c)",
									border: "1px solid var(--dsw-alias-border-l2, rgba(255,255,255,.14))",
									borderRadius: 999,
									padding: "0 5px"
								},
								children: t(locale, "rewrite.safe")
							})]
						}), finalText.trim() === "" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: {
								color: "var(--dsw-alias-label-secondary, #b3b3b3)",
								lineHeight: 1.55
							},
							children: showOnlyReminder ? t(locale, "rewrite.emptyReminder") : t(locale, "rewrite.empty")
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: {
								whiteSpace: "pre-wrap",
								overflowWrap: "anywhere",
								lineHeight: 1.65,
								padding: "8px 9px",
								border: "1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.09))",
								borderRadius: 8,
								background: "var(--dsw-alias-bg-layer-1, #1a1a1a)"
							},
							children: finalText
						})]
					}),
					showRewrite && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						style: {
							display: "grid",
							gap: 6
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t(locale, "chips.title") }),
							result.constraints.length > 0 || result.signals.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									flexWrap: "wrap",
									gap: 6
								},
								children: [result.constraints.map((item, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Chip, {
									selected: card.selectedChips.constraints[index] === true,
									label: t(locale, "chips.constraint"),
									text: item.text,
									source: t(locale, `chips.source.${item.source}`),
									locale,
									disabled: interactionsDisabled,
									covered: alreadyPresent(result.rewrite, item.text),
									onToggle: () => toggleConstraintChip(sessionId, index)
								}, `constraint-${index}`)), result.signals.map((signal, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Chip, {
									selected: card.selectedChips.signals[index] === true,
									label: t(locale, "chips.signal"),
									text: signal,
									source: t(locale, "chips.source.context"),
									locale,
									disabled: interactionsDisabled,
									covered: alreadyPresent(result.rewrite, signal),
									onToggle: () => toggleSignalChip(sessionId, index)
								}, `signal-${index}`))]
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: {
									fontSize: 11,
									color: "var(--dsw-alias-label-tertiary, #8c8c8c)"
								},
								children: t(locale, "chips.none")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: {
									fontSize: 10,
									color: "var(--dsw-alias-label-tertiary, #8c8c8c)"
								},
								children: t(locale, "chips.hint")
							})
						]
					}),
					settingsOpen && !generating && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						"data-input-uplift-settings": "",
						style: {
							display: "grid",
							gap: 7,
							order: -1,
							borderTop: "1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.09))",
							paddingTop: 8
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									alignItems: "center",
									gap: 6
								},
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
										style: { fontSize: 11 },
										children: t(locale, "settings.title")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { style: { flex: 1 } }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										style: {
											fontSize: 10,
											color: "var(--dsw-alias-label-tertiary, #8c8c8c)"
										},
										children: t(locale, "settings.hint")
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								style: {
									display: "flex",
									alignItems: "center",
									gap: 8,
									fontSize: 11
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									style: {
										width: 64,
										color: "var(--dsw-alias-label-secondary, #b3b3b3)"
									},
									children: t(locale, "settings.detailLevel")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
									value: card.options.detailLevel,
									onChange: (event) => setOptions(sessionId, { detailLevel: event.target.value }),
									style: {
										font: "inherit",
										fontSize: 11,
										padding: "2px 6px",
										borderRadius: 6
									},
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: "concise",
											children: t(locale, "settings.detail.concise")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: "standard",
											children: t(locale, "settings.detail.standard")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: "detailed",
											children: t(locale, "settings.detail.detailed")
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								style: {
									display: "flex",
									alignItems: "center",
									gap: 8,
									fontSize: 11
								},
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										style: {
											width: 64,
											color: "var(--dsw-alias-label-secondary, #b3b3b3)"
										},
										children: t(locale, "settings.balanced")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "checkbox",
										checked: card.options.balanced,
										onChange: (event) => setOptions(sessionId, { balanced: event.target.checked })
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										style: {
											fontSize: 10,
											color: "var(--dsw-alias-label-tertiary, #8c8c8c)"
										},
										children: t(locale, "settings.balancedHint")
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								style: {
									display: "flex",
									alignItems: "center",
									gap: 8,
									fontSize: 11
								},
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										style: {
											width: 64,
											color: "var(--dsw-alias-label-secondary, #b3b3b3)"
										},
										children: t(locale, "settings.display")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
										value: card.options.displayMode,
										onChange: (event) => {
											const mode = event.target.value === "side" ? "side" : "overlay";
											setOptions(sessionId, { displayMode: mode });
											if (mode === "side") openUpliftSidebar(sessionId);
											else closeUpliftSidebar();
										},
										style: {
											font: "inherit",
											fontSize: 11,
											padding: "2px 6px",
											borderRadius: 6
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: "overlay",
											children: t(locale, "settings.display.overlay")
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: "side",
											children: t(locale, "settings.display.side")
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										style: {
											fontSize: 10,
											color: "var(--dsw-alias-label-tertiary, #8c8c8c)"
										},
										children: t(locale, "settings.displayHint")
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								style: {
									display: "flex",
									alignItems: "center",
									gap: 8,
									fontSize: 11
								},
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										style: {
											width: 64,
											color: "var(--dsw-alias-label-secondary, #b3b3b3)"
										},
										children: t(locale, "settings.model")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
										value: card.options.provider === "" || card.options.model === "" ? "" : `${card.options.provider}|${card.options.model}`,
										onChange: (event) => {
											const value = event.target.value;
											if (value === "") {
												setOptions(sessionId, {
													provider: "",
													model: ""
												});
												return;
											}
											const at = value.indexOf("|");
											if (at < 0) return;
											setOptions(sessionId, {
												provider: value.slice(0, at),
												model: value.slice(at + 1)
											});
										},
										style: {
											font: "inherit",
											fontSize: 11,
											padding: "2px 6px",
											borderRadius: 6,
											maxWidth: 260
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: "",
											children: t(locale, "settings.modelFollow")
										}), (models ?? []).map((provider) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("optgroup", {
											label: provider.name,
											children: provider.models.map((model) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
												value: `${provider.id}|${model.id}`,
												children: model.name
											}, `${provider.id}|${model.id}`))
										}, provider.id))]
									}),
									models !== null && models.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										style: {
											fontSize: 10,
											color: "var(--dsw-alias-label-tertiary, #8c8c8c)"
										},
										children: t(locale, "settings.modelEmpty")
									}),
									modelsLoading && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										style: {
											fontSize: 10,
											color: "var(--dsw-alias-label-tertiary, #8c8c8c)"
										},
										children: t(locale, "settings.modelLoading")
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								style: {
									display: "flex",
									alignItems: "center",
									gap: 8,
									fontSize: 11
								},
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										style: {
											width: 64,
											color: "var(--dsw-alias-label-secondary, #b3b3b3)"
										},
										children: t(locale, "settings.auto")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "number",
										min: 0,
										max: 120,
										step: 1,
										value: card.options.autoDelaySeconds,
										"aria-label": t(locale, "settings.auto"),
										onChange: (event) => {
											const value = Number(event.target.value);
											setOptions(sessionId, { autoDelaySeconds: Number.isFinite(value) ? Math.min(120, Math.max(0, Math.floor(value))) : 0 });
										},
										style: {
											width: 64,
											font: "inherit",
											fontSize: 11,
											padding: "2px 6px",
											borderRadius: 6
										}
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										style: {
											fontSize: 10,
											color: "var(--dsw-alias-label-secondary, #b3b3b3)"
										},
										children: t(locale, "settings.autoUnit")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										style: {
											fontSize: 10,
											color: "var(--dsw-alias-label-tertiary, #8c8c8c)"
										},
										children: t(locale, "settings.autoHint")
									})
								]
							})
						]
					}),
					showRewrite && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
						style: {
							borderTop: "1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.09))",
							paddingTop: 8
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("summary", {
							style: {
								cursor: "pointer",
								color: "var(--dsw-alias-label-secondary, #b3b3b3)"
							},
							children: [
								t(locale, "inference.title"),
								" · ",
								t(locale, "inference.summary", {
									inferred: result.assumptions.length + result.inferred_in_rewrite.length,
									unknowns: result.unknowns.length
								})
							]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: {
								display: "grid",
								gap: 7,
								padding: "7px 2px 0"
							},
							children: result.brief.purpose !== "" || result.brief.scope !== "" || result.brief.approach !== "" || result.brief.acceptance !== "" || result.brief.chain !== "" || result.assumptions.length > 0 || result.inferred_in_rewrite.length > 0 || result.unknowns.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
								(result.brief.purpose !== "" || result.brief.acceptance !== "" || result.brief.chain !== "") && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: {
										fontSize: 11,
										color: "var(--dsw-alias-label-secondary, #b3b3b3)",
										lineHeight: 1.6
									},
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
											style: { color: "var(--dsw-alias-label-primary, #f2f2f2)" },
											children: t(locale, "panel.understanding")
										}),
										result.brief.purpose !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { children: result.brief.purpose }),
										result.brief.chain !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { children: result.brief.chain }),
										result.brief.acceptance !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { children: result.brief.acceptance })
									]
								}),
								result.assumptions.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: {
										fontSize: 11,
										lineHeight: 1.6
									},
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t(locale, "inference.assumptions") }), result.assumptions.map((item, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: {
											color: "var(--dsw-alias-label-secondary, #b3b3b3)",
											marginTop: 3
										},
										children: [
											"· ",
											item.text,
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												style: {
													marginLeft: 4,
													color: "var(--dsw-alias-label-tertiary, #8c8c8c)"
												},
												children: [
													"(",
													item.reversible ? t(locale, "inference.reversible") : t(locale, "inference.irreversible"),
													")"
												]
											}),
											item.consequence !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
												style: {
													marginLeft: 8,
													color: "var(--dsw-alias-label-tertiary, #8c8c8c)"
												},
												children: t(locale, "inference.consequence", { text: item.consequence })
											})
										]
									}, `assumption-${index}`))]
								}),
								result.inferred_in_rewrite.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: {
										fontSize: 11,
										lineHeight: 1.6
									},
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t(locale, "inference.inferred") }), result.inferred_in_rewrite.map((item, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: {
											color: "var(--dsw-alias-label-secondary, #b3b3b3)",
											marginTop: 2
										},
										children: ["· ", item]
									}, `inferred-${index}`))]
								}),
								result.unknowns.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: {
										fontSize: 11,
										lineHeight: 1.6
									},
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t(locale, "inference.unknowns") }), result.unknowns.map((item, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: {
											color: "var(--dsw-alias-label-secondary, #b3b3b3)",
											marginTop: 2
										},
										children: ["· ", item]
									}, `unknown-${index}`))]
								})
							] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: {
									fontSize: 11,
									color: "var(--dsw-alias-label-tertiary, #8c8c8c)"
								},
								children: t(locale, "inference.none")
							})
						})]
					}),
					replaceErrorText !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						role: "alert",
						style: {
							color: "var(--dsw-alias-label-error, #f06a6a)",
							lineHeight: 1.55
						},
						children: replaceErrorText
					})
				]
			}),
			showRewrite && !generating && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				"data-input-uplift-supplement-wrap": "",
				style: {
					margin: "0 12px 8px",
					borderTop: "1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.09))",
					paddingTop: 8,
					display: "grid",
					gap: 6,
					flexShrink: 0
				},
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						alignItems: "center",
						gap: 6,
						flexWrap: "wrap"
					},
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
							style: { fontSize: 11 },
							children: t(locale, "supplement.title")
						}),
						card.supplementApplied && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: {
								fontSize: 10,
								padding: "1px 6px",
								borderRadius: 999,
								background: "rgba(77, 107, 254, .14)",
								color: "var(--dsw-alias-label-link, #6ea8fe)"
							},
							children: t(locale, "supplement.applied")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { style: { flex: 1 } }),
						card.supplementApplied ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActionButton, {
							kind: "ghost",
							onClick: () => undoSupplement(sessionId),
							children: t(locale, "supplement.undo")
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActionButton, {
							kind: "secondary",
							disabled: card.supplement.trim() === "" || interactionsDisabled || stale,
							onClick: () => applySupplement(sessionId),
							children: t(locale, "supplement.apply")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActionButton, {
							kind: "secondary",
							disabled: !canRegenerate || card.supplement.trim() === "",
							onClick: () => beginGeneration(sessionId, draft, draftRev, card.options, card.supplement, false),
							children: t(locale, "supplement.regenerate")
						})
					]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
					"data-input-uplift-supplement": "",
					value: card.supplement,
					rows: 2,
					placeholder: t(locale, "supplement.placeholder"),
					"aria-label": t(locale, "supplement.title"),
					onChange: (event) => setSupplement(sessionId, event.target.value),
					onMouseDown: (event) => event.stopPropagation(),
					style: {
						width: "100%",
						boxSizing: "border-box",
						resize: "vertical",
						minHeight: 40,
						maxHeight: 120,
						padding: "6px 8px",
						borderRadius: 8,
						border: "1px solid var(--dsw-alias-border-l1, rgba(0,0,0,.12))",
						background: "var(--dsw-alias-interactive-bg-hover, rgba(0,0,0,.04))",
						color: "inherit",
						font: "inherit",
						fontSize: 12,
						lineHeight: 1.5
					}
				})]
			}),
			confirmReferences && card.status === "ready" && !stale && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: {
					margin: "0 12px 8px",
					border: "1px solid rgba(234,179,8,.42)",
					background: "rgba(234,179,8,.08)",
					borderRadius: 8,
					padding: "8px 9px",
					display: "grid",
					gap: 6
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t(locale, "panel.chipWarningTitle") }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: {
							color: "var(--dsw-alias-label-secondary, #b3b3b3)",
							lineHeight: 1.55
						},
						children: t(locale, "panel.chipWarningBody")
					}),
					attachmentCount > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: {
							fontSize: 11,
							color: "var(--dsw-alias-label-tertiary, #8c8c8c)"
						},
						children: t(locale, "panel.attachmentNote", { count: attachmentCount })
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							gap: 6
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActionButton, {
							kind: "primary",
							onClick: replace,
							children: t(locale, "panel.confirmRemoveRefs")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActionButton, {
							kind: "ghost",
							onClick: () => setConfirmReferences(false),
							children: t(locale, "panel.cancel")
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", {
				style: {
					display: "flex",
					alignItems: "center",
					gap: 6,
					padding: "8px 12px",
					borderTop: "1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.09))",
					flexShrink: 0,
					flexWrap: "wrap"
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: {
							flex: 1,
							minWidth: 130,
							fontSize: 10,
							color: "var(--dsw-alias-label-tertiary, #8c8c8c)"
						},
						children: card.status === "replaced" ? sameAsApplied ? t(locale, "panel.readonlyReplaced") : t(locale, "panel.restoreUnavailable") : t(locale, "panel.sourceNote")
					}),
					generating && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActionButton, {
						kind: "secondary",
						onClick: close,
						children: t(locale, "panel.stop")
					}),
					card.status === "error" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActionButton, {
						kind: "primary",
						disabled: !canRegenerate,
						onClick: regenerate,
						children: t(locale, "panel.retry")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActionButton, {
						kind: "ghost",
						onClick: close,
						children: t(locale, "actions.close")
					})] }),
					card.status === "ready" && stale && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActionButton, {
						kind: "primary",
						disabled: !canRegenerate,
						onClick: regenerate,
						children: t(locale, "actions.regenerateNew")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActionButton, {
						kind: "ghost",
						onClick: close,
						children: t(locale, "actions.close")
					})] }),
					card.status === "ready" && !stale && !noUplift && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActionButton, {
							kind: "primary",
							disabled: replaceDisabled,
							onClick: replace,
							title: stale ? t(locale, "panel.staleBody") : void 0,
							children: t(locale, "actions.replace")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActionButton, {
							kind: "secondary",
							disabled: !canRegenerate,
							onClick: regenerate,
							children: t(locale, "actions.regenerate")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActionButton, {
							kind: "ghost",
							onClick: close,
							children: t(locale, "actions.close")
						})
					] }),
					card.status === "ready" && !stale && noUplift && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActionButton, {
						kind: "secondary",
						disabled: !canRegenerate,
						onClick: regenerate,
						children: t(locale, "actions.regenerate")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActionButton, {
						kind: "ghost",
						onClick: close,
						children: t(locale, "actions.close")
					})] }),
					card.status === "replaced" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
						sameAsApplied && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActionButton, {
							kind: "primary",
							disabled: !canRestore,
							onClick: restore,
							children: t(locale, "actions.restore")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActionButton, {
							kind: "secondary",
							disabled: !canRegenerate,
							onClick: regenerate,
							children: t(locale, "actions.regenerate")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActionButton, {
							kind: "ghost",
							onClick: close,
							children: t(locale, "actions.close")
						})
					] })
				]
			})
		]
	});
}

//#endregion
//#region src/client/SidebarTab.tsx
function emptyStateStyle() {
	return {
		height: "100%",
		display: "grid",
		alignContent: "center",
		justifyItems: "center",
		gap: 10,
		padding: 20,
		color: "var(--dsw-alias-label-secondary, #b3b3b3)",
		textAlign: "center"
	};
}
function SidebarUpliftPane(props) {
	const { sessionId, useInput, inputActions } = props;
	const locale = useLocale();
	const composing = useComposing();
	const card = useSessionState(sessionId);
	const draft = useInput((state) => state.draft);
	const draftRev = useInput((state) => state.draftRev);
	const phase = useInput((state) => state.phase);
	const canGenerate = draft.trim() !== "" && phase === "plain" && !composing && card.status !== "generating";
	if (card.status === "idle") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		"data-input-uplift-sidebar-empty": "",
		style: emptyStateStyle(),
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
				style: {
					fontSize: 13,
					color: "var(--dsw-alias-label-primary, #f2f2f2)"
				},
				children: t(locale, "sidebar.empty")
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: {
					fontSize: 12,
					lineHeight: 1.6
				},
				children: t(locale, "sidebar.emptyHint")
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					gap: 8
				},
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					disabled: !canGenerate,
					onMouseDown: (event) => event.preventDefault(),
					onClick: () => {
						if (!canGenerate) return;
						beginGeneration(sessionId, draft, draftRev, getPreferredOptions(sessionId), "", true);
					},
					style: {
						height: 28,
						padding: "0 12px",
						borderRadius: 7,
						border: "1px solid var(--dsw-alias-border-l2, rgba(255,255,255,.14))",
						background: "var(--dsw-alias-state-business-primary, #4d6bfe)",
						color: "#fff",
						font: "inherit",
						fontSize: 12,
						cursor: canGenerate ? "pointer" : "default",
						opacity: canGenerate ? 1 : .5
					},
					children: t(locale, "sidebar.generate")
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					onMouseDown: (event) => event.preventDefault(),
					onClick: () => closeUpliftSidebar(),
					style: {
						height: 28,
						padding: "0 10px",
						borderRadius: 7,
						border: "1px solid var(--dsw-alias-border-l2, rgba(255,255,255,.14))",
						background: "transparent",
						color: "inherit",
						font: "inherit",
						fontSize: 12,
						cursor: "pointer"
					},
					children: t(locale, "sidebar.close")
				})]
			})
		]
	});
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
		style: {
			height: "100%",
			minHeight: 0,
			display: "flex",
			flexDirection: "column"
		},
		children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(UpliftPanel, {
			...props,
			inputActions,
			variant: "sidebar"
		})
	});
}

//#endregion
//#region src/client/index.tsx
/**
* Browser half. Registers a tool-row trigger and one non-modal overlay card.
*
* `slots` and `sessions` are hard Cordis services. `locale` and `shortcuts`
* are optional and therefore injected through `ctx.inject` rather than being
* placed in the top-level activation gate.
*/
const inject = ["slots", "sessions"];
function bridgeLocale(ctx) {
	let disposed = false;
	const cleanups = [];
	ctx.inject(["locale"], (scope) => {
		if (disposed) return;
		const service = scope.get("locale");
		if (service === void 0) return;
		for (const [localeId, dictionary] of Object.entries(DICTIONARIES)) try {
			const off = service.register?.(LOCALE_NS, localeId, { ...dictionary });
			if (typeof off === "function") cleanups.push(off);
		} catch {}
		const sync = () => {
			try {
				const active = service.getLocale?.()?.active;
				if (typeof active === "string" && active !== "") setLocale(active);
			} catch {}
		};
		sync();
		try {
			const off = service.subscribe?.(sync);
			if (typeof off === "function") cleanups.push(off);
		} catch {}
	});
	return () => {
		disposed = true;
		for (const cleanup of cleanups.splice(0)) try {
			cleanup();
		} catch {}
	};
}
function registerShortcut(ctx) {
	ctx.inject(["shortcuts"], (scope) => {
		const service = scope.get("shortcuts");
		if (service === void 0 || typeof service.register !== "function") return;
		const install = () => {
			try {
				const dispose = service.register({
					id: "input.uplift",
					label: () => t(getLocale(), "trigger.label"),
					aliases: ["input uplift", "uplift input"],
					defaults: {
						"desktop:macos": {
							code: "KeyU",
							modifiers: ["primary", "alt"]
						},
						"desktop:windows": {
							code: "KeyU",
							modifiers: ["primary", "alt"]
						},
						"desktop:linux": {
							code: "KeyU",
							modifiers: ["primary", "alt"]
						},
						"web:macos": {
							code: "KeyU",
							modifiers: ["primary", "alt"]
						},
						"web:windows": {
							code: "KeyU",
							modifiers: ["primary", "alt"]
						}
					},
					regions: ["page", "editable"],
					modals: [],
					resolve: () => ({
						status: "handled",
						run: () => {
							if (!isComposingNow()) requestShortcutUplift();
						}
					})
				});
				return typeof dispose === "function" ? dispose : () => {};
			} catch (error) {
				console.warn("[input-uplift] shortcut registration skipped:", error instanceof Error ? error.message : String(error));
				return () => {};
			}
		};
		if (typeof scope.effect === "function") scope.effect(install, "input-uplift: shortcut");
		else install();
	});
}
const SIDEBAR_TAB_ID_LOCAL = SIDEBAR_TAB_ID;
const SIDEBAR_TAB_KIND_LOCAL = SIDEBAR_TAB_KIND;
function registerSidebarTab(ctx) {
	ctx.inject(["sidebarRightTabs", "sidebarRight"], (scope) => {
		const tabs = scope.get("sidebarRightTabs");
		const right = scope.get("sidebarRight");
		if (tabs === void 0 || right === void 0) {
			console.warn("[input-uplift] sidebarRight services unavailable; side tab not registered");
			return;
		}
		const install = () => {
			let disposeType;
			try {
				disposeType = tabs.register({
					id: SIDEBAR_TAB_ID_LOCAL,
					kind: SIDEBAR_TAB_KIND_LOCAL,
					title: () => t(getLocale(), "sidebar.title")
				});
			} catch (error) {
				console.warn("[input-uplift] sidebar tab type registration skipped:", error instanceof Error ? error.message : String(error));
				return () => {};
			}
			globalThis.__iuSidebar = {
				openTab: (sessionId) => right.openTab(SIDEBAR_TAB_KIND_LOCAL, { params: { sessionId } }),
				closeActive: () => {
					try {
						const tabId = (right.active?.())?.id;
						if (typeof tabId === "string" && typeof right.close === "function") right.close(tabId);
					} catch {}
				},
				isAvailable: () => true
			};
			console.info("[input-uplift] sidebar tab type registered:", SIDEBAR_TAB_KIND_LOCAL);
			return () => {
				if (typeof disposeType === "function") disposeType();
				if (globalThis.__iuSidebar !== void 0) delete globalThis.__iuSidebar;
			};
		};
		if (typeof scope.effect === "function") scope.effect(install, "input-uplift: sidebar tab type");
		else install();
	});
}
/** Client entry. Returns a disposer so cordis can tear the slots down. */
function apply(ctx) {
	const disposers = [];
	ensureStyles();
	disposers.push(removeStyles);
	const disposeTrigger = ctx.slots.inject("conversation.input.right", () => ctx.slots.register({
		name: "conversation.input.right",
		id: "input-uplift-trigger",
		order: 20
	}, TriggerButton));
	if (typeof disposeTrigger === "function") disposers.push(disposeTrigger);
	const disposeCard = ctx.slots.inject("conversation.input.overlay", () => ctx.slots.register({
		name: "conversation.input.overlay",
		id: "input-uplift-card",
		order: 20,
		locale: LOCALE_NS
	}, UpliftPanel));
	if (typeof disposeCard === "function") disposers.push(disposeCard);
	disposers.push(bridgeLocale(ctx));
	registerShortcut(ctx);
	registerSidebarTab(ctx);
	const disposeSidebarBody = ctx.slots.inject("sidebar.right.pane.tab", () => ctx.slots.register({
		name: "sidebar.right.pane.tab",
		key: SIDEBAR_TAB_ID
	}, SidebarUpliftPane));
	if (typeof disposeSidebarBody === "function") disposers.push(disposeSidebarBody);
	console.info("[input-uplift] client active; trigger=conversation.input.right overlay=conversation.input.overlay");
	return () => {
		for (const dispose of disposers.splice(0)) try {
			dispose();
		} catch {}
	};
}

//#endregion
exports.apply = apply;
exports.inject = inject;
return module.exports; } });