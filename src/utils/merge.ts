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
 * Overlay Sleeper (or any other source) projections onto a DraftKings player
 * list. DK provides accurate salaries and game context; Sleeper provides the
 * projections.
 *
 * When Sleeper answers, it is also the authority on *who is playing*. A player
 * it declines to project is one it does not expect to produce, and the honest
 * thing to do is leave them out.
 *
 * The alternative -- falling back to DraftKings' `ppg` -- reads as a
 * projection but is last season's average points per game, which for a backup
 * who started a few games last year looks exactly like a starter's output at a
 * backup's price. That handed the optimizer the best value on the board:
 * Carson Wentz, second on the depth chart, 16.3 "points" at $4,000. Nine of
 * the ten best points-per-dollar plays in the pool were backup quarterbacks.
 *
 * So ppg survives only as a fallback for when Sleeper gives us nothing at all
 * (an outage, or the preseason), where a rough number beats an empty app.
 */
export function mergeProjectionsIntoDK(dkPlayers: Player[], projPlayers: Player[]): Player[] {
  // With no projections at all, DK's average is all we have.
  const sleeperIsAuthoritative = projPlayers.length > 0;
  const byName = new Map<string, Player>();
  const byTeamDST = new Map<string, Player>();

  for (const p of projPlayers) {
    byName.set(normalize(p.name), p);
    if (p.pos === "DST") byTeamDST.set(p.team, p);
  }

  // Max realistic single-week PPR score — anything above this is a season total
  const WEEKLY_MAX = 60;

  return dkPlayers
    .map(dk => {
      const match =
        dk.pos === "DST"
          ? byTeamDST.get(dk.team)
          : byName.get(normalize(dk.name));

      if (match && match.proj <= WEEKLY_MAX) {
        return { ...dk, proj: match.proj, projSource: "Sleeper" as const };
      }
      // Sleeper has season totals instead of weekly projections (preseason),
      // or does not project this player at all — fall back to DK's average.
      return dk;
    })
    .filter(p => {
      if (p.proj <= 0) return false;
      return sleeperIsAuthoritative ? p.projSource === "Sleeper" : true;
    });
}
