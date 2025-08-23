import { Player, Position } from "../types";
import { labelWindowLocal } from "../utils/time";


export async function fetchSleeperPlayers(): Promise<Record<string, any>> {
const url = "https://api.sleeper.app/v1/players/nfl";
const res = await fetch(url);
if (!res.ok) throw new Error("Failed to load Sleeper players");
return res.json();
}


export async function fetchSleeperWeekProjections(season: number, week: number): Promise<any[]> {
const base = `https://api.sleeper.com/projections/nfl/${season}`;
const params = new URLSearchParams({ season_type: "regular", week: String(week), order_by: "pts_ppr" });
["QB", "RB", "WR", "TE", "DEF"].forEach((p) => params.append("position[]", p));
const res = await fetch(`${base}?${params.toString()}`);
if (!res.ok) throw new Error("Failed to load Sleeper projections (week)");
return res.json();
}


export function mapSleeperToPlayers(
projections: any[],
playersById: Record<string, any>,
scheduleEvents: any[] | null,
scoring: "ppr" | "half" | "std"
): Player[] {
const byTeamOppTime: Record<string, { opp: string; time: string; id: string }> = {};
if (scheduleEvents) {
for (const ev of scheduleEvents) {
try {
const comps = ev.competitions?.[0]?.competitors;
const home = comps?.find((c: any) => c.homeAway === "home");
const away = comps?.find((c: any) => c.homeAway === "away");
const start = ev.date || ev.startDate;
const gameId = String(ev.id || ev.uid || Math.random());
if (home?.team?.abbreviation && away?.team?.abbreviation) {
const h = home.team.abbreviation.toUpperCase();
const a = away.team.abbreviation.toUpperCase();
byTeamOppTime[h] = { opp: a, time: start, id: gameId };
byTeamOppTime[a] = { opp: h, time: start, id: gameId };
}
} catch {}
}
}


const pickPts = (o: any) => (scoring === "ppr" ? o?.stats?.pts_ppr ?? o?.pts ?? 0 : scoring === "half" ? o?.stats?.pts_half_ppr ?? 0 : o?.stats?.pts_std ?? 0);


const out: Player[] = [];
for (const p of projections) {
const pid = p.player_id || p.player?.id || p.playerId || p.id;
const meta = playersById?.[pid];
const team = (meta?.team || p.team || "").toUpperCase();
const pos = String(meta?.position || p.position || "").toUpperCase() as Position;
if (!team || !pos) continue;
const name = meta?.full_name || meta?.name || (meta?.first_name && meta?.last_name ? `${meta.first_name} ${meta.last_name}` : p.player?.name || p.name || pid);
const proj = Number(pickPts(p));
if (!proj || Number.isNaN(proj)) continue;


const sched = byTeamOppTime[team];
const gameTime = sched?.time;
const window = labelWindowLocal(gameTime);


out.push({ id: String(pid), name, team, pos, proj, opp: sched?.opp, gameId: sched?.id, gameTime, window });
}
return out;
}