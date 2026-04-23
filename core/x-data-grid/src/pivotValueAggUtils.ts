import type { GridColDef, GridPivotAggFunc, GridPivotModel, GridValidRowModel } from "./types";

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function applyNumericAgg(values: number[], agg: "sum" | "avg" | "min" | "max"): number {
  const nums = values.filter((x) => Number.isFinite(x));
  if (nums.length === 0) return 0;
  switch (agg) {
    case "sum":
      return nums.reduce((a, b) => a + b, 0);
    case "avg":
      return nums.reduce((a, b) => a + b, 0) / nums.length;
    case "min":
      return Math.min(...nums);
    case "max":
      return Math.max(...nums);
    default:
      return 0;
  }
}

function distinctRawKey(v: unknown): string {
  if (v == null) return "\0__null__";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/** Rótulos PT alinhados ao painel de pivotagem (métricas). */
export const PIVOT_AGG_FUNC_LABELS_PT: Record<GridPivotAggFunc, string> = {
  sum: "soma",
  avg: "média",
  min: "mín",
  max: "máx",
  count: "contagem",
  countDistinct: "contagem distinta"
};

/**
 * Aplica a mesma agregação que o motor de pivotagem a uma lista de valores brutos de célula.
 */
export function applyPivotAggToRawValues(rawValues: unknown[], agg: GridPivotAggFunc): number {
  const nums = rawValues.map((v) => num(v)).filter((n) => Number.isFinite(n));
  switch (agg) {
    case "count":
      return rawValues.length;
    case "countDistinct": {
      const set = new Set<string>();
      for (const v of rawValues) set.add(distinctRawKey(v));
      return set.size;
    }
    case "sum":
    case "avg":
    case "min":
    case "max":
      if (nums.length === 0) return 0;
      return applyNumericAgg(nums, agg);
    default:
      return 0;
  }
}

export function skipPivotLayoutField(f: string): boolean {
  return f === "__select__" || f === "__detail__" || f === "__tree__" || f.startsWith("pivot_");
}

/** Campos que podem ir a Linhas/Colunas/Valores (excepto acções e meta). */
export function isPivotAxisCandidate<R extends GridValidRowModel>(c: GridColDef<R>): boolean {
  if (c.hide === true) return false;
  if (skipPivotLayoutField(c.field)) return false;
  if (c.type === "actions" || c.getActions != null) return false;
  return true;
}

/** Qualquer eixo pode ser métrica com contagem / contagem distinta; numéricos também soma, média, etc. */
export function canAddFieldToPivotValues<R extends GridValidRowModel>(c: GridColDef<R> | undefined): boolean {
  return !!c && isPivotAxisCandidate(c);
}

export function defaultAggForPivotValueField<R extends GridValidRowModel>(
  cd: GridColDef<R> | undefined
): GridPivotAggFunc {
  if (cd?.type === "number") return "sum";
  return "count";
}

export function aggChoicesForPivotValueField<R extends GridValidRowModel>(
  cd: GridColDef<R> | undefined
): GridPivotAggFunc[] {
  if (cd?.type === "number") return ["sum", "avg", "min", "max", "count", "countDistinct"];
  return ["count", "countDistinct"];
}

export function sanitizePivotValueAggs<R extends GridValidRowModel>(
  model: GridPivotModel,
  sourceColumns: GridColDef<R>[]
): GridPivotModel {
  const colBy = new Map(sourceColumns.map((c) => [c.field, c]));
  return {
    ...model,
    values: model.values.map((v) => {
      const cd = colBy.get(v.field);
      const allowed = aggChoicesForPivotValueField(cd);
      if (allowed.includes(v.aggFunc)) return v;
      return { ...v, aggFunc: defaultAggForPivotValueField(cd) };
    })
  };
}
