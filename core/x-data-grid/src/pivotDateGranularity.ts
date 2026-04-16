import type { GridColDef, GridPivotColumnDef, GridPivotDateGranularity, GridPivotRowDef, GridValidRowModel } from "./types";

function parseToDate(raw: unknown): Date | null {
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
    const d = parseToDate(raw);
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
      case "month":
        return `y:${y}-m:${String(m).padStart(2, "0")}`;
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
    if (g === "day") {
      const m = /^y:(\d+)-m:(\d{2})-d:(\d{2})$/.exec(key);
      if (m) return `${m[1]}-${m[2]}-${m[3]}`;
      return key;
    }
  }
  return key;
}

export function slugPivotKeyPart(s: string): string {
  return s.replace(/[^\w.-]+/g, "_").slice(0, 80);
}
