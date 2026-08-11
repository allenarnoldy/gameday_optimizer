import React from "react";
import { View, Text, FlatList } from "react-native";
import { Player } from "../types";
import { C, POS } from "../theme";
import { currency } from "../utils/time";

function PosBadge({ pos }: { pos: string }) {
  const colors = POS[pos] ?? { bg: '#f1f5f9', fg: C.muted };
  return (
    <View style={{ backgroundColor: colors.bg, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, minWidth: 34, alignItems: "center" }}>
      <Text style={{ color: colors.fg, fontWeight: "700", fontSize: 11 }}>{pos}</Text>
    </View>
  );
}

export default function PlayerList({ players }: { players: Player[] }) {
  return (
    <View style={{ backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border, overflow: "hidden" }}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: C.border }}>
        <Text style={{ flex: 1, fontSize: 12, fontWeight: "700", color: C.muted, letterSpacing: 0.5 }}>PLAYER ({players.length})</Text>
        <Text style={{ width: 72, textAlign: "right", fontSize: 12, fontWeight: "700", color: C.muted, letterSpacing: 0.5 }}>SALARY</Text>
        <Text style={{ width: 54, textAlign: "right", fontSize: 12, fontWeight: "700", color: C.muted, letterSpacing: 0.5 }}>PROJ</Text>
      </View>
      <FlatList
        data={players}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item, index }) => (
          <View style={{
            flexDirection: "row", alignItems: "center",
            paddingHorizontal: 14, paddingVertical: 10,
            backgroundColor: index % 2 === 0 ? C.card : '#f8fafc',
            borderBottomWidth: 1, borderBottomColor: C.border,
          }}>
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <PosBadge pos={item.pos} />
              <View>
                <Text style={{ fontWeight: "600", color: C.text, fontSize: 14 }}>{item.name}</Text>
                <Text style={{ color: C.muted, fontSize: 12 }}>{item.team}{item.opp ? ` vs ${item.opp}` : ""}</Text>
              </View>
            </View>
            <Text style={{ width: 72, textAlign: "right", color: C.muted, fontSize: 13 }}>
              {item.salary ? currency(item.salary) : "—"}
            </Text>
            <Text style={{ width: 54, textAlign: "right", fontWeight: "700", color: C.primary, fontSize: 14 }}>
              {item.proj.toFixed(1)}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
