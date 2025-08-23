import React from "react";
import { View, Text } from "react-native";
import { Lineup } from "../types";
import { currency } from "../utils/time";


export default function LineupCard({ lu, index }: { lu: Lineup; index: number }) {
return (
<View style={{ borderWidth: 1, borderRadius: 14, padding: 10, gap: 6 }}>
<View style={{ flexDirection: "row", justifyContent: "space-between" }}>
<Text style={{ fontWeight: "700" }}>#{index + 1} · {lu.totalProj.toFixed(2)} pts</Text>
<Text>{currency(lu.totalSalary)}</Text>
</View>
{Object.entries(lu.slots).map(([slot, p]) => (
<View key={slot} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
<View>
<Text style={{ fontWeight: "600" }}>{slot}</Text>
<Text>{p.name} — {p.team} {p.pos}</Text>
</View>
<View style={{ alignItems: "flex-end" }}>
<Text>{p.proj.toFixed(2)} pts</Text>
{p.salary != null && <Text>${p.salary}</Text>}
</View>
</View>
))}
</View>
);
}