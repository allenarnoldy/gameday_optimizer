import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import {
  ColorSet, PosColors, RankEntry,
  lightColors, darkColors,
  lightPOS, darkPOS,
  lightRANK, darkRANK,
} from "./theme";

type ThemeCtx = {
  isDark: boolean;
  toggle: () => void;
  C: ColorSet;
  POS: PosColors;
  RANK: RankEntry[];
};

const ThemeContext = createContext<ThemeCtx>({
  isDark: false,
  toggle: () => {},
  C: lightColors,
  POS: lightPOS,
  RANK: lightRANK,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === "dark");

  const toggle = useCallback(() => setIsDark(d => !d), []);

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
