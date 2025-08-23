import React from "react";
import { View, Text, FlatList } from "react-native";
import { Player } from "../types";


export default function PlayerList({ players }: { players: Player[] }) {
return (
<View style={{ borderWidth: 1, borderRadius: 16, padding: 8 }}>
<Text style={{ fontWeight: "700", marginBottom: 6 }}>Players Loaded: {players.length}</Text>
<FlatList
data={players}
keyExtractor={(item) => item.id}
renderItem={({ item }) => (
<View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}>
<Text>{item.name} ({item.team} {item.pos})</Text>
<Text>{item.proj.toFixed(1)} pts</Text>
</View>
)}
/>
</View>
);
}