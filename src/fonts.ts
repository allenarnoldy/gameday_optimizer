import { Platform } from "react-native";

/**
 * Framer's body voice is Inter Variable with a specific set of OpenType
 * character variants enabled — cv01 (alternate 1), cv05 (alternate g),
 * cv09 (alternate i/l), cv11 (alternate 0), plus the ss03/ss07 stylistic
 * sets and discretionary ligatures. The spec is explicit that switching
 * these off visibly changes the voice, so they're applied globally.
 *
 * React Native has no style prop for font features, so on web we inject the
 * stylesheet directly. On native this is a no-op.
 */

const FONT_FEATURES = `"cv01" 1, "cv05" 1, "cv09" 1, "cv11" 1, "ss03" 1, "ss07" 1, "dlig" 1`;

let injected = false;

export function installFramerFonts() {
  if (injected || Platform.OS !== "web" || typeof document === "undefined") return;
  injected = true;

  const preconnect = (href: string, crossOrigin?: boolean) => {
    const l = document.createElement("link");
    l.rel = "preconnect";
    l.href = href;
    if (crossOrigin) l.crossOrigin = "anonymous";
    document.head.appendChild(l);
  };
  preconnect("https://fonts.googleapis.com");
  preconnect("https://fonts.gstatic.com", true);

  const font = document.createElement("link");
  font.rel = "stylesheet";
  font.href =
    "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900&display=swap";
  document.head.appendChild(font);

  const style = document.createElement("style");
  style.textContent = `
    html, body, #root {
      height: 100%;
      margin: 0;
      background: #090909;
    }
    body, input, textarea, button, select {
      font-feature-settings: ${FONT_FEATURES};
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }
    /* Tabular figures wherever numbers line up in columns. */
    [data-tnum="true"] {
      font-variant-numeric: tabular-nums;
      font-feature-settings: ${FONT_FEATURES}, "tnum" 1;
    }
    /* The blue is a signal color: selection is the one place it shows up
       without being asked for. */
    ::selection {
      background: rgba(0, 153, 255, 0.30);
      color: #ffffff;
    }
    input:focus, textarea:focus {
      outline: none;
      box-shadow: 0 0 0 1px rgba(0, 153, 255, 0.55),
                  0 0 0 4px rgba(0, 153, 255, 0.15);
    }
    /* Dark scrollbars so the chrome doesn't break the black canvas. */
    * { scrollbar-color: #262626 transparent; scrollbar-width: thin; }
    ::-webkit-scrollbar { width: 10px; height: 10px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb {
      background: #262626;
      border-radius: 100px;
      border: 3px solid transparent;
      background-clip: content-box;
    }
    ::-webkit-scrollbar-thumb:hover { background-clip: content-box; background-color: #3a3a3a; }
  `;
  document.head.appendChild(style);
}

/** Marks a Text node for tabular figures (web only; inert on native). */
export const tnum = Platform.OS === "web" ? ({ dataSet: { tnum: "true" } } as any) : {};
