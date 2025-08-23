import React from "react";
import { View, Text, TextInput, Pressable, Switch } from "react-native";


type Props = {
season: number; setSeason: (n: number) => void;
week: number; setWeek: (n: number) => void;
scoring: "ppr" | "half" | "std"; setScoring: (s: "ppr"|"half"|"std") => void;
cap: number; setCap: (n: number) => void;
topN: number; setTopN: (n: number) => void;
maxPerTeam: number | null; setMaxPerTeam: (n: number|null) => void;
windowNoon: boolean; setWindowNoon: (b: boolean) => void;
window3pm: boolean; setWindow3pm: (b: boolean) => void;
onLoadDemo: () => void;
onFetchSleeper: () => void;
onFetchSchedule: () => void;
onUpload: () => void;
};


export default function Controls(props: Props) {
const { season, setSeason, week, setWeek, scoring, setScoring, cap, setCap, topN, setTopN, maxPerTeam, setMaxPerTeam, windowNoon, setWindowNoon, window3pm, setWindow3pm, onLoadDemo, onFetchSleeper, onFetchSchedule, onUpload } = props;
return (
<View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 12, gap: 8 }}>
<Text style={{ fontWeight: "600", fontSize: 16 }}>1) Data Source</Text>
<View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
<Pressable onPress={onLoadDemo} style={{ paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderRadius: 12 }}><Text>Load Demo</Text></Pressable>
<Pressable onPress={onFetchSleeper} style={{ paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderRadius: 12 }}><Text>Sleeper (free)</Text></Pressable>
<Pressable onPress={onUpload} style={{ paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderRadius: 12 }}><Text>Upload CSV/JSON</Text></Pressable>
</View>


<View style={{ flexDirection: "row", gap: 12 }}>
<View style={{ flex: 1 }}>
<Text>Season</Text>
<TextInput keyboardType="numeric" value={String(season)} onChangeText={(t) => setSeason(Number(t || 0))} style={{ borderWidth: 1, borderRadius: 8, padding: 8 }} />
</View>
<View style={{ flex: 1 }}>
<Text>Week</Text>
<TextInput keyboardType="numeric" value={String(week)} onChangeText={(t) => setWeek(Number(t || 0))} style={{ borderWidth: 1, borderRadius: 8, padding: 8 }} />
</View>
</View>


<View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
<Text>Scoring:</Text>
<Pressable onPress={() => setScoring("ppr")} style={{ borderWidth: 1, borderRadius: 12, paddingVertical: 6, paddingHorizontal: 10 }}><Text>PPR</Text></Pressable>
<Pressable onPress={() => setScoring("half")} style={{ borderWidth: 1, borderRadius: 12, paddingVertical: 6, paddingHorizontal: 10 }}><Text>Half</Text></Pressable>
<Pressable onPress={() => setScoring("std")} style={{ borderWidth: 1, borderRadius: 12, paddingVertical: 6, paddingHorizontal: 10 }}><Text>Std</Text></Pressable>
</View>


<Text style={{ fontWeight: "600", fontSize: 16, marginTop: 8 }}>2) Schedule & Slate</Text>
<View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
<Pressable onPress={onFetchSchedule} style={{ paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderRadius: 12 }}><Text>Fetch Schedule</Text></Pressable>
</View>
<View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
<View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
<Switch value={windowNoon} onValueChange={setWindowNoon} />
<Text>Noon</Text>
</View>
<View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
<Switch value={window3pm} onValueChange={setWindow3pm} />
<Text>3 PM</Text>
</View>
</View>


<Text style={{ fontWeight: "600", fontSize: 16, marginTop: 8 }}>3) Roster & Cap</Text>
<View style={{ flexDirection: "row", gap: 12 }}>
<View style={{ flex: 1 }}>
<Text>Salary Cap</Text>
<TextInput keyboardType="numeric" value={String(cap)} onChangeText={(t) => setCap(Number(t || 0))} style={{ borderWidth: 1, borderRadius: 8, padding: 8 }} />
</View>
<View style={{ flex: 1 }}>
<Text>Top Lineups</Text>
<TextInput keyboardType="numeric" value={String(topN)} onChangeText={(t) => setTopN(Number(t || 0))} style={{ borderWidth: 1, borderRadius: 8, padding: 8 }} />
</View>
</View>
<View style={{ marginTop: 6 }}>
<Text>Max per Team (optional)</Text>
<TextInput keyboardType="numeric" value={maxPerTeam == null ? "" : String(maxPerTeam)} onChangeText={(t) => props.setMaxPerTeam(t === "" ? null : Number(t || 0))} style={{ borderWidth: 1, borderRadius: 8, padding: 8 }} />
</View>
</View>
);
}