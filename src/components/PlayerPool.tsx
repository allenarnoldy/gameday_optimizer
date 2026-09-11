import React from "react";
import { View, Text, Pressable, TextStyle, ViewStyle, useWindowDimensions } from "react-native";
import { Player } from "../types";
import { useTheme } from "../ThemeContext";
import { currency } from "../utils/time";
import { radius, space, type as T, APP_WIDTH } from "../theme";
import { PosBadge, Chip } from "./ui";
import { tnum, pressable } from "../fonts";

export const POSITIONS = ["All", "QB", "RB", "WR", "TE", "DST"] as const;
export type PosFilter = typeof POSITIONS[number];

export function filterPool(players: Player[], posFilter: PosFilter): Player[] {
  return (posFilter === "All" ? players : players.filter(p => p.pos === posFilter))
    .slice()
    .sort((a, b) => b.proj - a.proj);
}

/* ------------------------------------------------------------------ */
/* Row                                                                 */
/* ------------------------------------------------------------------ */

export type RowState = "default" | "locked" | "excluded";

/** One of the paired toggles at the end of a row. */
function RowToggle({
  glyph, active, activeBg, label, onPress,
}: {
  glyph: string;
  active: boolean;
  activeBg: string;
  label: string;
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
      style={{
        width: 34,
        height: 34,
        borderRadius: radius.full,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: active ? activeBg : "transparent",
        borderWidth: active ? 0 : 1,
        borderColor: C.hairline,
      }}
    >
      <Text style={{ fontSize: 14, lineHeight: 17, color: active ? "#ffffff" : C.inkFaint }}>
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
  player, state, onLock, onExclude,
}: {
  player: Player;
  state: RowState;
  onLock: (id: string) => void;
  onExclude: (id: string) => void;
}) {
  const { C } = useTheme();
  const { width } = useWindowDimensions();
  // Below this the salary column leaves the name too little room, so salary
  // folds into the meta line instead of truncating everyone to "Jalen …".
  const narrow = width < 560;

  const locked = state === "locked";
  const excluded = state === "excluded";

  // State leads the line: on a phone the meta truncates, and the one part
  // that must never be the bit that gets cut is whether this row counts.
  const meta = [
    locked ? "Locked" : excluded ? "Excluded" : "",
    `${player.team}${player.opp ? ` vs ${player.opp}` : ""}`,
    narrow && player.salary ? currency(player.salary) : "",
    !narrow && !locked && !excluded ? (player.projSource ?? "") : "",
  ].filter(Boolean).join(" · ");

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.xs,
        paddingHorizontal: narrow ? space.sm : space.lg,
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
          gap: space.xs, opacity: excluded ? 0.45 : 1,
        }}
      >
        <PosBadge pos={player.pos} />

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

        {narrow ? null : (
          <Text {...tnum} style={{ ...T.captionMd, width: 62, textAlign: "right", color: C.inkMuted } as TextStyle}>
            {player.salary ? currency(player.salary) : "—"}
          </Text>
        )}
        <Text {...tnum} style={{ ...T.bodySm, fontWeight: "600", width: 46, textAlign: "right", color: C.ink } as TextStyle}>
          {player.proj.toFixed(1)}
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: space.xxs, marginLeft: space.xxs }}>
        <RowToggle
          glyph="✓"
          active={locked}
          activeBg={C.primary}
          label={locked ? `Unlock ${player.name}` : `Lock ${player.name} into every lineup`}
          onPress={() => onLock(player.id)}
        />
        <RowToggle
          glyph="✕"
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
 * Column headers. The leading spacers mirror the row's checkbox and position
 * badge so PLAYER actually sits above the name rather than over the badge.
 */
export function PoolColumns({ topRule }: { topRule?: boolean }) {
  const { C } = useTheme();
  const { width } = useWindowDimensions();
  const narrow = width < 560;
  return (
    <View
      style={{
        flexDirection: "row", alignItems: "center", gap: space.xs,
        paddingHorizontal: narrow ? space.sm : space.lg, paddingVertical: space.xs,
        borderTopWidth: topRule ? 1 : 0,
        borderTopColor: C.hairline,
        borderBottomWidth: 1,
        borderBottomColor: C.hairlineSoft,
        // Matches the rows' accent-bar gutter so the columns line up.
        borderLeftWidth: 3,
        borderLeftColor: "transparent",
      }}
    >
      <View style={{ width: 40 }} />
      <Text style={{ ...T.captionSm, flex: 1, color: C.inkFaint, letterSpacing: 0.8 } as TextStyle}>PLAYER</Text>
      {narrow ? null : (
        <Text style={{ ...T.captionSm, width: 62, textAlign: "right", color: C.inkFaint } as TextStyle}>SALARY</Text>
      )}
      <Text style={{ ...T.captionSm, width: 46, textAlign: "right", color: C.inkFaint } as TextStyle}>PROJ</Text>
      {/* Two 34px toggles plus their gap and leading margin. */}
      <View style={{ width: 76 }} />
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
  players, lockedIds, excludedIds, posFilter, setPosFilter,
  onLock, onExclude, onClearExcluded, style,
}: {
  players: Player[];
  lockedIds: Set<string>;
  excludedIds: Set<string>;
  posFilter: PosFilter;
  setPosFilter: (p: PosFilter) => void;
  onLock: (id: string) => void;
  onExclude: (id: string) => void;
  onClearExcluded: () => void;
  style?: ViewStyle;
}) {
  const { C } = useTheme();
  const rows = filterPool(players, posFilter);
  const excludedCount = players.reduce((n, p) => n + (excludedIds.has(p.id) ? 1 : 0), 0);

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

      <PoolColumns topRule />

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
