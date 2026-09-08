import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, Animated, Easing, Platform, AccessibilityInfo, TextStyle, useWindowDimensions,
} from "react-native";
import { useTheme } from "../ThemeContext";
import { radius, space, type as T } from "../theme";
import { gradient } from "./ui";

/**
 * Full-screen loading state, rebuilt from the Football Loader design canvas.
 *
 * The canvas shipped its ball as a compiled component, so the geometry here is
 * taken from the poster SVG it embedded (viewBox 1200x800, ball at cx600 cy400
 * rx300 ry180, tilted -24deg) and re-expressed as percentages of the ball box.
 * Colours for the ball itself are the canvas's own leather/lace values; the
 * accent follows this app's brand rather than the canvas's blurple.
 *
 * Motion uses Animated rather than CSS keyframes so it behaves the same on
 * native as on web, and so the spin can be driven off the native thread.
 */

const BALL_W = 208;
const BALL_H = 125;
const TILT = "-24deg";

/** Ball leather and lacing, straight from the canvas poster. */
const LEATHER = "#9c4634";
const SEAM = "#6a2f22";
const LACE = "#eceadf";
const STRIPE = "#e4e1d8";

/** What the app is actually doing while this is on screen. */
const PHRASES = [
  "Loading this week's slate",
  "Fetching player projections",
  "Checking kickoff times",
];

const PHRASE_HOLD = 2600;
const PHRASE_FADE = 340;

/**
 * Web has no native animated module, so asking for the native driver only earns
 * a console warning and a JS fallback — and in that fallback Animated.loop runs
 * a single iteration and stops, which left the ball and the sweep frozen on
 * their end values. Native still gets the off-thread driver.
 */
const NATIVE = Platform.OS !== "web";

function Ball() {
  return (
    <View
      style={{
        width: BALL_W,
        height: BALL_H,
        borderRadius: BALL_W / 2,
        // A true ellipse needs a percentage radius; RN Web passes this through
        // to CSS, and native falls back to the pill above.
        ...({ borderRadius: "50%" } as any),
        backgroundColor: LEATHER,
        borderWidth: 3,
        borderColor: SEAM,
        overflow: "hidden",
      }}
    >
      {/* End stripes */}
      <View
        style={{
          position: "absolute",
          left: "5%",
          top: "45.3%",
          width: "10%",
          height: "9.4%",
          backgroundColor: STRIPE,
        }}
      />
      <View
        style={{
          position: "absolute",
          right: "5%",
          top: "45.3%",
          width: "10%",
          height: "9.4%",
          backgroundColor: STRIPE,
        }}
      />

      {/* Lace panel */}
      <View
        style={{
          position: "absolute",
          left: "36.7%",
          top: "47.8%",
          width: "26.7%",
          height: "4.4%",
          borderRadius: 4,
          backgroundColor: LACE,
        }}
      />

      {/* Four stitches straddling centre */}
      {[37.33, 43.67, 50, 56.33].map(left => (
        <View
          key={left}
          style={{
            position: "absolute",
            left: `${left}%`,
            top: "40.6%",
            width: "2.3%",
            height: "18.9%",
            borderRadius: 3,
            backgroundColor: LACE,
          }}
        />
      ))}
    </View>
  );
}

export default function FootballLoader({ message }: { message?: string | null }) {
  const { C } = useTheme();
  const { width } = useWindowDimensions();
  const narrow = width < 480;

  const spin = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const sweep = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const [phrase, setPhrase] = useState(0);
  const [reduced, setReduced] = useState(false);

  // Respect the OS "reduce motion" setting. On web RNW reads the media query.
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then(v => { if (alive) setReduced(!!v); });
    const sub = AccessibilityInfo.addEventListener?.("reduceMotionChanged", v => setReduced(!!v));
    return () => { alive = false; (sub as any)?.remove?.(); };
  }, []);

  // Spin, bob and sweep run for as long as the loader is mounted.
  useEffect(() => {
    if (reduced) return;
    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: NATIVE,
      })
    );
    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: NATIVE,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: NATIVE,
        }),
      ])
    );
    const sweepLoop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 1600,
        easing: Easing.bezier(0.45, 0.05, 0.55, 0.95),
        useNativeDriver: NATIVE,
      })
    );
    spinLoop.start();
    bobLoop.start();
    sweepLoop.start();
    return () => {
      spinLoop.stop();
      bobLoop.stop();
      sweepLoop.stop();
    };
  }, [spin, bob, sweep, reduced]);

  // Phrase rotation: fade out, swap, fade back in. Under reduced motion the
  // wording still advances — it's the progress report — but it cuts instead.
  useEffect(() => {
    if (reduced) {
      const id = setInterval(() => setPhrase(p => (p + 1) % PHRASES.length), PHRASE_HOLD);
      return () => clearInterval(id);
    }
    const id = setInterval(() => {
      Animated.timing(fade, {
        toValue: 0,
        duration: PHRASE_FADE,
        easing: Easing.out(Easing.quad),
        useNativeDriver: NATIVE,
      }).start(() => {
        setPhrase(p => (p + 1) % PHRASES.length);
        Animated.timing(fade, {
          toValue: 1,
          duration: PHRASE_FADE,
          easing: Easing.out(Easing.quad),
          useNativeDriver: NATIVE,
        }).start();
      });
    }, PHRASE_HOLD);
    return () => clearInterval(id);
  }, [fade, reduced]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [6, -6] });
  const barWidth = Math.min(320, width - space.xl * 2);
  const sweepX = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-barWidth * 0.32, barWidth],
  });

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: C.canvas,
        alignItems: "center",
        justifyContent: "center",
        gap: space.xl,
        paddingHorizontal: space.lg,
      }}
    >
      {/* The canvas centred the ball over a soft radial lift off the ground. */}
      <View
        style={[
          {
            width: narrow ? 260 : 320,
            height: narrow ? 260 : 320,
            borderRadius: 9999,
            alignItems: "center",
            justifyContent: "center",
          },
          gradient(
            `radial-gradient(circle at 50% 45%, ${C.surface2} 0%, transparent 68%)`,
            "transparent"
          ),
        ]}
      >
        <Animated.View style={{ transform: [{ translateY }, { rotate: TILT }, { rotate }] }}>
          <Ball />
        </Animated.View>
      </View>

      <View style={{ alignItems: "center", gap: space.md, width: barWidth }}>
        <Animated.Text
          style={[
            { ...T.bodyStrong, color: C.ink, textAlign: "center" } as TextStyle,
            { opacity: fade },
          ]}
        >
          {message ?? PHRASES[phrase]}
        </Animated.Text>

        {/* Indeterminate sweep — the app can't know how long the slate takes. */}
        <View
          style={{
            width: "100%",
            height: 2,
            overflow: "hidden",
            backgroundColor: C.surface2,
            borderRadius: radius.sm,
          }}
        >
          {reduced ? (
            // A parked 32% bar would read as a stalled download, so reduced
            // motion gets a solid track instead of a frozen sweep.
            <View
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: C.primary,
              }}
            />
          ) : (
            <Animated.View
              style={[
                {
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  width: "32%",
                  transform: [{ translateX: sweepX }],
                },
                gradient(
                  `linear-gradient(90deg, transparent, ${C.primary}, transparent)`,
                  C.primary
                ),
              ]}
            />
          )}
        </View>
      </View>
    </View>
  );
}
