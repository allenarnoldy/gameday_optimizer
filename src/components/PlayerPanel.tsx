import React, { useState } from "react";
import { Modal, View, Text, Pressable, FlatList, SafeAreaView } from "react-native";
import { Player } from "../types";
import { C, POS } from "../theme";
import { currency } from "../utils/time";

const POSITIONS = ["All", "QB", "RB", "WR", "TE", "DST"] as const;
type PosFilter = typeof POSITIONS[number];

function PosBadge({ pos }: { pos: string }) {
  const colors = POS[pos] ?? { bg: '#f1f5f9', fg: C.muted };
  return (
    <View style={{ backgroundColor: colors.bg, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, minWidth: 34, alignItems: "center" }}>
      <Text style={{ color: colors.fg, fontWeight: "700", fontSize: 11 }}>{pos}</Text>
    </View>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <View style={{
      width: 20, height: 20, borderRadius: 5,
      borderWidth: 1.5,
      borderColor: checked ? C.primary : C.border,
      backgroundColor: checked ? C.primary : C.card,
      alignItems: "center", justifyContent: "center",
    }}>
      {checked && <Text style={{ color: "#fff", fontSize: 12, fontWeight: "800", lineHeight: 16 }}>✓</Text>}
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
  const [posFilter, setPosFilter] = useState<PosFilter>("All");

  const filtered = (posFilter === "All" ? players : players.filter(p => p.pos === posFilter))
    .slice()
    .sort((a, b) => b.proj - a.proj);

  const lockedCount = lockedIds.size;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.4)" }}
        onPress={onClose}
      />

      <View style={{
        position: "absolute", right: 0, top: 0, bottom: 0, width: 340,
        backgroundColor: C.card,
        shadowColor: "#000", shadowOffset: { width: -4, height: 0 }, shadowOpacity: 0.15, shadowRadius: 20,
        elevation: 10,
      }}>
        <SafeAreaView style={{ flex: 1 }}>

          {/* Header */}
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View>
                <Text style={{ fontWeight: "800", fontSize: 18, color: C.text }}>Players</Text>
                <Text style={{ color: C.muted, fontSize: 13 }}>
                  {players.length} loaded{lockedCount > 0 ? ` · ${lockedCount} locked` : ""}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ fontSize: 16, color: C.muted, fontWeight: "600" }}>✕</Text>
              </Pressable>
            </View>

            {/* Position filter pills */}
            <View style={{ flexDirection: "row", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
              {POSITIONS.map(pos => {
                const active = posFilter === pos;
                const colors = pos !== "All" ? POS[pos] : null;
                return (
                  <Pressable
                    key={pos}
                    onPress={() => setPosFilter(pos)}
                    style={{
                      paddingVertical: 5, paddingHorizontal: 12, borderRadius: 16,
                      backgroundColor: active ? (colors ? colors.bg : C.primaryBg) : "#f8fafc",
                      borderWidth: 1.5,
                      borderColor: active ? (colors ? colors.fg : C.primary) : C.border,
                    }}
                  >
                    <Text style={{ fontWeight: "700", fontSize: 12, color: active ? (colors ? colors.fg : C.primary) : C.muted }}>
                      {pos}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Column headers */}
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "#f8fafc", borderBottomWidth: 1, borderBottomColor: C.border }}>
            <View style={{ width: 20 }} />
            <View style={{ width: 34, marginLeft: 8 }} />
            <Text style={{ flex: 1, fontSize: 11, fontWeight: "700", color: C.muted, marginLeft: 8, letterSpacing: 0.5 }}>PLAYER</Text>
            <Text style={{ width: 60, textAlign: "right", fontSize: 11, fontWeight: "700", color: C.muted, letterSpacing: 0.5 }}>SAL</Text>
            <Text style={{ width: 52, textAlign: "right", fontSize: 11, fontWeight: "700", color: C.muted, letterSpacing: 0.5 }}>PROJ</Text>
          </View>

          {/* Player rows */}
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            renderItem={({ item, index }) => {
              const locked = lockedIds.has(item.id);
              return (
                <Pressable
                  onPress={() => onToggleLock(item.id)}
                  style={{
                    flexDirection: "row", alignItems: "center",
                    paddingHorizontal: 14, paddingVertical: 10,
                    backgroundColor: locked ? C.primaryBg : (index % 2 === 0 ? C.card : "#f8fafc"),
                    borderBottomWidth: 1, borderBottomColor: C.border,
                  }}
                >
                  <Checkbox checked={locked} />
                  <View style={{ marginLeft: 8 }}>
                    <PosBadge pos={item.pos} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={{ fontWeight: locked ? "700" : "600", color: C.text, fontSize: 13 }} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={{ color: C.muted, fontSize: 11 }}>
                      {item.team}{item.opp ? ` vs ${item.opp}` : ""}
                    </Text>
                  </View>
                  <Text style={{ width: 60, textAlign: "right", color: C.muted, fontSize: 12 }}>
                    {item.salary ? currency(item.salary) : "—"}
                  </Text>
                  <View style={{ width: 52, alignItems: "flex-end" }}>
                    <Text style={{ fontWeight: "700", color: C.primary, fontSize: 13 }}>
                      {item.proj.toFixed(1)}
                    </Text>
                    {item.projSource && (
                      <Text style={{ fontSize: 9, color: item.projSource === "Sleeper" ? "#7c3aed" : C.light, fontWeight: "600" }}>
                        {item.projSource}
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={{ padding: 24, alignItems: "center" }}>
                <Text style={{ color: C.muted, fontSize: 14 }}>No players for this position.</Text>
              </View>
            }
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
}
