import React from "react";
import { View, Text, Pressable, Platform, ViewStyle, TextStyle } from "react-native";
import { useTheme } from "../ThemeContext";
import { radius, space, type as T, floatShadow } from "../theme";

/* ------------------------------------------------------------------ */
/* Gradient helper                                                     */
/* ------------------------------------------------------------------ */
/**
 * The gradient spotlight is the brand's atmosphere device. On web we hand CSS
 * the real multi-stop gradient; on native we fall back to the base anchor
 * color the spec documents. No extra dependency for a web-first target.
 */
export function gradient(css: string, fallback: string): ViewStyle {
  if (Platform.OS === "web") {
    return { backgroundColor: fallback, backgroundImage: css } as any;
  }
  return { backgroundColor: fallback };
}

export const VIOLET_WASH =
  "radial-gradient(120% 120% at 12% 0%, #8b6cff 0%, #6a4cf5 42%, #4a2fd0 100%)";
export const MAGENTA_WASH =
  "radial-gradient(120% 120% at 85% 10%, #ef7bff 0%, #d44df0 45%, #8f2bb8 100%)";
export const ORANGE_WASH =
  "radial-gradient(120% 120% at 20% 100%, #ffb347 0%, #ff7a3d 45%, #ff5577 100%)";

/* ------------------------------------------------------------------ */
/* Chip — small caption pill used as an eyebrow                        */
/* ------------------------------------------------------------------ */

export function Chip({
  label,
  tone = "muted",
  style,
}: {
  label: string;
  tone?: "muted" | "ink" | "accent";
  style?: ViewStyle;
}) {
  const { C } = useTheme();
  const fg = tone === "ink" ? C.ink : tone === "accent" ? C.accent : C.inkMuted;
  return (
    <View
      style={[
        {
          alignSelf: "flex-start",
          backgroundColor: C.surface1,
          borderRadius: radius.pill,
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderWidth: 1,
          borderColor: C.hairline,
        },
        style,
      ]}
    >
      <Text style={{ ...T.caption, color: fg } as TextStyle}>{label}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

type PillVariant = "primary" | "secondary" | "translucent";

export function PillButton({
  label,
  onPress,
  variant = "primary",
  disabled,
  size = "md",
  style,
  children,
}: {
  label?: string;
  onPress?: () => void;
  variant?: PillVariant;
  disabled?: boolean;
  size?: "md" | "lg";
  style?: ViewStyle;
  children?: React.ReactNode;
}) {
  const { C } = useTheme();

  const bg =
    variant === "primary" ? C.primary : variant === "secondary" ? C.surface1 : C.surface2;
  const fg = variant === "primary" ? C.onPrimary : C.ink;

  const padV = size === "lg" ? 16 : 10;
  const padH = size === "lg" ? 24 : 15;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) =>
        [
          {
            backgroundColor: disabled ? C.surface1 : bg,
            borderRadius: radius.pill,
            paddingVertical: padV,
            paddingHorizontal: padH,
            minHeight: 44,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: space.xs,
            // The spec's pressed state is a scale shrink, not a darkened fill.
            transform: [{ scale: pressed && !disabled ? 0.97 : 1 }],
            opacity: disabled ? 0.5 : 1,
            borderWidth: variant === "primary" ? 0 : 1,
            borderColor: C.hairline,
          } as ViewStyle,
          style,
        ] as ViewStyle
      }
    >
      {children}
      {label ? (
        <Text
          style={{
            ...T.button,
            fontSize: size === "lg" ? 15 : 14,
            color: disabled ? C.inkMuted : fg,
          } as TextStyle}
        >
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

/** 40px circle for inline icon actions. Grows to 44px on touch viewports. */
export function IconButton({
  onPress,
  disabled,
  children,
  active,
  size = 40,
}: {
  onPress?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  active?: boolean;
  size?: number;
}) {
  const { C } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: radius.full,
        backgroundColor: active ? C.surface2 : C.surface1,
        borderWidth: 1,
        borderColor: active ? C.hairline : C.hairlineSoft,
        alignItems: "center",
        justifyContent: "center",
        transform: [{ scale: pressed && !disabled ? 0.94 : 1 }],
        opacity: disabled ? 0.45 : 1,
      })}
    >
      {children}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */

/** Surface-lift card. `featured` steps up one level (surface1 -> surface2). */
export function Card({
  children,
  featured,
  padding = 24,
  float,
  style,
}: {
  children: React.ReactNode;
  featured?: boolean;
  padding?: number;
  float?: boolean;
  style?: ViewStyle;
}) {
  const { C } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: featured ? C.surface2 : C.surface1,
          borderRadius: radius.xl,
          padding,
          borderWidth: 1,
          borderColor: featured ? C.hairline : C.hairlineSoft,
        },
        float ? floatShadow : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

/**
 * Gradient spotlight card. Scarce by design — the spec allows one or two per
 * long page; three reads as a moodboard.
 */
export function Spotlight({
  children,
  wash = VIOLET_WASH,
  fallback,
  padding = 32,
  style,
}: {
  children: React.ReactNode;
  wash?: string;
  fallback?: string;
  padding?: number;
  style?: ViewStyle;
}) {
  const { C } = useTheme();
  return (
    <View
      style={[
        {
          borderRadius: radius.xxl,
          padding,
          overflow: "hidden",
        },
        gradient(wash, fallback ?? C.gradViolet),
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Divider({ soft, style }: { soft?: boolean; style?: ViewStyle }) {
  const { C } = useTheme();
  return (
    <View style={[{ height: 1, backgroundColor: soft ? C.hairlineSoft : C.hairline }, style]} />
  );
}

/* ------------------------------------------------------------------ */
/* Position badge                                                      */
/* ------------------------------------------------------------------ */
/**
 * Surfaces stay monochrome; the position coding lives in the glyph color,
 * drawn only from the documented gradient family.
 */
export function PosBadge({ pos, compact }: { pos: string; compact?: boolean }) {
  const { POS, C } = useTheme();
  const colors = POS[pos] ?? { bg: C.surface2, fg: C.inkMuted };
  return (
    <View
      style={{
        backgroundColor: colors.bg,
        borderRadius: radius.sm,
        paddingHorizontal: compact ? 6 : 8,
        paddingVertical: compact ? 3 : 4,
        minWidth: compact ? 34 : 40,
        alignItems: "center",
        borderWidth: 1,
        borderColor: C.hairlineSoft,
      }}
    >
      <Text style={{ ...T.caption, fontSize: 11, color: colors.fg } as TextStyle}>{pos}</Text>
    </View>
  );
}
