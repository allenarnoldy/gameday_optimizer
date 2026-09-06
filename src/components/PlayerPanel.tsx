import React, { useEffect, useState } from "react";
import { Modal, View, Text, Pressable, FlatList, TextStyle, useWindowDimensions } from "react-native";
import { Player } from "../types";
import { useTheme } from "../ThemeContext";
import { currency } from "../utils/time";
import { radius, space, type as T } from "../theme";
import { PosBadge, IconButton, Chip, Checkbox } from "./ui";
import { tnum, drawerState, scrimState, pressable } from "../fonts";

const POSITIONS = ["All", "QB", "RB", "WR", "TE", "DST"] as const;
type PosFilter = typeof POSITIONS[number];

type Props = {
  visible: boolean;
  onClose: () => void;
  players: Player[];
  lockedIds: Set<string>;
  onToggleLock: (id: string) => void;
};

export default function PlayerPanel({ visible, onClose, players, lockedIds, onToggleLock }: Props) {
  const { C } = useTheme();
  const { width } = useWindowDimensions();
  const [posFilter, setPosFilter] = useState<PosFilter>("All");

  // Keep the modal mounted through the exit so the panel can slide out
  // instead of being cut. `open` drives the transform one frame after mount.
  const [mounted, setMounted] = useState(visible);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      // Double rAF: a single frame flips `open` before the browser has
      // painted the closed state, so there is no start value to transition
      // from and the panel just appears. The second frame guarantees a paint.
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setOpen(true));
      });
      return () => { cancelAnimationFrame(outer); cancelAnimationFrame(inner); };
    }
    setOpen(false);
    const t = setTimeout(() => setMounted(false), 260);
    return () => clearTimeout(t);
  }, [visible]);

  if (!mounted) return null;

  const panelWidth = Math.min(420, width);
  const filtered = (posFilter === "All" ? players : players.filter(p => p.pos === posFilter))
    .slice()
    .sort((a, b) => b.proj - a.proj);

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        {...scrimState(open)}
        style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.7)",
        }}
      />

      <View
        {...drawerState(open)}
        style={{
          position: "absolute", right: 0, top: 0, bottom: 0,
          width: panelWidth,
          backgroundColor: C.canvas,
          borderLeftWidth: 1,
          borderLeftColor: C.hairline,
        }}
      >
        {/* Header */}
        <View
          style={{
            paddingHorizontal: space.lg,
            paddingTop: space.xl,
            paddingBottom: space.md,
            gap: space.md,
            borderBottomWidth: 1,
            borderBottomColor: C.hairline,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ gap: 2 }}>
              <Text style={{ ...T.headingLg, color: C.ink } as TextStyle}>Player pool</Text>
              <Text style={{ ...T.captionMd, color: C.inkMuted } as TextStyle}>
                {players.length} available
                {lockedIds.size > 0 ? ` · ${lockedIds.size} locked` : ""}
              </Text>
            </View>
            <IconButton onPress={onClose} size={40}>
              <Text style={{ fontSize: 15, color: C.ink }}>✕</Text>
            </IconButton>
          </View>

          <Text style={{ ...T.captionSm, color: C.inkFaint } as TextStyle}>
            Tap a player to lock them into every lineup.
          </Text>

          <View style={{ flexDirection: "row", gap: space.xxs, flexWrap: "wrap" }}>
            {POSITIONS.map(pos => (
              <Chip
                key={pos}
                label={pos}
                active={posFilter === pos}
                onPress={() => setPosFilter(pos)}
              />
            ))}
          </View>
        </View>

        {/* Column headers */}
        <View
          style={{
            flexDirection: "row", alignItems: "center", gap: space.xs,
            paddingHorizontal: space.lg, paddingVertical: space.xs,
            borderBottomWidth: 1, borderBottomColor: C.hairlineSoft,
          }}
        >
          <View style={{ width: 20 }} />
          <View style={{ width: 40 }} />
          <Text style={{ ...T.captionSm, flex: 1, color: C.inkFaint, letterSpacing: 0.8 } as TextStyle}>
            PLAYER
          </Text>
          <Text style={{ ...T.captionSm, width: 62, textAlign: "right", color: C.inkFaint } as TextStyle}>
            SALARY
          </Text>
          <Text style={{ ...T.captionSm, width: 46, textAlign: "right", color: C.inkFaint } as TextStyle}>
            PROJ
          </Text>
        </View>

        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const locked = lockedIds.has(item.id);
            return (
              <Pressable
                onPress={() => onToggleLock(item.id)}
                {...pressable}
                style={({ pressed }) => ({
                  flexDirection: "row", alignItems: "center", gap: space.xs,
                  paddingHorizontal: space.lg, paddingVertical: 11,
                  backgroundColor: locked
                    ? "rgba(0,112,209,0.14)"
                    : pressed ? C.surface1 : "transparent",
                  borderBottomWidth: 1,
                  borderBottomColor: C.hairlineSoft,
                })}
              >
                <Checkbox checked={locked} />
                <PosBadge pos={item.pos} />
                <View style={{ flex: 1, gap: 1 }}>
                  <Text numberOfLines={1} style={{ ...T.bodySm, fontWeight: "500", color: C.ink } as TextStyle}>
                    {item.name}
                  </Text>
                  <Text style={{ ...T.captionSm, color: C.inkFaint } as TextStyle}>
                    {item.team}{item.opp ? ` vs ${item.opp}` : ""}
                    {item.projSource ? ` · ${item.projSource}` : ""}
                  </Text>
                </View>
                <Text {...tnum} style={{ ...T.captionMd, width: 62, textAlign: "right", color: C.inkMuted } as TextStyle}>
                  {item.salary ? currency(item.salary) : "—"}
                </Text>
                <Text {...tnum} style={{ ...T.bodySm, fontWeight: "600", width: 46, textAlign: "right", color: C.ink } as TextStyle}>
                  {item.proj.toFixed(1)}
                </Text>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={{ padding: space.xxl, alignItems: "center" }}>
              <Text style={{ ...T.bodySm, color: C.inkMuted } as TextStyle}>
                No players at this position.
              </Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}
