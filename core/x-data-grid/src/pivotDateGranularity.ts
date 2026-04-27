import type { GridColDef, GridPivotColumnDef, GridPivotDateGranularity, GridPivotRowDef, GridValidRowModel } from "./types";

/** Interpreta valores de células `date` / `dateTime` (paridade grelha / gráficos / pivot). */
/** Segunda-feira (00:00 local) da semana que contém `d`. */
function startOfLocalWeekMonday(d: Date): { y: number; m: number; day: number } {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - dow);
  return { y: x.getFullYear(), m: x.getMonth() + 1, day: x.getDate() };
}

export function gridParseCellDate(raw: unknown): Date | null {
  if (raw == null || raw === "") return null;
  if (raw instanceof Date) return Number.isNaN(raw.getTime()) ? null : raw;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof raw === "string") {
    const t = Date.parse(raw);
    if (!Number.isNaN(t)) return new Date(t);
  }
  return null;
}

/** Chave estável para agregação (ordenável). */
export function pivotDimensionKey<R extends GridValidRowModel>(
  row: R,
  def: GridPivotRowDef | GridPivotColumnDef,
  colDef: GridColDef<R> | undefined
): string {
  const raw = (row as Record<string, unknown>)[def.field];
  const g = def.dateGranularity;
  if (g && colDef && (colDef.type === "date" || colDef.type === "dateTime")) {
    const d = gridParseCellDate(raw);
    if (!d) return "";
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    switch (g) {
      case "year":
        return `y:${y}`;
      case "quarter": {
        const q = Math.floor((m - 1) / 3) + 1;
        return `y:${y}-q:${q}`;
      }
      case "semester": {
        const sem = m <= 6 ? 1 : 2;
        return `y:${y}-sem:${sem}`;
      }
      case "month":
        return `y:${y}-m:${String(m).padStart(2, "0")}`;
      case "week": {
        const mon = startOfLocalWeekMonday(d);
        return `y:${mon.y}-m:${String(mon.m).padStart(2, "0")}-d:${String(mon.day).padStart(2, "0")}`;
      }
      case "day":
        return `y:${y}-m:${String(m).padStart(2, "0")}-d:${String(d.getDate()).padStart(2, "0")}`;
      default:
        return String(raw ?? "");
    }
  }
  return String(raw ?? "");
}

const QUARTER_PT = ["1.º trimestre", "2.º trimestre", "3.º trimestre", "4.º trimestre"];

/** Rótulo curto em PT para cabeçalhos / células pivot. */
export function pivotDimensionDisplayLabel<R extends GridValidRowModel>(
  key: string,
  def: GridPivotRowDef | GridPivotColumnDef,
  colDef: GridColDef<R> | undefined
): string {
  if (key === "") return "—";
  const g = def.dateGranularity;
  if (g && colDef && (colDef.type === "date" || colDef.type === "dateTime")) {
    if (g === "year") {
      const m = /^y:(\d+)$/.exec(key);
      return m ? m[1]! : key;
    }
    if (g === "quarter") {
      const m = /^y:(\d+)-q:(\d+)$/.exec(key);
      if (m) {
        const qi = Number(m[2]) - 1;
        return `${m[1]} · ${QUARTER_PT[qi] ?? `T${m[2]}`}`;
      }
      return key;
    }
    if (g === "month") {
      const m = /^y:(\d+)-m:(\d{2})$/.exec(key);
      if (m) return `${m[1]}-${m[2]}`;
      return key;
    }
    if (g === "week") {
      const m = /^y:(\d+)-m:(\d{2})-d:(\d{2})$/.exec(key);
      if (m) return `Sem. ${m[3]}/${m[2]}/${m[1]}`;
      return key;
    }
    if (g === "day") {
      const m = /^y:(\d+)-m:(\d{2})-d:(\d{2})$/.exec(key);
      if (m) return `${m[1]}-${m[2]}-${m[3]}`;
      return key;
    }
    if (g === "semester") {
      const m = /^y:(\d+)-sem:([12])$/.exec(key);
      if (m) return `${m[1]} · ${m[2] === "1" ? "1.º semestre" : "2.º semestre"}`;
      return key;
    }
  }
  return key;
}

export function slugPivotKeyPart(s: string): string {
  return s.replace(/[^\w.-]+/g, "_").slice(0, 80);
}
