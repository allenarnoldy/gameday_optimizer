import React from "react";
import { View, Text, Image, Platform, TextStyle, useWindowDimensions } from "react-native";
import { useTheme } from "../ThemeContext";
import { radius, space, type as T, heroTitle, APP_WIDTH } from "../theme";
import { heroLayer } from "../fonts";

/**
 * The hero band, ported from the design canvas.
 *
 * Five stacked layers: the deep blue-to-near-black gradient, a warm-side
 * overlay, a skewed stripe field, the football art bled off the right edge,
 * and the text. Everything but the text is decorative and marked
 * pointer-events: none so the band never eats a tap.
 *
 * The gradients and the two mask gradients are web-only (see fonts.ts) — RN
 * Web won't pass mask-image through the style prop. Native falls back to the
 * flat brand blue with the art at reduced opacity, which is the same band the
 * app shipped before.
 */

const web = Platform.OS === "web";

export default function HeroBand({
  label,
  labelShort,
  pill,
}: {
  label: string;
  /** Phone-width form; the long one wraps onto two lines under ~560px. */
  labelShort?: string;
  /** Settings summary, rendered inside the band's top-right. */
  pill?: React.ReactNode;
}) {
  const { C } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const narrow = width < 560;
  const hero = heroTitle(width);

  // Art scales with the band rather than with its own intrinsic size.
  const artH = isDesktop ? 236 : narrow ? 124 : 190;
  const artW = Math.round(artH * (245 / 249));

  return (
    <View style={{ paddingHorizontal: isDesktop ? space.xl : space.md, paddingTop: space.sm }}>
      <View
        {...heroLayer("bg")}
        style={{
          width: "100%",
          maxWidth: APP_WIDTH,
          alignSelf: "center",
          borderRadius: radius.md,
          overflow: "hidden",
          minHeight: isDesktop ? 208 : 168,
          justifyContent: "center",
          // Native (and any browser that drops the gradient) gets flat blue.
          backgroundColor: C.primary,
        }}
      >
        {web ? (
          <>
            <View
              {...heroLayer("overlay")}
              pointerEvents="none"
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <View
              {...heroLayer("stripes")}
              pointerEvents="none"
              style={{ position: "absolute", left: "-6%", top: "-30%", width: "46%", height: "160%" }}
            />
          </>
        ) : null}

        <Image
          {...heroLayer("art")}
          source={require("../../assets/hero-art.png")}
          pointerEvents="none"
          resizeMode="contain"
          style={{
            position: "absolute",
            // Sized in pixels, not percentages: a percentage height left the
            // image at its intrinsic 245px width, which on a 358px band ate
            // two thirds of the hero and pushed the eyebrow onto two lines.
            right: narrow ? -14 : 0,
            top: "54%",
            width: artW,
            height: artH,
            transform: [{ translateY: "-50%" as any }],
            // Without the radial mask the art would sit as a hard-edged tile,
            // so native softens it with opacity instead.
            opacity: web ? 1 : 0.55,
          }}
        />

        {/* Settings live in the band rather than on a strip above it — the
            mark and the controls used to float over black with a gap, which
            read as two disconnected pieces of chrome. */}
        {pill ? (
          <View
            style={{
              position: "absolute",
              top: space.sm,
              right: space.sm,
              zIndex: 5,
              maxWidth: "92%",
              alignItems: "flex-end",
            }}
          >
            {pill}
          </View>
        ) : null}

        <View
          style={{
            position: "relative",
            paddingTop: pill ? (isDesktop ? 74 : 62) : (isDesktop ? space.xl : space.lg),
            paddingBottom: isDesktop ? space.xl : space.lg,
            paddingHorizontal: space.lg,
            gap: space.xs,
            maxWidth: narrow ? "82%" : "64%",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
            <Image
              source={require("../../assets/logo.png")}
              style={{ width: 22, height: 22, borderRadius: 5 }}
              resizeMode="cover"
              accessibilityLabel="Gameday"
            />
            <Text
              style={{
                ...T.captionSm,
                textTransform: "uppercase",
                // Tighter on a phone so the slate line stays on one row.
                letterSpacing: narrow ? 0.9 : 1.6,
                color: "rgba(255,255,255,0.8)",
              } as TextStyle}
              numberOfLines={1}
            >
              {narrow ? (labelShort ?? label) : label}
            </Text>
          </View>
          <Text style={{ ...hero, color: "#ffffff" } as TextStyle}>Gameday</Text>
        </View>
      </View>
    </View>
  );
}
