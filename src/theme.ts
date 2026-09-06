/**
 * Framer design system tokens.
 * Source: DESIGN-framer.md (Framer-design-analysis, alpha).
 *
 * The brand is dark-native: near-black canvas, hierarchy carried by surface
 * lift (canvas -> surface1 -> surface2) rather than by chromatic fills.
 * `accent` (#0099ff) is a signal color only — links, focus, selection.
 * The gradient family is the atmosphere device and belongs on cards.
 */

export type ColorSet = {
  // Surfaces
  canvas: string;
  surface1: string;
  surface2: string;
  hairline: string;
  hairlineSoft: string;

  // Text
  ink: string;
  inkMuted: string;

  // Signal
  accent: string;
  success: string;

  // CTA pill
  primary: string;
  onPrimary: string;

  // Gradient family (cards only)
  gradMagenta: string;
  gradViolet: string;
  gradOrange: string;
  gradCoral: string;

  // Legacy aliases so any unmigrated call site still resolves
  bg: string;
  card: string;
  border: string;
  text: string;
  muted: string;
  light: string;
  primaryBg: string;
  primaryDark: string;
};

export type PosColors = Record<string, { bg: string; fg: string }>;
export type RankEntry = { color: string; bg: string };

/* ------------------------------------------------------------------ */
/* Colors                                                              */
/* ------------------------------------------------------------------ */

// The brand mode. Every token here is lifted straight from the spec.
export const darkColors: ColorSet = {
  canvas: '#090909',
  surface1: '#141414',
  surface2: '#1c1c1c',
  hairline: '#262626',
  hairlineSoft: '#1a1a1a',

  ink: '#ffffff',
  inkMuted: '#999999',

  accent: '#0099ff',
  success: '#22c55e',

  primary: '#ffffff',
  onPrimary: '#000000',

  gradMagenta: '#d44df0',
  gradViolet: '#6a4cf5',
  gradOrange: '#ff7a3d',
  gradCoral: '#ff5577',

  bg: '#090909',
  card: '#141414',
  border: '#262626',
  text: '#ffffff',
  muted: '#999999',
  light: '#5c5c5c',
  primaryBg: '#1c1c1c',
  primaryDark: '#e6e6e6',
};

// Inverse mode, built from the spec's own `inverse-canvas` / `inverse-ink`
// tokens rather than invented. Surface lift runs the other direction.
export const lightColors: ColorSet = {
  canvas: '#ffffff',
  surface1: '#f5f5f5',
  surface2: '#ebebeb',
  hairline: '#e0e0e0',
  hairlineSoft: '#f0f0f0',

  ink: '#000000',
  inkMuted: '#6b6b6b',

  accent: '#0086e0',
  success: '#16a34a',

  primary: '#000000',
  onPrimary: '#ffffff',

  gradMagenta: '#b830d4',
  gradViolet: '#5a3ce0',
  gradOrange: '#e05f22',
  gradCoral: '#e0335c',

  bg: '#ffffff',
  card: '#f5f5f5',
  border: '#e0e0e0',
  text: '#000000',
  muted: '#6b6b6b',
  light: '#a3a3a3',
  primaryBg: '#ebebeb',
  primaryDark: '#1a1a1a',
};

/* ------------------------------------------------------------------ */
/* Position coding                                                     */
/* ------------------------------------------------------------------ */
/**
 * Positions need to be scannable, but the spec forbids a second chromatic
 * accent family. So the chips stay monochrome surfaces and the coding lives
 * in the glyph color, drawn only from the documented gradient palette.
 */

export const darkPOS: PosColors = {
  QB:  { bg: '#1c1c1c', fg: '#ff5577' },
  RB:  { bg: '#1c1c1c', fg: '#ff7a3d' },
  WR:  { bg: '#1c1c1c', fg: '#d44df0' },
  TE:  { bg: '#1c1c1c', fg: '#8b6cff' },
  DST: { bg: '#1c1c1c', fg: '#999999' },
  K:   { bg: '#1c1c1c', fg: '#999999' },
};

export const lightPOS: PosColors = {
  QB:  { bg: '#ebebeb', fg: '#d92a4f' },
  RB:  { bg: '#ebebeb', fg: '#c4511a' },
  WR:  { bg: '#ebebeb', fg: '#a821c4' },
  TE:  { bg: '#ebebeb', fg: '#5a3ce0' },
  DST: { bg: '#ebebeb', fg: '#6b6b6b' },
  K:   { bg: '#ebebeb', fg: '#6b6b6b' },
};

