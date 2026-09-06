/**
 * PlayStation design system tokens.
 * Source: DESIGN-playstation.md (PlayStation-design-analysis, alpha).
 *
 * Three-canvas system: pure black, pure white, and PlayStation Blue as the
 * full-bleed "action moment" band. Chrome is flat — no resting shadows, no
 * gradients except the PS Plus gold. Display type runs at weight 300 with
 * POSITIVE tracking, which is the brand's airy editorial voice; scale, not
 * weight, is what makes it bold.
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
  inkFaint: string;

  // Brand
  primary: string;
  primaryPressed: string;
  primaryActive: string;
  onPrimary: string;
  link: string;

  // Accents
  commerce: string;
  warning: string;
  goldStart: string;
  goldMid: string;
  goldEnd: string;

  // Legacy aliases so no call site breaks mid-migration
  bg: string;
  card: string;
  border: string;
  text: string;
  muted: string;
  light: string;
  accent: string;
  success: string;
  primaryBg: string;
  primaryDark: string;
};

export type PosColors = Record<string, { bg: string; fg: string }>;
export type RankEntry = { color: string; bg: string };

/* ------------------------------------------------------------------ */
/* Colors                                                              */
/* ------------------------------------------------------------------ */

/** Dark canvas mode — the editorial/product surface. */
export const darkColors: ColorSet = {
  canvas: '#000000',
  surface1: '#121314',
  surface2: '#181818',
  hairline: 'rgba(229,229,229,0.2)',
  hairlineSoft: 'rgba(229,229,229,0.12)',

  ink: '#ffffff',
  inkMuted: '#cccccc',
  inkFaint: 'rgba(229,229,229,0.55)',

  // The brand blue is precise and does not change between modes.
  primary: '#0070d1',
  primaryPressed: '#0064b7',
  primaryActive: '#004d8d',
  onPrimary: '#ffffff',
  link: '#53b1ff',

  commerce: '#d53b00',
  warning: '#c81b3a',
  goldStart: '#ffce21',
  goldMid: '#f5a623',
  goldEnd: '#ee8e00',

  bg: '#000000',
  card: '#181818',
  border: 'rgba(229,229,229,0.2)',
  text: '#ffffff',
  muted: '#cccccc',
  light: 'rgba(229,229,229,0.55)',
  accent: '#53b1ff',
  success: '#0070d1',
  primaryBg: '#121314',
  primaryDark: '#0064b7',
};

/** Light canvas mode — the utility surface (support / listing pages). */
export const lightColors: ColorSet = {
  canvas: '#ffffff',
  surface1: '#f3f3f3',
  surface2: '#f5f7fa',
  hairline: '#e4e4e4',
  hairlineSoft: '#f3f3f3',

  ink: '#000000',
  inkMuted: 'rgba(0,0,0,0.6)',
  inkFaint: '#6b6b6b',

  primary: '#0070d1',
  primaryPressed: '#0064b7',
  primaryActive: '#004d8d',
  onPrimary: '#ffffff',
  link: '#0064b7',

  commerce: '#d53b00',
  warning: '#c81b3a',
  goldStart: '#ffce21',
  goldMid: '#f5a623',
  goldEnd: '#ee8e00',

  bg: '#ffffff',
  card: '#f5f7fa',
  border: '#e4e4e4',
  text: '#000000',
  muted: 'rgba(0,0,0,0.6)',
  light: '#6b6b6b',
  accent: '#0064b7',
  success: '#0070d1',
  primaryBg: '#f3f3f3',
  primaryDark: '#0064b7',
};

/* ------------------------------------------------------------------ */
/* Position coding                                                     */
/* ------------------------------------------------------------------ */
/**
 * Every hue here is drawn from the documented PlayStation palette
 * (commerce orange, warning red, link blue, PS Plus gold, Marathon yellow).
 * The spec reserves some of them for store CTAs and PS Plus chrome, so this
 * is a deliberate departure: a DFS pool has to be scannable by position, and
 * the brief asked for bold. Chips stay flat with no border.
 */
export const darkPOS: PosColors = {
  QB:  { bg: 'rgba(200,27,58,0.18)',  fg: '#ff5c78' },
  RB:  { bg: 'rgba(213,59,0,0.18)',   fg: '#ff8551' },
  WR:  { bg: 'rgba(83,177,255,0.18)', fg: '#53b1ff' },
  TE:  { bg: 'rgba(245,166,35,0.18)', fg: '#ffbe4d' },
  DST: { bg: 'rgba(222,255,32,0.16)', fg: '#deff20' },
  K:   { bg: 'rgba(229,229,229,0.14)', fg: '#cccccc' },
};

