import React, { useRef, useState } from "react";
import {
  View, Text, TextInput, Pressable, TextStyle, ViewStyle, useWindowDimensions,
} from "react-native";
import { useTheme } from "../ThemeContext";
import { radius, space, type as T } from "../theme";
import { tnum, pressable, popState } from "../fonts";
import { Checkbox } from "./ui";

export type Scoring = "ppr" | "half" | "std";

/** The staged copy of every setting the popover can change. */
export type Draft = {
  scoring: Scoring;
  cap: number;
  topN: number;
  maxPerTeam: number | null;
  windowNoon: boolean;
  window3pm: boolean;
};

export type Anchor = { top: number; right: number };

/* ------------------------------------------------------------------ */
/* Theme switch                                                        */
/* ------------------------------------------------------------------ */
/**
 * 52x28 track. The knob carries the mode you're in; the track shows the one
 * you'd switch to, which is why exactly one glyph is visible on each side.
 */
export function ThemeSwitch() {
  const { C, isDark, toggle } = useTheme();

  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: !isDark }}
      accessibilityLabel="Switch canvas mode"
      style={{ flexShrink: 0 }}
    >
      <View
        style={{
          width: 52,
          height: 28,
          borderRadius: radius.full,
          backgroundColor: isDark ? "rgba(255,255,255,0.12)" : C.primary,
          borderWidth: 1,
          borderColor: isDark ? C.hairline : C.primary,
          justifyContent: "center",
        }}
      >
        <View
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 5,
          }}
        >
          <Text style={{ fontSize: 13, lineHeight: 15, color: isDark ? "transparent" : "rgba(255,255,255,0.85)" }}>
            ☾
          </Text>
          <Text style={{ fontSize: 13, lineHeight: 15, color: isDark ? "rgba(229,229,229,0.6)" : "transparent" }}>
            ☀
          </Text>
        </View>

        <View
          style={{
            position: "absolute",
            top: 2,
            left: 2,
            width: 22,
            height: 22,
            borderRadius: radius.full,
            backgroundColor: "#ffffff",
            alignItems: "center",
            justifyContent: "center",
            transform: [{ translateX: isDark ? 0 : 24 }],
          }}
        >
          <Text style={{ fontSize: 12, lineHeight: 14, color: isDark ? "#121314" : C.primary }}>
            {isDark ? "☾" : "☀"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Summary pill                                                        */
/* ------------------------------------------------------------------ */

function Seg({ children }: { children: React.ReactNode }) {
  const { C } = useTheme();
  return (
    <Text
      {...tnum}
      numberOfLines={1}
      style={{
        fontFamily: T.captionSm.fontFamily,
        fontSize: 13,
        fontWeight: "600",
        letterSpacing: 0.2,
        color: C.ink,
        flexShrink: 1,
      } as TextStyle}
    >
      {children}
    </Text>
  );
}

function Rule() {
  const { C } = useTheme();
  return <View style={{ width: 1, height: 14, backgroundColor: C.hairline }} />;
}

/**
 * Settings collapse to a single read-only pill. The controls themselves move
 * into the popover behind the gear, so the working column starts at the hero
 * rather than at a form.
 */
export function SummaryPill({
  draft,
  onOpen,
}: {
  draft: Draft;
  onOpen: (a: Anchor) => void;
}) {
  const { C } = useTheme();
  const { width } = useWindowDimensions();
  const ref = useRef<View>(null);

  const currency = (n: number) => "$" + Number(n || 0).toLocaleString();
  const windows =
    draft.windowNoon && draft.window3pm ? "Noon + 3 PM"
      : draft.windowNoon ? "Noon only"
      : draft.window3pm ? "3 PM only"
      : "No windows";

  const scoringLabel =
    draft.scoring === "ppr" ? "PPR" : draft.scoring === "half" ? "Half PPR" : "Standard";
  const all = [
    scoringLabel,
    windows,
    currency(draft.cap),
    draft.topN === 1 ? "1 lineup" : `${draft.topN} lineups`,
    draft.maxPerTeam == null ? "Any per team" : `Max ${draft.maxPerTeam} / team`,
  ];
  const segments =
    width >= 1024 ? all
      : width >= 820 ? all.slice(0, 3)
      : width >= 620 ? all.slice(0, 2)
      : [scoringLabel];

  const open = () => {
    const node = ref.current as any;
    if (node?.measureInWindow) {
      node.measureInWindow((x: number, y: number, w: number, h: number) => {
        onOpen({ top: y + h + 8, right: Math.max(0, width - (x + w)) });
      });
    } else {
      onOpen({ top: 68, right: space.xl });
    }
  };

  return (
    <View
      ref={ref}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        flexShrink: 1,
        minWidth: 0,
        paddingVertical: 5,
        paddingLeft: 18,
        paddingRight: 5,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: C.hairline,
        backgroundColor: C.chipBg,
        maxWidth: "100%",
      }}
    >
      {/* The pill summarises as much as the width allows. Narrow screens keep
          only the two settings people change most; the rest stay one tap away
          behind the gear rather than wrapping or spilling off the edge. */}
      {segments.map((s, i) => (
        <React.Fragment key={s}>
          {i > 0 ? <Rule /> : null}
          <Seg>{s}</Seg>
        </React.Fragment>
      ))}

      <Pressable
        onPress={open}
        {...pressable}
        accessibilityLabel="Edit settings"
        style={{
          width: 40, height: 40, borderRadius: radius.full,
          alignItems: "center", justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 20, lineHeight: 24, color: C.ink }}>⚙</Text>
      </Pressable>

      <ThemeSwitch />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Settings popover                                                    */
/* ------------------------------------------------------------------ */

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

function ScoringChip({
  label, active, onPress,
}: { label: string; active: boolean; onPress: () => void }) {
  const { C } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      {...pressable}
      style={{
        flex: 1,
        minHeight: 40,
        paddingVertical: 7,
        paddingHorizontal: space.sm,
        borderRadius: radius.full,
        backgroundColor: C.chipBg,
        borderWidth: 2,
        borderColor: active ? C.primary : "transparent",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ ...T.buttonMd, color: active ? C.link : C.inkMuted } as TextStyle}>{label}</Text>
    </Pressable>
  );
}

