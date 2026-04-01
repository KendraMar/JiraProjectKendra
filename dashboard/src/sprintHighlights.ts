import type { JiraComment, JiraIssue } from "./types";

export function sprintYearFromSprintName(name: string): number {
  const m = name.match(/(20\d{2})\s*$/);
  return m ? parseInt(m[1], 10) : new Date().getFullYear();
}

export function sprintDateWindow(
  startLabel: string | undefined,
  endLabel: string | undefined,
  year: number
): { start: Date; end: Date } | null {
  if (!startLabel || !endLabel) return null;
  const start = new Date(`${startLabel} ${year}`);
  const end = new Date(`${endLabel} ${year}`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function commentCreatedDate(c: JiraComment): Date | null {
  if (c.createdIso) {
    const d = new Date(c.createdIso);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(c.created);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function filterCommentsInSprint(comments: JiraComment[], start: Date, end: Date): JiraComment[] {
  return comments.filter((c) => {
    const t = commentCreatedDate(c);
    if (!t) return false;
    return t >= start && t <= end;
  });
}

export function htmlToPlain(html: string): string {
  if (!html) return "";
  if (typeof document === "undefined") {
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent || "").replace(/\s+/g, " ").trim();
}

function shortenForBullet(text: string, maxLen: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= maxLen) return t;
  const cut = t.slice(0, maxLen - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 32 ? cut.slice(0, lastSpace) : cut) + "…";
}

/** Remove leading bracket tags like [UXD explore] from summaries */
function cleanSummary(summary: string): string {
  return summary.replace(/^\[[^\]]+\]\s*/g, "").trim();
}

/** Strip recurring epic title prefix from generated report headings */
function stripUxdEpicPrefix(epicName: string): string {
  return epicName.replace(/^\[\s*uxd\s+epic\s*\]\s*/i, "").trim();
}

/**
 * Irregular / common imperative → past (first word of summary treated as a verb when matched here).
 */
const IRREGULAR_VERB_PAST = new Map<string, string>([
  ["add", "Added"],
  ["align", "Aligned"],
  ["apply", "Applied"],
  ["audit", "Audited"],
  ["automate", "Automated"],
  ["backfill", "Backfilled"],
  ["branch", "Branched"],
  ["build", "Built"],
  ["bump", "Bumped"],
  ["clarify", "Clarified"],
  ["clean", "Cleaned"],
  ["consolidate", "Consolidated"],
  ["copy", "Copied"],
  ["create", "Created"],
  ["debug", "Debugged"],
  ["define", "Defined"],
  ["delete", "Deleted"],
  ["deploy", "Deployed"],
  ["deprecate", "Deprecated"],
  ["design", "Designed"],
  ["develop", "Developed"],
  ["disable", "Disabled"],
  ["document", "Documented"],
  ["draft", "Drafted"],
  ["drive", "Drove"],
  ["enable", "Enabled"],
  ["enhance", "Enhanced"],
  ["expand", "Expanded"],
  ["expose", "Exposed"],
  ["extract", "Extracted"],
  ["finalize", "Finalized"],
  ["fix", "Fixed"],
  ["format", "Formatted"],
  ["gather", "Gathered"],
  ["hide", "Hid"],
  ["implement", "Implemented"],
  ["improve", "Improved"],
  ["include", "Included"],
  ["integrate", "Integrated"],
  ["introduce", "Introduced"],
  ["iterate", "Iterated"],
  ["land", "Landed"],
  ["launch", "Launched"],
  ["lift", "Lifted"],
  ["link", "Linked"],
  ["load", "Loaded"],
  ["lock", "Locked"],
  ["merge", "Merged"],
  ["migrate", "Migrated"],
  ["move", "Moved"],
  ["open", "Opened"],
  ["outline", "Outlined"],
  ["parse", "Parsed"],
  ["patch", "Patched"],
  ["polish", "Polished"],
  ["port", "Ported"],
  ["prepare", "Prepared"],
  ["prototype", "Prototyped"],
  ["publish", "Published"],
  ["purge", "Purged"],
  ["refactor", "Refactored"],
  ["release", "Released"],
  ["remove", "Removed"],
  ["rename", "Renamed"],
  ["reorder", "Reordered"],
  ["replace", "Replaced"],
  ["revert", "Reverted"],
  ["revise", "Revised"],
  ["rework", "Reworked"],
  ["roll", "Rolled"],
  ["run", "Ran"],
  ["send", "Sent"],
  ["set", "Set"],
  ["ship", "Shipped"],
  ["show", "Showed"],
  ["simplify", "Simplified"],
  ["split", "Split"],
  ["standardize", "Standardized"],
  ["support", "Supported"],
  ["surface", "Surfaced"],
  ["sync", "Synced"],
  ["test", "Tested"],
  ["tighten", "Tightened"],
  ["toggle", "Toggled"],
  ["trim", "Trimmed"],
  ["tune", "Tuned"],
  ["unblock", "Unblocked"],
  ["undo", "Undid"],
  ["unify", "Unified"],
  ["update", "Updated"],
  ["upgrade", "Upgraded"],
  ["validate", "Validated"],
  ["wire", "Wired"],
]);

/**
 * Story titles that often start with a noun/proper noun — do not treat as verbs for -ed fallback.
 */
const LEADING_NON_VERB_WORDS = new Set([
  "amplitude",
  "analytics",
  "api",
  "auth",
  "authz",
  "aws",
  "banner",
  "beta",
  "billing",
  "brand",
  "chrome",
  "chroming",
  "cloud",
  "console",
  "content",
  "context",
  "cursor",
  "dashboard",
  "data",
  "error",
  "feature",
  "field",
  "footer",
  "flow",
  "form",
  "gcp",
  "hcc",
  "header",
  "help",
  "homepage",
  "hybrid",
  "iam",
  "integration",
  "jira",
  "kessel",
  "masthead",
  "menu",
  "modal",
  "navigation",
  "oauth",
  "org",
  "page",
  "panel",
  "pattern",
  "platform",
  "product",
  "rbac",
  "redhat",
  "scope",
  "security",
  "service",
  "sidebar",
  "settings",
  "sources",
  "sso",
  "story",
  "title",
  "subscription",
  "subscriptions",
  "swatch",
  "table",
  "toast",
  "ux",
  "ui",
  "user",
  "users",
  "uxd",
  "version",
  "widget",
]);

function normalizeLeadingWordToken(raw: string): string {
  return raw.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, "").toLowerCase();
}

/** Past-tense form for sentence start, or null if the first word is not treated as a verb. */
function pastTenseForLeadingVerb(firstWordRaw: string): string | null {
  const key = normalizeLeadingWordToken(firstWordRaw);
  if (!key) return null;

  const irregular = IRREGULAR_VERB_PAST.get(key);
  if (irregular) return irregular;

  if (!/^[a-z]+$/.test(key) || key.length < 5 || key.length > 20) return null;
  if (LEADING_NON_VERB_WORDS.has(key)) return null;
  if (key.endsWith("ing") || key.endsWith("ed")) return null;
  if (key.endsWith("s") && key.length > 3) return null;

  let pastLower: string;
  if (key.endsWith("e")) {
    pastLower = `${key}d`;
  } else if (key.length >= 2 && key.endsWith("y") && !"aeiou".includes(key[key.length - 2]!)) {
    pastLower = `${key.slice(0, -1)}ied`;
  } else {
    pastLower = `${key}ed`;
  }

  return pastLower.charAt(0).toUpperCase() + pastLower.slice(1);
}

function stripLeadingVerbIfAny(phrase: string): string {
  const words = phrase.trim().split(/\s+/);
  if (words.length < 2) return phrase.trim();
  if (pastTenseForLeadingVerb(words[0]!) === null) return phrase.trim();
  const rest = words.slice(1).join(" ").trim();
  if (!rest) return phrase.trim();
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

/**
 * Phrase for highlight sentences (no issue key).
 * If the first word is a verb → closed lines use past-tense lead; active lines drop the verb (object only).
 * Otherwise → closed uses "Completed …"; active uses the summary phrase as-is (trimmed to max words).
 */
function highlightTopic(issue: JiraIssue, intent: "closed" | "active", maxWords = 22): string {
  const t = cleanSummary(issue.summary).replace(/\s+/g, " ").trim();
  if (!t) {
    if (issue.activityType) {
      const fb = `${issue.activityType} work`;
      return intent === "closed" ? `Completed ${fb}` : fb;
    }
    return intent === "closed" ? "Completed this initiative" : "this initiative";
  }

  const words = t.split(/\s+/);
  const past = pastTenseForLeadingVerb(words[0]!);

  if (past !== null && words.length >= 2) {
    const restWords = words.slice(1);
    const limit = restWords.slice(0, maxWords);
    const ellipsed = restWords.length > maxWords ? "…" : "";
    const rest = limit.join(" ") + ellipsed;
    if (intent === "closed") {
      return `${past} ${rest}`;
    }
    return rest.charAt(0).toUpperCase() + rest.slice(1);
  }

  const limit = words.slice(0, maxWords);
  const ellipsed = words.length > maxWords ? "…" : "";
  const phrase = limit.join(" ") + ellipsed;
  const capped = phrase.charAt(0).toUpperCase() + phrase.slice(1);
  if (intent === "closed") {
    return `Completed ${capped}`;
  }
  return capped;
}

/** Design / build activity phrasing from comments (before generic "plans to" patterns). */
function extractActivityPhrase(corpus: string): string | null {
  const p = corpus.replace(/\s+/g, " ").trim();
  if (p.length < 12) return null;

  const design = p.match(
    /\b(mocking\s+up\s+[^.!?]{8,}?|mockup\s+designs?\s+for\s+[^.!?]{8,}?|designs?\s+for\s+(?:the\s+)?[^.!?]{8,}?)(?=[.!?]|;|$)/i
  );
  if (design?.[1]) {
    let s = design[1].trim().replace(/\s*[.;:]+$/g, "").trim();
    s = s.replace(/\s*\([^)]{20,}\)\s*$/g, "").trim();
    if (s.length >= 10) return shortenForBullet(s, 100);
  }
  return null;
}

/**
 * Pull a short follow-on clause from comments for "Worked on X by …" — not pasted paragraphs.
 */
function extractPlanDetail(corpus: string): string | null {
  const p = corpus.replace(/\s+/g, " ").trim();
  if (p.length < 12) return null;

  const tryPatterns: RegExp[] = [
    /\bplans?\s+to\s+([^.!?\n]{12,}?)(?=[.!?]|$)/i,
    /\bplanning\s+to\s+([^.!?\n]{12,}?)(?=[.!?]|$)/i,
    /\bgoing\s+to\s+([^.!?\n]{12,}?)(?=[.!?]|$)/i,
    /\bintend(?:s|ing)?\s+to\s+([^.!?\n]{12,}?)(?=[.!?]|$)/i,
    /\bhoping\s+to\s+([^.!?\n]{12,}?)(?=[.!?]|$)/i,
    /\bworking\s+on\s+([^.!?\n]{12,}?)(?=[.!?]|$)/i,
    /\bnext\s*(?:step)?[:\s]+([^.!?\n]{12,}?)(?=[.!?]|$)/i,
    /\bwill\s+([^.!?\n]{12,}?)(?=[.!?]|$)/i,
    /\bcreate\s+(?:a\s+)?([^.!?\n]{12,}?)(?=[.!?]|$)/i,
    /\bbuilding\s+(?:a\s+)?([^.!?\n]{12,}?)(?=[.!?]|$)/i,
    /\brolled?\s+out\s+([^.!?\n]{12,}?)(?=[.!?]|$)/i,
  ];

  for (const re of tryPatterns) {
    const m = p.match(re);
    if (!m?.[1]) continue;
    let clause = m[1].trim();
    clause = clause.replace(/^(the|a|an)\s+/i, "").trim();
    clause = clause.replace(/\s*\([^)]{20,}\)\s*$/g, "").trim();
    if (clause.length < 12) continue;
    clause = shortenForBullet(clause, 92);
    clause = clause.replace(/\s*[.!?]+\s*$/, "").trim();
    return clause;
  }

  return null;
}

