import React from "react";
import { View, Text } from "react-native";
import { Lineup } from "../types";
import { C, POS, RANK } from "../theme";
import { currency } from "../utils/time";

function PosBadge({ pos }: { pos: string }) {
  const colors = POS[pos] ?? { bg: '#f1f5f9', fg: C.muted };
  return (
    <View style={{ backgroundColor: colors.bg, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, minWidth: 38, alignItems: "center" }}>
      <Text style={{ color: colors.fg, fontWeight: "700", fontSize: 11 }}>{pos}</Text>
    </View>
  );
}

export default function LineupCard({ lu, index }: { lu: Lineup; index: number }) {
  const rank = RANK[index];
  const borderColor = rank?.color ?? C.border;
  const headerBg = rank?.bg ?? '#f8fafc';
  const slots = Object.entries(lu.slots);

  return (
    <View style={{ backgroundColor: C.card, borderRadius: 20, borderWidth: 1.5, borderColor, overflow: "hidden" }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, backgroundColor: headerBg, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: rank ? borderColor : C.muted, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 13 }}>#{index + 1}</Text>
          </View>
          <View>
            <Text style={{ fontWeight: "800", fontSize: 20, color: C.text }}>{lu.totalProj.toFixed(2)}</Text>
            <Text style={{ color: C.muted, fontSize: 12 }}>projected pts</Text>
          </View>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontWeight: "700", fontSize: 16, color: C.text }}>{currency(lu.totalSalary)}</Text>
          <Text style={{ color: C.muted, fontSize: 12 }}>salary used</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
        {slots.map(([slot, p], i) => (
          <View
            key={slot}
            style={{
              flexDirection: "row", alignItems: "center",
              paddingVertical: 8, paddingHorizontal: 2,
              borderBottomWidth: i < slots.length - 1 ? 1 : 0,
              borderBottomColor: C.border,
            }}
          >
            <Text style={{ width: 44, fontSize: 11, color: C.light, fontWeight: "600" }}>{slot}</Text>
            <PosBadge pos={p.pos} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={{ fontWeight: "600", color: C.text, fontSize: 14 }}>{p.name}</Text>
              <Text style={{ color: C.muted, fontSize: 12 }}>{p.team}{p.opp ? ` vs ${p.opp}` : ""}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontWeight: "700", color: C.primary, fontSize: 14 }}>{p.proj.toFixed(2)}</Text>
              {p.salary != null && <Text style={{ color: C.muted, fontSize: 12 }}>${p.salary.toLocaleString()}</Text>}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
