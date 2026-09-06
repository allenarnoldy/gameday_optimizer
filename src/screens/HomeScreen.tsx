import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View, Text, ScrollView, ActivityIndicator, Alert, useWindowDimensions, TextStyle,
} from "react-native";

import { Player, RosterRule, Lineup } from "../types";
import { DEMO_PLAYERS } from "../constants/demoPlayers";
import { labelWindowLocal, currency } from "../utils/time";
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
import { radius, space, type as T, heroType, APP_WIDTH } from "../theme";
import { Card, IconButton, PillButton, PanelRightIcon } from "../components/ui";

export default function HomeScreen() {
  const { C, isDark, toggle } = useTheme();
  const { season, week } = getCurrentNFLWeek();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const isNarrow = width < 560;
  const gutter = isDesktop ? space.xl : space.md;

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
  // Bumped per solve so result cards remount and replay their stagger.
  const [runId, setRunId] = useState(0);

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
      setRunId(n => n + 1);
      setGenerating(false);
    }, 0);
  };

  const hero = heroType(width);
  const column = { width: "100%" as const, maxWidth: APP_WIDTH, alignSelf: "center" as const };

  return (
    <>
      <ScrollView style={{ backgroundColor: C.canvas }}>

        {/* ---- Primary nav: black band, 48px ---- */}
        <View style={{ backgroundColor: C.canvas, paddingHorizontal: gutter }}>
          <View
            style={{
              ...column, height: 48, flexDirection: "row",
              alignItems: "center", justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
              <View
                style={{
                  width: 24, height: 24, borderRadius: radius.full,
                  backgroundColor: C.primary, alignItems: "center", justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff", lineHeight: 16 }}>G</Text>
              </View>
              <Text style={{ ...T.bodyStrong, fontSize: 15, color: C.ink } as TextStyle}>
                GAMEDAY
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
              <IconButton onPress={toggle} size={36}>
                <Text style={{ fontSize: 14, color: C.ink }}>{isDark ? "☀" : "☾"}</Text>
              </IconButton>
              <IconButton onPress={fetchAll} disabled={!!loading} size={36}>
                {loading
                  ? <ActivityIndicator size="small" color={C.ink} />
                  : <Text style={{ fontSize: 15, color: C.ink }}>↻</Text>}
              </IconButton>
            </View>
          </View>
        </View>

        {/* ---- The blue band: the system's action moment ---- */}
        <View style={{ backgroundColor: C.primary, paddingHorizontal: gutter }}>
          <View style={{ ...column, paddingVertical: isDesktop ? space.xl : space.lg, gap: space.xs }}>
            <Text
              style={{
                ...T.captionSm,
                textTransform: "uppercase",
                letterSpacing: 1.6,
                color: "rgba(255,255,255,0.75)",
              } as TextStyle}
            >
              NFL Daily Fantasy · {season} Week {week}
            </Text>
            <Text style={{ ...hero, color: "#ffffff" } as TextStyle}>Gameday Optimizer</Text>
          </View>
        </View>

        {/* ---- Controls, immediately under the band ---- */}
        <View style={{ paddingHorizontal: gutter, paddingTop: space.lg }}>
          <View style={{ ...column, gap: space.md }}>
            <Controls
              scoring={scoring} setScoring={setScoring}
              cap={cap} setCap={setCap}
              topN={topN} setTopN={setTopN}
              maxPerTeam={maxPerTeam} setMaxPerTeam={setMaxPerTeam}
              windowNoon={windowNoon} setWindowNoon={setWindowNoon}
              window3pm={window3pm} setWindow3pm={setWindow3pm}
            />

            <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}>
              <PillButton
                label={generating ? "Solving…" : "Generate optimal lineups"}
                onPress={handleGenerate}
                disabled={!canGenerate}
                style={isNarrow ? { width: "100%" } : { flexGrow: 1, minWidth: 280 }}
              >
                {generating ? <ActivityIndicator size="small" color="#fff" /> : null}
              </PillButton>
              <PillButton
                // Locked count used to live in the banner; it belongs with the
                // pool it describes rather than disappearing entirely.
                label={
                  lockedIds.size > 0
                    ? `Player pool · ${filteredPlayers.length} · ${lockedIds.size} locked`
                    : `Player pool · ${filteredPlayers.length}`
                }
                onPress={() => setPanelOpen(true)}
                variant="secondary"
                style={isNarrow ? { width: "100%" } : undefined}
              >
                <PanelRightIcon color={C.ink} />
              </PillButton>
            </View>
          </View>
        </View>

        {/* ---- Results ---- */}
        <View style={{ paddingHorizontal: gutter, paddingTop: space.lg }}>
          <View style={{ ...column, gap: space.sm }}>
            {lineups && lineups.length > 0 ? (
              <>
                <Text
                  style={{
                    ...T.captionSm, textTransform: "uppercase", letterSpacing: 1,
                    color: C.inkFaint, marginTop: space.xs,
                  } as TextStyle}
                >
                  {lineups.length} lineup{lineups.length === 1 ? "" : "s"} under {currency(cap)}
                </Text>
                {lineups.map((lu, i) => (
                  <LineupCard key={`${runId}-${i}`} lu={lu} index={i} />
                ))}
              </>
            ) : lineups ? (
              <Card>
                <Text style={{ ...T.headingMd, color: C.ink, marginBottom: 6 } as TextStyle}>
                  No lineup fits.
                </Text>
                <Text style={{ ...T.captionMd, color: C.inkMuted } as TextStyle}>
                  The pool can't fill every slot under {currency(cap)}. Widen the kickoff windows,
                  raise the cap, or unlock a player.
                </Text>
              </Card>
            ) : null}
          </View>
        </View>

        {/* ---- Footer ---- */}
        <View style={{ paddingHorizontal: gutter, paddingTop: space.xl, paddingBottom: space.xl }}>
          <View style={{ ...column }}>
            <Text style={{ ...T.captionSm, color: C.inkFaint } as TextStyle}>
              Projections from Sleeper · Salaries from DraftKings · Schedule from ESPN
            </Text>
          </View>
        </View>

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
