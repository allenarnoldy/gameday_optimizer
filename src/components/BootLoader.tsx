import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  Animated,
  Easing,
  Platform,
  AccessibilityInfo,
  TextStyle,
  useWindowDimensions,
} from "react-native";
import { BODY_FONT } from "../theme";
import { gradient } from "./ui";
import { bootLayer } from "../fonts";

/**
 * Full-screen boot state, built from the App Boot Loader design.
 *
 * One cycle: a scan line snaps open across the stage, the app icon resolves
 * out of blur while a soft diagonal wipe uncovers it and a gloss sweeps
 * across, then a rule draws under it and the status line rises into place.
 * The whole thing loops until the slate arrives, with the status copy
 * advancing one phrase per cycle — the swap lands inside the long window
 * where the line is faded out, so it is never seen changing.
 *
 * Web runs the design as written: the wipe and vignette are mask images, the
 * gloss is a screen blend, the glow and gloss are blurred, and the grounds are
 * radial gradients. None of those exist in React Native, so the keyframes and
 * masks live in fonts.ts and bind by data attribute here, and native falls
 * back to an Animated reduction — see BootNative at the bottom for exactly
 * what it drops and why.
 *
 * Everything accent-tinted is set inline because the accent is a prop; the
 * stylesheet holds only accent-free rules, so one sheet serves any accent.
 */

/* ------------------------------------------------------------------ */
/* Design constants — the canvas's own values, kept literal            */
/* ------------------------------------------------------------------ */

/**
 * The design's default accent. It sits between this app's brand blue
 * (#0070d1) and its link blue (#53b1ff), and matches the electric blue in
 * the icon art it is lighting.
 */
const ACCENT = "#2f8cff";

/** One full boot cycle. The design's default. */
const CYCLE_MS = 5200;

/**
 * What the app is actually doing while this is up. The design canvas shipped
 * generic sample copy ("Fetching today's fixtures", "Checking the score");
 * these are the app's real first-load steps, carried over from the loader
 * this replaces. Override with the `phrases` prop.
 */
const PHRASES = [
  "Loading this week's slate",
  "Fetching player projections",
  "Checking kickoff times",
];

/** Stage size: min(46vh, 300px). */
const STAGE_VH = 0.46;
const STAGE_MAX = 300;
/** The footer column. */
const FOOT_MAX = 300;

/** The canvas's radial ground, and the mid stop native falls back to. */
const CANVAS =
  "radial-gradient(110% 80% at 50% 42%, #0a0d18 0%, #07090f 55%, #05060b 100%)";
const CANVAS_FLAT = "#07090f";

/** Nocturne's --color-neutral-200, the status line's colour. */
const STATUS_INK = "#e4e7f5";
/** The sweep track, #ffffff14. */
const TRACK = "rgba(255,255,255,0.078)";

/**
 * The design's spacing tokens, used literally rather than mapped onto this
 * app's 4pt scale so the rhythm matches the canvas: --space-8 between the
 * stage and the footer, --space-6 of side padding, --space-4 inside the
 * footer.
 */
const GAP_STAGE = 22.4;
const PAD_X = 16.8;
const PAD_Y = 22.4;
const GAP_FOOT = 11.2;

/** 0.6875rem at the design's .30em tracking. */
const STATUS_SIZE = 11;
const STATUS_TRACK = STATUS_SIZE * 0.3;

const WEB = Platform.OS === "web";

/**
 * The canvas writes its accent tints as 8-digit hex (`{accent}59`). Parsed to
 * rgba() instead so the alphas read as numbers, and so a 3- or 8-digit accent
 * works as well as a 6-digit one.
 */
function withAlpha(hex: string, alpha: number): string {
  let h = hex.trim().replace("#", "");
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  if (h.length === 8) h = h.slice(0, 6);
  const n = parseInt(h, 16);
  if (h.length !== 6 || Number.isNaN(n)) return hex;
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** Reads the OS "reduce motion" setting. On web RNW maps it to the media query. */
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then(v => {
      if (alive) setReduced(!!v);
    });
    const sub = AccessibilityInfo.addEventListener?.("reduceMotionChanged", v =>
      setReduced(!!v)
    );
    return () => {
      alive = false;
      (sub as any)?.remove?.();
    };
  }, []);
  return reduced;
}

