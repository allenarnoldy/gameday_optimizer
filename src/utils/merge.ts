import { Player } from "../types";

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+(jr\.?|sr\.?|ii|iii|iv)$/i, "")
    .replace(/['.,-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Overlay Sleeper (or any other source) projections onto a DraftKings player list.
 * DK provides accurate salaries + game context; Sleeper provides better projections.
 * Falls back to DK's own ppg average if no Sleeper match is found.
 */
export function mergeProjectionsIntoDK(dkPlayers: Player[], projPlayers: Player[]): Player[] {
  const byName = new Map<string, Player>();
  const byTeamDST = new Map<string, Player>();

  for (const p of projPlayers) {
    byName.set(normalize(p.name), p);
    if (p.pos === "DST") byTeamDST.set(p.team, p);
  }

  return dkPlayers.map(dk => {
    const match =
      dk.pos === "DST"
        ? byTeamDST.get(dk.team)
        : byName.get(normalize(dk.name));

    return match ? { ...dk, proj: match.proj, projSource: "Sleeper" } : dk;
  });
}
