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
 * here. Everything moves in CSS rather than with Animated, and only via
 * transform and opacity: solving blocks the main thread for over a second, so
 * anything else stalls exactly when it is meant to be showing progress. The
 * shared keyframes live in fonts.ts; the throw itself is width-dependent and
 * is generated below. Native has none of this and keeps the platform spinner
 * on the flat brand fill.
 */

/** The design's bar height. Kept exact: see the 1:1 note on the viewBox. */
const H = 56;
/** The design's reference width, used only until the real one is measured. */
const W0 = 420;

/** Football, centred on the origin so the fly transform can carry it. */
const BALL =
  "M -20 0 C -18 -8, -9 -12.6, 0 -12.6 C 9 -12.6, 18 -8, 20 0 " +
  "C 18 8, 9 12.6, 0 12.6 C -9 12.6, -18 8, -20 0 Z";

/** Yard-mark pitch and length, from the design. */
const HASH_PITCH = 48;
const HASH_LEN = 14;

/** How far above the bar the throw is allowed to reach. */
const RISE = 40;
/**
 * The box the ball travels in. Wide enough for the streak reaching back behind
 * it, tall enough for the ball at its 1.2 tumble scale plus the glow.
 */
const BALL_BOX_W = 176;
const BALL_BOX_H = 44;

export const THROW_BAR_HEIGHT = H;
export const THROW_BAR_WIDTH = W0;
/** One complete throw, in ms. Callers hold the bar up at least this long. */
export const THROW_CYCLE_MS = 1250;

/**
 * The bar's own surface. The idle CTA borrows it so that starting a solve
 * swaps the contents of the button without the button itself changing.
 */
export const CTA_GRADIENT =
  "linear-gradient(100deg, #1580e6 0%, #0d6ed0 46%, #0a5cb8 100%)";
export const CTA_BORDER = "#9cc3ea";
export const CTA_SHADOW =
  "0 1px 0 rgba(255,255,255,0.18) inset, 0 6px 22px rgba(13,110,208,0.34)";

/** The design's arc control points, as fractions of the bar's width. */
const P = [16 / W0, 100 / W0, 320 / W0, 404 / W0];
const Y = [42, -16, -16, 42];

/** Position and tangent angle at t along that cubic. */
function arcAt(w: number, t: number) {
  const u = 1 - t;
  const bez = (a: number, b: number, c: number, d: number) =>
    u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
  const dbez = (a: number, b: number, c: number, d: number) =>
    3 * u * u * (b - a) + 6 * u * t * (c - b) + 3 * t * t * (d - c);
  const x = bez(P[0] * w, P[1] * w, P[2] * w, P[3] * w);
  const y = bez(Y[0], Y[1], Y[2], Y[3]);
  const dx = dbez(P[0] * w, P[1] * w, P[2] * w, P[3] * w);
  const dy = dbez(Y[0], Y[1], Y[2], Y[3]);
  return { x, y, a: (Math.atan2(dy, dx) * 180) / Math.PI };
}

/** The design's fade: in over the first tenth, out over the last eighth. */
function flyOpacity(t: number) {
  if (t < 0.1) return t / 0.1;
  if (t > 0.88) return Math.max(0, 1 - (t - 0.88) / 0.12);
  return 1;
}

/** The ball's transform at t, in the wrapper's coordinates. */
function flyTransform(w: number, t: number) {
  const { x, y, a } = arcAt(w, t);
  // Note the spaces: a transform list is whitespace-separated, and writing
  // translate(...)rotate(...) run together is accepted by Chrome but is not
  // something to rely on -- an engine that rejects it drops the whole
  // declaration, and the ball never moves.
  return `translate(${x.toFixed(2)}px, ${(y + RISE).toFixed(2)}px) rotate(${a.toFixed(2)}deg)`;
}

function flyStep(w: number, t: number) {
  return `transform: ${flyTransform(w, t)}; opacity: ${flyOpacity(t).toFixed(3)};`;
}

const injectedFly = new Set<string>();

/**
 * The throw, sampled off the arc into transform keyframes.
 *
 * The design drives the ball with offset-path/offset-distance, which reads
 * beautifully but is not a compositor property: it animates on the main
 * thread, and the whole point of this bar is to play while the main thread is
 * busy solving. Sampled into translate+rotate it composites, and keeps moving
 * through the solve -- which the scrolling yard marks, a plain transform,
 * already demonstrated they could.
 *
 * The keyframes depend on the bar's width, so each width gets its own rule,
 * injected once.
 */
function ensureFlyKeyframes(w: number): string {
  const name = `omFly_${w}`;
  if (injectedFly.has(name) || typeof document === "undefined") return name;
  injectedFly.add(name);

  const STEPS = 32;
  const frames: string[] = [];
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS;
    frames.push(`${(t * 100).toFixed(3)}% { ${flyStep(w, t)} }`);
  }
  const el = document.createElement("style");
  el.textContent = `@keyframes ${name}{${frames.join("")}}`;
  document.head.appendChild(el);
  return name;
}

/** Enough marks to cover the bar plus one pitch, so the scroll never runs dry. */
function hashPath(w: number) {
  const n = Math.ceil((w + HASH_PITCH) / HASH_PITCH) + 1;
  let d = "";
  for (let i = 0; i < n; i++) d += `M${12 + i * HASH_PITCH} 42 h${HASH_LEN} `;
  return d.trim();
}

