import React from "react";
import { View, Text, TextInput, Pressable, TextStyle, useWindowDimensions } from "react-native";
import { useTheme } from "../ThemeContext";
import { radius, space, type as T } from "../theme";
import { Card, Divider } from "./ui";
import { tnum } from "../fonts";

type Props = {
  scoring: "ppr" | "half" | "std"; setScoring: (s: "ppr" | "half" | "std") => void;
  cap: number; setCap: (n: number) => void;
  topN: number; setTopN: (n: number) => void;
  maxPerTeam: number | null; setMaxPerTeam: (n: number | null) => void;
  windowNoon: boolean; setWindowNoon: (b: boolean) => void;
  window3pm: boolean; setWindow3pm: (b: boolean) => void;
};

/** Field label — caption tier, ink-muted. Hierarchy is ink -> ink-muted only. */
function Label({ children }: { children: React.ReactNode }) {
  const { C } = useTheme();
  return (
    <Text style={{ ...T.caption, color: C.inkMuted, marginBottom: space.xs } as TextStyle}>
      {children}
    </Text>
  );
}

/**
 * Pill toggle. The spec marks selection with a surface lift, but on a
 * near-black canvas that reads as "slightly darker black" — the on-state has
 * to be unmistakable in a tool, so it takes the accent fill.
 */
function TabPill({
  label, active, onPress, flex,
}: { label: string; active: boolean; onPress: () => void; flex?: boolean }) {
  const { C } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: flex ? 1 : undefined,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: radius.pill,
        minHeight: 40,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: active ? C.primary : "transparent",
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      <Text
        style={{
          ...T.button,
          fontWeight: active ? "600" : "500",
          color: active ? C.onPrimary : C.inkMuted,
        } as TextStyle}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function NumField({
  value, onChangeText, placeholder,
}: { value: string; onChangeText: (t: string) => void; placeholder?: string }) {
  const { C } = useTheme();
  return (
    <TextInput
      keyboardType="numeric"
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={C.light}
      {...tnum}
      style={{
        backgroundColor: C.surface2,
        borderRadius: radius.md,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: C.hairline,
        ...T.body,
        color: C.ink,
      } as TextStyle}
    />
  );
}

export default function Controls(props: Props) {
  const { C } = useTheme();
  const { width } = useWindowDimensions();
  const narrow = width < 560;
  const {
    scoring, setScoring,
    cap, setCap, topN, setTopN, maxPerTeam, setMaxPerTeam,
    windowNoon, setWindowNoon, window3pm, setWindow3pm,
  } = props;

  return (
    <Card padding={space.lg} style={{ gap: space.lg }}>

      {/* Scoring + game window sit on one line at desktop width */}
      <View style={{ flexDirection: narrow ? "column" : "row", gap: space.lg }}>
        <View style={{ flex: 1 }}>
          <Label>Scoring</Label>
          <View
            style={{
              flexDirection: "row",
              gap: space.xxs,
              backgroundColor: C.canvas,
              borderRadius: radius.pill,
              padding: 4,
              borderWidth: 1,
              borderColor: C.hairlineSoft,
            }}
          >
            {(["ppr", "half", "std"] as const).map(s => (
              <TabPill
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
          <Label>Game window</Label>
          <View
            style={{
              flexDirection: "row",
              gap: space.xxs,
              backgroundColor: C.canvas,
              borderRadius: radius.pill,
              padding: 4,
              borderWidth: 1,
              borderColor: C.hairlineSoft,
            }}
          >
            <TabPill flex label="Noon" active={windowNoon} onPress={() => setWindowNoon(!windowNoon)} />
            <TabPill flex label="3 PM" active={window3pm} onPress={() => setWindow3pm(!window3pm)} />
          </View>
        </View>
      </View>

      <Divider soft />

      {/* Numeric constraints */}
      <View style={{ flexDirection: "row", gap: space.sm }}>
        <View style={{ flex: 1.2 }}>
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
