import { forwardRef, useMemo } from "react";

import { THEMATIC_GROUP_ORDER, type HighlightBucketState, type ThematicGroupId } from "./sprintHighlights";

export const SLIDE_CAPTURE_WIDTH = 1920;
export const SLIDE_CAPTURE_HEIGHT = 1080;

const RH_RED = "#ee0000";
const HIGHLIGHT_YELLOW = "#ffef5e";

/** Effective chars per line for height estimate (narrow column, ~24px bullet text). */
const CHARS_PER_LINE = 48;

type Props = {
  sprintTitle: string;
  buckets: HighlightBucketState;
};

function estimatedBulletLines(text: string): number {
  const t = text.trim();
  if (!t.length) return 1;
  return Math.max(1, Math.ceil(t.length / CHARS_PER_LINE));
}

/** Relative vertical weight for balancing columns (title + bullets + section gap). */
function groupContentWeight(groupId: ThematicGroupId, buckets: HighlightBucketState): number {
  const rows = buckets[groupId];
  if (rows.length === 0) return 0;
  let w = 2.4; // section title block
  for (const r of rows) {
    w += estimatedBulletLines(r.text);
  }
  w += 0.35; // margin between sections
  return w;
}

/**
 * Split non-empty groups into two columns with minimal weight imbalance.
 * Preserves thematic order within each column. With 2+ groups, both columns are non-empty.
 */
function splitGroupsBalanced(present: ThematicGroupId[], buckets: HighlightBucketState): [ThematicGroupId[], ThematicGroupId[]] {
  const n = present.length;
  if (n === 0) return [[], []];
  if (n === 1) return [[present[0]!], []];

  const weights = present.map((g) => groupContentWeight(g, buckets));

  let bestMask = (1 << (n - 1)) - 1; // e.g. n=3 → 011 first group left, rest right
  let bestDiff = Infinity;

  for (let mask = 0; mask < 1 << n; mask++) {
    let lw = 0;
    let rw = 0;
    let leftCount = 0;
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        lw += weights[i]!;
        leftCount += 1;
      } else {
        rw += weights[i]!;
      }
    }
    const rightCount = n - leftCount;
    if (leftCount === 0 || rightCount === 0) continue;

    const diff = Math.abs(lw - rw);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestMask = mask;
    }
  }

  const left: ThematicGroupId[] = [];
  const right: ThematicGroupId[] = [];
  for (let i = 0; i < n; i++) {
    if (bestMask & (1 << i)) left.push(present[i]!);
    else right.push(present[i]!);
  }
  return [left, right];
}

function RedHatMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size * 1.2} height={size} viewBox="0 0 120 100" aria-hidden style={{ flexShrink: 0 }}>
      <path
        fill={RH_RED}
        d="M60 8c-22 0-40 14-44 34 8-4 18-6 28-6 12 0 24 3 34 10-4-22-24-38-48-38-28 0-50 22-50 50s22 50 50 50c18 0 34-10 42-24-6 4-14 6-22 6-10 0-20-3-28-8 4 18 20 32 40 32 22 0 40-18 40-40 0-36-28-66-62-66z"
      />
    </svg>
  );
}

function GroupBlock({ groupId, buckets }: { groupId: ThematicGroupId; buckets: HighlightBucketState }) {
  const rows = buckets[groupId];
  return (
    <section style={{ marginBottom: 22 }}>
      <h3
        style={{
          margin: "0 0 14px",
          fontSize: 28,
          fontWeight: 700,
          color: "#1a1a1a",
          lineHeight: 1.2,
        }}
      >
        {groupId}
      </h3>
      <ul
        style={{
          margin: 0,
          paddingLeft: 32,
          fontSize: 24,
          lineHeight: 1.45,
          color: "#1a1a1a",
          listStyleType: "disc",
        }}
      >
        {rows.map((row) => (
          <li key={row.id} style={{ marginBottom: 8 }}>
            {row.text}
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Console Dot UXD sprint highlights slide — white deck, red accents, two columns balanced by content.
 * Empty thematic groups are omitted. Rasterize with html-to-image.
 */
export const SprintHighlightsSlideCapture = forwardRef<HTMLDivElement, Props>(
  function SprintHighlightsSlideCapture({ sprintTitle, buckets }, ref) {
    const [leftGroups, rightGroups] = useMemo(() => {
      const present = THEMATIC_GROUP_ORDER.filter((g) => buckets[g].length > 0);
      return splitGroupsBalanced(present, buckets);
    }, [buckets]);

    return (
      <div
        ref={ref}
        className="sprint-slide-capture-root"
        style={{
          width: SLIDE_CAPTURE_WIDTH,
          height: SLIDE_CAPTURE_HEIGHT,
          boxSizing: "border-box",
          position: "relative",
          backgroundColor: "#ffffff",
          color: "#1a1a1a",
          fontFamily: '"Red Hat Text", "Red Hat Display", "Helvetica Neue", Helvetica, Arial, sans-serif',
          padding: "36px 64px 48px 64px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 32,
            width: 5,
            height: 56,
            backgroundColor: RH_RED,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 88,
            width: 5,
            height: 44,
            backgroundColor: RH_RED,
          }}
        />

        <header
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 28,
            marginBottom: 4,
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: RH_RED,
              letterSpacing: "0.02em",
              paddingTop: 6,
              flexShrink: 0,
            }}
          >
            Sprint Highlights
          </div>
          <div
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 52,
              fontWeight: 700,
              lineHeight: 1.08,
              paddingTop: 0,
            }}
          >
            Console Dot UXD
          </div>
          <div
            style={{
              fontSize: 98,
              fontWeight: 800,
              lineHeight: 0.85,
              letterSpacing: "-0.06em",
              color: "#ffffff",
              WebkitTextStroke: `5px ${RH_RED}`,
              paintOrder: "stroke fill",
              fontFamily: '"Red Hat Display", "Red Hat Text", Arial, sans-serif',
              flexShrink: 0,
              paddingRight: 4,
            }}
          >
            UXD
          </div>
        </header>

        <p
          style={{
            margin: "12px 0 48px",
            fontSize: 34,
            fontWeight: 600,
            lineHeight: 1.28,
          }}
        >
          {sprintTitle.trim() ? `${sprintTitle.trim()} ` : "Sprint "}
          <span
            style={{
              backgroundColor: HIGHLIGHT_YELLOW,
              padding: "3px 12px 5px",
              borderRadius: 2,
              boxDecorationBreak: "clone",
              WebkitBoxDecorationBreak: "clone",
            }}
          >
            Highlights
          </span>
          {" 😎"}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            columnGap: 56,
            alignContent: "start",
          }}
        >
          <div>
            {leftGroups.map((g) => (
              <GroupBlock key={g} groupId={g} buckets={buckets} />
            ))}
          </div>
          <div>
            {rightGroups.map((g) => (
              <GroupBlock key={g} groupId={g} buckets={buckets} />
            ))}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            right: 64,
            bottom: 36,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <RedHatMark size={44} />
          <span style={{ fontSize: 28, fontWeight: 600, color: "#1a1a1a", letterSpacing: "-0.02em" }}>
            Red Hat
          </span>
        </div>
      </div>
    );
  }
);
