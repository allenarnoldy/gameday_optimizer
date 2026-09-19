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
        const byProj  = [...pool].sort((a, b) => b.proj - a.proj).slice(0, 8);
        const byValue = [...pool]
          .filter(p => (p.salary ?? 0) > 0)
          .sort((a, b) => (b.proj / b.salary!) - (a.proj / a.salary!))
          .slice(0, 8);
        const merged: Record<string, Player> = {};
        for (const p of [...byProj, ...byValue]) merged[p.id] = p;
        // Sorted by projection so DFS explores high-proj players first, which
        // both finds good lineups early and makes the suffix ceiling exact.
        candidates = Object.values(merged).sort((a, b) => b.proj - a.proj);
      }
      byPos[pos] = candidates;
    }
  }

  return rules.map(r => {
    const merged: Record<string, Player> = {};
    for (const pos of r.allow) {
      for (const pl of (byPos[pos] ?? [])) merged[pl.id] = pl;
    }
    return Object.values(merged).sort((a, b) => b.proj - a.proj);
  });
}

/** Two rules are interchangeable when they accept exactly the same positions. */
function sameAllow(a: RosterRule, b: RosterRule): boolean {
  return a.allow.length === b.allow.length && a.allow.every(x => b.allow.includes(x));
}

/**
 * Builds the search once and hands back two ways to drive it: all at once, or
 * one top-level branch at a time. Everything below is shared, so the sliced
 * and synchronous runs cannot drift apart.
 */
function createSolver(
  players: Player[],
  rules: RosterRule[],
  cap: number,
  topN: number,
  maxPerTeam: number | null,
  lockedIds: Set<string> = new Set()
) {
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

  const candidatesPerSlot = buildCandidateSlots(players, rules);
  const nSlots = rules.length;

  /**
   * RB1/RB2 and WR1/WR2/WR3 draw from identical lists, so every roster was
   * being rebuilt once per permutation of those slots - 2! * 3! = 12 times.
   * Requiring the candidate index to increase across a run of interchangeable
   * slots keeps exactly one representative and loses no lineup.
   */
  const orderedWithPrev: boolean[] = rules.map((r, i) =>
    i > 0 &&
    !preAssigned.has(i) &&
    !preAssigned.has(i - 1) &&
    sameAllow(r, rules[i - 1])
  );

  /**
   * Cheapest way to fill each remaining slot, as a suffix sum. The old check
   * used one global minimum salary for every slot, which barely pruned: a DST
   * floor is nothing like a QB floor.
   */
  const minSuffix = new Array<number>(nSlots + 1).fill(0);
  for (let i = nSlots - 1; i >= 0; i--) {
    let slotMin: number;
    if (preAssigned.has(i)) {
      slotMin = preAssigned.get(i)!.salary ?? 0;
    } else {
      slotMin = Infinity;
      for (const p of candidatesPerSlot[i]) slotMin = Math.min(slotMin, p.salary ?? 0);
      if (!isFinite(slotMin)) slotMin = 0;
    }
    minSuffix[i] = minSuffix[i + 1] + slotMin;
  }

  /**
   * Best projection still reachable from each slot, ignoring which players are
   * already used. Looser than upperBound() but O(1), so it rejects most nodes
   * before the exact bound has to be walked.
   */
  const maxSuffix = new Array<number>(nSlots + 1).fill(0);
  for (let i = nSlots - 1; i >= 0; i--) {
    const bestAt = preAssigned.has(i)
      ? preAssigned.get(i)!.proj
      : (candidatesPerSlot[i][0]?.proj ?? 0);
    maxSuffix[i] = maxSuffix[i + 1] + bestAt;
  }

  type Entry = { lineup: Lineup; sig: string };
  const best: Entry[] = [];
  const usedIds = new Set<string>();
  const teamCount = new Map<string, number>();

  for (const p of preAssigned.values()) {
    usedIds.add(p.id);
    teamCount.set(p.team, (teamCount.get(p.team) || 0) + 1);
  }

  // Filled in place rather than spread into a new object at every node.
  const chosen: Player[] = new Array(nSlots);

  /** Exact ceiling: the best still-available player for each remaining slot. */
  function upperBound(fromSlot: number): number {
    let sum = 0;
    for (let i = fromSlot; i < nSlots; i++) {
      if (preAssigned.has(i)) { sum += preAssigned.get(i)!.proj; continue; }
      for (const pl of candidatesPerSlot[i]) {
        if (!usedIds.has(pl.id)) { sum += pl.proj; break; }
      }
    }
    return sum;
  }

  function record(curProj: number, curSalary: number) {
    // Slots like TE and FLEX overlap, so the same roster can arrive under
    // different labels. Key on the player set so "2 lineups" is really two.
    const ids = new Array<string>(nSlots);
    for (let i = 0; i < nSlots; i++) ids[i] = chosen[i].id;
    const sig = ids.slice().sort().join("|");
    if (best.some(e => e.sig === sig)) return;

    const slots: Record<string, Player> = {};
    for (let i = 0; i < nSlots; i++) slots[rules[i].slot] = chosen[i];

    best.push({ lineup: { slots, totalProj: curProj, totalSalary: curSalary }, sig });
    best.sort((a, b) => b.lineup.totalProj - a.lineup.totalProj);
    if (best.length > topN) best.pop();
  }

  /** One candidate placed in one slot, plus everything that follows from it. */
  function expand(slotIdx: number, k: number, curProj: number, curSalary: number) {
    const pl = candidatesPerSlot[slotIdx][k];
    if (usedIds.has(pl.id)) return;
    const nextSalary = curSalary + (pl.salary || 0);
    if (nextSalary > cap) return;
    if (maxPerTeam != null && (teamCount.get(pl.team) || 0) >= maxPerTeam) return;

    usedIds.add(pl.id);
    teamCount.set(pl.team, (teamCount.get(pl.team) || 0) + 1);
    chosen[slotIdx] = pl;

    // Next slot resumes after this index only when it is interchangeable.
    const nextStart = slotIdx + 1 < nSlots && orderedWithPrev[slotIdx + 1] ? k + 1 : 0;
    dfs(slotIdx + 1, curProj + pl.proj, nextSalary, nextStart);

    usedIds.delete(pl.id);
    teamCount.set(pl.team, (teamCount.get(pl.team) || 1) - 1);
  }

  function dfs(slotIdx: number, curProj: number, curSalary: number, startIdx: number) {
    if (slotIdx === nSlots) { record(curProj, curSalary); return; }

    // Can every remaining slot still be filled within the cap?
    if (curSalary + minSuffix[slotIdx] > cap) return;

    if (best.length >= topN) {
      const worst = best[best.length - 1].lineup.totalProj;
      // Cheap precomputed ceiling first; only pay for the exact one if it survives.
      if (curProj + maxSuffix[slotIdx] <= worst) return;
      if (curProj + upperBound(slotIdx) <= worst) return;
    }

    if (preAssigned.has(slotIdx)) {
      const p = preAssigned.get(slotIdx)!;
      chosen[slotIdx] = p;
      dfs(slotIdx + 1, curProj + p.proj, curSalary + (p.salary || 0), 0);
      return;
    }

    const cands = candidatesPerSlot[slotIdx];
    for (let k = startIdx; k < cands.length; k++) expand(slotIdx, k, curProj, curSalary);
  }

  /**
   * The same search, but stopping `depth` branching slots down and handing the
   * rest of each subtree back as a piece of work to run.
   *
   * The generator stays suspended at the yield, so the placement it just made
   * is still in effect when the caller runs the thunk; it only backtracks when
   * asked for the next one. That is what lets the caller await in between
   * without the search losing its place.
   */
  function* walk(
    slotIdx: number, curProj: number, curSalary: number, startIdx: number, depth: number
  ): Generator<() => void> {
    if (slotIdx >= nSlots || depth === 0) {
      yield () => dfs(slotIdx, curProj, curSalary, startIdx);
      return;
    }
    if (curSalary + minSuffix[slotIdx] > cap) return;

    if (preAssigned.has(slotIdx)) {
      const p = preAssigned.get(slotIdx)!;
      chosen[slotIdx] = p;
      // A locked player is not a branch, so it does not spend any depth.
      yield* walk(slotIdx + 1, curProj + p.proj, curSalary + (p.salary || 0), 0, depth);
      return;
    }

    const cands = candidatesPerSlot[slotIdx];
    for (let k = startIdx; k < cands.length; k++) {
      const pl = cands[k];
      if (usedIds.has(pl.id)) continue;
      const nextSalary = curSalary + (pl.salary || 0);
      if (nextSalary > cap) continue;
      if (maxPerTeam != null && (teamCount.get(pl.team) || 0) >= maxPerTeam) continue;

      usedIds.add(pl.id);
      teamCount.set(pl.team, (teamCount.get(pl.team) || 0) + 1);
      chosen[slotIdx] = pl;

      const nextStart = slotIdx + 1 < nSlots && orderedWithPrev[slotIdx + 1] ? k + 1 : 0;
      yield* walk(slotIdx + 1, curProj + pl.proj, nextSalary, nextStart, depth - 1);

      usedIds.delete(pl.id);
      teamCount.set(pl.team, (teamCount.get(pl.team) || 1) - 1);
    }
  }

  return {
    runSync() {
      dfs(0, 0, 0, 0);
      return best.map(e => e.lineup);
    },
    tasks: (depth: number) => walk(0, 0, 0, 0, depth),
    result: () => best.map(e => e.lineup),
  };
}

