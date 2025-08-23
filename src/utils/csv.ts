export function splitCSVLine(line: string): string[] {
    const out: string[] = [];
    let inQuotes = false;
    let cur = "";
    for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
    if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
    else { inQuotes = !inQuotes; }
    } else if (c === "," && !inQuotes) { out.push(cur); cur = ""; }
    else { cur += c; }
    }
    out.push(cur);
    return out.map((s) => s.trim());
    }
    
    
    export function parseCSV(text: string): any[] {
    const rows: any[] = [];
    const lines = text.replace(/\r/g, "").split("\n").filter(Boolean);
    if (!lines.length) return rows;
    const headers = splitCSVLine(lines[0]);
    for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i]);
    const obj: any = {};
    headers.forEach((h, idx) => (obj[h.trim()] = cols[idx] !== undefined ? cols[idx] : ""));
    rows.push(obj);
    }
    return rows;
    }