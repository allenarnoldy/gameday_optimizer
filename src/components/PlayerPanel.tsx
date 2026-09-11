import React, { useEffect, useState } from "react";
import { Modal, View, Text, Pressable, FlatList, TextStyle, useWindowDimensions } from "react-native";
import { Player } from "../types";
import { useTheme } from "../ThemeContext";
import { space, type as T } from "../theme";
import { IconButton } from "./ui";
import { drawerState, scrimState } from "../fonts";
import {
  PlayerRow, PoolColumns, PoolFilters, PoolEmpty, filterPool, PosFilter,
} from "./PlayerPool";

type Props = {
  visible: boolean;
  onClose: () => void;
  players: Player[];
  lockedIds: Set<string>;
  onToggleLock: (id: string) => void;
  onRemove: (id: string) => void;
  removedCount: number;
  onRestoreAll: () => void;
  posFilter: PosFilter;
  setPosFilter: (p: PosFilter) => void;
};

export default function PlayerPanel({
  visible, onClose, players, lockedIds, onToggleLock,
  onRemove, removedCount, onRestoreAll, posFilter, setPosFilter,
}: Props) {
  const { C } = useTheme();
  const { width } = useWindowDimensions();

  // Keep the modal mounted through the exit so the panel can slide out
  // instead of being cut. `open` drives the transform one frame after mount.
  const [mounted, setMounted] = useState(visible);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      // Double rAF: a single frame flips `open` before the browser has
      // painted the closed state, so there is no start value to transition
      // from and the panel just appears. The second frame guarantees a paint.
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setOpen(true));
      });
      return () => { cancelAnimationFrame(outer); cancelAnimationFrame(inner); };
    }
    setOpen(false);
    const t = setTimeout(() => setMounted(false), 260);
    return () => clearTimeout(t);
  }, [visible]);

  if (!mounted) return null;

  const panelWidth = Math.min(420, width);
  const rows = filterPool(players, posFilter);

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        {...scrimState(open)}
        style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.7)",
        }}
      />

      <View
        {...drawerState(open)}
        style={{
          position: "absolute", right: 0, top: 0, bottom: 0,
          width: panelWidth,
          backgroundColor: C.canvas,
          borderLeftWidth: 1,
          borderLeftColor: C.hairline,
        }}
      >
        <View
          style={{
            paddingHorizontal: space.lg,
            paddingTop: space.xl,
            paddingBottom: space.md,
            gap: space.md,
            borderBottomWidth: 1,
            borderBottomColor: C.hairline,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ gap: 2 }}>
              <Text style={{ ...T.headingLg, color: C.ink } as TextStyle}>Player pool</Text>
              <Text style={{ ...T.captionMd, color: C.inkMuted } as TextStyle}>
                {players.length} available
                {lockedIds.size > 0 ? ` · ${lockedIds.size} locked` : ""}
              </Text>
            </View>
            <IconButton onPress={onClose} size={40}>
              <Text style={{ fontSize: 15, color: C.ink }}>✕</Text>
            </IconButton>
          </View>

          <Text style={{ ...T.captionSm, color: C.inkFaint } as TextStyle}>
            Tap to lock a player in, ✕ to remove.
          </Text>

          <PoolFilters
            posFilter={posFilter}
            setPosFilter={setPosFilter}
            removedCount={removedCount}
            onRestoreAll={onRestoreAll}
          />
        </View>

        <PoolColumns />

        <FlatList
          data={rows}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <PlayerRow
              player={item}
              locked={lockedIds.has(item.id)}
              onToggleLock={onToggleLock}
              onRemove={onRemove}
            />
          )}
          ListEmptyComponent={<PoolEmpty />}
        />
      </View>
    </Modal>
  );
}
