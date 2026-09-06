import React from "react";
import { View, Text, TextInput, TextStyle, useWindowDimensions } from "react-native";
import { useTheme } from "../ThemeContext";
import { radius, space, type as T } from "../theme";
import { Card, Chip, Divider } from "./ui";
import { tnum } from "../fonts";

type Props = {
  scoring: "ppr" | "half" | "std"; setScoring: (s: "ppr" | "half" | "std") => void;
  cap: number; setCap: (n: number) => void;
  topN: number; setTopN: (n: number) => void;
  maxPerTeam: number | null; setMaxPerTeam: (n: number | null) => void;
  windowNoon: boolean; setWindowNoon: (b: boolean) => void;
  window3pm: boolean; setWindow3pm: (b: boolean) => void;
};

function Label({ children }: { children: React.ReactNode }) {
  const { C } = useTheme();
  return (
    <Text
      style={{
        ...T.captionSm,
        textTransform: "uppercase",
        letterSpacing: 0.9,
        color: C.inkFaint,
        marginBottom: space.xs,
      } as TextStyle}
    >
      {children}
    </Text>
  );
}

/** 4px radius, 48px tall. Focus is a 2px brand-blue inset border, no halo. */
function NumField({
  value, onChangeText, placeholder,
}: { value: string; onChangeText: (t: string) => void; placeholder?: string }) {
  const { C, isDark } = useTheme();
  return (
    <TextInput
      keyboardType="numeric"
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={C.inkFaint}
      {...tnum}
      style={{
        backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#ffffff",
        borderRadius: radius.sm,
        height: 48,
        paddingHorizontal: space.md,
        borderWidth: 1,
        borderColor: C.hairline,
        ...T.bodySm,
        fontWeight: "500",
        color: C.ink,
      } as TextStyle}
    />
  );
}

export default function Controls(props: Props) {
  const { width } = useWindowDimensions();
  const narrow = width < 620;
  const {
    scoring, setScoring,
    cap, setCap, topN, setTopN, maxPerTeam, setMaxPerTeam,
    windowNoon, setWindowNoon, window3pm, setWindow3pm,
  } = props;

  return (
    <Card padding={space.lg} style={{ gap: space.lg }}>

      <View style={{ flexDirection: narrow ? "column" : "row", gap: space.lg }}>
        <View style={{ flex: 1.4 }}>
          <Label>Scoring</Label>
          <View style={{ flexDirection: "row", gap: space.xs }}>
            {(["ppr", "half", "std"] as const).map(s => (
              <Chip
                key={s}
                flex
                label={s === "ppr" ? "PPR" : s === "half" ? "Half" : "Standard"}
                active={scoring === s}
                onPress={() => setScoring(s)}
              />
            ))}
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <Label>Kickoff window</Label>
          <View style={{ flexDirection: "row", gap: space.xs }}>
            <Chip flex label="Noon" active={windowNoon} onPress={() => setWindowNoon(!windowNoon)} />
            <Chip flex label="3 PM" active={window3pm} onPress={() => setWindow3pm(!window3pm)} />
          </View>
        </View>
      </View>

      <Divider />

      <View style={{ flexDirection: "row", gap: space.sm }}>
        <View style={{ flex: 1.3 }}>
          <Label>Salary cap</Label>
          <NumField value={String(cap)} onChangeText={t => setCap(Number(t.replace(/\D/g, "") || 0))} />
        </View>
        <View style={{ flex: 1 }}>
          <Label>Lineups</Label>
          <NumField value={String(topN)} onChangeText={t => setTopN(Number(t.replace(/\D/g, "") || 0))} />
        </View>
        <View style={{ flex: 1 }}>
          <Label>Max / team</Label>
          <NumField
            value={maxPerTeam == null ? "" : String(maxPerTeam)}
            onChangeText={t => {
              const d = t.replace(/\D/g, "");
              setMaxPerTeam(d === "" ? null : Number(d));
            }}
            placeholder="Any"
          />
        </View>
      </View>

    </Card>
  );
}
