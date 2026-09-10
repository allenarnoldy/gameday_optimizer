/**
 * Local stand-in for the /api/dk Vercel route, for `expo start --web`.
 *
 * The Expo dev server doesn't serve the api/ directory, so without this the web
 * dev build can't reach DraftKings and falls back to Sleeper alone (no
 * salaries). Run it alongside the dev server:
 *
 *   npm run dk-proxy
 *
 * It mounts the real exported handler, so what you exercise locally is what
 * ships. Only CORS is added, which production doesn't need - there the app and
 * the function share an origin.
 */
const http = require("http");
const path = require("path");
const dk = require(path.join(__dirname, "..", "api", "dk.js"));

const PORT = Number(process.env.PORT) || 4600;

http
  .createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      return res.end();
    }
    if (!req.url.startsWith("/api/dk")) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "not found" }));
    }
    const started = Date.now();
    await dk(req, res);
    console.log(`${res.statusCode}  ${Date.now() - started}ms  ${req.url}`);
  })
  .listen(PORT, () => console.log(`dk proxy listening on http://localhost:${PORT}/api/dk`));