/* ------------------------------------------------------------------ */
/* Public component                                                    */
/* ------------------------------------------------------------------ */

export type BootLoaderProps = {
  /** Drives every accent tint: the glow, scan line, haze, rule and sweep. */
  accent?: string;
  /** One boot cycle, in ms. Also the interval the status copy advances on. */
  durationMs?: number;
  /** Status lines, one per cycle. */
  phrases?: string[];
  /** Pins a single line instead of cycling — for a known, specific wait. */
  message?: string | null;
};

export default function BootLoader({
  accent = ACCENT,
  durationMs = CYCLE_MS,
  phrases = PHRASES,
  message = null,
}: BootLoaderProps) {
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();

  const stage = Math.min(height * STAGE_VH, STAGE_MAX);
  const foot = Math.min(FOOT_MAX, width - PAD_X * 2);

  /**
   * The copy advances once per cycle. On web the swap is hidden by the
   * status line's own fade — it is transparent from 96% of one cycle through
   * 44% of the next — so no crossfade is needed and the two stay in step
   * without sharing a clock. Native crossfades instead; see BootNative.
   */
  const [phrase, setPhrase] = useState(0);
  useEffect(() => {
    if (message || !WEB || phrases.length < 2) return;
    const id = setInterval(
      () => setPhrase(p => (p + 1) % phrases.length),
      durationMs
    );
    return () => clearInterval(id);
  }, [message, durationMs, phrases.length]);

  const shell = {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: GAP_STAGE,
    paddingVertical: PAD_Y,
    paddingHorizontal: PAD_X,
    overflow: "hidden" as const,
  };

  if (!WEB) {
    return (
      <BootNative
        accent={accent}
        durationMs={durationMs}
        phrases={phrases}
        message={message}
        stage={stage}
        foot={foot}
        reduced={reduced}
        shell={shell}
      />
    );
  }

  const cycle = `${durationMs}ms`;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      style={[shell, gradient(CANVAS, CANVAS_FLAT)]}
    >
      {/* Ambient haze — two off-centre accent blooms drifting on their own
          nine-second clock, independent of the boot cycle. */}
      <View
        {...bootLayer("haze")}
        pointerEvents="none"
        style={[
          { position: "absolute", top: "-20%", bottom: "-20%", left: "-10%", right: "-10%" },
          gradient(
            `radial-gradient(45% 40% at 22% 28%, ${withAlpha(accent, 0.133)} 0%, transparent 70%), ` +
              `radial-gradient(50% 45% at 80% 74%, ${withAlpha(accent, 0.078)} 0%, transparent 72%)`,
            "transparent"
          ),
        ]}
      />

      {/* The icon stage. Nothing here clips: the glow runs to 170% of it. */}
      <View {...bootLayer("stage")} style={{ width: stage, height: stage }}>
        {/* Glow, z0. The absolute-fill wrapper is what centres it — CSS grid
            centred it via place-items, which RN has no equivalent for. */}
        <View
          pointerEvents="none"
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", zIndex: 0 }}
        >
          <View
            {...bootLayer("glow")}
            style={[
              { width: "170%", height: "170%", animationDuration: cycle } as any,
              { borderRadius: 9999, ...({ borderRadius: "50%" } as any) },
              gradient(
                `radial-gradient(circle, ${withAlpha(accent, 0.349)} 0%, ${withAlpha(accent, 0.122)} 38%, transparent 68%)`,
                "transparent"
              ),
            ]}
          />
        </View>

        {/* The icon, z2. */}
        <View
          {...bootLayer("icon")}
          style={
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 2,
              animationDuration: cycle,
            } as any
          }
        >
          {/* The diagonal wipe. The gloss sits inside it, so it is uncovered
              by the same edge the icon is. */}
          <View
            {...bootLayer("wipe")}
            style={
              {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                animationDuration: cycle,
              } as any
            }
          >
            {/* Feathers the square icon into the ground. Oversized 6% so the
                mask's fade has somewhere to happen without cropping the art. */}
            <View
              {...bootLayer("vignette")}
              style={{ position: "absolute", top: "-6%", left: "-6%", right: "-6%", bottom: "-6%" }}
            >
              <Image
                source={require("../../assets/icon.png")}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
                accessibilityLabel="Gameday"
              />
            </View>

            {/* Specular gloss, screen-blended over the icon and the glow. */}
            <View
              {...bootLayer("gloss")}
              pointerEvents="none"
              style={[
                { position: "absolute", top: "-20%", bottom: "-20%", left: 0, width: "42%", animationDuration: cycle } as any,
                gradient(
                  "linear-gradient(90deg, transparent, #eaf4ff66 45%, #ffffff8c 52%, transparent)",
                  "transparent"
                ),
              ]}
            />
          </View>
        </View>

        {/* Scan line, z3 — above the icon, so it reads as passing over it. */}
        <View
          pointerEvents="none"
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", zIndex: 3 }}
        >
          <View
            {...bootLayer("line")}
            style={[
              {
                width: "78%",
                height: 2,
                animationDuration: cycle,
                boxShadow: `0 0 22px ${accent}`,
              } as any,
              gradient(
                `linear-gradient(90deg, transparent, ${accent} 18%, #dff0ff 50%, ${accent} 82%, transparent)`,
                accent
              ),
            ]}
          />
        </View>
      </View>

      {/* Footer: rule, status line, sweep. */}
      <View style={{ width: foot, alignItems: "center", gap: GAP_FOOT }}>
        <View
          {...bootLayer("rule")}
          style={[
            { width: "100%", height: 1, animationDuration: cycle } as any,
            gradient(`linear-gradient(90deg, transparent, ${accent}, transparent)`, accent),
          ]}
        />

        <Text
          {...bootLayer("foot")}
          accessibilityLiveRegion="polite"
          numberOfLines={1}
          style={
            {
              fontFamily: BODY_FONT,
              fontSize: STATUS_SIZE,
              fontWeight: "500",
              textTransform: "uppercase",
              // The base value; the cycle animates tracking .46em -> .30em
              // over the top of it, and animations outrank inline styles.
              letterSpacing: STATUS_TRACK,
              color: STATUS_INK,
              textAlign: "center",
              animationDuration: cycle,
            } as any
          }
        >
          {message ?? phrases[phrase % phrases.length]}
        </Text>

        {/* Indeterminate sweep — the app can't know how long the slate takes.
            It runs at its own 1.5s pace, deliberately out of step with the
            boot cycle so the screen never looks like it is beating in time. */}
        <View style={{ width: "46%", height: 1, overflow: "hidden", backgroundColor: TRACK }}>
          {reduced ? (
            // A parked 34% bar would read as a stalled download.
            <View
              style={[
                { position: "absolute", top: 0, bottom: 0, left: 0, right: 0 },
                gradient(
                  `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                  accent
                ),
              ]}
            />
          ) : (
            <View
              {...bootLayer("sweep")}
              style={[
                { position: "absolute", top: 0, bottom: 0, left: 0, width: "34%" },
                gradient(
                  `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                  accent
                ),
              ]}
            />
          )}
        </View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Native fallback                                                     */
