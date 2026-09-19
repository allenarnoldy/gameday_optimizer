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
    // Roboto 700 is here for the wordmark; without a real bold face the
    // browser synthesises one and the letterforms smear.
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap";
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

    /* ---- Hero band ----
       The layered gradients, the skewed stripe field and the two mask
       gradients can't go through RN Web's style prop, so they live here and
       attach by data attribute. Native gets the flat blue fallback instead. */
    [data-hero="bg"] {
      background-image: linear-gradient(101deg, #0070d1 0%, #0a5cb0 30%, #0b3468 56%, #061d38 76%, #030c18 100%);
    }
    [data-hero="overlay"] {
      background-image:
        linear-gradient(103deg, rgba(0,142,255,0.55) 0%, rgba(0,142,255,0.16) 26%, transparent 46%),
        radial-gradient(90% 130% at 4% 26%, rgba(83,177,255,0.4) 0%, transparent 60%);
    }
    [data-hero="stripes"] {
      background-image: repeating-linear-gradient(90deg, rgba(0,158,255,0.26) 0 6px, transparent 6px 28px);
      transform: skewX(-19deg);
      -webkit-mask-image: linear-gradient(94deg, transparent 0%, #000 34%, transparent 88%);
      mask-image: linear-gradient(94deg, transparent 0%, #000 34%, transparent 88%);
    }
    [data-hero="art"] {
      -webkit-mask-image: radial-gradient(72% 62% at 62% 50%, #000 42%, rgba(0,0,0,0.55) 66%, transparent 84%);
      mask-image: radial-gradient(72% 62% at 62% 50%, #000 42%, rgba(0,0,0,0.55) 66%, transparent 84%);
    }

    /* ---- Generate button: the football throw ----
       From the Football Throw Loader design. The bar is the field: yard marks
       scroll past underneath while the ball is thrown along an arc that rises
       out of the bar and lands at the far end.

       Deliberately CSS rather than Animated, because solving blocks the main
       thread — a JS-driven animation would stall exactly when it is meant to
       show progress. */
    @keyframes omTumble {
      0%, 100% { transform: rotate(-6deg) scale(1.2); }
      50%      { transform: rotate(6deg) scale(1.2); }
    }
    @keyframes omHash { to { transform: translateX(-48px); } }
    @keyframes omGlow { 0%, 100% { opacity: .30; } 50% { opacity: .55; } }

    @media (prefers-reduced-motion: reduce) {
      [data-throw="true"], [data-throw="true"] * { animation: none !important; }
      /* With the fly animation off, the ball falls back to its inline resting
         transform, which is the top of the arc — so it parks mid-throw rather
         than sitting at the keyframe's origin looking abandoned. The glow
         keeps breathing underneath it: a pulse is not the kind of motion this
         setting is asking us to drop, and something has to say the app is
         still working. */
      [data-throw="true"] [data-throw="glow"] {
        animation: omGlow 1.8s ease-in-out infinite !important;
      }
    }

    /* ---- Boot loader: the first-load splash ----
       From the App Boot Loader design. One cycle: a scan line snaps open
       across the stage, the icon resolves out of blur while a diagonal wipe
       uncovers it and a gloss sweeps across, then the rule draws and the
       status line rises. The whole thing loops until the slate arrives.

       Everything accent-tinted is set inline (the accent is a prop); what
       lives here is the part RN Web's style prop cannot express — mask
       images, mix-blend-mode, filters — plus the keyframes themselves.
       None of these reference the accent, so one static sheet serves every
       accent. Only animation-duration is set inline, which is why the rules
       below use longhands: the shorthand would reset it. */
    @keyframes omBootLine {
      0%, 2%   { transform: scaleX(0);    opacity: 0; }
      6%       { transform: scaleX(.06);  opacity: 1; }
      13%      { transform: scaleX(1);    opacity: 1; }
      19%      { transform: scaleX(1.25); opacity: 0; }
      100%     { transform: scaleX(1.25); opacity: 0; }
    }
    @keyframes omBootIcon {
      0%, 6%  { opacity: 0; transform: scale(1.34) translateY(14px); filter: blur(22px) saturate(.4); }
      14%     { opacity: .55; filter: blur(14px) saturate(.6); }
      26%     { opacity: .92; filter: blur(6px) saturate(.9); }
      42%     { opacity: 1; transform: scale(1.015) translateY(0);   filter: blur(0) saturate(1.04); }
      62%     { transform: scale(1) translateY(-4px); }
      86%     { opacity: 1; transform: scale(1.005) translateY(0); filter: blur(0) saturate(1.04); }
      96%,100%{ opacity: 0; transform: scale(.985) translateY(-2px); filter: blur(6px) saturate(.7); }
    }
    @keyframes omBootWipe {
      0%, 6%  { -webkit-mask-position: 0% 50%; mask-position: 0% 50%; }
      46%,100%{ -webkit-mask-position: 100% 50%; mask-position: 100% 50%; }
    }
    @keyframes omBootGloss {
      0%, 26% { transform: translateX(-130%) skewX(-18deg); opacity: 0; }
      31%     { opacity: .85; }
      46%     { transform: translateX(130%) skewX(-18deg);  opacity: 0; }
      100%    { transform: translateX(130%) skewX(-18deg);  opacity: 0; }
    }
    @keyframes omBootGlow {
      0%, 10% { opacity: 0; transform: scale(.6); }
      30%     { opacity: .95; transform: scale(1.12); }
      55%     { opacity: .6;  transform: scale(1); }
      80%     { opacity: .78; transform: scale(1.05); }
      95%,100%{ opacity: 0;  transform: scale(.94); }
    }
    @keyframes omBootFoot {
      0%, 44% { opacity: 0; transform: translateY(8px); letter-spacing: .46em; }
      56%     { opacity: 1; transform: translateY(0);   letter-spacing: .30em; }
      88%     { opacity: 1; transform: translateY(0);   letter-spacing: .30em; }
      96%,100%{ opacity: 0; transform: translateY(-4px); letter-spacing: .30em; }
    }
    @keyframes omBootRule {
      0%, 46% { transform: scaleX(0); opacity: 0; }
      60%     { transform: scaleX(1); opacity: 1; }
      88%     { transform: scaleX(1); opacity: 1; }
      96%,100%{ transform: scaleX(1); opacity: 0; }
    }
    @keyframes omBootSweep {
      0%   { transform: translateX(-100%); }
      100% { transform: translateX(320%); }
    }
    @keyframes omBootHaze {
      0%, 100% { opacity: .35; transform: translate3d(0,0,0) scale(1); }
      50%      { opacity: .6;  transform: translate3d(0,-8px,0) scale(1.06); }
    }
    /* Opacity-only pulse for the reduced-motion path below. */
    @keyframes omBootBreathe { 0%, 100% { opacity: .45; } 50% { opacity: .8; } }

    [data-boot] { animation-iteration-count: infinite; }
    [data-boot="haze"] {
      animation: omBootHaze 9s ease-in-out infinite;
    }
    /* isolation keeps the gloss's screen blend inside the stage, so it lifts
       the icon and the glow rather than the page behind them. */
    [data-boot="stage"] { isolation: isolate; }
    [data-boot="glow"] {
      filter: blur(18px);
      animation-name: omBootGlow;
      animation-timing-function: cubic-bezier(.22,.7,.2,1);
    }
    [data-boot="line"] {
      animation-name: omBootLine;
      animation-timing-function: cubic-bezier(.16,.84,.3,1);
    }
    [data-boot="icon"] {
      animation-name: omBootIcon;
      animation-timing-function: cubic-bezier(.16,.84,.24,1);
      will-change: transform, opacity, filter;
    }
    /* The wipe is a mask three times the layer's width, slid from one end to
       the other — so the soft diagonal edge travels across the icon. */
    [data-boot="wipe"] {
      -webkit-mask-image: linear-gradient(104deg, transparent 0 22%, rgba(0,0,0,.18) 34%, rgba(0,0,0,.55) 46%, rgba(0,0,0,.88) 58%, #000 70%, #000 100%);
      mask-image: linear-gradient(104deg, transparent 0 22%, rgba(0,0,0,.18) 34%, rgba(0,0,0,.55) 46%, rgba(0,0,0,.88) 58%, #000 70%, #000 100%);
      -webkit-mask-size: 300% 140%; mask-size: 300% 140%;
      -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;
      animation-name: omBootWipe;
      animation-timing-function: cubic-bezier(.32,.62,.24,1);
    }
    /* Feathers the square icon into the ground so it reads as lit, not pasted. */
    [data-boot="vignette"] {
      -webkit-mask-image: radial-gradient(closest-side ellipse at 50% 50%, #000 30%, rgba(0,0,0,.72) 62%, rgba(0,0,0,.28) 84%, transparent 100%);
      mask-image: radial-gradient(closest-side ellipse at 50% 50%, #000 30%, rgba(0,0,0,.72) 62%, rgba(0,0,0,.28) 84%, transparent 100%);
    }
    [data-boot="gloss"] {
      filter: blur(10px);
      mix-blend-mode: screen;
      animation-name: omBootGloss;
      animation-timing-function: cubic-bezier(.3,.1,.2,1);
    }
    [data-boot="rule"] {
      animation-name: omBootRule;
      animation-timing-function: cubic-bezier(.16,.84,.3,1);
    }
    [data-boot="foot"] {
      animation-name: omBootFoot;
      animation-timing-function: cubic-bezier(.2,.7,.2,1);
    }
    /* Not tied to the boot cycle — it runs at its own pace underneath. */
    [data-boot="sweep"] {
      animation: omBootSweep 1.5s cubic-bezier(.45,.05,.55,.95) infinite;
    }

    @media (prefers-reduced-motion: reduce) {
      /* The component also reads this through AccessibilityInfo and drops the
         moving parts structurally, but that lookup is async — this keeps the
         first frame still while it resolves. */
      [data-boot] { animation: none !important; }
      /* With the cycle off, park the icon arrived rather than at the
         keyframe's origin, where it would be invisible and blurred. */
      [data-boot="icon"] { opacity: 1 !important; transform: none !important; filter: none !important; }
      [data-boot="wipe"] { -webkit-mask-image: none !important; mask-image: none !important; }
      [data-boot="gloss"], [data-boot="line"] { display: none !important; }
      [data-boot="rule"], [data-boot="foot"] { opacity: 1 !important; transform: none !important; }
      /* A pulse is not the movement this setting is asking us to drop, and
         something has to say the app is still working. */
      [data-boot="glow"] {
        transform: scale(1) !important;
        animation: omBootBreathe 2.6s ease-in-out infinite !important;
      }
    }

    /* Settings popover: fades and lifts into place from under the pill. */
    [data-pop] {
      transition: opacity 180ms cubic-bezier(.23,1,.32,1), transform 180ms cubic-bezier(.23,1,.32,1);
    }
    [data-pop="closed"] { opacity: 0; transform: translateY(-6px) scale(0.985); }
    [data-pop="open"]   { opacity: 1; transform: none; }

    /* Reduced motion means gentler, not zero: colour and opacity stay,
       movement goes. */
    @media (prefers-reduced-motion: reduce) {
      [data-pop] { transition: opacity 140ms ease; transform: none !important; }
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
/** Attach one of the hero band's web-only gradient/mask layers. */
export const heroLayer = (part: "bg" | "overlay" | "stripes" | "art") =>
  web ? ({ dataSet: { hero: part } } as any) : {};
/**
 * Attach one of the boot loader's web-only layers. The masks, blend mode and
 * blur filters can't go through RN Web's style prop, so they live in the sheet
 * above and bind by data attribute; native skips them entirely.
 */
export type BootPart =
  | "haze" | "stage" | "glow" | "line"
  | "icon" | "wipe" | "vignette" | "gloss"
  | "rule" | "foot" | "sweep";
export const bootLayer = (part: BootPart) =>
  web ? ({ dataSet: { boot: part } } as any) : {};
/** Settings popover open/closed transition. */
export const popState = (open: boolean) =>
  web ? ({ dataSet: { pop: open ? "open" : "closed" } } as any) : {};
/** Puts the football into its throw arc. */
export const throwState = web ? ({ dataSet: { throw: "true" } } as any) : {};