/** The leather itself. Static — the tumble is applied by the layer above it. */
function Ball() {
  return (
    <g>
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
  throwSeconds = THROW_CYCLE_MS / 1000,
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
  const flyName = ensureFlyKeyframes(w);
  const rest = flyTransform(w, 0.5);

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
      {/*
        Positioned out of flow on purpose. In flow, the viewBox plus a fixed
        height gives the <svg> an intrinsic width, which becomes this flex
        item's basis -- so the bar refused to shrink and pushed the reload
        button onto a row of its own on a phone. Absolute, it contributes no
        width and the bar takes whatever the row leaves it.
      */}
      <svg
        viewBox={`0 0 ${w} ${H}`}
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          display: "block",
          overflow: "visible",
        }}
      >
        <defs>
          {/* The pill. The throw is no longer drawn in here, so it needs no
              window above it any more. */}
          <clipPath id="omBar">
            <rect x="0" y="0" width={w} height={H} rx={H / 2} />
          </clipPath>
        </defs>

        <g clipPath="url(#omBar)">
          {/* Yard marks running past under the throw */}
          <g data-throw="hash" opacity={0.18} style={{ animation: "omHash 1.1s linear infinite" }}>
            <path d={hashPath(w)} stroke="#dfeeff" strokeWidth={2} strokeLinecap="round" />
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

      {/*
        The football is carried by an HTML element, not by a transform on an
        SVG group.

        A transform on an SVG element is the one part of this that browsers
        genuinely disagree about -- transform-box and transform-origin default
        differently, and support has changed across versions -- and if an
        engine drops the declaration the ball simply never moves. On a plain
        absolutely-positioned div, translate/rotate mean the same thing
        everywhere and composite everywhere.

        The wrapper is the bar plus a window above it, with overflow hidden:
        the streak reaches back far enough to leave the pill at the start of
        the throw, and something has to cut it off. Plain overflow rather than
        clip-path, again because it behaves the same everywhere.
      */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: -RISE,
          width: "100%",
          height: H + RISE,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <div
          data-throw="ball"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: BALL_BOX_W,
            height: BALL_BOX_H,
            marginLeft: -BALL_BOX_W / 2,
            marginTop: -BALL_BOX_H / 2,
            // Resting value: mid-arc, so reduced motion parks the ball at the
            // top of the throw rather than at the keyframe's origin.
            transform: rest,
            animation: `${flyName} ${dur} linear infinite`,
          }}
        >
          <svg
            viewBox={`${-BALL_BOX_W / 2} ${-BALL_BOX_H / 2} ${BALL_BOX_W} ${BALL_BOX_H}`}
            width={BALL_BOX_W}
            height={BALL_BOX_H}
            style={{ display: "block", overflow: "visible" }}
          >
            {/* Kept local rather than referenced out of the field SVG above:
                cross-element url(#…) references are another thing engines have
                disagreed about, and there is no reason to depend on it. */}
            <defs>
              <radialGradient id="omGlowG">
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
              </radialGradient>
              {/* The streak fades out behind the ball. */}
              <linearGradient
                id="omTrailG"
                gradientUnits="userSpaceOnUse"
                x1="-80" y1="0" x2="-26" y2="0"
              >
                <stop offset="0%" stopColor="#dfeeff" stopOpacity={0} />
                <stop offset="100%" stopColor="#dfeeff" stopOpacity={0.55} />
              </linearGradient>
            </defs>
            <ellipse
              data-throw="glow"
              cx={0}
              cy={1}
              rx={26}
              ry={14}
              fill="url(#omGlowG)"
              style={{ animation: "omGlow .9s ease-in-out infinite" }}
            />
            {showTrail ? (
              /*
                The streak rides with the ball rather than being a dash
                crawling along a static path: stroke-dashoffset is a
                main-thread property and would freeze during the solve. The
                ball is rotated to the path tangent, so a flat streak behind it
                stays tangent to the arc.
              */
              <path
                data-throw="trail"
                d="M -80 0 L -26 0"
                fill="none"
                stroke="url(#omTrailG)"
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            ) : null}
          </svg>

          {/* The tumble gets its own HTML layer for the same reason the throw
              does, and because two animations cannot share one transform.
              The streak above stays out of it — it marks the line of flight,
              so it should not wobble with the ball. */}
          <div
            data-throw="tumble"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: BALL_BOX_W,
              height: BALL_BOX_H,
              transform: "scale(1.2)",
              animation: "omTumble .5s ease-in-out infinite",
            }}
          >
            <svg
              viewBox={`${-BALL_BOX_W / 2} ${-BALL_BOX_H / 2} ${BALL_BOX_W} ${BALL_BOX_H}`}
              width={BALL_BOX_W}
              height={BALL_BOX_H}
              style={{ display: "block", overflow: "visible" }}
            >
              <defs>
                <linearGradient id="omLeather" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#cd7434" />
                  <stop offset="60%" stopColor="#b25a23" />
                  <stop offset="100%" stopColor="#9a4a1b" />
                </linearGradient>
                <clipPath id="omBallClip">
                  <path d={BALL} />
                </clipPath>
              </defs>
              <Ball />
            </svg>
          </div>
        </div>
      </div>
    </View>
  );
}
