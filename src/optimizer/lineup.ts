import { Lineup, Player, RosterRule } from "../types";


export function buildTopLineups(
players: Player[],
rules: RosterRule[],
cap: number,
topN: number,
maxPerTeam: number | null
): Lineup[] {
const byPos: Record<string, Player[]> = {};
for (const rule of rules) {
for (const pos of rule.allow) {
const pool = players.filter((p) => p.pos === pos);
const sorted = pool.sort((a, b) => b.proj - a.proj);
byPos[pos] = sorted.slice(0, Math.max(15, Math.ceil(sorted.length * 0.6)));
}
}


const candidatesPerSlot: Player[][] = rules.map((r) => {
const sets = r.allow.map((pos) => byPos[pos] || []);
const merged: Record<string, Player> = {};
for (const s of sets) for (const pl of s) merged[pl.id] = pl;
return Object.values(merged).sort((a, b) => b.proj - a.proj);
});


const best: Lineup[] = [];
const usedIds = new Set<string>();
const teamCount = new Map<string, number>();
const pushBest = (lu: Lineup) => {
best.push(lu);
best.sort((a, b) => b.totalProj - a.totalProj);
if (best.length > topN) best.pop();
};


function canUse(player: Player) {
if (usedIds.has(player.id)) return false;
if (player.salary && player.salary < 0) return false;
if (maxPerTeam != null) {
const cur = teamCount.get(player.team) || 0;
if (cur + 1 > maxPerTeam) return false;
}
return true;
}


function upperBound(slotIdx: number): number {
let sum = 0;
for (let i = slotIdx; i < rules.length; i++) {
const pool = candidatesPerSlot[i];
for (const pl of pool) {
if (!usedIds.has(pl.id)) { sum += pl.proj; break; }
}
}
return sum;
}


function dfs(slotIdx: number, curSlots: Record<string, Player>, curProj: number, curSalary: number) {
if (slotIdx === rules.length) {
pushBest({ slots: curSlots, totalProj: curProj, totalSalary: curSalary });
return;
}


const bound = curProj + upperBound(slotIdx);
if (best.length && bound <= best[best.length - 1].totalProj) return;


const rule = rules[slotIdx];
const pool = candidatesPerSlot[slotIdx];


for (const pl of pool) {
if (!canUse(pl)) continue;
const nextSalary = curSalary + (pl.salary || 0);
if (nextSalary > cap) continue;
usedIds.add(pl.id);
teamCount.set(pl.team, (teamCount.get(pl.team) || 0) + 1);


dfs(slotIdx + 1, { ...curSlots, [rule.slot]: pl }, curProj + pl.proj, nextSalary);


usedIds.delete(pl.id);
teamCount.set(pl.team, (teamCount.get(pl.team) || 1) - 1);
}
}


dfs(0, {}, 0, 0);
return best;
}