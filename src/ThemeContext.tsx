import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import {
  ColorSet, PosColors, RankEntry,
  lightColors, darkColors,
  lightPOS, darkPOS,
  lightRANK, darkRANK,
} from "./theme";
import { installFonts } from "./fonts";

type ThemeCtx = {
  isDark: boolean;
  toggle: () => void;
  C: ColorSet;
  POS: PosColors;
  RANK: RankEntry[];
};

const ThemeContext = createContext<ThemeCtx>({
  isDark: true,
  toggle: () => {},
  C: darkColors,
  POS: darkPOS,
  RANK: darkRANK,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // PlayStation ships both canvas modes; dark is the editorial/product one
  // and the right default for a gaming tool.
  const [isDark, setIsDark] = useState(true);

  const toggle = useCallback(() => setIsDark(d => !d), []);

  useEffect(() => { installFonts(); }, []);

  // Keep the document canvas in sync so overscroll doesn't reveal a
  // mismatched ground behind the app.
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    const bg = isDark ? darkColors.canvas : lightColors.canvas;
    document.documentElement.style.background = bg;
    document.body.style.background = bg;
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  }, [isDark]);

  const value = useMemo<ThemeCtx>(() => ({
    isDark,
    toggle,
    C: isDark ? darkColors : lightColors,
    POS: isDark ? darkPOS : lightPOS,
    RANK: isDark ? darkRANK : lightRANK,
  }), [isDark, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeCtx {
  return useContext(ThemeContext);
}
