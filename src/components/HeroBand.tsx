import React from "react";
import { View, Text, Image, Platform, TextStyle, useWindowDimensions } from "react-native";
import { useTheme } from "../ThemeContext";
import { radius, space, type as T, heroType, APP_WIDTH } from "../theme";
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

export default function HeroBand({ label }: { label: string }) {
  const { C } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const narrow = width < 560;
  const hero = heroType(width);

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
            // On a phone the band is barely wider than the art, so it is
            // pushed further off the edge and scaled down rather than sitting
            // on top of the title.
            right: narrow ? "-8%" : 0,
            top: "54%",
            height: narrow ? "78%" : "112%",
            aspectRatio: 245 / 249,
            transform: [{ translateY: "-50%" as any }],
            // Without the radial mask the art would sit as a hard-edged tile,
            // so native softens it with opacity instead.
            opacity: web ? 1 : 0.55,
          }}
        />

        <View
          style={{
            position: "relative",
            paddingVertical: isDesktop ? space.xl : space.lg,
            paddingHorizontal: space.lg,
            gap: space.xs,
            maxWidth: narrow ? "72%" : "64%",
          }}
        >
          <Text
            style={{
              ...T.captionSm,
              textTransform: "uppercase",
              letterSpacing: 1.6,
              color: "rgba(255,255,255,0.8)",
            } as TextStyle}
          >
            {label}
          </Text>
          <Text style={{ ...hero, color: "#ffffff" } as TextStyle}>Gameday Optimizer</Text>
        </View>
      </View>
    </View>
  );
}
