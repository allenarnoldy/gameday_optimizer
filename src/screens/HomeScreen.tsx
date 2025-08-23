import React, { useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";




import { Player, RosterRule, Lineup } from "../types";
import { DEMO_PLAYERS } from "../constants/demoPlayers";
import { parseCSV } from "../utils/csv";
import { labelWindowLocal, uniq } from "../utils/time";
import { fetchSleeperPlayers, fetchSleeperWeekProjections, mapSleeperToPlayers } from "../api/sleeper";
import { fetchESPNWeekSchedule } from "../api/espn";
import Controls from "../components/Controls";
import PlayerList from "../components/PlayerList";
import LineupCard from "../components/LineupCard";
import { buildTopLineups } from "../optimizer";



export default function HomeScreen() {
const [season, setSeason] = useState<number>(new Date().getFullYear());
const [week, setWeek] = useState<number>(1);
const [scoring, setScoring] = useState<"ppr" | "half" | "std">("ppr");




const [players, setPlayers] = useState<Player[]>([]);
const [schedule, setSchedule] = useState<any[] | null>(null);
const [loading, setLoading] = useState<string | null>(null);




const [windowNoon, setWindowNoon] = useState(true);
const [window3pm, setWindow3pm] = useState(true);




const [cap, setCap] = useState<number>(50000);
const [rules, setRules] = useState<RosterRule[]>([
{ slot: "QB", allow: ["QB"] },
{ slot: "RB1", allow: ["RB"] },
{ slot: "RB2", allow: ["RB"] },
{ slot: "WR1", allow: ["WR"] },
{ slot: "WR2", allow: ["WR"] },
{ slot: "WR3", allow: ["WR"] },
{ slot: "TE", allow: ["TE"] },
{ slot: "FLEX", allow: ["RB", "WR", "TE"] },
{ slot: "DST", allow: ["DST"] },
]);
const [maxPerTeam, setMaxPerTeam] = useState<number | null>(null);
const [topN, setTopN] = useState<number>(20);
const [lineups, setLineups] = useState<Lineup[] | null>(null);




const scheduleTeams = useMemo(() => {
if (!schedule) return [] as string[];
const teams: string[] = [];
for (const ev of schedule) {
const comps = ev?.competitions?.[0]?.competitors || [];
for (const c of comps) {
const abbr = c?.team?.abbreviation?.toUpperCase?.();
if (abbr) teams.push(abbr);
}
}
return uniq(teams).sort();
}, [schedule]);




const filteredPlayers = useMemo(() => {
  let xs = players.slice();

  xs = xs.filter((p) => {
    const w = p.window || labelWindowLocal(p.gameTime);
    const noonOk = w === "Noon" && windowNoon;
    const threeOk = w === "3PM" && window3pm;

    if (noonOk || threeOk) return true;
    if (w === "Other") return !windowNoon || !window3pm ? false : true;
    return false;
  });

  return xs;
}, [players, windowNoon, window3pm]);

return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 22, fontWeight: "800" }}>NFL Weekly Fantasy Optimizer</Text>
        {loading ? <ActivityIndicator /> : null}
      </View>

      <Controls
        season={season} setSeason={setSeason}
        week={week} setWeek={setWeek}
        scoring={scoring} setScoring={setScoring}
        cap={cap} setCap={setCap}
        topN={topN} setTopN={setTopN}
        maxPerTeam={maxPerTeam} setMaxPerTeam={setMaxPerTeam}
        windowNoon={windowNoon} setWindowNoon={setWindowNoon}
        window3pm={window3pm} setWindow3pm={setWindow3pm}
        onLoadDemo={() => {
          setPlayers(DEMO_PLAYERS.map((p) => ({ ...p, window: labelWindowLocal(p.gameTime) })));
          setSchedule(null);
          setLineups(null);
        }}
        onFetchSleeper={async () => {
          setLoading("Fetching Sleeper projections + players...");
          try {
            const [proj, allPlayers] = await Promise.all([
              fetchSleeperWeekProjections(season, week),
              fetchSleeperPlayers(),
            ]);
            const mapped = mapSleeperToPlayers(proj, allPlayers, schedule, scoring);
            setPlayers(mapped.map((p) => ({ ...p, window: p.window || labelWindowLocal(p.gameTime) })));
            setLineups(null);
          } catch (e: any) {
            console.warn(e?.message || String(e));
          } finally {
            setLoading(null);
          }
        }}
        onFetchSchedule={async () => {
          setLoading("Fetching ESPN schedule...");
          try {
            const evs = await fetchESPNWeekSchedule(season, week);
            setSchedule(evs);
            if (players.length) {
              const byTeam: Record<string, { time: string }> = {};
              for (const ev of evs) {
                const comps = ev?.competitions?.[0]?.competitors || [];
                const start = ev.date || ev.startDate;
                for (const c of comps) {
                  const abbr = c?.team?.abbreviation?.toUpperCase?.();
                  if (abbr) byTeam[abbr] = { time: start };
                }
              }
              setPlayers((prev) =>
                prev.map((p) => {
                  const t = byTeam[p.team];
                  const gameTime = t?.time || p.gameTime;
                  return { ...p, gameTime, window: labelWindowLocal(gameTime) };
                })
              );
            }
          } catch (e: any) {
            console.warn(e?.message || String(e));
          } finally {
            setLoading(null);
          }
        }}
        onUpload={() => {
          // hook up DocumentPicker later; placeholder for now
          setPlayers(DEMO_PLAYERS.map((p) => ({ ...p, window: labelWindowLocal(p.gameTime) })));
        }}
      />

      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <Pressable
          onPress={() => {
            if (!filteredPlayers.length) return;
            const ls = buildTopLineups(filteredPlayers, rules, cap, topN, maxPerTeam);
            setLineups(ls);
          }}
          style={{ paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderRadius: 12, backgroundColor: "#22c55e" }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Generate Optimal Lineups</Text>
        </Pressable>
        <Text style={{ opacity: 0.7 }}>
          {filteredPlayers.length} players loaded · {schedule ? `${scheduleTeams.length} teams` : "no schedule yet"}
        </Text>
      </View>

      {!!filteredPlayers.length && <PlayerList players={filteredPlayers} />}

      {lineups && (
        <View style={{ gap: 10 }}>
          <Text style={{ fontWeight: "700", fontSize: 16 }}>Top {lineups.length} Lineups</Text>
          {lineups.map((lu, i) => (
            <LineupCard key={i} lu={lu} index={i} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}