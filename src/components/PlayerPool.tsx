import React from "react";
import { View, Text, Pressable, TextStyle, ViewStyle, useWindowDimensions } from "react-native";
import { Player } from "../types";
import { useTheme } from "../ThemeContext";
import { currency } from "../utils/time";
import { radius, space, type as T, APP_WIDTH } from "../theme";
import { PosBadge, Chip } from "./ui";
import { tnum, pressable, toggleable } from "../fonts";

export const POSITIONS = ["All", "QB", "RB", "WR", "TE", "DST"] as const;
export type PosFilter = typeof POSITIONS[number];

export type SortKey = "proj" | "salary";
export type SortDir = "desc" | "asc";
export type Sort = { key: SortKey; dir: SortDir };
export const DEFAULT_SORT: Sort = { key: "proj", dir: "desc" };

export function filterPool(
  players: Player[],
  posFilter: PosFilter,
  sort: Sort = DEFAULT_SORT,
): Player[] {
  const sign = sort.dir === "desc" ? -1 : 1;
  return (posFilter === "All" ? players : players.filter(p => p.pos === posFilter))
    .slice()
    .sort((a, b) => {
      const av = sort.key === "salary" ? (a.salary ?? 0) : a.proj;
      const bv = sort.key === "salary" ? (b.salary ?? 0) : b.proj;
      // Salaries tie constantly — DraftKings prices most of the bench at
      // exactly $3,000 — so projection breaks the tie and keeps the order
      // stable and useful rather than arbitrary.
      if (av !== bv) return sign * (av - bv);
      if (a.proj !== b.proj) return b.proj - a.proj;
      return a.name.localeCompare(b.name);
    });
}

/* ------------------------------------------------------------------ */
/* Row                                                                 */
/* ------------------------------------------------------------------ */

export type RowState = "default" | "locked" | "excluded";

/**
 * Column widths, shared by the rows and the header so the two stay in step.
 *
 * The phone numbers are tighter across the board — the toggles especially —
 * to buy back enough room for a salary column. Salary used to fold into the
 * meta line there, which made it unsortable by a column header and hard to
 * compare down the list.
 */
function metrics(narrow: boolean) {
  const toggle = narrow ? 28 : 34;
  const toggleGap = narrow ? 3 : 4;
  return {
    gap: narrow ? 4 : space.xs,
    padH: narrow ? 10 : space.lg,
    // Wide enough for the heading *and* its caret, not just for the value:
    // these were sized for "$8,000" and "22.1", so the headings clipped to
    // "SALA…" and "PR…" once they became sort controls. Measured need, with
    // the caret and a little headroom: SALARY 65, PROJ 47, SAL 36.
    salaryW: narrow ? 50 : 68,
    projW: narrow ? 46 : 52,
    // Tracking that reads well on a wide heading just eats room on a phone.
    headingTracking: narrow ? 0.3 : 0.8,
    toggle,
    toggleGap,
    /* Both toggles, the gap between them, and the margin before them. */
    tailW: toggle * 2 + toggleGap + space.xxs,
  };
}

/** One of the paired toggles at the end of a row. */
function RowToggle({
  glyph, active, activeBg, label, size, onPress,
}: {
  glyph: string;
  active: boolean;
  activeBg: string;
  label: string;
  size: number;
  onPress: () => void;
}) {
  const { C } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      {...pressable}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      // The visible circle shrinks on a phone, but the touch target does not:
      // hitSlop keeps roughly 44px of reachable area around each one.
      hitSlop={Math.round((44 - size) / 2)}
      style={{
        width: size,
        height: size,
        borderRadius: radius.full,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: active ? activeBg : "transparent",
        borderWidth: active ? 0 : 1,
        borderColor: C.hairline,
      }}
    >
      <Text
        style={{
          fontSize: size >= 34 ? 14 : 12,
          lineHeight: size >= 34 ? 17 : 15,
          color: active ? "#ffffff" : C.inkFaint,
        }}
      >
        {glyph}
      </Text>
    </Pressable>
  );
}

/**
 * A row is in exactly one of three states. Excluded players stay in the list,
 * in their sorted position, dimmed - they are ruled out of the solve, not
 * removed from view, so it stays obvious who you've set aside.
 *
 * The two toggles are mutually exclusive and sit together at the end of the
 * row; pressing the active one returns the row to default.
 */
