import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";

import { Player, RosterRule, Lineup } from "../types";
import { DEMO_PLAYERS } from "../constants/demoPlayers";
import { labelWindowLocal } from "../utils/time";
import { getCurrentNFLWeek } from "../utils/nflWeek";
import { fetchSleeperPlayers, fetchSleeperWeekProjections, mapSleeperToPlayers } from "../api/sleeper";
import { fetchESPNWeekSchedule } from "../api/espn";
import { fetchDKCurrentWeek } from "../api/draftkings";
import { mergeProjectionsIntoDK } from "../utils/merge";
import Controls from "../components/Controls";
import LineupCard from "../components/LineupCard";
import PlayerPanel from "../components/PlayerPanel";
import { buildTopLineups } from "../optimizer";
import { useTheme } from "../ThemeContext";

export default function HomeScreen() {
  const { C, isDark, toggle } = useTheme();
  const { season, week } = getCurrentNFLWeek();
  const [scoring, setScoring] = useState<"ppr" | "half" | "std">("ppr");

  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState<string | null>("Loading current slate...");
  const [panelOpen, setPanelOpen] = useState(false);

  const [windowNoon, setWindowNoon] = useState(true);
  const [window3pm, setWindow3pm] = useState(true);
  const [lockedIds, setLockedIds] = useState<Set<string>>(new Set());

  const [cap, setCap] = useState<number>(50000);
  const [rules] = useState<RosterRule[]>([
    { slot: "QB",   allow: ["QB"] },
    { slot: "RB1",  allow: ["RB"] },
    { slot: "RB2",  allow: ["RB"] },
    { slot: "WR1",  allow: ["WR"] },
    { slot: "WR2",  allow: ["WR"] },
    { slot: "WR3",  allow: ["WR"] },
    { slot: "TE",   allow: ["TE"] },
    { slot: "FLEX", allow: ["RB", "WR", "TE"] },
    { slot: "DST",  allow: ["DST"] },
  ]);
  const [maxPerTeam, setMaxPerTeam] = useState<number | null>(null);
  const [topN, setTopN] = useState<number>(2);
  const [lineups, setLineups] = useState<Lineup[] | null>(null);

  const loadDemo = useCallback(() => {
    setPlayers(DEMO_PLAYERS.map(p => ({ ...p, window: labelWindowLocal(p.gameTime) })));
    setLineups(null);
    setLockedIds(new Set());
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading("Loading current week's slate...");
    setLockedIds(new Set());
    setLineups(null);
    try {
      const [dkResult, proj, allPlayers, evs] = await Promise.all([
        fetchDKCurrentWeek().catch(() => null),
        fetchSleeperWeekProjections(season, week).catch(() => [] as any[]),
        fetchSleeperPlayers().catch(() => ({} as Record<string, any>)),
        fetchESPNWeekSchedule(season, week).catch(() => [] as any[]),
      ]);

      const byTeam: Record<string, string> = {};
      for (const ev of (evs ?? [])) {
        const comps = ev?.competitions?.[0]?.competitors || [];
        const start = ev.date || ev.startDate;
        for (const c of comps) {
          const abbr = c?.team?.abbreviation?.toUpperCase?.();
          if (abbr && start) byTeam[abbr] = start;
        }
      }

      const sleeperPlayers = mapSleeperToPlayers(proj ?? [], allPlayers ?? {}, null, scoring);

      const basePlayers = dkResult?.players.length
        ? mergeProjectionsIntoDK(dkResult.players, sleeperPlayers)
        : sleeperPlayers;

      const withTimes = basePlayers.map(p => {
        const gameTime = byTeam[p.team] ?? p.gameTime;
        return { ...p, gameTime, window: labelWindowLocal(gameTime) };
      });

      setPlayers(withTimes);

      if (withTimes.length === 0) {
        Alert.alert(
          "No players loaded",
          "Neither DraftKings nor Sleeper returned data for this week. The NFL season may not have started — loading demo data.",
          [{ text: "Load Demo", onPress: loadDemo }, { text: "OK" }]
        );
      }
    } catch (e: any) {
      Alert.alert("Load failed", e?.message || String(e));
    } finally {
      setLoading(null);
    }
  }, [scoring]);

  useEffect(() => { fetchAll(); }, []);

  const filteredPlayers = useMemo(() => {
    return players.filter(p => {
      if (lockedIds.has(p.id)) return true;
      const w = p.window || labelWindowLocal(p.gameTime);
      if (w === "Noon") return windowNoon;
      if (w === "3PM")  return window3pm;
      return windowNoon || window3pm;
    });
  }, [players, windowNoon, window3pm, lockedIds]);

  const toggleLock = (id: string) => {
    setLockedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const [generating, setGenerating] = useState(false);
  const canGenerate = filteredPlayers.length > 0 && !generating;

  const handleGenerate = () => {
    if (!canGenerate) return;
    setGenerating(true);
    setTimeout(() => {
      const result = buildTopLineups(filteredPlayers, rules, cap, topN, maxPerTeam, lockedIds);
      setLineups(result);
      setGenerating(false);
    }, 0);
  };

  return (
    <>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} style={{ backgroundColor: C.bg }}>

        {/* Header */}
        <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.border }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={{ fontSize: 11, fontWeight: "700", color: C.primary, letterSpacing: 1.5, marginBottom: 2 }}>NFL DAILY FANTASY</Text>
              <Text style={{ fontSize: 26, fontWeight: "800", color: C.text }}>Gameday Optimizer</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {/* Dark mode toggle */}
              <Pressable
                onPress={toggle}
                style={({ pressed }) => ({
                  width: 42, height: 42, borderRadius: 21,
                  backgroundColor: pressed ? C.primaryBg : C.card,
                  borderWidth: 1.5, borderColor: C.border,
                  alignItems: "center", justifyContent: "center",
                })}
              >
                <Text style={{ fontSize: 18 }}>{isDark ? "☀️" : "🌙"}</Text>
              </Pressable>

              {/* Refresh */}
              <Pressable
                onPress={fetchAll}
                disabled={!!loading}
                style={({ pressed }) => ({
                  width: 42, height: 42, borderRadius: 21,
                  backgroundColor: loading ? C.primaryBg : (pressed ? C.primaryBg : C.card),
                  borderWidth: 1.5, borderColor: loading ? C.primary : C.border,
                  alignItems: "center", justifyContent: "center",
                })}
              >
                {loading
                  ? <ActivityIndicator color={C.primary} />
                  : <Text style={{ fontSize: 18 }}>↺</Text>
                }
              </Pressable>
            </View>
          </View>
          {loading && (
            <Text style={{ color: C.muted, fontSize: 13, marginTop: 8 }}>{loading}</Text>
          )}
        </View>

        <Controls
          scoring={scoring} setScoring={setScoring}
          cap={cap} setCap={setCap}
          topN={topN} setTopN={setTopN}
          maxPerTeam={maxPerTeam} setMaxPerTeam={setMaxPerTeam}
          windowNoon={windowNoon} setWindowNoon={setWindowNoon}
          window3pm={window3pm} setWindow3pm={setWindow3pm}
        />

        {/* Action row */}
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              onPress={handleGenerate}
              style={({ pressed }) => ({
                flex: 1, paddingVertical: 15, borderRadius: 16,
                backgroundColor: canGenerate ? (pressed ? C.primaryDark : C.primary) : C.border,
                alignItems: "center", justifyContent: "center",
              })}
            >
              {generating
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: 0.3 }}>Generate Optimal Lineups</Text>
              }
            </Pressable>

            <Pressable
              onPress={() => setPanelOpen(true)}
              style={({ pressed }) => ({
                paddingVertical: 15, paddingHorizontal: 16, borderRadius: 16,
                borderWidth: 1.5, borderColor: C.border,
                backgroundColor: pressed ? C.bg : C.card,
                alignItems: "center", justifyContent: "center", gap: 2,
              })}
            >
              <Text style={{ fontSize: 18 }}>👥</Text>
              {filteredPlayers.length > 0 && (
                <Text style={{ fontSize: 11, fontWeight: "700", color: C.muted }}>
                  {filteredPlayers.length}{lockedIds.size > 0 ? ` · 🔒${lockedIds.size}` : ""}
                </Text>
              )}
            </Pressable>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "center", gap: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: canGenerate ? C.primary : C.light }} />
              <Text style={{ color: C.muted, fontSize: 13 }}>{filteredPlayers.length} players</Text>
            </View>
            {lockedIds.size > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.primary }} />
                <Text style={{ color: C.muted, fontSize: 13 }}>{lockedIds.size} locked</Text>
              </View>
            )}
          </View>
        </View>

        {lineups && (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
              <Text style={{ fontWeight: "700", fontSize: 15, color: C.text }}>Top lineups for Week {week}</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
            </View>
            {lineups.map((lu, i) => (
              <LineupCard key={i} lu={lu} index={i} />
            ))}
          </View>
        )}

      </ScrollView>

      <PlayerPanel
        visible={panelOpen}
        onClose={() => setPanelOpen(false)}
        players={filteredPlayers}
        lockedIds={lockedIds}
        onToggleLock={toggleLock}
      />
    </>
  );
}
