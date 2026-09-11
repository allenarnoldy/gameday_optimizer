import React from "react";
import { View, Text, Pressable, TextStyle, ViewStyle, useWindowDimensions } from "react-native";
import { Player } from "../types";
import { useTheme } from "../ThemeContext";
import { currency } from "../utils/time";
import { radius, space, type as T, APP_WIDTH } from "../theme";
import { PosBadge, Chip, Checkbox } from "./ui";
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

export function PlayerRow({
  player, locked, onToggleLock, onRemove,
}: {
  player: Player;
  locked: boolean;
  onToggleLock: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const { C } = useTheme();
  const { width } = useWindowDimensions();
  // Below this the salary column leaves the name too little room, so salary
  // folds into the meta line instead of truncating everyone to "Jalen …".
  const narrow = width < 560;

  return (
    <Pressable
      onPress={() => onToggleLock(player.id)}
      {...pressable}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: space.xs,
        paddingHorizontal: narrow ? space.sm : space.lg,
        paddingVertical: 11,
        backgroundColor: locked
          ? "rgba(0,112,209,0.14)"
          : pressed ? C.surface1 : "transparent",
        borderBottomWidth: 1,
        borderBottomColor: C.hairlineSoft,
      })}
    >
      <Checkbox checked={locked} />
      <PosBadge pos={player.pos} />

      <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
        <Text numberOfLines={1} style={{ ...T.bodySm, fontWeight: "500", color: C.ink } as TextStyle}>
          {player.name}
        </Text>
        <Text numberOfLines={1} style={{ ...T.captionSm, color: C.inkFaint } as TextStyle}>
          {player.team}{player.opp ? ` vs ${player.opp}` : ""}
          {narrow
            ? (player.salary ? ` · ${currency(player.salary)}` : "")
            : (player.projSource ? ` · ${player.projSource}` : "")}
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

      <Pressable
        onPress={() => onRemove(player.id)}
        {...pressable}
        accessibilityLabel={`Remove ${player.name} from the pool`}
        style={{
          width: 32, height: 32, marginLeft: space.xxs,
          borderRadius: radius.full,
          alignItems: "center", justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 15, lineHeight: 18, color: C.inkFaint }}>✕</Text>
      </Pressable>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Shared chrome                                                       */
/* ------------------------------------------------------------------ */

export function PoolFilters({
  posFilter, setPosFilter, removedCount, onRestoreAll,
}: {
  posFilter: PosFilter;
  setPosFilter: (p: PosFilter) => void;
  removedCount: number;
  onRestoreAll: () => void;
}) {
  const { C } = useTheme();
  return (
    // minWidth 0 lets the row actually wrap: without it the chips size the
    // flex parent and run off the edge instead of breaking to a second line.
    <View style={{ flexDirection: "row", gap: space.xxs, flexWrap: "wrap", flexShrink: 1, minWidth: 0 }}>
      {POSITIONS.map(pos => (
        <Chip key={pos} label={pos} active={posFilter === pos} onPress={() => setPosFilter(pos)} />
      ))}
      {removedCount > 0 ? (
        <Pressable
          onPress={onRestoreAll}
          {...pressable}
          style={{
            minHeight: 40, paddingVertical: 7, paddingHorizontal: 14,
            borderRadius: radius.full,
            borderWidth: 1, borderColor: C.hairline,
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Text style={{ ...T.buttonMd, color: C.inkMuted } as TextStyle}>Restore {removedCount}</Text>
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
      }}
    >
      <View style={{ width: 20 }} />
      <View style={{ width: 40 }} />
      <Text style={{ ...T.captionSm, flex: 1, color: C.inkFaint, letterSpacing: 0.8 } as TextStyle}>PLAYER</Text>
      {narrow ? null : (
        <Text style={{ ...T.captionSm, width: 62, textAlign: "right", color: C.inkFaint } as TextStyle}>SALARY</Text>
      )}
      <Text style={{ ...T.captionSm, width: 46, textAlign: "right", color: C.inkFaint } as TextStyle}>PROJ</Text>
      <View style={{ width: 36 }} />
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
  players, lockedIds, posFilter, setPosFilter,
  onToggleLock, onRemove, removedCount, onRestoreAll, style,
}: {
  players: Player[];
  lockedIds: Set<string>;
  posFilter: PosFilter;
  setPosFilter: (p: PosFilter) => void;
  onToggleLock: (id: string) => void;
  onRemove: (id: string) => void;
  removedCount: number;
  onRestoreAll: () => void;
  style?: ViewStyle;
}) {
  const { C } = useTheme();
  const rows = filterPool(players, posFilter);

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
              {players.length} available
              {lockedIds.size > 0 ? ` · ${lockedIds.size} locked` : ""}
              {" · tap to lock a player in, ✕ to remove"}
            </Text>
          </View>
          <PoolFilters
            posFilter={posFilter}
            setPosFilter={setPosFilter}
            removedCount={removedCount}
            onRestoreAll={onRestoreAll}
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
            locked={lockedIds.has(p.id)}
            onToggleLock={onToggleLock}
            onRemove={onRemove}
          />
        ))
      )}
    </View>
  );
}