export function PlayerRow({
  player, state, onLock, onExclude, narrow: narrowProp,
}: {
  player: Player;
  state: RowState;
  onLock: (id: string) => void;
  onExclude: (id: string) => void;
  /**
   * Overrides the window-width check. The drawer is a 420px panel on a wide
   * screen, so measuring the window there gave it the roomy desktop columns
   * and squeezed every name down to "Jahmyr Gi…".
   */
  narrow?: boolean;
}) {
  const { C } = useTheme();
  const { width } = useWindowDimensions();
  const narrow = narrowProp ?? width < 560;
  const m = metrics(narrow);

  const locked = state === "locked";
  const excluded = state === "excluded";

  // State leads the line: on a phone the meta truncates, and the one part
  // that must never be the bit that gets cut is whether this row counts.
  // Salary is a column at every width now, so it is no longer repeated here.
  const meta = [
    locked ? "Locked" : excluded ? "Excluded" : "",
    `${player.team}${player.opp ? ` vs ${player.opp}` : ""}`,
    !narrow && !locked && !excluded ? (player.projSource ?? "") : "",
  ].filter(Boolean).join(" · ");

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: m.gap,
        paddingHorizontal: m.padH,
        paddingVertical: 11,
        backgroundColor: locked ? "rgba(0,112,209,0.14)" : "transparent",
        borderBottomWidth: 1,
        borderBottomColor: C.hairlineSoft,
        // Accent bar marks a locked row without relying on the tint alone.
        borderLeftWidth: 3,
        borderLeftColor: locked ? C.primary : "transparent",
      }}
    >
      {/* Only the player's own details dim, so the toggle that undoes an
          exclusion never fades out with them. */}
      <View
        style={{
          flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center",
          gap: m.gap, opacity: excluded ? 0.45 : 1,
        }}
      >
        <PosBadge pos={player.pos} compact={narrow} />

        <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
          <Text
            numberOfLines={1}
            style={{
              ...T.bodySm, fontWeight: "500", color: C.ink,
              textDecorationLine: excluded ? "line-through" : "none",
            } as TextStyle}
          >
            {player.name}
          </Text>
          <Text numberOfLines={1} style={{ ...T.captionSm, color: excluded ? C.inkFaint : C.inkFaint } as TextStyle}>
            {meta}
          </Text>
        </View>

        <Text
          {...tnum}
          style={{
            ...T.captionMd, width: m.salaryW, textAlign: "right", color: C.inkMuted,
          } as TextStyle}
        >
          {player.salary ? currency(player.salary) : "—"}
        </Text>
        <Text
          {...tnum}
          style={{
            ...T.bodySm, fontWeight: "600", width: m.projW, textAlign: "right", color: C.ink,
          } as TextStyle}
        >
          {player.proj.toFixed(1)}
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: m.toggleGap, marginLeft: space.xxs }}>
        <RowToggle
          glyph="✓"
          size={m.toggle}
          active={locked}
          activeBg={C.primary}
          label={locked ? `Unlock ${player.name}` : `Lock ${player.name} into every lineup`}
          onPress={() => onLock(player.id)}
        />
        <RowToggle
          glyph="✕"
          size={m.toggle}
          active={excluded}
          activeBg={C.warning}
          label={excluded ? `Include ${player.name} again` : `Exclude ${player.name} from lineups`}
          onPress={() => onExclude(player.id)}
        />
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Shared chrome                                                       */
/* ------------------------------------------------------------------ */