/** Clause after "by" — lowercase lead-in, trim noisy parentheticals */
function byPhraseFromDetail(detail: string): string {
  let d = detail.trim().replace(/\s*[.!?]+$/, "");
  d = d.replace(/\s*\([^)]{15,}\)\s*$/g, "").trim();
  d = shortenForBullet(d, 100);
  if (!d) return d;
  return d.charAt(0).toLowerCase() + d.slice(1);
}

/** Only these workflow statuses appear in sprint highlight output. */
type HighlightStatusKind = "progress" | "review" | "closed";

function highlightStatusKind(status: string): HighlightStatusKind | null {
  const s = status.trim().toLowerCase();
  if (s === "in progress") return "progress";
  if (s === "review" || s === "in review" || s === "ready for review") return "review";
  if (s === "closed" || s === "done") return "closed";
  return null;
}

/** Same statuses used when building highlight lines (modal list is filtered to these). */
export function isHighlightEligibleStatus(status: string): boolean {
  return highlightStatusKind(status) !== null;
}

function lineClosed(issue: JiraIssue): string {
  return `${highlightTopic(issue, "closed")}.`;
}

function lineReview(
  issue: JiraIssue,
  commentsByKey: Map<string, JiraComment[]>,
  window: { start: Date; end: Date }
): string {
  const topic = highlightTopic(issue, "active");
  const plains = inSprintPlainComments(issue, commentsByKey, window);
  const corpus = [...plains].reverse().join(" ");
  const activity = extractActivityPhrase(corpus);
  const plan = extractPlanDetail(corpus);
  const detailRaw = activity ?? plan;
  if (detailRaw) {
    const part = byPhraseFromDetail(detailRaw);
    return `Submitted ${topic} for review — ${part}.`;
  }
  return `Submitted ${topic} for review.`;
}

