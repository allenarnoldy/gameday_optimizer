import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View, Text, Image, ScrollView, ActivityIndicator, Alert, Pressable,
  useWindowDimensions, TextStyle,
} from "react-native";

import { Player, RosterRule, Lineup } from "../types";
import { DEMO_PLAYERS } from "../constants/demoPlayers";
import { labelWindowLocal, currency } from "../utils/time";
import { getCurrentNFLWeek } from "../utils/nflWeek";
import { fetchSleeperPlayers, fetchSleeperWeekProjections, mapSleeperToPlayers } from "../api/sleeper";
import { fetchESPNWeekSchedule } from "../api/espn";
import { fetchDKCurrentWeek } from "../api/draftkings";
import { mergeProjectionsIntoDK } from "../utils/merge";
import LineupCard from "../components/LineupCard";
import PlayerPanel from "../components/PlayerPanel";
import FootballLoader from "../components/FootballLoader";
import HeroBand from "../components/HeroBand";
import InlinePool, { PosFilter } from "../components/PlayerPool";
import { SummaryPill, SettingsPopover, Draft, Anchor, Scoring } from "../components/Settings";
import { buildTopLineups } from "../optimizer";
import { useTheme } from "../ThemeContext";
import { radius, space, type as T, APP_WIDTH } from "../theme";
import { Card, PillButton, PanelRightIcon } from "../components/ui";
import { pressable } from "../fonts";

