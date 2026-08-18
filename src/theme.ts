export type ColorSet = {
  bg: string; card: string; border: string;
  primary: string; primaryDark: string; primaryBg: string;
  text: string; muted: string; light: string;
};

export type PosColors = Record<string, { bg: string; fg: string }>;
export type RankEntry = { color: string; bg: string };

export const lightColors: ColorSet = {
  bg: '#f1f5f9',
  card: '#ffffff',
  border: '#e2e8f0',
  primary: '#16a34a',
  primaryDark: '#15803d',
  primaryBg: '#dcfce7',
  text: '#0f172a',
  muted: '#64748b',
  light: '#94a3b8',
};

export const darkColors: ColorSet = {
  bg: '#0f172a',
  card: '#1e293b',
  border: '#334155',
  primary: '#22c55e',
  primaryDark: '#16a34a',
  primaryBg: '#14532d',
  text: '#f1f5f9',
  muted: '#94a3b8',
  light: '#475569',
};

export const lightPOS: PosColors = {
  QB:  { bg: '#fef2f2', fg: '#dc2626' },
  RB:  { bg: '#f0fdf4', fg: '#16a34a' },
  WR:  { bg: '#eff6ff', fg: '#2563eb' },
  TE:  { bg: '#faf5ff', fg: '#9333ea' },
  DST: { bg: '#fffbeb', fg: '#d97706' },
  K:   { bg: '#f8fafc', fg: '#64748b' },
};

export const darkPOS: PosColors = {
  QB:  { bg: '#450a0a', fg: '#f87171' },
  RB:  { bg: '#052e16', fg: '#4ade80' },
  WR:  { bg: '#172554', fg: '#60a5fa' },
  TE:  { bg: '#3b0764', fg: '#c084fc' },
  DST: { bg: '#451a03', fg: '#fbbf24' },
  K:   { bg: '#1e293b', fg: '#64748b' },
};

export const lightRANK: RankEntry[] = [
  { color: '#f59e0b', bg: '#fffbeb' },
  { color: '#9ca3af', bg: '#f8fafc' },
  { color: '#b45309', bg: '#fef3c7' },
];

export const darkRANK: RankEntry[] = [
  { color: '#f59e0b', bg: '#292524' },
  { color: '#9ca3af', bg: '#1e293b' },
  { color: '#b45309', bg: '#1c1412' },
];

// Static exports kept for any files that haven't migrated to useTheme()
export const C = lightColors;
export const POS = lightPOS;
export const RANK = lightRANK;