/* ------------------------------------------------------------------ */

/**
 * What native can actually render of the design.
 *
 * Dropped, because React Native has no equivalent: the mask wipe, the
 * radial grounds (gradient() flattens to its fallback colour), the blur on
 * the glow and the screen-blended gloss. Without the wipe and the gloss
 * there is nothing to motivate the icon dissolving out and back every cycle
 * — it would just blink — so the icon arrives once and then breathes, which
 * is the 42%-62% settle of the design's own icon keyframe held on a loop.
 * The scan line, rule, status rotation and sweep all survive intact.
 */
function BootNative({
  accent,
  durationMs,
  phrases,
  message,
  stage,
  foot,
  reduced,
  shell,
}: {
  accent: string;
  durationMs: number;
  phrases: string[];
  message: string | null;
  stage: number;
  foot: number;
  reduced: boolean;
  shell: any;
}) {
  const enter = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const sweep = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const [phrase, setPhrase] = useState(0);

  const track = foot * 0.46;
  const bar = track * 0.34;

  // Arrival, then the settle loop and the sweep. Native driver throughout —
  // first load is the one moment the JS thread is genuinely busy.
  useEffect(() => {
    if (reduced) {
      enter.setValue(1);
      return;
    }
    const arrive = Animated.timing(enter, {
      toValue: 1,
      duration: Math.round(durationMs * 0.42),
      easing: Easing.bezier(0.16, 0.84, 0.24, 1),
      useNativeDriver: true,
    });
    const settle = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: Math.round(durationMs * 0.2),
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: Math.round(durationMs * 0.24),
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    const run = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 1500,
        easing: Easing.bezier(0.45, 0.05, 0.55, 0.95),
        useNativeDriver: true,
      })
    );
    arrive.start(() => settle.start());
    run.start();
    return () => {
      arrive.stop();
      settle.stop();
      run.stop();
    };
  }, [enter, bob, sweep, durationMs, reduced]);

  // Crossfade the copy, since there is no cycle-long fade to hide the swap in.
  useEffect(() => {
    if (message || phrases.length < 2) return;
    if (reduced) {
      const id = setInterval(
        () => setPhrase(p => (p + 1) % phrases.length),
        durationMs
      );
      return () => clearInterval(id);
    }
    const id = setInterval(() => {
      Animated.timing(fade, {
        toValue: 0,
        duration: 340,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        setPhrase(p => (p + 1) % phrases.length);
        Animated.timing(fade, {
          toValue: 1,
          duration: 340,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start();
      });
    }, durationMs);
    return () => clearInterval(id);
  }, [fade, message, durationMs, phrases.length, reduced]);

  const iconScale = enter.interpolate({ inputRange: [0, 1], outputRange: [1.34, 1] });
  const iconLift = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });
  const sweepX = sweep.interpolate({ inputRange: [0, 1], outputRange: [-bar, bar * 3.2] });

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      style={[shell, { backgroundColor: CANVAS_FLAT }]}
    >
      <View style={{ width: stage, height: stage, alignItems: "center", justifyContent: "center" }}>
        {/* Flat stand-in for the blurred radial glow, kept faint — at this
            alpha a hard-edged disc still reads as a lift, not a shape. */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            width: stage * 1.3,
            height: stage * 1.3,
            borderRadius: stage,
            backgroundColor: withAlpha(accent, 0.09),
          }}
        />
        <Animated.View
          style={{
            width: "100%",
            height: "100%",
            opacity: enter,
            transform: [{ scale: iconScale }, { translateY: iconLift }],
          }}
        >
          <Image
            source={require("../../assets/icon.png")}
            style={{ width: "100%", height: "100%", borderRadius: stage * 0.22 }}
            resizeMode="cover"
            accessibilityLabel="Gameday"
          />
        </Animated.View>
      </View>

      <View style={{ width: foot, alignItems: "center", gap: GAP_FOOT }}>
        <View style={{ width: "100%", height: 1, backgroundColor: accent, opacity: 0.55 }} />

        <Animated.Text
          accessibilityLiveRegion="polite"
          numberOfLines={1}
          style={[
            {
              fontFamily: BODY_FONT,
              fontSize: STATUS_SIZE,
              fontWeight: "500",
              textTransform: "uppercase",
              letterSpacing: STATUS_TRACK,
              color: STATUS_INK,
              textAlign: "center",
            } as TextStyle,
            { opacity: fade },
          ]}
        >
          {message ?? phrases[phrase % phrases.length]}
        </Animated.Text>

        <View style={{ width: track, height: 1, overflow: "hidden", backgroundColor: TRACK }}>
          {reduced ? (
            <View style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: accent }} />
          ) : (
            <Animated.View
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                width: bar,
                backgroundColor: accent,
                transform: [{ translateX: sweepX }],
              }}
            />
          )}
        </View>
      </View>
    </View>
  );
}
