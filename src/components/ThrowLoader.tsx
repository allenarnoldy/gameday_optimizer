import React from "react";
import {
  View,
  Platform,
  ActivityIndicator,
  LayoutChangeEvent,
  ViewStyle,
} from "react-native";
import { throwState } from "../fonts";

/**
 * The busy state for Generate, ported from the Football Throw Loader design.
 *
 * The button becomes the field: yard marks scroll past underneath while a
 * football is thrown along an arc that rises out of the bar and lands at the
 * far end, tumbling as it goes.
 *
 * Drawn as DOM/SVG rather than react-native-svg, which isn't a dependency
 * here, and animated in CSS (see fonts.ts) rather than with Animated: solving
 * blocks the main thread, so a JS-driven animation would stall exactly when it
 * is meant to show progress. Native has neither and keeps the platform spinner
 * on the flat brand fill.
 */

/** The design's bar height. Kept exact: see the 1:1 note on the viewBox. */
const H = 56;
/** The design's reference width, used only until the real one is measured. */
const W0 = 420;

/** Football, centred on the origin so offset-path can carry it. */
const BALL =
  "M -20 0 C -18 -8, -9 -12.6, 0 -12.6 C 9 -12.6, 18 -8, 20 0 " +
  "C 18 8, 9 12.6, 0 12.6 C -9 12.6, -18 8, -20 0 Z";

/** Yard-mark pitch and length, from the design. */
const HASH_PITCH = 48;
const HASH_LEN = 14;

export const THROW_BAR_HEIGHT = H;
export const THROW_BAR_WIDTH = W0;

/**
 * The bar's own surface. The idle CTA borrows it so that starting a solve
 * swaps the contents of the button without the button itself changing.
 */
export const CTA_GRADIENT =
  "linear-gradient(100deg, #1580e6 0%, #0d6ed0 46%, #0a5cb8 100%)";
export const CTA_BORDER = "#9cc3ea";
export const CTA_SHADOW =
  "0 1px 0 rgba(255,255,255,0.18) inset, 0 6px 22px rgba(13,110,208,0.34)";

/** The design's arc, expressed as fractions of the bar so it can span any width. */
function arcPath(w: number) {
  const x = (f: number) => +(w * f).toFixed(2);
  return `M ${x(16 / W0)} 42 C ${x(100 / W0)} -16, ${x(320 / W0)} -16, ${x(404 / W0)} 42`;
}

/** Enough marks to cover the bar plus one pitch, so the scroll never runs dry. */
function hashPath(w: number) {
  const n = Math.ceil((w + HASH_PITCH) / HASH_PITCH) + 1;
  let d = "";
  for (let i = 0; i < n; i++) d += `M${12 + i * HASH_PITCH} 42 h${HASH_LEN} `;
  return d.trim();
}

/** The leather itself. Static — the tumble is applied by the group above it. */
function Ball() {
  return (
    // The scale is repeated as a resting value so the ball keeps its size when
    // reduced motion switches the tumble off.
    <g style={{ transform: "scale(1.2)", animation: "omTumble .5s ease-in-out infinite" }}>
      <path d={BALL} fill="url(#omLeather)" />
      <g clipPath="url(#omBallClip)">
        {/* Shaded underside */}
        <path d="M -21 2.2 C -9 8.4, 9 7, 21 -2.2 L 21 14 L -21 14 Z" fill="#5c2b14" />
        {/* End stripes */}
        <path
          d="M 10.4 -12 C 13.4 -4.6, 13.4 4.6, 10.4 12 L 15.2 12 C 17.8 4.6, 17.8 -4.6, 15.2 -12 Z"
          fill="#f1f1ef"
        />
        <path
          d="M -10.4 -12 C -13.4 -4.6, -13.4 4.6, -10.4 12 L -15.2 12 C -17.8 4.6, -17.8 -4.6, -15.2 -12 Z"
          fill="#f1f1ef"
        />
        {/* Seam, top-light, lacing */}
        <path
          d="M -21 2.2 C -9 8.4, 9 7, 21 -2.2"
          fill="none"
          stroke="#14100c"
          strokeWidth={1.8}
        />
        <path
          d="M -11.5 -7.4 C -5 -10.2, 4 -10.8, 11.5 -8.6"
          fill="none"
          stroke="#ffffff"
          strokeOpacity={0.22}
          strokeWidth={2.4}
          strokeLinecap="round"
        />
        <path
          d="M -7.4 -6.8 C -2.4 -8.2, 3 -8.8, 7.8 -8.6"
          fill="none"
          stroke="#f4f4f2"
          strokeWidth={1.2}
          strokeLinecap="round"
        />
        <path
          d="M -6.6 -9 v4 M -3.2 -9.6 v4 M 0.2 -10 v4 M 3.6 -10 v4 M 7 -9.8 v4"
          stroke="#f4f4f2"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </g>
      <path d={BALL} fill="none" stroke="#14100c" strokeWidth={2.2} strokeLinejoin="round" />
    </g>
  );
}

