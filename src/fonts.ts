import { Platform } from "react-native";

/**
 * Web-only style layer: fonts, motion primitives and focus chrome.
 *
 * Motion follows the design-engineering rules rather than CSS defaults —
 * custom ease-out curves (the built-ins are too weak), transitions instead of
 * keyframes wherever a state can be retriggered, transform/opacity only, and
 * a real prefers-reduced-motion path that keeps opacity but drops movement.
 */

let injected = false;

export function installFonts() {
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
  // Roboto Light 300 stands in for PlayStation SST's display tier;
  // Inter covers body and chrome.
  font.href =
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@300;400;500&display=swap";
  document.head.appendChild(font);

  const style = document.createElement("style");
  style.textContent = `
    :root {
      /* The built-in CSS easings lack punch; these are the strong variants. */
      --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
      --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
      --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
    }
    html, body, #root { height: 100%; margin: 0; background: #000; }
    body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }

    [data-tnum="true"] { font-variant-numeric: tabular-nums; }

    /* Press feedback. RN sets the transform inline; CSS makes it travel.
       160ms is the button-feedback band — fast enough to feel instant. */
    [data-press="true"] {
      transition: transform 160ms var(--ease-out), background-color 140ms ease;
      will-change: transform;
    }

    /* Toggles are used dozens of times per session, so they get a colour
       transition only — no movement, which would read as lag. */
    [data-toggle="true"] {
      transition: border-color 140ms ease, color 140ms ease, background-color 140ms ease;
    }

    /* Results stagger in. Keyframes are fine here: the list is remounted per
       solve, so there is no mid-flight retarget to worry about. */
    @keyframes psRise {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    [data-rise="true"] {
      opacity: 0;
      animation: psRise 320ms var(--ease-out) forwards;
    }

    /* Drawer: slides by its own width, so height/width changes never break it. */
    [data-drawer] {
      transition: transform 260ms var(--ease-drawer);
      will-change: transform;
    }
    [data-drawer="closed"] { transform: translateX(100%); }
    [data-drawer="open"]   { transform: translateX(0); }
    /* Exit is quicker than enter — the system responding should outpace the
       user deciding. */
    [data-scrim] { transition: opacity 200ms var(--ease-out); }
    [data-scrim="closed"] { opacity: 0; }
    [data-scrim="open"]   { opacity: 1; }

    /* Focus is a 2px brand-blue border per the spec — no halo. */
    input:focus, textarea:focus {
      outline: none;
      box-shadow: inset 0 0 0 2px #0070d1;
    }
    ::selection { background: rgba(0,112,209,0.4); color: #fff; }

    * { scrollbar-color: rgba(229,229,229,0.3) transparent; scrollbar-width: thin; }
    ::-webkit-scrollbar { width: 10px; height: 10px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb {
      background-color: rgba(229,229,229,0.25);
      border-radius: 9999px;
      border: 3px solid transparent;
      background-clip: content-box;
    }

    /* Reduced motion means gentler, not zero: colour and opacity stay,
       movement goes. */
    @media (prefers-reduced-motion: reduce) {
      [data-press="true"] { transition: background-color 140ms ease; transform: none !important; }
      [data-rise="true"]  { animation: none; opacity: 1; }
      [data-drawer]       { transition: opacity 160ms ease; transform: none !important; }
      [data-drawer="closed"] { opacity: 0; }
      [data-drawer="open"]   { opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

const web = Platform.OS === "web";

/** Tabular figures for numbers that sit in columns. */
export const tnum = web ? ({ dataSet: { tnum: "true" } } as any) : {};
/** Opt an element into the press transition. */
export const pressable = web ? ({ dataSet: { press: "true" } } as any) : {};
/** Colour-only transition, for frequently-hit toggles. */
export const toggleable = web ? ({ dataSet: { toggle: "true" } } as any) : {};
/**
 * Stagger a list item in. Returns `attrs` and `style` separately — spreading
 * a `style` key alongside a component's own `style` prop silently loses the
 * delay, so callers must merge it: style={[rise(i).style, base]}.
 * Delay is capped so a long list never feels slow.
 */
export const rise = (index: number): { attrs: any; style: any } =>
  web
    ? {
        attrs: { dataSet: { rise: "true" } },
        style: { animationDelay: `${Math.min(index * 60, 300)}ms` },
      }
    : { attrs: {}, style: null };
export const drawerState = (open: boolean) =>
  web ? ({ dataSet: { drawer: open ? "open" : "closed" } } as any) : {};
export const scrimState = (open: boolean) =>
  web ? ({ dataSet: { scrim: open ? "open" : "closed" } } as any) : {};
