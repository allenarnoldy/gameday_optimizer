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
        backgroundColor: C.surface1,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: C.hairlineSoft,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: space.lg,
          paddingVertical: space.sm,
          borderBottomWidth: 1,
          borderBottomColor: C.hairline,
          gap: space.xs,
        }}
      >
        <Text style={{ ...T.micro, flex: 1, color: C.light } as TextStyle}>
          PLAYER ({players.length})
        </Text>
        <Text style={{ ...T.micro, width: 64, textAlign: "right", color: C.light } as TextStyle}>SALARY</Text>
        <Text style={{ ...T.micro, width: 46, textAlign: "right", color: C.light } as TextStyle}>PROJ</Text>
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
              paddingHorizontal: space.lg,
              paddingVertical: 11,
              borderBottomWidth: 1,
              borderBottomColor: C.hairlineSoft,
              gap: space.xs,
            }}
          >
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: space.xs }}>
              <PosBadge pos={item.pos} compact />
              <View style={{ gap: 1 }}>
                <Text style={{ ...T.bodySm, color: C.ink } as TextStyle}>{item.name}</Text>
                <Text style={{ ...T.micro, color: C.inkMuted } as TextStyle}>
                  {item.team}{item.opp ? ` vs ${item.opp}` : ""}
                </Text>
              </View>
            </View>
            <Text
              {...tnum}
              style={{ ...T.micro, width: 64, textAlign: "right", color: C.inkMuted } as TextStyle}
            >
              {item.salary ? currency(item.salary) : "—"}
            </Text>
            <Text
              {...tnum}
              style={{ ...T.bodySm, width: 46, textAlign: "right", color: C.ink } as TextStyle}
            >
              {item.proj.toFixed(1)}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