function Field({
  label, value, placeholder, onChangeText,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChangeText: (t: string) => void;
}) {
  const { C } = useTheme();
  return (
    <View style={{ flex: 1, minWidth: 0 }}>
      <Label>{label}</Label>
      <TextInput
        value={value}
        placeholder={placeholder}
        placeholderTextColor={C.inkFaint}
        onChangeText={onChangeText}
        inputMode="numeric"
        {...tnum}
        style={{
          height: 44,
          paddingHorizontal: space.sm,
          borderRadius: radius.sm,
          backgroundColor: C.fieldBg,
          borderWidth: 1,
          borderColor: C.hairline,
          color: C.ink,
          fontFamily: T.bodySm.fontFamily,
          fontSize: 16,
          fontWeight: "500",
        } as any}
      />
    </View>
  );
}

const digits = (t: string) => String(t).replace(/\D/g, "");

export function SettingsPopover({
  anchor,
  draft,
  setDraft,
  onCancel,
  onApply,
}: {
  anchor: Anchor | null;
  draft: Draft;
  setDraft: (patch: Partial<Draft>) => void;
  onCancel: () => void;
  onApply: () => void;
}) {
  const { C } = useTheme();
  const { width } = useWindowDimensions();
  const open = !!anchor;

  // Kept mounted through the close so the fade-out can play.
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const last = useRef<Anchor | null>(null);
  if (anchor) last.current = anchor;

  React.useEffect(() => {
    if (open) {
      setMounted(true);
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setShown(true));
      });
      return () => { cancelAnimationFrame(outer); cancelAnimationFrame(inner); };
    }
    setShown(false);
    const t = setTimeout(() => setMounted(false), 200);
    return () => clearTimeout(t);
  }, [open]);

  if (!mounted || !last.current) return null;

  const a = last.current;

  return (
    <View
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      pointerEvents={open ? "auto" : "none"}
    >
      <Pressable
        onPress={onCancel}
        style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.4)",
          opacity: shown ? 1 : 0,
        }}
      />

      <View
        {...popState(shown)}
        style={{
          position: "absolute",
          top: a.top,
          right: a.right,
          width: Math.min(400, width - space.xxl),
          backgroundColor: C.canvas,
          borderWidth: 1,
          borderColor: C.hairline,
          borderRadius: radius.md,
          padding: 20,
          gap: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 20 },
          shadowOpacity: 0.42,
          shadowRadius: 52,
          elevation: 12,
          opacity: shown ? 1 : 0,
        } as ViewStyle}
      >
        <View>
          <Label>Scoring</Label>
          <View style={{ flexDirection: "row", gap: 6 }}>
            <ScoringChip label="PPR" active={draft.scoring === "ppr"} onPress={() => setDraft({ scoring: "ppr" })} />
            <ScoringChip label="Half" active={draft.scoring === "half"} onPress={() => setDraft({ scoring: "half" })} />
            <ScoringChip label="Standard" active={draft.scoring === "std"} onPress={() => setDraft({ scoring: "std" })} />
          </View>
        </View>

        <View>
          <Label>Kickoff window</Label>
          <View style={{ flexDirection: "row", gap: space.lg }}>
            <Pressable
              onPress={() => setDraft({ windowNoon: !draft.windowNoon })}
              style={{ flexDirection: "row", alignItems: "center", gap: space.xs, minHeight: 40 }}
            >
              <Checkbox checked={draft.windowNoon} />
              <Text style={{ ...T.bodySm, fontWeight: "500", color: C.ink } as TextStyle}>Noon</Text>
            </Pressable>
            <Pressable
              onPress={() => setDraft({ window3pm: !draft.window3pm })}
              style={{ flexDirection: "row", alignItems: "center", gap: space.xs, minHeight: 40 }}
            >
              <Checkbox checked={draft.window3pm} />
              <Text style={{ ...T.bodySm, fontWeight: "500", color: C.ink } as TextStyle}>3 PM</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <Field
            label="Salary cap"
            value={String(draft.cap)}
            onChangeText={t => setDraft({ cap: Number(digits(t) || 0) })}
          />
          <Field
            label="Lineups"
            value={String(draft.topN)}
            onChangeText={t => setDraft({ topN: Number(digits(t) || 0) })}
          />
          <Field
            label="Max / team"
            placeholder="Any"
            value={draft.maxPerTeam == null ? "" : String(draft.maxPerTeam)}
            onChangeText={t => setDraft({ maxPerTeam: digits(t) === "" ? null : Number(digits(t)) })}
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            gap: space.xs,
            paddingTop: space.xxs,
            borderTopWidth: 1,
            borderTopColor: C.hairlineSoft,
          }}
        >
          <Pressable
            onPress={onCancel}
            {...pressable}
            style={{
              flex: 1, minHeight: 44, marginTop: space.sm,
              borderWidth: 1, borderColor: C.hairline, borderRadius: radius.full,
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Text style={{ ...T.buttonLg, fontSize: 15, color: C.ink } as TextStyle}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={onApply}
            {...pressable}
            style={{
              flex: 1.2, minHeight: 44, marginTop: space.sm,
              backgroundColor: C.primary, borderRadius: radius.full,
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Text style={{ ...T.buttonLg, fontSize: 15, color: "#ffffff" } as TextStyle}>Apply</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
