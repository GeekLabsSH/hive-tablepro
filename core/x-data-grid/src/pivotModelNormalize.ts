import type {
  GridPivotAggFunc,
  GridPivotColumnDef,
  GridPivotDateGranularity,
  GridPivotModel,
  GridPivotRowDef,
  GridPivotValueDef
} from "./types";

const DATE_GRAN_SET = new Set<GridPivotDateGranularity>(["year", "quarter", "semester", "month", "week", "day"]);

function coerceDateGranularity(g: unknown): GridPivotDateGranularity | undefined {
  if (g === undefined || g === null) return undefined;
  const s = String(g) as GridPivotDateGranularity;
  return DATE_GRAN_SET.has(s) ? s : undefined;
}

function isLegacyRows(rows: unknown): rows is string[] {
  return Array.isArray(rows) && rows.length > 0 && typeof (rows as string[])[0] === "string";
}

function coerceAgg(s: unknown): GridPivotAggFunc {
  const a = String(s ?? "sum");
  if (
    a === "sum" ||
    a === "avg" ||
    a === "min" ||
    a === "max" ||
    a === "median" ||
    a === "stdDev" ||
    a === "count" ||
    a === "countDistinct"
  )
    return a;
  return "sum";
}

/**
 * Converte modelo legado (`rows`/`columns` como `string[]`) para o formato actual (`GridPivotRowDef` / `GridPivotColumnDef`).
 * Idempotente sobre o formato novo.
 */
export function normalizePivotModel(input: GridPivotModel | undefined | null): GridPivotModel {
  if (!input) return { rows: [], columns: [], values: [] };
  const rowsIn = input.rows ?? [];
  const colsIn = input.columns ?? [];
  const valsIn = input.values ?? [];

  let rows: GridPivotRowDef[];
  let columns: GridPivotColumnDef[];

  if (isLegacyRows(rowsIn)) {
    rows = (rowsIn as string[]).map((field) => ({ field }));
  } else {
    rows = (rowsIn as GridPivotRowDef[]).map((r) => ({
      field: r.field,
      hidden: r.hidden,
      dateGranularity: coerceDateGranularity(r.dateGranularity)
    }));
  }

  if (isLegacyRows(colsIn)) {
    columns = (colsIn as string[]).map((field) => ({ field }));
  } else {
    columns = (colsIn as GridPivotColumnDef[]).map((c) => ({
      field: c.field,
      hidden: c.hidden,
      sort: c.sort,
      dateGranularity: coerceDateGranularity(c.dateGranularity)
    }));
  }

  const values: GridPivotValueDef[] = (valsIn as GridPivotValueDef[]).map((v) => ({
    field: v.field,
    aggFunc: coerceAgg(v.aggFunc),
    hidden: v.hidden
  }));

  return { rows, columns, values };
}
