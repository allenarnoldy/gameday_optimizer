/**
 * Post-export step for the web build.
 *
 * `expo export --platform web` emits index.html from its own template and gives
 * us no hook into <head> (the +html.tsx escape hatch is Expo Router only). It
 * writes a favicon link, which covers desktop browser tabs, but nothing that
 * makes an installed app use our icon: Android reads the web manifest and iOS
 * reads apple-touch-icon, and neither is auto-discovered the way /favicon.ico
 * is. The icon files themselves ship via public/, which Expo copies verbatim.
 *
 * Idempotent, so re-running against an already-processed dist is a no-op.
 */
const fs = require("fs");
const path = require("path");

const indexPath = path.join(process.cwd(), "dist", "index.html");

if (!fs.existsSync(indexPath)) {
  console.error(`inject-head: ${indexPath} not found - did the export run?`);
  process.exit(1);
}

const TAGS = [
  '<link rel="manifest" href="/manifest.webmanifest" />',
  '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />',
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />',
  '<meta name="apple-mobile-web-app-title" content="Gameday" />',
];

let html = fs.readFileSync(indexPath, "utf8");

const missing = TAGS.filter(tag => !html.includes(tag));
if (missing.length === 0) {
  console.log("inject-head: already present, nothing to do");
  process.exit(0);
}

if (!html.includes("</head>")) {
  console.error("inject-head: no </head> in the exported index.html");
  process.exit(1);
}

html = html.replace("</head>", missing.map(t => `${t}\n`).join("") + "</head>");
fs.writeFileSync(indexPath, html);
console.log(`inject-head: added ${missing.length} tag(s) to dist/index.html`);
