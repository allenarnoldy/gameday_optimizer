import React from "react";
import { View, Text, TextStyle } from "react-native";
import { Lineup } from "../types";
import { useTheme } from "../ThemeContext";
import { currency } from "../utils/time";
import { radius, space, type as T, floatShadow } from "../theme";
import { PosBadge, gradient, BLUE_WASH } from "./ui";
import { tnum } from "../fonts";

export default function LineupCard({ lu, index }: { lu: Lineup; index: number }) {
  const { C } = useTheme();
  const slots = Object.entries(lu.slots);

  // The top lineup earns the brand's atmosphere device; the rest mark rank
  // through surface lift, which is how Framer carries hierarchy.
  const isTop = index === 0;
  const headerStyle = isTop
    ? gradient(BLUE_WASH, C.primary)
    : { backgroundColor: C.surface2 };
  const headerInk = isTop ? "#ffffff" : C.ink;
  const headerInkMuted = isTop ? "rgba(255,255,255,0.72)" : C.inkMuted;

  return (
    <View
      style={[
        {
          backgroundColor: C.surface1,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: isTop ? C.hairline : C.hairlineSoft,
          overflow: "hidden",
        },
        isTop ? floatShadow : null,
      ]}
    >
      {/* Header band */}
      <View
        style={[
          {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-end",
            paddingHorizontal: space.lg,
            paddingVertical: space.md + 3,
          },
          headerStyle,
        ]}
      >
        <View style={{ gap: 2 }}>
          <Text style={{ ...T.caption, color: headerInkMuted } as TextStyle}>
            {isTop ? "Optimal lineup" : `Lineup ${index + 1}`}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
            <Text {...tnum} style={{ ...T.displayMd, color: headerInk } as TextStyle}>
              {lu.totalProj.toFixed(1)}
            </Text>
            <Text style={{ ...T.caption, color: headerInkMuted } as TextStyle}>pts</Text>
          </View>
        </View>

        <View style={{ alignItems: "flex-end", gap: 2 }}>
          <Text style={{ ...T.caption, color: headerInkMuted } as TextStyle}>Salary used</Text>
          <Text {...tnum} style={{ ...T.headline, color: headerInk } as TextStyle}>
            {currency(lu.totalSalary)}
          </Text>
        </View>
      </View>

      {/* Roster rows */}
      <View style={{ paddingHorizontal: space.lg, paddingVertical: space.xs }}>
        {slots.map(([slot, p], i) => (
          <View
            key={slot}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 11,
              borderBottomWidth: i < slots.length - 1 ? 1 : 0,
              borderBottomColor: C.hairlineSoft,
              gap: space.sm,
            }}
          >
            <Text style={{ ...T.micro, width: 42, color: C.light } as TextStyle}>{slot}</Text>
            <PosBadge pos={p.pos} compact />
            <View style={{ flex: 1, gap: 1 }}>
              <Text numberOfLines={1} style={{ ...T.bodySm, color: C.ink } as TextStyle}>
                {p.name}
              </Text>
              <Text style={{ ...T.micro, color: C.inkMuted } as TextStyle}>
                {p.team}{p.opp ? ` vs ${p.opp}` : ""}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 1 }}>
              <Text {...tnum} style={{ ...T.bodySm, color: C.ink } as TextStyle}>
                {p.proj.toFixed(1)}
              </Text>
              {p.salary != null && (
                <Text {...tnum} style={{ ...T.micro, color: C.inkMuted } as TextStyle}>
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
