import React from "react";
import { View, Text, Pressable, Platform, ActivityIndicator, ViewStyle, TextStyle } from "react-native";
import { useTheme } from "../ThemeContext";
import { radius, space, type as T } from "../theme";
import { pressable, toggleable, throwState } from "../fonts";

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
/** Same three stops, angled slightly so a tall row reads as a lit surface. */
export const GOLD_ROW = "linear-gradient(104deg, #ffce21 0%, #f5a623 55%, #ee8e00 100%)";

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
  accessibilityLabel,
}: {
  label?: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  compact?: boolean;
  style?: ViewStyle;
  children?: React.ReactNode;
  /** For states where the visible label is replaced by an indicator. */
  accessibilityLabel?: string;
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
      accessibilityLabel={accessibilityLabel ?? label}
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

/* ------------------------------------------------------------------ */
/* Throwing football                                                   */
/* ------------------------------------------------------------------ */
/**
 * The busy state for Generate: a ball thrown across the button, spinning.
 *
 * It takes the app icon's black-and-white football rather than the loader's
 * brown leather — on the blue fill the brown goes muddy at this size, while
 * black and white stays crisp and matches the mark in the nav.
 *
 * The motion is CSS (see fonts.ts): solving blocks the main thread, so an
 * Animated version would stall precisely while it is meant to show progress.
 * Native has no such stylesheet and falls back to the platform spinner.
 */
export function ThrowingBall() {
  if (Platform.OS !== "web") {
    return <ActivityIndicator size="small" color="#ffffff" />;
  }

  const W = 26;
  const H = 15;

  return (
    // The track reserves the arc's full width so the button doesn't resize
    // as the ball travels.
    <View style={{ width: 128, height: 26, alignItems: "center", justifyContent: "center" }}>
      <View
        {...throwState}
        style={{
          width: W,
          height: H,
          ...({ borderRadius: "50%" } as any),
          backgroundColor: "#0d1117",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.35)",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* Lace panel — long enough to read as lacing rather than a hash */}
        <View
          style={{
            position: "absolute",
            left: "28%",
            top: "44%",
            width: "44%",
            height: "12%",
            backgroundColor: "#ffffff",
          }}
        />
        {/* Three stitches across it */}
        {[34, 48, 62].map(left => (
          <View
            key={left}
            style={{
              position: "absolute",
              left: `${left}%`,
              top: "31%",
              width: "5%",
              height: "38%",
              backgroundColor: "#ffffff",
            }}
          />
        ))}
      </View>
    </View>
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
/* Checkbox                                                            */
/* ------------------------------------------------------------------ */

/**
 * 4px-radius box, filled brand blue when checked.
 *
 * Independent on/off options need a checkbox, not a pill: a row of pills
 * reads as "pick one", which is wrong wherever several can be active at
 * once. The filled state is fine here — at 20px it never competes with the
 * CTA the way a full-width pill did.
 */
export function Checkbox({ checked }: { checked: boolean }) {
  const { C } = useTheme();
  return (
    <View
      {...toggleable}
      style={{
        width: 20,
        height: 20,
        borderRadius: radius.sm,
        borderWidth: 2,
        borderColor: checked ? C.primary : C.hairline,
        backgroundColor: checked ? C.primary : "transparent",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {checked && (
        <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700", lineHeight: 14 }}>✓</Text>
      )}
    </View>
  );
}

/** Checkbox plus label, the whole row pressable so the target is generous. */
export function CheckRow({
  label, checked, onPress,
}: { label: string; checked: boolean; onPress: () => void }) {
  const { C } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.xs,
        minHeight: 40,
        paddingRight: space.xs,
      }}
    >
      <Checkbox checked={checked} />
      <Text style={{ ...T.bodySm, fontWeight: "500", color: C.ink } as TextStyle}>{label}</Text>
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

/**
 * Right-panel glyph for the drawer trigger — an outlined frame with its right
 * edge filled, so the button says which side the panel comes from. Drawn from
 * Views rather than a glyph font so it stays crisp and needs no dependency.
 */
export function PanelRightIcon({ color, size = 15 }: { color: string; size?: number }) {
  const h = Math.round(size * 0.82);
  return (
    <View
      style={{
        width: size,
        height: h,
        borderRadius: 2,
        borderWidth: 1.5,
        borderColor: color,
        flexDirection: "row",
        justifyContent: "flex-end",
        overflow: "hidden",
      }}
    >
      <View style={{ width: Math.round(size * 0.32), backgroundColor: color }} />
    </View>
  );
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
