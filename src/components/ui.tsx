import React from "react";
import { View, Text, Pressable, Platform, ViewStyle, TextStyle } from "react-native";
import { useTheme } from "../ThemeContext";
import { radius, space, type as T } from "../theme";
import { pressable, toggleable } from "../fonts";

/* ------------------------------------------------------------------ */
/* Gradient helper                                                     */
/* ------------------------------------------------------------------ */
/** The PS Plus gold is the system's only sanctioned chrome gradient. */
export function gradient(css: string, fallback: string): ViewStyle {
  if (Platform.OS === "web") {
    return { backgroundColor: fallback, backgroundImage: css } as any;
  }
  return { backgroundColor: fallback };
}

export const GOLD_BAR = "linear-gradient(90deg, #ffce21 0%, #f5a623 50%, #ee8e00 100%)";

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

type Variant = "primary" | "secondary" | "commerce";

/**
 * The universal PlayStation CTA: fully-rounded pill, 48px tall, heavyweight
 * label with +0.45px tracking. Pressed drops to the darker blue and scales
 * 0.97 so the press is felt, not just seen.
 */
export function PillButton({
  label,
  onPress,
  variant = "primary",
  disabled,
  compact,
  style,
  children,
}: {
  label?: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  compact?: boolean;
  style?: ViewStyle;
  children?: React.ReactNode;
}) {
  const { C } = useTheme();

  const fill =
    variant === "primary" ? C.primary : variant === "commerce" ? C.commerce : "transparent";
  const fillPressed = variant === "primary" ? C.primaryPressed : variant === "commerce" ? "#aa2f00" : C.surface2;
  const fg = variant === "secondary" ? C.ink : C.onPrimary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      {...pressable}
      style={({ pressed }) =>
        [
          {
            backgroundColor: disabled ? C.surface2 : pressed ? fillPressed : fill,
            borderRadius: radius.full,
            minHeight: compact ? 40 : 48,
            paddingVertical: compact ? 10 : 12,
            paddingHorizontal: compact ? 20 : 28,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: space.xs,
            borderWidth: variant === "secondary" ? 1 : 0,
            borderColor: C.hairline,
            transform: [{ scale: pressed && !disabled ? 0.97 : 1 }],
            opacity: disabled ? 0.6 : 1,
          } as ViewStyle,
          style,
        ] as ViewStyle
      }
    >
      {children}
      {label ? (
        <Text
          style={{
            ...(compact ? T.buttonMd : T.buttonLg),
            color: disabled ? C.inkFaint : fg,
          } as TextStyle}
        >
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

/** 48px circular icon button — the carousel-paddle shape. */
export function IconButton({
  onPress, disabled, children, size = 44,
}: {
  onPress?: () => void; disabled?: boolean; children: React.ReactNode; size?: number;
}) {
  const { C, isDark } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      {...pressable}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: radius.full,
        backgroundColor: pressed
          ? (isDark ? "rgba(255,255,255,0.26)" : "rgba(0,0,0,0.12)")
          : (isDark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.06)"),
        alignItems: "center",
        justifyContent: "center",
        transform: [{ scale: pressed && !disabled ? 0.94 : 1 }],
        opacity: disabled ? 0.5 : 1,
      })}
    >
      {children}
    </Pressable>
  );
}

/**
 * Filter / tab chip.
 *
 * The fill stays put in both states; selection is a 2px brand-blue outline
 * with the label switching to the brighter link blue. A solid blue fill was
 * indistinguishable from the primary CTA, which left nothing on screen
 * reading as *the* action — the solid fill belongs to the CTA alone.
 *
 * The border is always 2px (transparent when off) so toggling never nudges
 * layout, and the transition is colour-only because these are hit constantly.
 */
export function Chip({
  label, active, onPress, flex,
}: { label: string; active: boolean; onPress: () => void; flex?: boolean }) {
  const { C, isDark } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      {...toggleable}
      style={{
        flex: flex ? 1 : undefined,
        minHeight: 40,
        paddingVertical: 7,
        paddingHorizontal: 14,
        borderRadius: radius.full,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
        borderWidth: 2,
        borderColor: active ? C.primary : "transparent",
      }}
    >
      <Text
        style={{
          ...T.buttonMd,
          color: active ? C.link : C.inkMuted,
        } as TextStyle}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */

/** 8px-radius card, flat on canvas. The system has no resting shadow. */
export function Card({
  children, padding = space.lg, tone = "card", style,
}: {
  children: React.ReactNode;
  padding?: number;
  tone?: "card" | "elevated";
  style?: ViewStyle;
}) {
  const { C } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: tone === "elevated" ? C.surface1 : C.surface2,
          borderRadius: radius.md,
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Full-bleed band — the chapter device. Structural surfaces stay at 0 radius. */
export function Band({
  children, tone, style,
}: {
  children: React.ReactNode;
  tone: "blue" | "dark" | "canvas";
  style?: ViewStyle;
}) {
  const { C } = useTheme();
  const bg = tone === "blue" ? C.primary : tone === "dark" ? C.surface1 : C.canvas;
  return <View style={[{ backgroundColor: bg, borderRadius: radius.none }, style]}>{children}</View>;
}

export function Divider({ style }: { style?: ViewStyle }) {
  const { C } = useTheme();
  return <View style={[{ height: 1, backgroundColor: C.hairline }, style]} />;
}

/** The PS Plus gold accent bar — reserved for the top lineup. */
export function GoldBar({ height = 4 }: { height?: number }) {
  const { C } = useTheme();
  return <View style={[{ height, width: "100%" }, gradient(GOLD_BAR, C.goldMid)]} />;
}

/* ------------------------------------------------------------------ */
/* Position badge                                                      */
/* ------------------------------------------------------------------ */

export function PosBadge({ pos }: { pos: string }) {
  const { POS, C } = useTheme();
  const colors = POS[pos] ?? { bg: C.surface2, fg: C.inkMuted };
  return (
    <View
      style={{
        backgroundColor: colors.bg,
        borderRadius: radius.sm,
        paddingHorizontal: 7,
        paddingVertical: 3,
        minWidth: 40,
        alignItems: "center",
      }}
    >
      <Text style={{ ...T.captionSm, fontWeight: "700", color: colors.fg } as TextStyle}>
        {pos}
      </Text>
    </View>
  );
}