function inSprintPlainComments(
  issue: JiraIssue,
  commentsByKey: Map<string, JiraComment[]>,
  window: { start: Date; end: Date }
): string[] {
  const raw = commentsByKey.get(issue.key) ?? issue.comments ?? [];
  const inSprint = filterCommentsInSprint(raw, window.start, window.end);
  return inSprint.map((c) => htmlToPlain(c.body)).filter(Boolean);
}

function lineInProgress(
  issue: JiraIssue,
  commentsByKey: Map<string, JiraComment[]>,
  window: { start: Date; end: Date }
): string {
  const topic = highlightTopic(issue, "active");
  const plains = inSprintPlainComments(issue, commentsByKey, window);
  const corpus = [...plains].reverse().join(" ");

  const activity = extractActivityPhrase(corpus);
  const plan = extractPlanDetail(corpus);
  const detailRaw = activity ?? plan;
  if (detailRaw) {
    const byPart = byPhraseFromDetail(detailRaw);
    return `Worked on ${topic} by ${byPart}.`;
  }

  const full = cleanSummary(issue.summary).replace(/\s+/g, " ").trim();
  const colonIdx = full.indexOf(":");
  if (colonIdx > 4 && colonIdx < full.length - 18) {
    let head = stripLeadingVerbIfAny(full.slice(0, colonIdx).trim());
    let tail = stripLeadingVerbIfAny(full.slice(colonIdx + 1).trim());
    const hw = head.split(/\s+/);
    head = hw.slice(0, 14).join(" ") + (hw.length > 14 ? "…" : "");
    tail = shortenForBullet(tail, 95);
    if (tail.length > 14) {
      return `Worked on ${head.charAt(0).toUpperCase() + head.slice(1)} by ${tail.charAt(0).toLowerCase() + tail.slice(1)}.`;
    }
  }

  const t = topic.charAt(0).toLowerCase() + topic.slice(1);
  return `Making progress on ${t}.`;
}