export default function ThrowLoader({
  /** Seconds for one throw. The design's default. */
  throwSeconds = 1.25,
  showTrail = true,
  style,
}: {
  throwSeconds?: number;
  showTrail?: boolean;
  style?: ViewStyle;
}) {
  const [w, setW] = React.useState(W0);

  if (Platform.OS !== "web") {
    return (
      <View
        style={[
          {
            height: H,
            borderRadius: H / 2,
            backgroundColor: "#0d6ed0",
            alignItems: "center",
            justifyContent: "center",
          },
          style,
        ]}
      >
        <ActivityIndicator size="small" color="#ffffff" />
      </View>
    );
  }

  const onLayout = (e: LayoutChangeEvent) => {
    const next = Math.round(e.nativeEvent.layout.width);
    if (next > 0 && next !== w) setW(next);
  };

  const dur = `${throwSeconds}s`;
  const arc = arcPath(w);

  return (
    <View
      {...throwState}
      onLayout={onLayout}
      accessibilityRole="progressbar"
      accessibilityLabel="Solving lineups"
      style={[
        {
          height: H,
          borderRadius: H / 2,
          // The design's 1.5px rim is stroked inside the SVG instead of set as
          // a CSS border: a border shrinks the content box, which would leave
          // the viewBox mapping slightly wider than it is tall and squash the
          // football. The arc also leaves the pill, so nothing here may clip.
          overflow: "visible",
          ...({ backgroundImage: CTA_GRADIENT, boxShadow: CTA_SHADOW } as any),
        },
        style,
      ]}
    >
      {/*
        The viewBox is the measured width by the design's 56 height, so one
        user unit is one CSS pixel. That keeps the football at its drawn size
        however wide the button gets — scaling the whole 420-wide design to fit
        would either squash the ball or letterbox the field in the middle of
        the bar — and it lets the hash keyframe's 48px step land exactly one
        yard mark along.
      */}
      <svg
        viewBox={`0 0 ${w} ${H}`}
        width="100%"
        height={H}
        preserveAspectRatio="none"
        style={{ display: "block", overflow: "visible" }}
      >
        <defs>
          <linearGradient id="omLeather" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#cd7434" />
            <stop offset="60%" stopColor="#b25a23" />
            <stop offset="100%" stopColor="#9a4a1b" />
          </linearGradient>
          {/* The pill, plus a window above it so the throw can leave the bar. */}
          <clipPath id="omBar">
            <rect x="0" y="0" width={w} height={H} rx={H / 2} />
            <rect x={w * (30 / W0)} y="-40" width={w * (360 / W0)} height="40" />
          </clipPath>
          <clipPath id="omBallClip">
            <path d={BALL} />
          </clipPath>
          <radialGradient id="omGlowG">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
          </radialGradient>
        </defs>

        <g clipPath="url(#omBar)">
          {/* Yard marks running past under the throw */}
          <g data-throw="hash" opacity={0.18} style={{ animation: "omHash 1.1s linear infinite" }}>
            <path d={hashPath(w)} stroke="#dfeeff" strokeWidth={2} strokeLinecap="round" />
          </g>

          {showTrail ? (
            /*
              pathLength normalises the arc to 100 units, so the dash keyframes
              in fonts.ts stay correct at every bar width.
            */
            <path
              data-throw="trail"
              d={arc}
              pathLength={100}
              fill="none"
              stroke="#dfeeff"
              strokeOpacity={0.5}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeDasharray="16 200"
              style={{ animation: `omTrail ${dur} linear infinite` }}
            />
          ) : null}

          <g
            data-throw="ball"
            style={
              {
                offsetPath: `path('${arc}')`,
                offsetRotate: "auto",
                animation: `omFly ${dur} linear infinite`,
              } as any
            }
          >
            <ellipse
              data-throw="glow"
              cx={0}
              cy={1}
              rx={26}
              ry={14}
              fill="url(#omGlowG)"
              style={{ animation: "omGlow .9s ease-in-out infinite" }}
            />
            <Ball />
          </g>
        </g>

        {/* The rim, drawn last and unclipped so it stays a clean full pill. */}
        <rect
          x={0.75}
          y={0.75}
          width={Math.max(0, w - 1.5)}
          height={H - 1.5}
          rx={(H - 1.5) / 2}
          fill="none"
          stroke={CTA_BORDER}
          strokeWidth={1.5}
        />
      </svg>
    </View>
  );
}
