import React from "react";
import { View, Text, FlatList, TextStyle } from "react-native";
import { Player } from "../types";
import { useTheme } from "../ThemeContext";
import { currency } from "../utils/time";
import { radius, space, type as T } from "../theme";
import { PosBadge } from "./ui";
import { tnum } from "../fonts";

export default function PlayerList({ players }: { players: Player[] }) {
  const { C } = useTheme();
  return (
    <View
      style={{
        backgroundColor: C.surface2,
        borderRadius: radius.md,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: space.xs,
          paddingHorizontal: space.lg,
          paddingVertical: space.sm,
          borderBottomWidth: 1,
          borderBottomColor: C.hairline,
        }}
      >
        <Text style={{ ...T.captionSm, flex: 1, color: C.inkFaint, letterSpacing: 0.8 } as TextStyle}>
          PLAYER ({players.length})
        </Text>
        <Text style={{ ...T.captionSm, width: 66, textAlign: "right", color: C.inkFaint } as TextStyle}>
          SALARY
        </Text>
        <Text style={{ ...T.captionSm, width: 46, textAlign: "right", color: C.inkFaint } as TextStyle}>
          PROJ
        </Text>
      </View>

      <FlatList
        data={players}
        keyExtractor={item => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: space.xs,
              paddingHorizontal: space.lg,
              paddingVertical: 11,
              borderBottomWidth: 1,
              borderBottomColor: C.hairlineSoft,
            }}
          >
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: space.xs }}>
              <PosBadge pos={item.pos} />
              <View style={{ gap: 1 }}>
                <Text style={{ ...T.bodySm, fontWeight: "500", color: C.ink } as TextStyle}>
                  {item.name}
                </Text>
                <Text style={{ ...T.captionSm, color: C.inkFaint } as TextStyle}>
                  {item.team}{item.opp ? ` vs ${item.opp}` : ""}
                </Text>
              </View>
            </View>
            <Text {...tnum} style={{ ...T.captionMd, width: 66, textAlign: "right", color: C.inkMuted } as TextStyle}>
              {item.salary ? currency(item.salary) : "—"}
            </Text>
            <Text {...tnum} style={{ ...T.bodySm, fontWeight: "600", width: 46, textAlign: "right", color: C.ink } as TextStyle}>
              {item.proj.toFixed(1)}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
