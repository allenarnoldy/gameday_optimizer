import { Lineup, Player, RosterRule } from "../types";

function buildCandidateSlots(players: Player[], rules: RosterRule[]): Player[][] {
  const hasSalaries = players.some(p => (p.salary ?? 0) > 0);

  const byPos: Record<string, Player[]> = {};
  for (const rule of rules) {
    for (const pos of rule.allow) {
      if (byPos[pos]) continue;
      const pool = players.filter(p => p.pos === pos);

      let candidates: Player[];
      if (!hasSalaries) {
        candidates = [...pool].sort((a, b) => b.proj - a.proj).slice(0, 15);
      } else {
        // Top studs by raw projection + top value plays by proj/salary.
        // Sorting combined pool by proj/salary means DFS visits high-value
        // players first, finds good lineups early, and pruning kicks in fast.
        const byProj  = [...pool].sort((a, b) => b.proj - a.proj).slice(0, 8);
        const byValue = [...pool]
          .filter(p => (p.salary ?? 0) > 0)
          .sort((a, b) => (b.proj / b.salary!) - (a.proj / a.salary!))
          .slice(0, 8);
        const merged: Record<string, Player> = {};
        for (const p of [...byProj, ...byValue]) merged[p.id] = p;
        // Sort by projection so DFS explores high-proj (high-salary) players first.
        // This also makes upperBound() accurate: it picks the first available player
        // per slot, which will be the highest-projection option when sorted this way.
        candidates = Object.values(merged)
          .sort((a, b) => b.proj - a.proj);
      }
      byPos[pos] = candidates;
    }
  }

  return rules.map(r => {
    const merged: Record<string, Player> = {};
    for (const pos of r.allow) {
      for (const pl of (byPos[pos] ?? [])) merged[pl.id] = pl;
    }
    return Object.values(merged)
      .sort((a, b) => b.proj - a.proj);
  });
}

export function buildTopLineups(
  players: Player[],
  rules: RosterRule[],
  cap: number,
  topN: number,
  maxPerTeam: number | null,
  lockedIds: Set<string> = new Set()
): Lineup[] {
  // Pre-assign locked players to their slots
  const lockedPlayers = players.filter(p => lockedIds.has(p.id));
  const preAssigned = new Map<number, Player>();
  const preAssignedIds = new Set<string>();
  for (let i = 0; i < rules.length; i++) {
    for (const lp of lockedPlayers) {
      if (preAssignedIds.has(lp.id)) continue;
      if (rules[i].allow.includes(lp.pos)) {
        preAssigned.set(i, lp);
        preAssignedIds.add(lp.id);
        break;
      }
    }
  }

  const hasSalaries = players.some(p => (p.salary ?? 0) > 0);
  // True minimum salary for any player — used to check if remaining slots are fundable
  const floorPerSlot = hasSalaries
    ? Math.min(...players.map(p => p.salary ?? 0).filter(s => s > 0))
    : 0;

  // How many non-pre-assigned slots remain at each index (precomputed)
  const unfilledFrom = rules.map((_, i) =>
    rules.slice(i).filter((__, j) => !preAssigned.has(i + j)).length
  );

  const candidatesPerSlot = buildCandidateSlots(players, rules);

  const best: Lineup[] = [];
  const usedIds  = new Set<string>();
  const teamCount = new Map<string, number>();

  // Seed mutable state with locked players so they're unavailable for other slots
  for (const p of preAssigned.values()) {
    usedIds.add(p.id);
    teamCount.set(p.team, (teamCount.get(p.team) || 0) + 1);
  }

  // Upper bound: sum of the highest-projection available player for each remaining slot.
  // Ignores salary (loose but fast). Projection pruning is the primary mechanism.
  function upperBound(fromSlot: number): number {
    let sum = 0;
    for (let i = fromSlot; i < rules.length; i++) {
      if (preAssigned.has(i)) { sum += preAssigned.get(i)!.proj; continue; }
      for (const pl of candidatesPerSlot[i]) {
        if (!usedIds.has(pl.id)) { sum += pl.proj; break; }
      }
    }
    return sum;
  }

  function dfs(
    slotIdx: number,
    curSlots: Record<string, Player>,
    curProj: number,
    curSalary: number
  ) {
    if (slotIdx === rules.length) {
      best.push({ slots: curSlots, totalProj: curProj, totalSalary: curSalary });
      best.sort((a, b) => b.totalProj - a.totalProj);
      if (best.length > topN) best.pop();
      return;
    }

    // Can we afford to fill every remaining slot at minimum price?
    if (curSalary + unfilledFrom[slotIdx] * floorPerSlot > cap) return;

    // Is the theoretical ceiling good enough to beat our Nth best?
    const bound = curProj + upperBound(slotIdx);
    if (best.length >= topN && bound <= best[best.length - 1].totalProj) return;

    // Locked slot — use the pre-assigned player directly
    if (preAssigned.has(slotIdx)) {
      const p = preAssigned.get(slotIdx)!;
      dfs(
        slotIdx + 1,
        { ...curSlots, [rules[slotIdx].slot]: p },
        curProj + p.proj,
        curSalary + (p.salary || 0)
      );
      return;
    }

    for (const pl of candidatesPerSlot[slotIdx]) {
      if (usedIds.has(pl.id)) continue;
      const nextSalary = curSalary + (pl.salary || 0);
      if (nextSalary > cap) continue;
      if (maxPerTeam != null && (teamCount.get(pl.team) || 0) >= maxPerTeam) continue;

      usedIds.add(pl.id);
      teamCount.set(pl.team, (teamCount.get(pl.team) || 0) + 1);

      dfs(slotIdx + 1, { ...curSlots, [rules[slotIdx].slot]: pl }, curProj + pl.proj, nextSalary);

      usedIds.delete(pl.id);
      teamCount.set(pl.team, (teamCount.get(pl.team) || 1) - 1);
    }
  }

  dfs(0, {}, 0, 0);
  return best;
}
