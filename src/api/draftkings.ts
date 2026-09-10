import { Platform } from "react-native";
import { Player, Position } from "../types";

/**
 * DraftKings sends no CORS headers, so a browser can't call it directly - on
 * web these go through our own /api/dk function instead, which fetches
 * server-side and hands back the same field names. Native has no such
 * restriction and talks to DraftKings directly.
 *
 * The Expo dev server doesn't serve /api routes, so in development we point at
 * a local copy of the same function: `npm run dk-proxy`. Without it the fetch
 * simply fails and the app falls back to Sleeper alone, as it did before.
 */
const PROXY = __DEV__ ? "http://localhost:4600/api/dk" : "/api/dk";
const viaProxy = Platform.OS === "web";

const LOBBY_URL = viaProxy
  ? `${PROXY}?resource=lobby`
  : "https://www.draftkings.com/lobby/getcontests?sport=NFL";

const PLAYERS_URL = (draftGroupId: number) =>
  viaProxy
    ? `${PROXY}?resource=players&draftGroupId=${draftGroupId}`
    : `https://www.draftkings.com/lineup/getavailableplayers?draftGroupId=${draftGroupId}`;

export async function fetchDKDraftGroup(): Promise<{ draftGroupId: number; contestName: string }> {
  const res = await fetch(LOBBY_URL);
  if (!res.ok) throw new Error("Could not reach DraftKings lobby");
  const data = await res.json();
  const contests: any[] = data.Contests ?? [];

  // Pick the highest-entry classic (main slate, not Showdown/Tiers/Snake)
  const classic = contests
    .filter(c => c.gameType === "Classic" && !c.n?.toLowerCase().includes("showdown"))
    .sort((a, b) => (b.nt ?? 0) - (a.nt ?? 0))[0];

  if (!classic) throw new Error("No NFL Classic contest found in DraftKings lobby");
  return { draftGroupId: classic.dg, contestName: classic.n };
}

export async function fetchDKPlayersForGroup(draftGroupId: number): Promise<Player[]> {
  const res = await fetch(PLAYERS_URL(draftGroupId));
  if (!res.ok) throw new Error("Could not load DraftKings player list");
  const data = await res.json();
  const raw: any[] = data.playerList ?? [];

  return raw
    .flatMap((p): Player[] => {
      const isHome = p.tid === p.htid;
      const team = (isHome ? p.htabbr : p.atabbr)?.toUpperCase();
      const opp  = (isHome ? p.atabbr : p.htabbr)?.toUpperCase();
      const pos  = p.pn as Position;
      if (!team || !pos) return [];

      // DST has empty last name — fn is the team city/nickname
      const name = p.ln ? `${p.fn} ${p.ln}` : p.fn;
      const proj = parseFloat(p.ppg) || 0;

      return [{ id: `dk-${p.pid}`, name, team, opp, pos, salary: p.s, proj, projSource: "DK Avg" as const }];
    })
    .filter(p => !p.name.includes("undefined") && p.proj > 0);
}

export async function fetchDKCurrentWeek(): Promise<{ players: Player[]; contestName: string }> {
  const { draftGroupId, contestName } = await fetchDKDraftGroup();
  const players = await fetchDKPlayersForGroup(draftGroupId);
  return { players, contestName };
}
