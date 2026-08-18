import React from "react";
import { View, Text, TextInput, Pressable, Switch } from "react-native";
import { C } from "../theme";

type Props = {
  scoring: "ppr" | "half" | "std"; setScoring: (s: "ppr" | "half" | "std") => void;
  cap: number; setCap: (n: number) => void;
  topN: number; setTopN: (n: number) => void;
  maxPerTeam: number | null; setMaxPerTeam: (n: number | null) => void;
  windowNoon: boolean; setWindowNoon: (b: boolean) => void;
  window3pm: boolean; setWindow3pm: (b: boolean) => void;
};

function FieldLabel({ label }: { label: string }) {
  return <Text style={{ fontSize: 12, color: C.muted, marginBottom: 4, fontWeight: "500" }}>{label}</Text>;
}

const inputStyle = {
  borderWidth: 1.5, borderColor: C.border, borderRadius: 10,
  padding: 10, fontSize: 15, color: C.text,
} as const;

export default function Controls(props: Props) {
  const {
    scoring, setScoring,
    cap, setCap, topN, setTopN, maxPerTeam, setMaxPerTeam,
    windowNoon, setWindowNoon, window3pm, setWindow3pm,
  } = props;

  return (
    <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 16, gap: 14, borderWidth: 1, borderColor: C.border }}>

      {/* Scoring row */}
      <View>
        <FieldLabel label="Scoring" />
        <View style={{ flexDirection: "row", gap: 6 }}>
          {(["ppr", "half", "std"] as const).map(s => {
            const active = scoring === s;
            return (
              <Pressable
                key={s}
                onPress={() => setScoring(s)}
                style={{
                  flex: 1, paddingVertical: 9, borderRadius: 10,
                  backgroundColor: active ? C.primary : C.card,
                  borderWidth: 1.5, borderColor: active ? C.primary : C.border,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: active ? "#fff" : C.muted, fontWeight: "700", fontSize: 12, textTransform: "uppercase" }}>
                  {s}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Window toggles */}
      <View style={{ flexDirection: "row", gap: 20, alignItems: "center" }}>
        <Text style={{ fontSize: 12, fontWeight: "500", color: C.muted }}>Game window</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Switch value={windowNoon} onValueChange={setWindowNoon} trackColor={{ true: C.primary }} />
          <Text style={{ color: C.text, fontWeight: "500" }}>Noon</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Switch value={window3pm} onValueChange={setWindow3pm} trackColor={{ true: C.primary }} />
          <Text style={{ color: C.text, fontWeight: "500" }}>3 PM</Text>
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: C.border }} />

      {/* Cap / Top N / Max per team */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <FieldLabel label="Salary Cap" />
          <TextInput
            keyboardType="numeric"
            value={String(cap)}
            onChangeText={t => setCap(Number(t || 0))}
            style={inputStyle}
          />
        </View>
        <View style={{ flex: 1 }}>
          <FieldLabel label="Top Lineups" />
          <TextInput
            keyboardType="numeric"
            value={String(topN)}
            onChangeText={t => setTopN(Number(t || 0))}
            style={inputStyle}
          />
        </View>
        <View style={{ flex: 1 }}>
          <FieldLabel label="Max / Team" />
          <TextInput
            keyboardType="numeric"
            value={maxPerTeam == null ? "" : String(maxPerTeam)}
            onChangeText={t => setMaxPerTeam(t === "" ? null : Number(t || 0))}
            style={inputStyle}
            placeholder="—"
            placeholderTextColor={C.light}
          />
        </View>
      </View>

    </View>
  );
}
