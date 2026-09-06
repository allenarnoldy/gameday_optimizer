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
import {
  radius, space, type as T, heroType, sectionType, MAX_WIDTH,
} from "../theme";
import {
  Card, Chip, Divider, IconButton, PillButton, Spotlight, MAGENTA_WASH,
} from "../components/ui";
import { tnum } from "../fonts";

const TOOL_WIDTH = 820;

/** Stat tile — a number at display scale on a surface lift. */
function Stat({ value, label }: { value: string; label: string }) {
  const { C } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        minWidth: 140,
        backgroundColor: C.surface1,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: C.hairlineSoft,
        paddingVertical: space.lg,
        paddingHorizontal: space.md,
        gap: 4,
      }}
    >
      <Text {...tnum} style={{ ...T.displayMd, fontSize: 28, color: C.ink } as TextStyle}>
        {value}
      </Text>
      <Text style={{ ...T.caption, color: C.inkMuted } as TextStyle}>{label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const { C, isDark, toggle } = useTheme();
  const { season, week } = getCurrentNFLWeek();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 810;
  const isNarrow = width < 560;
  const gutter = isDesktop ? space.xl : space.lg;
  // Stacked CTAs read as a ragged column unless they share a full-width edge.
  const ctaStyle = isNarrow ? { width: "100%" as const } : undefined;

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

  const hero = heroType(width);
  const section = sectionType(width);

  return (
    <>
      <ScrollView style={{ backgroundColor: C.canvas }} contentContainerStyle={{ paddingBottom: 0 }}>

        {/* ---------------------------------------------------------- */}
        {/* Top nav — 56px, canvas, wordmark left, pill pair right      */}
        {/* ---------------------------------------------------------- */}
        <View
          style={{
            borderBottomWidth: 1,
            borderBottomColor: C.hairlineSoft,
            paddingHorizontal: gutter,
          }}
        >
          <View
            style={{
              width: "100%", maxWidth: MAX_WIDTH, alignSelf: "center",
              height: 56, flexDirection: "row", alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
              <View
                style={{
                  width: 22, height: 22, borderRadius: radius.sm,
                  backgroundColor: C.ink, alignItems: "center", justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: C.canvas, lineHeight: 14 }}>G</Text>
              </View>
              <Text
                style={{
                  ...T.bodySm, fontWeight: "600", color: C.ink, letterSpacing: -0.4,
                } as TextStyle}
              >
                Gameday
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
              {isDesktop && (
                <Text style={{ ...T.caption, color: C.inkMuted, marginRight: space.xs } as TextStyle}>
                  {season} · Week {week}
                </Text>
              )}
              <IconButton onPress={toggle} size={36}>
                <Text style={{ fontSize: 15, lineHeight: 18, color: C.ink }}>
                  {isDark ? "☀" : "☾"}
                </Text>
              </IconButton>
              <IconButton onPress={fetchAll} disabled={!!loading} size={36}>
                {loading
                  ? <ActivityIndicator size="small" color={C.inkMuted} />
                  : <Text style={{ fontSize: 14, color: C.ink }}>↻</Text>}
              </IconButton>
            </View>
          </View>
        </View>

        {/* ---------------------------------------------------------- */}
        {/* Hero — one assertive statement, poster tracking            */}
        {/* ---------------------------------------------------------- */}
        <View style={{ paddingHorizontal: gutter }}>
          <View
            style={{
              width: "100%", maxWidth: MAX_WIDTH, alignSelf: "center",
              paddingTop: isDesktop ? 72 : 44,
              paddingBottom: isDesktop ? 56 : 36,
              gap: space.lg,
            }}
          >
            <Chip label={`NFL daily fantasy · Week ${week}`} />

            <Text style={{ ...hero, color: C.ink, maxWidth: 900 } as TextStyle}>
              The best lineup{"\n"}is a solved problem.
            </Text>

            <Text
              style={{
                ...T.bodyLg, color: C.inkMuted, maxWidth: 560,
              } as TextStyle}
            >
              Live DraftKings salaries, Sleeper projections and the real slate schedule —
              solved against your cap for the highest-scoring roster available.
            </Text>

            <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap", marginTop: space.xs }}>
              <PillButton
                label={generating ? "Solving…" : "Generate optimal lineups"}
                onPress={handleGenerate}
                disabled={!canGenerate}
                size="lg"
                style={ctaStyle}
              />
              <PillButton
                label={`Player pool${filteredPlayers.length ? ` · ${filteredPlayers.length}` : ""}`}
                onPress={() => setPanelOpen(true)}
                variant="secondary"
                size="lg"
                style={ctaStyle}
              />
            </View>

            {loading && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
                <ActivityIndicator size="small" color={C.inkMuted} />
                <Text style={{ ...T.caption, color: C.inkMuted } as TextStyle}>{loading}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ---------------------------------------------------------- */}
        {/* Stat row                                                    */}
        {/* ---------------------------------------------------------- */}
        <View style={{ paddingHorizontal: gutter }}>
          <View
            style={{
              width: "100%", maxWidth: MAX_WIDTH, alignSelf: "center",
              flexDirection: "row", gap: space.sm, flexWrap: "wrap",
              paddingBottom: isDesktop ? space.section - 40 : space.xxl,
            }}
          >
            <Stat value={String(filteredPlayers.length)} label="Players in pool" />
            <Stat value={currency(cap)} label="Salary cap" />
            <Stat value={String(lockedIds.size)} label="Locked in" />
            <Stat value={scoring === "ppr" ? "PPR" : scoring === "half" ? "Half PPR" : "Standard"} label="Scoring" />
          </View>
        </View>

        {/* ---------------------------------------------------------- */}
        {/* The tool                                                    */}
        {/* ---------------------------------------------------------- */}
        <View style={{ paddingHorizontal: gutter }}>
          <View style={{ width: "100%", maxWidth: MAX_WIDTH, alignSelf: "center" }}>
          <View
            style={{
              width: "100%", maxWidth: TOOL_WIDTH,
              gap: space.lg, paddingBottom: space.xxl,
            }}
          >
            <View style={{ gap: space.xs }}>
              <Text style={{ ...section, color: C.ink } as TextStyle}>Set your constraints</Text>
              <Text style={{ ...T.body, color: C.inkMuted, maxWidth: 520 } as TextStyle}>
                Scoring format, kickoff windows and roster limits. Everything recomputes on the next solve.
              </Text>
            </View>

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
                size="lg"
                style={isNarrow ? { width: "100%" } : { flexGrow: 1, minWidth: 240 }}
              >
                {generating ? <ActivityIndicator size="small" color={C.onPrimary} /> : null}
              </PillButton>
              <PillButton
                label={lockedIds.size > 0 ? `Pool · ${filteredPlayers.length} · ${lockedIds.size} locked` : `Pool · ${filteredPlayers.length}`}
                onPress={() => setPanelOpen(true)}
                variant="secondary"
                size="lg"
                style={ctaStyle}
              />
            </View>
          </View>
          </View>
        </View>

        {/* ---------------------------------------------------------- */}
        {/* Results, or the spotlight empty state                       */}
        {/* ---------------------------------------------------------- */}
        <View style={{ paddingHorizontal: gutter }}>
          <View style={{ width: "100%", maxWidth: MAX_WIDTH, alignSelf: "center" }}>
          <View
            style={{
              width: "100%", maxWidth: TOOL_WIDTH,
              gap: space.lg, paddingBottom: isDesktop ? space.section : space.xxl,
            }}
          >
            {lineups && lineups.length > 0 ? (
              <>
                <Divider />
                <View style={{ gap: space.xs, paddingTop: space.xs }}>
                  <Text style={{ ...section, color: C.ink } as TextStyle}>
                    Week {week}, solved.
                  </Text>
                  <Text style={{ ...T.body, color: C.inkMuted } as TextStyle}>
                    {lineups.length} lineup{lineups.length === 1 ? "" : "s"} under {currency(cap)}
                    {lockedIds.size > 0 ? ` · ${lockedIds.size} player${lockedIds.size === 1 ? "" : "s"} locked` : ""}
                  </Text>
                </View>
                {lineups.map((lu, i) => (
                  <LineupCard key={i} lu={lu} index={i} />
                ))}
              </>
            ) : lineups && lineups.length === 0 ? (
              <Card padding={space.xl}>
                <Text style={{ ...T.headline, color: C.ink, marginBottom: 6 } as TextStyle}>
                  No lineup fits.
                </Text>
                <Text style={{ ...T.body, color: C.inkMuted } as TextStyle}>
                  The pool can't fill every roster slot inside {currency(cap)}. Try widening the game
                  windows, raising the cap, or unlocking a player.
                </Text>
              </Card>
            ) : (
              // The page's one atmosphere moment — scarce by design.
              <Spotlight wash={MAGENTA_WASH} fallback={C.gradMagenta} padding={isDesktop ? 40 : 28}>
                <View style={{ gap: space.sm, maxWidth: 460 }}>
                  <Text style={{ ...T.caption, color: "rgba(255,255,255,0.75)" } as TextStyle}>
                    Ready when you are
                  </Text>
                  <Text
                    style={{
                      ...T.displayMd,
                      fontSize: isDesktop ? 32 : 26,
                      color: "#ffffff",
                    } as TextStyle}
                  >
                    {filteredPlayers.length > 0
                      ? `${filteredPlayers.length} players loaded. Solve the slate.`
                      : "Loading this week's slate."}
                  </Text>
                  <Text
                    style={{ ...T.body, color: "rgba(255,255,255,0.8)" } as TextStyle}
                  >
                    Every legal combination is evaluated against your cap and roster rules — the
                    result is the mathematically highest-projecting lineup, not a suggestion.
                  </Text>
                </View>
              </Spotlight>
            )}
          </View>
          </View>
        </View>

        {/* ---------------------------------------------------------- */}
        {/* Footer                                                      */}
        {/* ---------------------------------------------------------- */}
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: C.hairlineSoft,
            paddingHorizontal: gutter,
            paddingVertical: isDesktop ? 56 : 36,
          }}
        >
          <View
            style={{
              width: "100%", maxWidth: MAX_WIDTH, alignSelf: "center",
              flexDirection: isDesktop ? "row" : "column",
              justifyContent: "space-between",
              gap: space.lg,
            }}
          >
            <View style={{ gap: 6 }}>
              <Text style={{ ...T.bodySm, fontWeight: "600", color: C.ink } as TextStyle}>
                Gameday Optimizer
              </Text>
              <Text style={{ ...T.caption, color: C.inkMuted, maxWidth: 320 } as TextStyle}>
                Projections from Sleeper · Salaries from DraftKings · Schedule from ESPN
              </Text>
            </View>
            <View style={{ gap: 6, alignItems: isDesktop ? "flex-end" : "flex-start" }}>
              <Text style={{ ...T.caption, color: C.inkMuted } as TextStyle}>
                Season {season} · Week {week}
              </Text>
              <Text style={{ ...T.micro, color: C.light } as TextStyle}>
                Not affiliated with the NFL or DraftKings.
              </Text>
            </View>
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