/**
 * Lineup ranking. Framer marks hierarchy with surface lift, not medals — so
 * rank 1 gets the gradient spotlight treatment (the brand's scarce atmosphere
 * device), rank 2 lifts to surface2, and everything below sits on surface1.
 */
export const darkRANK: RankEntry[] = [
  { color: '#6a4cf5', bg: '#1c1c1c' },
  { color: '#262626', bg: '#1c1c1c' },
  { color: '#262626', bg: '#141414' },
];

export const lightRANK: RankEntry[] = [
  { color: '#5a3ce0', bg: '#ebebeb' },
  { color: '#e0e0e0', bg: '#ebebeb' },
  { color: '#e0e0e0', bg: '#f5f5f5' },
];

/* ------------------------------------------------------------------ */
/* Typography                                                          */
/* ------------------------------------------------------------------ */
/**
 * GT Walsheim is proprietary. Per the spec's own substitution note we use
 * Inter at 600-700 for display with the tracking tightened by hand, and Inter
 * Variable for body with the documented OpenType character variants (applied
 * globally on web in `fonts.ts`).
 *
 * Letter-spacing is kept as a PERCENTAGE of size, per the Do's list: reduce
 * the size at small breakpoints, never the compression.
 */

export const DISPLAY_FONT =
  '"Inter", "Inter Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
export const BODY_FONT =
  '"Inter", "Inter Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export type TypeToken = {
  fontFamily: string;
  fontSize: number;
  fontWeight:
    | '400' | '500' | '600' | '700';
  lineHeight: number;
  letterSpacing: number;
};

const display = (fontSize: number, trackPct: number, lh: number): TypeToken => ({
  fontFamily: DISPLAY_FONT,
  fontSize,
  fontWeight: '600',
  lineHeight: Math.round(fontSize * lh),
  letterSpacing: fontSize * trackPct,
});

export const type = {
  // -5% tracking is the brand signature on the display tier.
  displayXxl: display(110, -0.05, 0.85),
  displayXl: display(85, -0.05, 0.95),
  displayLg: display(62, -0.05, 1.0),
  displayMd: display(32, -0.031, 1.13),

  headline: {
    fontFamily: BODY_FONT,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 26,
    letterSpacing: -0.8,
  },
  subhead: {
    fontFamily: BODY_FONT,
    fontSize: 24,
    fontWeight: '400',
    lineHeight: 31,
    letterSpacing: -0.01,
  },
  bodyLg: {
    fontFamily: BODY_FONT,
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 23,
    letterSpacing: -0.18,
  },
  body: {
    fontFamily: BODY_FONT,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: -0.15,
  },
  bodySm: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: -0.14,
  },
  caption: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: -0.13,
  },
  micro: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 14,
    letterSpacing: -0.12,
  },
  button: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 14,
    letterSpacing: -0.14,
  },
} as const;

/**
 * Display type scales down across breakpoints while holding the -5% tracking.
 * 110 -> 62 (tablet) -> 32 (mobile), per the responsive spec.
 */
export function heroType(width: number): TypeToken {
  if (width >= 1199) return display(96, -0.05, 0.9);
  if (width >= 810) return display(62, -0.05, 1.0);
  if (width >= 480) return display(44, -0.05, 1.02);
  return display(34, -0.05, 1.05);
}

export function sectionType(width: number): TypeToken {
  if (width >= 810) return display(32, -0.031, 1.13);
  return display(26, -0.031, 1.15);
}

/* ------------------------------------------------------------------ */
/* Shape & space                                                       */
/* ------------------------------------------------------------------ */

export const radius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 15,
  xl: 20,
  xxl: 30,
  pill: 100,
  full: 9999,
} as const;

// Framer works in 5px increments (5/10/15/20/30) rather than the usual 4/8/16.
export const space = {
  hair: 1,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 15,
  lg: 20,
  xl: 30,
  xxl: 40,
  section: 96,
} as const;

export const MAX_WIDTH = 1100;

/* ------------------------------------------------------------------ */
/* Elevation                                                           */
/* ------------------------------------------------------------------ */
/** Level 2: light top edge + soft drop, for floating cards. */
export const floatShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.25,
  shadowRadius: 30,
  elevation: 8,
} as const;

/** Level 3: the blue-tinted selection ring. The only chromatic depth signal. */
export const focusRing = 'rgba(0, 153, 255, 0.15)';

// Static exports kept for any file that hasn't migrated to useTheme()
export const C = darkColors;
export const POS = darkPOS;
export const RANK = darkRANK;