function dedupeHighlightItems(items: { text: string; issue: JiraIssue }[]): { text: string; issue: JiraIssue }[] {
  const out: { text: string; issue: JiraIssue }[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const fp = item.text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .slice(0, 12)
      .join(" ");
    if (fp.length < 16 || seen.has(fp)) continue;
    seen.add(fp);
    out.push(item);
  }
  return out;
}

const MAX_BULLETS_PER_EPIC = 5;
const MAX_IN_PROGRESS_LINES = 4;
const MAX_REVIEW_LINES = 4;
const MAX_CLOSED_LINES = 4;

/** Share-out lines with source issue (for thematic grouping). */
function summarizeEpicGroupItems(
  epicIssues: JiraIssue[],
  commentsByKey: Map<string, JiraComment[]>,
  window: { start: Date; end: Date }
): { text: string; issue: JiraIssue }[] {
  const eligible = epicIssues.filter((i) => highlightStatusKind(i.status) !== null);
  if (eligible.length === 0) return [];

  const inProg = eligible.filter((i) => highlightStatusKind(i.status) === "progress");
  const review = eligible.filter((i) => highlightStatusKind(i.status) === "review");
  const closed = eligible.filter((i) => highlightStatusKind(i.status) === "closed");

  const raw: { text: string; issue: JiraIssue }[] = [];
  for (const issue of inProg.slice(0, MAX_IN_PROGRESS_LINES)) {
    raw.push({ text: lineInProgress(issue, commentsByKey, window), issue });
  }
  for (const issue of review.slice(0, MAX_REVIEW_LINES)) {
    raw.push({ text: lineReview(issue, commentsByKey, window), issue });
  }
  for (const issue of closed.slice(0, MAX_CLOSED_LINES)) {
    raw.push({ text: lineClosed(issue), issue });
  }

  const deduped = dedupeHighlightItems(raw);
  return deduped.slice(0, MAX_BULLETS_PER_EPIC);
}

