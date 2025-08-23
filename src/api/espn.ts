export async function fetchESPNWeekSchedule(season: number, week: number): Promise<any[]> {
    const url = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/${season}/types/2/events?limit=1000`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load ESPN schedule");
    const data = await res.json();
    const items: any[] = data.items || [];
    const details = await Promise.all(
    items.map(async (it) => {
    try {
    const r = await fetch(it.$ref || it.href || it);
    if (!r.ok) return null;
    return r.json();
    } catch {
    return null;
    }
    })
    );
    return details.filter((ev) => ev && ev.week && Number(ev.week.number) === Number(week));
    }