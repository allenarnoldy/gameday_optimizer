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
import { radius, space, type as T, sectionType } from "../theme";
import { Card, Divider, IconButton, PillButton } from "../components/ui";

/** The app is a tool, so the working column is the whole page. */
const APP_WIDTH = 820;

export default function HomeScreen() {
  const { C, isDark, toggle } = useTheme();
  const { season, week } = getCurrentNFLWeek();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 810;
  const isNarrow = width < 560;
  const gutter = isDesktop ? space.xl : space.lg;
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

  const title = sectionType(width);

  /** Status dot + label, as in the original build. */
  const StatusDot = ({ on, children }: { on: boolean; children: React.ReactNode }) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View
        style={{
          width: 6, height: 6, borderRadius: radius.full,
          backgroundColor: on ? C.primary : C.light,
        }}
      />
      <Text style={{ ...T.caption, color: C.inkMuted } as TextStyle}>{children}</Text>
    </View>
  );

  return (
    <>
      <ScrollView style={{ backgroundColor: C.canvas }}>
        <View style={{ paddingHorizontal: gutter }}>
          <View
            style={{
              width: "100%", maxWidth: APP_WIDTH, alignSelf: "center",
              paddingTop: space.xl, gap: space.lg,
            }}
          >

            {/* Header — eyebrow + title, actions right */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: space.md,
              }}
            >
              <View style={{ gap: 4, flex: 1 }}>
                <Text
                  style={{
                    ...T.micro,
                    fontWeight: "700",
                    letterSpacing: 1.4,
                    color: C.primary,
                  } as TextStyle}
                >
                  NFL DAILY FANTASY
                </Text>
                <Text style={{ ...title, color: C.ink } as TextStyle}>Gameday Optimizer</Text>
              </View>

              <View style={{ flexDirection: "row", gap: space.xs, paddingTop: 4 }}>
                <IconButton onPress={toggle} size={38}>
                  <Text style={{ fontSize: 15, lineHeight: 18, color: C.ink }}>
                    {isDark ? "☀" : "☾"}
                  </Text>
                </IconButton>
                <IconButton onPress={fetchAll} disabled={!!loading} size={38}>
                  {loading
                    ? <ActivityIndicator size="small" color={C.inkMuted} />
                    : <Text style={{ fontSize: 15, color: C.ink }}>↻</Text>}
                </IconButton>
              </View>
            </View>

            {/* Slate status */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.md, flexWrap: "wrap" }}>
              <Text style={{ ...T.caption, color: C.inkMuted } as TextStyle}>
                {season} · Week {week}
              </Text>
              <StatusDot on={filteredPlayers.length > 0}>
                {filteredPlayers.length} players
              </StatusDot>
              {lockedIds.size > 0 && <StatusDot on>{lockedIds.size} locked</StatusDot>}
              {loading && (
                <Text style={{ ...T.caption, color: C.inkMuted } as TextStyle}>{loading}</Text>
              )}
            </View>

            {/* The controls are the show */}
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
                style={isNarrow ? { width: "100%" } : { flexGrow: 1, minWidth: 260 }}
              >
                {generating ? <ActivityIndicator size="small" color={C.onPrimary} /> : null}
              </PillButton>
              <PillButton
                label={`Player pool · ${filteredPlayers.length}`}
                onPress={() => setPanelOpen(true)}
                variant="secondary"
                size="lg"
                style={ctaStyle}
              />
            </View>

            {/* Results */}
            {lineups && lineups.length > 0 ? (
              <View style={{ gap: space.md, paddingTop: space.xs }}>
                <Divider />
                <Text style={{ ...T.caption, color: C.inkMuted } as TextStyle}>
                  {lineups.length} lineup{lineups.length === 1 ? "" : "s"} under {currency(cap)}
                </Text>
                {lineups.map((lu, i) => (
                  <LineupCard key={i} lu={lu} index={i} />
                ))}
              </View>
            ) : lineups ? (
              <Card padding={space.lg}>
                <Text style={{ ...T.bodySm, color: C.ink, marginBottom: 4 } as TextStyle}>
                  No lineup fits.
                </Text>
                <Text style={{ ...T.caption, color: C.inkMuted } as TextStyle}>
                  The pool can't fill every slot under {currency(cap)}. Widen the game windows,
                  raise the cap, or unlock a player.
                </Text>
              </Card>
            ) : null}

            {/* Footer — attribution only */}
            <View style={{ paddingTop: space.lg, paddingBottom: space.xl, gap: space.sm }}>
              <Divider soft />
              <Text style={{ ...T.micro, color: C.light } as TextStyle}>
                Projections from Sleeper · Salaries from DraftKings · Schedule from ESPN
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