function collectHighlightItems(
  issues: JiraIssue[],
  selectedKeys: Set<string>,
  commentsByKey: Map<string, JiraComment[]>,
  window: { start: Date; end: Date }
): { text: string; issue: JiraIssue }[] {
  const sortedIssues = [...issues]
    .filter((i) => selectedKeys.has(i.key))
    .sort((a, b) => a.key.localeCompare(b.key));

  const epicGroups = new Map<string, JiraIssue[]>();
  for (const issue of sortedIssues) {
    const rawEpic = issue.epicName.trim();
    const epicHeading = rawEpic
      ? `${stripUxdEpicPrefix(rawEpic)}${issue.epicKey ? ` (${issue.epicKey})` : ""}`
      : "No epic";
    if (!epicGroups.has(epicHeading)) epicGroups.set(epicHeading, []);
    epicGroups.get(epicHeading)!.push(issue);
  }

  const items: { text: string; issue: JiraIssue }[] = [];
  for (const [, epicIssues] of [...epicGroups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    items.push(...summarizeEpicGroupItems(epicIssues, commentsByKey, window));
  }
  return items;
}

/** Fixed order for UI and plain-text export. */
export const THEMATIC_GROUP_ORDER = [
  "Kessel / AuthZ",
  "Console Settings",
  "Subscriptions",
  "Chroming",
  "AI",
  "Other",
] as const;

export type ThematicGroupId = (typeof THEMATIC_GROUP_ORDER)[number];

export type ThematicHighlightSection = { group: ThematicGroupId; bullets: string[] };

/** One draggable highlight line in the sprint highlights editor. */
export type HighlightRow = { id: string; text: string; /** When true, omitted from slide and plain-text export */ hidden?: boolean };

/** All thematic groups, each with an ordered list of highlights (for drag-and-drop UI). */
export type HighlightBucketState = { [K in ThematicGroupId]: HighlightRow[] };

export function emptyHighlightBuckets(): HighlightBucketState {
  return {
    "Kessel / AuthZ": [],
    "Console Settings": [],
    Subscriptions: [],
    Chroming: [],
    AI: [],
    Other: [],
  };
}

/** Stable random id for highlight rows (generated and manual). */
export function newHighlightRowId(prefix = "hl"): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function sectionsToHighlightBuckets(sections: ThematicHighlightSection[]): HighlightBucketState {
  const b = emptyHighlightBuckets();
  for (const s of sections) {
    for (const text of s.bullets) {
      b[s.group].push({ id: newHighlightRowId(), text });
    }
  }
  return b;
}

/** Rows included in slide / export (hidden and blank lines removed, `hidden` stripped). */
export function highlightBucketsVisibleOnly(buckets: HighlightBucketState): HighlightBucketState {
  return Object.fromEntries(
    THEMATIC_GROUP_ORDER.map((g) => [
      g,
      buckets[g]
        .filter((r) => !r.hidden && r.text.trim().length > 0)
        .map(({ id, text }) => ({ id, text })),
    ])
  ) as HighlightBucketState;
}

/** Plain text export from the editable bucket state (empty groups omitted; hidden lines skipped). */
export function highlightBucketsToPlainText(buckets: HighlightBucketState, sprintTitle: string): string {
  return highlightBucketsToPlainTextFromVisible(highlightBucketsVisibleOnly(buckets), sprintTitle);
}

function highlightBucketsToPlainTextFromVisible(buckets: HighlightBucketState, sprintTitle: string): string {
  const parts: string[] = [`Sprint highlights — ${sprintTitle}`, ""];
  for (const g of THEMATIC_GROUP_ORDER) {
    const rows = buckets[g];
    if (rows.length === 0) continue;
    parts.push(g);
    for (const { text } of rows) {
      parts.push(`• ${text}`);
    }
    parts.push("");
  }
  return parts.join("\n").trimEnd();
}

/**
 * Classify by story summary. If several themes match, Kessel / AuthZ wins, then Subscriptions, then the rest.
 */
export function classifyThematicGroup(summary: string): ThematicGroupId {
  const t = cleanSummary(summary).toLowerCase();

  if (/\brbac\b/i.test(t) || /\biam\b/i.test(t) || /\bauthz\b/i.test(t) || /kessel/i.test(t)) {
    return "Kessel / AuthZ";
  }
  if (/\bsubscriptions?\b/i.test(t) || /\bswatch\b/i.test(t) || /\bsubs\b/i.test(t)) {
    return "Subscriptions";
  }
  if (
    /\bnotifications?\b/i.test(t) ||
    /\bintegrations?\b/i.test(t) ||
    /\balerts?\b/i.test(t) ||
    /\bsources?\b/i.test(t) ||
    /\bsettings?\b/i.test(t)
  ) {
    return "Console Settings";
  }
  if (
    /help\s+panel/i.test(t) ||
    /\bhomepage\b/i.test(t) ||
    /\bdashboard\b/i.test(t) ||
    /masthead/i.test(t) ||
    /chatbot/i.test(t) ||
    /virtual\s+assistant/i.test(t) ||
    /\bnavigation\b/i.test(t)
  ) {
    return "Chroming";
  }
  if (/\bai\b/i.test(t) || /\bagents?\b/i.test(t) || /\bmcps?\b/i.test(t) || /\bcursor\b/i.test(t) || /\bclaude\b/i.test(t)) {
    return "AI";
  }
  return "Other";
}

export function buildThematicHighlightSections(
  issues: JiraIssue[],
  selectedKeys: Set<string>,
  commentsByKey: Map<string, JiraComment[]>,
  window: { start: Date; end: Date }
): ThematicHighlightSection[] {
  const items = collectHighlightItems(issues, selectedKeys, commentsByKey, window);
  const buckets = new Map<ThematicGroupId, string[]>();
  for (const g of THEMATIC_GROUP_ORDER) {
    buckets.set(g, []);
  }
  for (const { text, issue } of items) {
    const g = classifyThematicGroup(issue.summary);
    buckets.get(g)!.push(text);
  }
  return THEMATIC_GROUP_ORDER.filter((g) => (buckets.get(g)?.length ?? 0) > 0).map((g) => ({
    group: g,
    bullets: buckets.get(g)!,
  }));
}

/** Plain text for email/slides paste (no markdown). */
export function thematicHighlightsToPlainText(sections: ThematicHighlightSection[], sprintTitle: string): string {
  const parts: string[] = [`Sprint highlights — ${sprintTitle}`, ""];
  for (const s of sections) {
    parts.push(s.group);
    for (const b of s.bullets) {
      parts.push(`• ${b}`);
    }
    parts.push("");
  }
  return parts.join("\n").trimEnd();
}
