/**
 * DraftKings proxy (Vercel serverless function, served at /api/dk).
 *
 * DraftKings sends no CORS headers, so a browser cannot call it directly -
 * which is why salaries were blank on the web build and the salary cap had
 * nothing to act on. This fetches server-side, where CORS does not apply, and
 * returns the same field names the client already reads so the mapping code is
 * shared with native.
 *
 * It also slims both responses. The lobby is ~5MB of contest metadata when all
 * the client needs is a draft group id, and the player list is ~400KB of which
 * we use ten fields.
 *
 * Only these two DraftKings endpoints are reachable - `resource` selects
 * between them, so this cannot be used as an open proxy for arbitrary URLs.
 */

const LOBBY_URL = "https://www.draftkings.com/lobby/getcontests?sport=NFL";
const PLAYERS_URL = id =>
  `https://www.draftkings.com/lineup/getavailableplayers?draftGroupId=${id}`;

// DraftKings serves HTML to requests that don't look like a browser.
const HEADERS = {
  Accept: "application/json, text/plain, */*",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
};

async function getJSON(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) {
    const err = new Error(`DraftKings responded ${res.status}`);
    err.status = 502;
    throw err;
  }
  const type = res.headers.get("content-type") || "";
  if (!type.includes("json")) {
    const err = new Error(`DraftKings returned ${type || "an unknown type"}, not JSON`);
    err.status = 502;
    throw err;
  }
  return res.json();
}

/** Pure handler, so the local dev harness and the Vercel entry share it. */
async function handle({ resource, draftGroupId }) {
  if (resource === "lobby") {
    const data = await getJSON(LOBBY_URL);
    // Classic only - the client discards Showdown/Tiers/Snake anyway, and this
    // is what turns 5MB into a few hundred KB.
    const contests = (data.Contests || [])
      .filter(c => c.gameType === "Classic")
      .map(c => ({ dg: c.dg, n: c.n, nt: c.nt, gameType: c.gameType }));
    return { status: 200, body: { Contests: contests } };
  }

  if (resource === "players") {
    const id = Number(draftGroupId);
    if (!Number.isInteger(id) || id <= 0) {
      return { status: 400, body: { error: "draftGroupId must be a positive integer" } };
    }
    const data = await getJSON(PLAYERS_URL(id));
    const playerList = (data.playerList || []).map(p => ({
      pid: p.pid, fn: p.fn, ln: p.ln, pn: p.pn, s: p.s, ppg: p.ppg,
      tid: p.tid, htid: p.htid, htabbr: p.htabbr, atabbr: p.atabbr,
    }));
    return { status: 200, body: { playerList } };
  }

  return { status: 400, body: { error: "resource must be 'lobby' or 'players'" } };
}

module.exports = async function dk(req, res) {
  const url = new URL(req.url, "http://localhost");
  try {
    const { status, body } = await handle({
      resource: url.searchParams.get("resource"),
      draftGroupId: url.searchParams.get("draftGroupId"),
    });
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    // Salaries move slowly; let the CDN absorb repeat loads.
    if (status === 200) {
      res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    }
    res.end(JSON.stringify(body));
  } catch (e) {
    res.statusCode = e && e.status ? e.status : 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: (e && e.message) || "Proxy failed" }));
  }
};

module.exports.handle = handle;
