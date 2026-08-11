import { Player, Position } from "../types";

const LOBBY_URL = "https://www.draftkings.com/lobby/getcontests?sport=NFL";
const PLAYERS_URL = (draftGroupId: number) =>
  `https://www.draftkings.com/lineup/getavailableplayers?draftGroupId=${draftGroupId}`;

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