export default function HomeScreen() {
  const { C } = useTheme();
  const { season, week } = getCurrentNFLWeek();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const isNarrow = width < 560;
  const gutter = isDesktop ? space.xl : space.md;

  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState<string | null>("Loading current slate...");
  const [panelOpen, setPanelOpen] = useState(false);

  /* ---- Applied settings ---- */
  const [scoring, setScoring] = useState<Scoring>("ppr");
  const [cap, setCap] = useState(50000);
  const [topN, setTopN] = useState(2);
  const [maxPerTeam, setMaxPerTeam] = useState<number | null>(null);
  const [windowNoon, setWindowNoon] = useState(true);
  const [window3pm, setWindow3pm] = useState(true);

  /* ---- Staged settings: the popover edits a copy, Apply commits it ---- */
  const [draft, setDraft] = useState<Draft | null>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);

  const [lockedIds, setLockedIds] = useState<Set<string>>(new Set());
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [posFilter, setPosFilter] = useState<PosFilter>("All");

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

  const [lineups, setLineups] = useState<Lineup[] | null>(null);
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  // Bumped per solve so result cards remount and replay their stagger.
  const [runId, setRunId] = useState(0);

  const loadDemo = useCallback(() => {
    setPlayers(DEMO_PLAYERS.map(p => ({ ...p, window: labelWindowLocal(p.gameTime) })));
    setLineups(null);
    setLockedIds(new Set());
  }, []);

  const fetchAll = useCallback(async (nextScoring: Scoring = scoring) => {
    setLoading("Loading current week's slate...");
    setLockedIds(new Set());
    setExcludedIds(new Set());
    setLineups(null);
    // A reload is a fresh slate, so drop back to the pool view. Without this
    // the results section stayed mounted with nothing in it.
    setGenerated(false);
    setPanelOpen(false);
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

      const sleeperPlayers = mapSleeperToPlayers(proj ?? [], allPlayers ?? {}, null, nextScoring);

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
  }, [scoring, season, week, loadDemo]);

  useEffect(() => { fetchAll(); }, []);

  /**
   * Everything the pool lists. Excluded players stay in here so they keep
   * their place in the table; a locked player ignores the window filter.
   */
  const poolPlayers = useMemo(() => {
    return players.filter(p => {
      if (lockedIds.has(p.id)) return true;
      const w = p.window || labelWindowLocal(p.gameTime);
      if (w === "Noon") return windowNoon;
      if (w === "3PM")  return window3pm;
      return windowNoon || window3pm;
    });
  }, [players, windowNoon, window3pm, lockedIds]);

  /** What the optimizer is allowed to pick from. */
  const solvePlayers = useMemo(
    () => poolPlayers.filter(p => !excludedIds.has(p.id)),
    [poolPlayers, excludedIds]
  );

  // Locked and excluded are mutually exclusive: setting one clears the other,
  // or a locked player could be forced into a lineup they're ruled out of.
  const toggleLock = (id: string) => {
    setExcludedIds(prev => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setLockedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleExclude = (id: string) => {
    setLockedIds(prev => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setExcludedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearExcluded = () => setExcludedIds(new Set());

  const solve = (pool: Player[], c = cap, n = topN, mpt = maxPerTeam, locked = lockedIds) => {
    const result = buildTopLineups(pool, rules, c, Math.max(1, n || 1), mpt, locked);
    setLineups(result);
    setRunId(x => x + 1);
  };

  const canGenerate = solvePlayers.length > 0 && !generating;

  const handleGenerate = () => {
    if (!canGenerate) return;
    setGenerating(true);
    setPanelOpen(false);
    setTimeout(() => {
      solve(solvePlayers);
      setGenerated(true);
      setGenerating(false);
    }, 0);
  };

  /* ---- Settings popover ---- */
  const applied: Draft = { scoring, cap, topN, maxPerTeam, windowNoon, window3pm };

  const openSettings = (a: Anchor) => {
    setDraft(applied);
    setAnchor(a);
  };
  const closeSettings = () => { setAnchor(null); setDraft(null); };
  const patchDraft = (patch: Partial<Draft>) =>
    setDraft(d => (d ? { ...d, ...patch } : d));

  const applySettings = () => {
    const d = draft;
    setAnchor(null);
    setDraft(null);
    if (!d) return;

    const scoringChanged = d.scoring !== scoring;
    setScoring(d.scoring);
    setCap(d.cap);
    setTopN(d.topN);
    setMaxPerTeam(d.maxPerTeam);
    setWindowNoon(d.windowNoon);
    setWindow3pm(d.window3pm);
    setLineups(null);

    // Scoring changes what Sleeper returns, so it needs a refetch rather than
    // just another pass over the pool we already have.
    if (scoringChanged) {
      fetchAll(d.scoring);
      return;
    }
    if (!generated) return;
    const pool = players.filter(p => {
      if (excludedIds.has(p.id)) return false;
      if (lockedIds.has(p.id)) return true;
      const w = p.window || labelWindowLocal(p.gameTime);
      if (w === "Noon") return d.windowNoon;
      if (w === "3PM")  return d.window3pm;
      return d.windowNoon || d.window3pm;
    });
    solve(pool, d.cap, d.topN, d.maxPerTeam);
  };

  const column = { width: "100%" as const, maxWidth: APP_WIDTH, alignSelf: "center" as const };

  // Full-screen only on the first load. A manual refresh keeps the user's
  // place and reports through the button's own spinner instead.
  const firstLoad = !!loading && players.length === 0;

  const poolLabel = lockedIds.size > 0
    ? `Player pool · ${solvePlayers.length} · ${lockedIds.size} locked`
    : `Player pool · ${solvePlayers.length}`;

  return (
    <>
      <ScrollView style={{ backgroundColor: C.canvas }}>

        {/* ---- Brand mark + settings summary ----
             The canvas puts only the pill here. The mark is kept on the left
             so the app still carries its icon; it predates that asset. */}
        <View style={{ paddingHorizontal: gutter, paddingTop: 10 }}>
          <View
            style={{
              ...column,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: space.sm,
            }}
          >
            <Image
              source={require("../../assets/logo.png")}
              style={{ width: 30, height: 30, borderRadius: 7 }}
              resizeMode="cover"
              accessibilityLabel="Gameday Optimizer"
            />
            <SummaryPill draft={applied} onOpen={openSettings} />
          </View>
        </View>

        <HeroBand label={`NFL Daily Fantasy · ${season} Week ${week}`} />

        {/* ---- Actions ---- */}
        <View style={{ paddingHorizontal: gutter, paddingTop: space.lg }}>
          <View style={{ ...column, flexDirection: "row", gap: space.sm, flexWrap: "wrap", alignItems: "center" }}>
            {/* Generate and refresh share a line at every width - a full-width
                Generate would push the reload button onto a row of its own. */}
            <PillButton
              label={generating ? "Solving…" : "Generate optimal lineups"}
              onPress={handleGenerate}
              disabled={!canGenerate}
              style={{ flexGrow: 1, flexShrink: 1, minWidth: isNarrow ? 0 : 280 }}
            >
              {generating ? <ActivityIndicator size="small" color="#fff" /> : null}
            </PillButton>

            <Pressable
              onPress={() => fetchAll()}
              disabled={!!loading}
              {...pressable}
              accessibilityLabel="Reload slate"
              style={{
                width: 48, height: 48, flexShrink: 0, borderRadius: radius.full,
                alignItems: "center", justifyContent: "center",
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading
                ? <ActivityIndicator size="small" color={C.ink} />
                : <Text style={{ fontSize: 20, lineHeight: 24, color: C.ink }}>↻</Text>}
            </Pressable>

            {generated ? (
              <PillButton
                label={poolLabel}
                onPress={() => setPanelOpen(true)}
                variant="secondary"
                style={isNarrow ? { width: "100%" } : undefined}
              >
                <PanelRightIcon color={C.ink} />
              </PillButton>
            ) : null}
          </View>
        </View>

        {/* ---- Before the first solve the pool is the page ---- */}
        {!generated ? (
          <View style={{ paddingHorizontal: gutter, paddingTop: space.lg }}>
            <InlinePool
              players={poolPlayers}
              lockedIds={lockedIds}
              excludedIds={excludedIds}
              posFilter={posFilter}
              setPosFilter={setPosFilter}
              onLock={toggleLock}
              onExclude={toggleExclude}
              onClearExcluded={clearExcluded}
            />
          </View>
        ) : (
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
        )}

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
        players={poolPlayers}
        lockedIds={lockedIds}
        excludedIds={excludedIds}
        onLock={toggleLock}
        onExclude={toggleExclude}
        onClearExcluded={clearExcluded}
        posFilter={posFilter}
        setPosFilter={setPosFilter}
      />

      <SettingsPopover
        anchor={anchor}
        draft={draft ?? applied}
        setDraft={patchDraft}
        onCancel={closeSettings}
        onApply={applySettings}
      />

      {firstLoad && <FootballLoader />}
    </>
  );
}