export function PoolFilters({
  posFilter, setPosFilter, excludedCount, onClearExcluded,
}: {
  posFilter: PosFilter;
  setPosFilter: (p: PosFilter) => void;
  excludedCount: number;
  onClearExcluded: () => void;
}) {
  const { C } = useTheme();
  return (
    // minWidth 0 lets the row actually wrap: without it the chips size the
    // flex parent and run off the edge instead of breaking to a second line.
    <View style={{ flexDirection: "row", gap: space.xxs, flexWrap: "wrap", flexShrink: 1, minWidth: 0 }}>
      {POSITIONS.map(pos => (
        <Chip key={pos} label={pos} active={posFilter === pos} onPress={() => setPosFilter(pos)} />
      ))}

      {excludedCount > 0 ? (
        <Pressable
          onPress={onClearExcluded}
          {...pressable}
          style={{
            minHeight: 40, paddingVertical: 7, paddingHorizontal: 14,
            borderRadius: radius.full,
            borderWidth: 1, borderColor: C.hairline,
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Text style={{ ...T.buttonMd, color: C.inkMuted } as TextStyle}>
            Clear {excludedCount} excluded
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * A sortable column heading. Pressing the column already in use reverses it,
 * so both the key and the direction are reachable from the header alone.
 *
 * The caret's space is reserved in both states — rendered transparent when
 * inactive — so switching columns doesn't shuffle the headings sideways.
 */
function SortHeader({
  label, width, tracking, active, dir, onPress,
}: {
  label: string;
  width: number;
  tracking: number;
  active: boolean;
  dir: SortDir;
  onPress: () => void;
}) {
  const { C } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      {...toggleable}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={
        active
          ? `Sorted by ${label}, ${dir === "desc" ? "highest first" : "lowest first"}. Press to reverse.`
          : `Sort by ${label}`
      }
      style={{
        width,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 1,
        paddingVertical: 6,
      }}
    >
      <Text
        numberOfLines={1}
        style={{
          ...T.captionSm,
          color: active ? C.link : C.inkFaint,
          letterSpacing: tracking,
        } as TextStyle}
      >
        {label}
      </Text>
      <Text
        style={{
          ...T.captionSm,
          lineHeight: 14,
          color: active ? C.link : "transparent",
        } as TextStyle}
      >
        {dir === "desc" ? "↓" : "↑"}
      </Text>
    </Pressable>
  );
}

/**
 * Column headers, and the sort control. The leading spacer mirrors the row's
 * position badge so PLAYER sits above the name rather than over the badge.
 */
export function PoolColumns({
  topRule, sort, onSort, narrow: narrowProp,
}: {
  topRule?: boolean;
  sort: Sort;
  onSort: (key: SortKey) => void;
  /** See PlayerRow — must match whatever the rows below are using. */
  narrow?: boolean;
}) {
  const { C } = useTheme();
  const { width } = useWindowDimensions();
  const narrow = narrowProp ?? width < 560;
  const m = metrics(narrow);
  return (
    <View
      style={{
        flexDirection: "row", alignItems: "center", gap: m.gap,
        paddingHorizontal: m.padH, paddingVertical: 2,
        borderTopWidth: topRule ? 1 : 0,
        borderTopColor: C.hairline,
        borderBottomWidth: 1,
        borderBottomColor: C.hairlineSoft,
        // Matches the rows' accent-bar gutter so the columns line up.
        borderLeftWidth: 3,
        borderLeftColor: "transparent",
      }}
    >
      <View style={{ width: narrow ? 34 : 40 }} />
      <Text
        style={{
          ...T.captionSm, flex: 1, color: C.inkFaint, letterSpacing: m.headingTracking,
        } as TextStyle}
      >
        PLAYER
      </Text>
      <SortHeader
        label={narrow ? "SAL" : "SALARY"}
        width={m.salaryW}
        tracking={m.headingTracking}
        active={sort.key === "salary"}
        dir={sort.dir}
        onPress={() => onSort("salary")}
      />
      <SortHeader
        label="PROJ"
        width={m.projW}
        tracking={m.headingTracking}
        active={sort.key === "proj"}
        dir={sort.dir}
        onPress={() => onSort("proj")}
      />
      <View style={{ width: m.tailW }} />
    </View>
  );
}

export function PoolEmpty() {
  const { C } = useTheme();
  return (
    <View style={{ padding: space.xxl, alignItems: "center" }}>
      <Text style={{ ...T.bodySm, color: C.inkMuted } as TextStyle}>No players at this position.</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Inline card                                                         */
/* ------------------------------------------------------------------ */
/**
 * Before the first solve the pool is the page's main content, so it sits
 * inline as a card. Once lineups exist it moves behind the drawer button and
 * the results take the column.
 */
export default function InlinePool({
  players, lockedIds, excludedIds, posFilter, setPosFilter, sort, setSort,
  onLock, onExclude, onClearExcluded, style,
}: {
  players: Player[];
  lockedIds: Set<string>;
  excludedIds: Set<string>;
  posFilter: PosFilter;
  setPosFilter: (p: PosFilter) => void;
  sort: Sort;
  setSort: (s: Sort) => void;
  onLock: (id: string) => void;
  onExclude: (id: string) => void;
  onClearExcluded: () => void;
  style?: ViewStyle;
}) {
  const { C } = useTheme();
  const rows = filterPool(players, posFilter, sort);
  const excludedCount = players.reduce((n, p) => n + (excludedIds.has(p.id) ? 1 : 0), 0);
  // A new column starts high-to-low — that is what you want first of either
  // money or points; pressing the one in use reverses it.
  const onSort = (key: SortKey) =>
    setSort(sort.key === key ? { key, dir: sort.dir === "desc" ? "asc" : "desc" } : { key, dir: "desc" });

  return (
    <View
      style={[
        {
          width: "100%", maxWidth: APP_WIDTH, alignSelf: "center",
          backgroundColor: C.surface2,
          borderRadius: radius.md,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <View style={{ padding: space.lg, paddingBottom: space.md, gap: space.md }}>
        <View
          style={{
            flexDirection: "row", justifyContent: "space-between",
            alignItems: "flex-end", gap: space.md, flexWrap: "wrap",
          }}
        >
          <View style={{ gap: 2 }}>
            <Text style={{ ...T.headingXl, fontSize: 26, color: C.ink } as TextStyle}>Player pool</Text>
            <Text style={{ ...T.captionMd, color: C.inkMuted } as TextStyle}>
              {players.length - excludedCount} in play
              {lockedIds.size > 0 ? ` · ${lockedIds.size} locked` : ""}
              {excludedCount > 0 ? ` · ${excludedCount} excluded` : ""}
            </Text>
          </View>
          <PoolFilters
            posFilter={posFilter}
            setPosFilter={setPosFilter}
            excludedCount={excludedCount}
            onClearExcluded={onClearExcluded}
          />
        </View>
      </View>

      <PoolColumns topRule sort={sort} onSort={onSort} />

      {rows.length === 0 ? (
        <PoolEmpty />
      ) : (
        rows.map(p => (
          <PlayerRow
            key={p.id}
            player={p}
            state={lockedIds.has(p.id) ? "locked" : excludedIds.has(p.id) ? "excluded" : "default"}
            onLock={onLock}
            onExclude={onExclude}
          />
        ))
      )}
    </View>
  );
}
