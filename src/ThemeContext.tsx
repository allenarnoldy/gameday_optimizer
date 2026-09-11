import React, { createContext, useContext, useEffect, useMemo } from "react";
import { Platform } from "react-native";
import { ColorSet, PosColors, RankEntry, darkColors, darkPOS, darkRANK } from "./theme";
import { installFonts } from "./fonts";

/**
 * The app ships dark only. PlayStation defines both canvas modes and the light
 * palette is still exported from theme.ts, but nothing renders it — there is no
 * mode switch, and `isDark` is here so call sites don't all need rewriting.
 */
type ThemeCtx = {
  isDark: true;
  C: ColorSet;
  POS: PosColors;
  RANK: RankEntry[];
};

const VALUE: ThemeCtx = {
  isDark: true,
  C: darkColors,
  POS: darkPOS,
  RANK: darkRANK,
};

const ThemeContext = createContext<ThemeCtx>(VALUE);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => { installFonts(); }, []);

  // Keep the document canvas in sync so overscroll doesn't reveal a
  // mismatched ground behind the app.
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    document.documentElement.style.background = darkColors.canvas;
    document.body.style.background = darkColors.canvas;
    document.documentElement.style.colorScheme = "dark";
  }, []);

  const value = useMemo<ThemeCtx>(() => VALUE, []);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeCtx {
  return useContext(ThemeContext);
}
