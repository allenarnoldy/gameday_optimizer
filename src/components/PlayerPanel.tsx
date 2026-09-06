import React, { useState } from "react";
import { Modal, View, Text, Pressable, FlatList, TextStyle, useWindowDimensions } from "react-native";
import { Player } from "../types";
import { useTheme } from "../ThemeContext";
import { currency } from "../utils/time";
import { radius, space, type as T } from "../theme";
import { PosBadge, IconButton } from "./ui";
import { tnum } from "../fonts";

const POSITIONS = ["All", "QB", "RB", "WR", "TE", "DST"] as const;
type PosFilter = typeof POSITIONS[number];

/** Selection is the one place the blue signal color appears. */
function Checkbox({ checked }: { checked: boolean }) {
  const { C } = useTheme();
  return (
    <View
      style={{
        width: 18,
        height: 18,
        borderRadius: radius.xs + 1,
        borderWidth: 1,
        borderColor: checked ? C.accent : C.hairline,
        backgroundColor: checked ? C.accent : "transparent",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {checked && (
        <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700", lineHeight: 14 }}>✓</Text>
      )}
    </View>
  );
}

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

  const panelWidth = Math.min(400, width);

  const filtered = (posFilter === "All" ? players : players.filter(p => p.pos === posFilter))
    .slice()
    .sort((a, b) => b.proj - a.proj);

  const lockedCount = lockedIds.size;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.72)",
        }}
        onPress={onClose}
      />

      <View
        style={{
          position: "absolute", right: 0, top: 0, bottom: 0,
          width: panelWidth,
          backgroundColor: C.canvas,
          borderLeftWidth: 1,
          borderLeftColor: C.hairline,
          shadowColor: "#000",
          shadowOffset: { width: -10, height: 0 },
          shadowOpacity: 0.4,
          shadowRadius: 40,
          elevation: 12,
        }}
      >
        {/* Header */}
        <View
          style={{
            paddingHorizontal: space.lg,
            paddingTop: space.xl,
            paddingBottom: space.md,
            borderBottomWidth: 1,
            borderBottomColor: C.hairlineSoft,
            gap: space.md,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ gap: 3 }}>
              <Text style={{ ...T.headline, color: C.ink } as TextStyle}>Player pool</Text>
              <Text style={{ ...T.caption, color: C.inkMuted } as TextStyle}>
                {players.length} available{lockedCount > 0 ? ` · ${lockedCount} locked` : ""}
              </Text>
            </View>
            <IconButton onPress={onClose} size={36}>
              <Text style={{ fontSize: 14, color: C.inkMuted }}>✕</Text>
            </IconButton>
          </View>

          <Text style={{ ...T.micro, color: C.light } as TextStyle}>
            Tap a player to lock them into every lineup.
          </Text>

          {/* Position filter pills — selected = surface lift, not color */}
          <View style={{ flexDirection: "row", gap: space.xxs, flexWrap: "wrap" }}>
            {POSITIONS.map(pos => {
              const active = posFilter === pos;
              return (
                <Pressable
                  key={pos}
                  onPress={() => setPosFilter(pos)}
                  style={({ pressed }) => ({
                    paddingVertical: 7,
                    paddingHorizontal: 13,
                    borderRadius: radius.pill,
                    backgroundColor: active ? C.surface2 : "transparent",
                    borderWidth: 1,
                    borderColor: active ? C.hairline : C.hairlineSoft,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  })}
                >
                  <Text style={{ ...T.button, color: active ? C.ink : C.inkMuted } as TextStyle}>
                    {pos}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Column headers */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: space.lg,
            paddingVertical: space.xs,
            borderBottomWidth: 1,
            borderBottomColor: C.hairlineSoft,
            gap: space.xs,
          }}
        >
          <View style={{ width: 18 }} />
          <View style={{ width: 34 }} />
          <Text style={{ ...T.micro, flex: 1, color: C.light } as TextStyle}>PLAYER</Text>
          <Text style={{ ...T.micro, width: 58, textAlign: "right", color: C.light } as TextStyle}>SALARY</Text>
          <Text style={{ ...T.micro, width: 46, textAlign: "right", color: C.light } as TextStyle}>PROJ</Text>
        </View>

        {/* Rows — no zebra striping; the dark canvas carries the separation */}
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const locked = lockedIds.has(item.id);
            return (
              <Pressable
                onPress={() => onToggleLock(item.id)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: space.lg,
                  paddingVertical: 11,
                  gap: space.xs,
                  backgroundColor: locked ? C.surface1 : pressed ? C.surface1 : "transparent",
                  borderBottomWidth: 1,
                  borderBottomColor: C.hairlineSoft,
                })}
              >
                <Checkbox checked={locked} />
                <PosBadge pos={item.pos} compact />
                <View style={{ flex: 1, gap: 1 }}>
                  <Text numberOfLines={1} style={{ ...T.bodySm, color: C.ink } as TextStyle}>
                    {item.name}
                  </Text>
                  <Text style={{ ...T.micro, color: C.inkMuted } as TextStyle}>
                    {item.team}{item.opp ? ` vs ${item.opp}` : ""}
                    {item.projSource ? ` · ${item.projSource}` : ""}
                  </Text>
                </View>
                <Text
                  {...tnum}
                  style={{ ...T.micro, width: 58, textAlign: "right", color: C.inkMuted } as TextStyle}
                >
                  {item.salary ? currency(item.salary) : "—"}
                </Text>
                <Text
                  {...tnum}
                  style={{ ...T.bodySm, width: 46, textAlign: "right", color: C.ink } as TextStyle}
                >
                  {item.proj.toFixed(1)}
                </Text>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={{ padding: space.xxl, alignItems: "center" }}>
              <Text style={{ ...T.body, color: C.inkMuted } as TextStyle}>
                No players at this position.
              </Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}