export const lightPOS: PosColors = {
  QB:  { bg: 'rgba(200,27,58,0.12)',  fg: '#c81b3a' },
  RB:  { bg: 'rgba(213,59,0,0.12)',   fg: '#d53b00' },
  WR:  { bg: 'rgba(0,112,209,0.12)',  fg: '#0064b7' },
  TE:  { bg: 'rgba(238,142,0,0.16)',  fg: '#b06400' },
  DST: { bg: 'rgba(154,178,0,0.18)',  fg: '#6e7f00' },
  K:   { bg: 'rgba(0,0,0,0.06)',      fg: '#6b6b6b' },
};

/** Rank 1 takes the PS Plus gold; the rest sit flat on the card surface. */
export const darkRANK: RankEntry[] = [
  { color: '#f5a623', bg: '#121314' },
  { color: 'rgba(229,229,229,0.2)', bg: '#181818' },
  { color: 'rgba(229,229,229,0.2)', bg: '#181818' },
];

export const lightRANK: RankEntry[] = [
  { color: '#f5a623', bg: '#f3f3f3' },
  { color: '#e4e4e4', bg: '#f5f7fa' },
  { color: '#e4e4e4', bg: '#f5f7fa' },
];

/* ------------------------------------------------------------------ */
/* Typography                                                          */
/* ------------------------------------------------------------------ */
/**
 * PlayStation SST is proprietary. Per the spec's substitution note, the
 * display tier uses Roboto Light (300) and the chrome/body tier uses Inter.
 * The positive tracking (+0.1 to +0.45px) is preserved — the spec is explicit
 * that the spacing is what makes the light weight read as premium.
 */
export const DISPLAY_FONT =
  '"Roboto", "Helvetica Neue", Helvetica, Arial, sans-serif';
export const BODY_FONT =
  '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif';

export type TypeToken = {
  fontFamily: string;
  fontSize: number;
  fontWeight: '300' | '400' | '500' | '600' | '700';
  lineHeight: number;
  letterSpacing: number;
};

const display = (fontSize: number, letterSpacing: number): TypeToken => ({
  fontFamily: DISPLAY_FONT,
  fontSize,
  fontWeight: '300',
  lineHeight: Math.round(fontSize * 1.25),
  letterSpacing,
});

export const type = {
  displayXl: display(54, -0.1),
  displayLg: display(44, 0.1),
  displayMd: display(35, 0),
  headingXl: display(28, 0.1),
  headingLg: display(22, 0.1),

  headingMd: {
    fontFamily: BODY_FONT, fontSize: 18, fontWeight: '600',
    lineHeight: 18, letterSpacing: 0,
  },
  bodyMd: {
    fontFamily: BODY_FONT, fontSize: 18, fontWeight: '400',
    lineHeight: 27, letterSpacing: 0.1,
  },
  bodyStrong: {
    fontFamily: BODY_FONT, fontSize: 18, fontWeight: '500',
    lineHeight: 23, letterSpacing: 0.4,
  },
  bodySm: {
    fontFamily: BODY_FONT, fontSize: 16, fontWeight: '400',
    lineHeight: 24, letterSpacing: 0,
  },
  captionMd: {
    fontFamily: BODY_FONT, fontSize: 14, fontWeight: '400',
    lineHeight: 21, letterSpacing: 0,
  },
  captionSm: {
    fontFamily: BODY_FONT, fontSize: 12, fontWeight: '500',
    lineHeight: 18, letterSpacing: 0,
  },
  buttonLg: {
    fontFamily: BODY_FONT, fontSize: 18, fontWeight: '700',
    lineHeight: 23, letterSpacing: 0.45,
  },
  buttonMd: {
    fontFamily: BODY_FONT, fontSize: 14, fontWeight: '700',
    lineHeight: 18, letterSpacing: 0.324,
  },
} as const;

/** Hero scales 54 -> 44 -> 32 -> 28 down the breakpoint stack, per the spec. */
export function heroType(width: number): TypeToken {
  if (width >= 1280) return display(54, -0.1);
  if (width >= 768) return display(44, 0.1);
  if (width >= 480) return display(32, 0.1);
  return display(28, 0.1);
}

export function sectionType(width: number): TypeToken {
  if (width >= 768) return display(28, 0.1);
  return display(22, 0.1);
}

/* ------------------------------------------------------------------ */
/* Shape & space                                                       */
/* ------------------------------------------------------------------ */

export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 16,
  full: 9999,
} as const;

export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  section: 96,
} as const;

export const MAX_WIDTH = 1280;
/** The working column. Controls stay readable rather than stretching. */
export const APP_WIDTH = 900;

/** Level 2 — cards lift only on press; there is no resting shadow. */
export const pressShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.16,
  shadowRadius: 12,
  elevation: 4,
} as const;

// Static exports for any file that hasn't migrated to useTheme()
export const C = darkColors;
export const POS = darkPOS;
export const RANK = darkRANK;
