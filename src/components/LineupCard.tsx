import React from "react";
import { View, Text, TextStyle } from "react-native";
import { Lineup } from "../types";
import { useTheme } from "../ThemeContext";
import { currency } from "../utils/time";
import { radius, space, type as T } from "../theme";
import { PosBadge, GoldBar } from "./ui";
import { tnum, rise } from "../fonts";

export default function LineupCard({ lu, index }: { lu: Lineup; index: number }) {
  const { C } = useTheme();
  const slots = Object.entries(lu.slots);

  // Rank 1 gets the PS Plus gold treatment — the system's "premium tier"
  // signal, which is exactly what the optimal lineup is.
  const isTop = index === 0;
  const anim = rise(index);

  return (
    <View
      {...anim.attrs}
      style={[
        anim.style,
        {
          backgroundColor: C.surface2,
          borderRadius: radius.md,
          overflow: "hidden",
        },
      ]}
    >
      {isTop && <GoldBar />}

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
          paddingHorizontal: space.lg,
          paddingTop: space.md,
          paddingBottom: space.sm,
        }}
      >
        <View style={{ gap: 2 }}>
          <Text
            style={{
              ...T.captionSm,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: isTop ? C.goldMid : C.inkFaint,
            } as TextStyle}
          >
            {isTop ? "★ Optimal lineup" : `Lineup ${index + 1}`}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
            <Text {...tnum} style={{ ...T.displayMd, color: C.ink } as TextStyle}>
              {lu.totalProj.toFixed(1)}
            </Text>
            <Text style={{ ...T.captionMd, color: C.inkMuted } as TextStyle}>pts</Text>
          </View>
        </View>

        <View style={{ alignItems: "flex-end", gap: 2 }}>
          <Text style={{ ...T.captionSm, color: C.inkFaint } as TextStyle}>Salary used</Text>
          <Text {...tnum} style={{ ...T.headingMd, color: C.ink } as TextStyle}>
            {currency(lu.totalSalary)}
          </Text>
        </View>
      </View>

      {/* Roster */}
      <View style={{ paddingHorizontal: space.lg, paddingBottom: space.xs }}>
        {slots.map(([slot, p], i) => (
          <View
            key={slot}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 11,
              gap: space.sm,
              borderTopWidth: 1,
              borderTopColor: C.hairlineSoft,
            }}
          >
            <Text style={{ ...T.captionSm, width: 44, color: C.inkFaint } as TextStyle}>
              {slot}
            </Text>
            <PosBadge pos={p.pos} />
            <View style={{ flex: 1, gap: 1 }}>
              <Text numberOfLines={1} style={{ ...T.bodySm, fontWeight: "500", color: C.ink } as TextStyle}>
                {p.name}
              </Text>
              <Text style={{ ...T.captionSm, color: C.inkFaint } as TextStyle}>
                {p.team}{p.opp ? ` vs ${p.opp}` : ""}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 1 }}>
              <Text {...tnum} style={{ ...T.bodySm, fontWeight: "600", color: C.ink } as TextStyle}>
                {p.proj.toFixed(1)}
              </Text>
              {p.salary != null && (
                <Text {...tnum} style={{ ...T.captionSm, color: C.inkFaint } as TextStyle}>
                  ${p.salary.toLocaleString()}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