export function buildTopLineups(
  players: Player[],
  rules: RosterRule[],
  cap: number,
  topN: number,
  maxPerTeam: number | null,
  lockedIds: Set<string> = new Set()
): Lineup[] {
  return createSolver(players, rules, cap, topN, maxPerTeam, lockedIds).runSync();
}

/**
 * The same solve, in slices, for the browser.
 *
 * A full slate takes well over a second of solid computation, and it used to
 * run in one go on the main thread. On a phone that is several seconds during
 * which the page cannot paint or answer a tap, and iOS Safari responds by
 * killing the tab -- the page appears to reload, and on a second attempt
 * Safari gives up with "a problem repeatedly occurred".
 *
 * Splitting two branching slots down gives a few hundred pieces rather than a
 * dozen, and control returns to the browser whenever a slice has run long
 * enough. That keeps the tab alive and the throw animating. Same search, same
 * answers, same order -- only the thread is shared now.
 */
export async function buildTopLineupsSliced(
  players: Player[],
  rules: RosterRule[],
  cap: number,
  topN: number,
  maxPerTeam: number | null,
  lockedIds: Set<string> = new Set(),
  opts: { sliceMs?: number; depth?: number } = {}
): Promise<Lineup[]> {
  const { sliceMs = 12, depth = 2 } = opts;
  const solver = createSolver(players, rules, cap, topN, maxPerTeam, lockedIds);

  let sliceStart = Date.now();
  for (const task of solver.tasks(depth)) {
    task();
    // setTimeout rather than a microtask: a resolved promise would be drained
    // within the same task and never actually hand the thread back.
    if (Date.now() - sliceStart >= sliceMs) {
      await new Promise<void>(r => setTimeout(r, 0));
      sliceStart = Date.now();
    }
  }
  return solver.result();
}
