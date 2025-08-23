export type Position = "QB" | "RB" | "WR" | "TE" | "DST" | "K";


export type Player = {
id: string;
name: string;
team: string;
opp?: string;
pos: Position;
salary?: number;
proj: number;
gameId?: string;
gameTime?: string; // ISO
window?: "Noon" | "3PM" | "Other";
};


export type Lineup = {
slots: Record<string, Player>;
totalProj: number;
totalSalary: number;
};


export type RosterRule = { slot: string; allow: Position[] };